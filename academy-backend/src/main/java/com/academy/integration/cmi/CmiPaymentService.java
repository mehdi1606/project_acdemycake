package com.academy.integration.cmi;

import com.academy.dto.response.CmiInitiateResponse;
import com.academy.entity.Course;
import com.academy.entity.PaymentTransaction;
import com.academy.entity.User;
import com.academy.entity.enums.PaymentStatus;
import com.academy.exception.BadRequestException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.CourseRepository;
import com.academy.repository.PaymentTransactionRepository;
import com.academy.service.CouponService;
import com.academy.service.EnrollmentService;
import com.academy.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

/**
 * CMI Chaabi Payment gateway integration.
 *
 * Flow:
 *  1. initiateCmiSubscription / initiateCmiCoursePayment
 *     → creates a PaymentTransaction (status=PENDING)
 *     → builds all CMI form parameters
 *     → computes SHA-512 HASH
 *     → returns CmiInitiateResponse for the frontend to auto-submit
 *
 *  2. handleCmiCallback (called by POST /cmi/callback — server-to-server from CMI)
 *     → validates HASH
 *     → on success (ProcReturnCode=00) → updates DB, processes enrollment/subscription
 *     → returns "ACTION=POSTAUTH", "APPROVED", or "FAILURE" as plain text
 *
 * Hash algorithm (ver3 / SHA-512):
 *
 *  OUTGOING (merchant → CMI, buildFormParams):
 *   - Collect all param names except "hash" and "encoding" (case-insensitive exclusion)
 *   - Sort case-insensitively
 *   - Escape each value: replace \ → \\ then | → \|
 *   - Build string: escaped_val1|...|escaped_valN|escaped_storeKey
 *   - SHA-512 digest → raw bytes → Base64
 *
 *  INCOMING / CALLBACK (CMI → merchant, handleCmiCallback):
 *   - CMI includes HASHPARAMSVAL in the callback POST — the pre-concatenated escaped values
 *   - Verify: HASH == Base64(SHA-512(HASHPARAMSVAL + "|" + storeKey))
 *   - Falls back to sort-all-params if HASHPARAMSVAL is absent
 *   (Equivalent to PHP: base64_encode(pack('H*', hash('sha512', $hashParamsVal . '|' . $storeKey))))
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CmiPaymentService {

    private final PaymentTransactionRepository transactionRepository;
    private final CourseRepository            courseRepository;
    private final EnrollmentService           enrollmentService;
    private final PaymentService              paymentService;
    private final CouponService               couponService;

    // ── Config ───────────────────────────────────────────────────────────────
    @Value("${cmi.client-id}")   private String clientId;
    @Value("${cmi.store-key}")   private String storeKey;
    @Value("${cmi.gateway-url}") private String gatewayUrl;
    @Value("${cmi.currency}")    private String currency;
    @Value("${cmi.callback-url}") private String callbackUrl;
    @Value("${cmi.ok-url}")       private String okUrl;
    @Value("${cmi.fail-url}")     private String failUrl;
    @Value("${cmi.shop-url}")     private String shopUrl;

    @Value("${app.subscription.monthly-price}") private BigDecimal monthlyPrice;
    @Value("${app.subscription.yearly-price}")  private BigDecimal yearlyPrice;
    @Value("${app.subscription.currency}")      private String     subscriptionCurrency; // MAD

    // ── Subscription initiation ───────────────────────────────────────────────

    @Transactional
    public CmiInitiateResponse initiateCmiSubscription(String planId, String couponCode, User user) {
        if (user.hasActiveSubscription()) {
            throw new BadRequestException("You already have an active subscription");
        }

        // Resolve plan
        String planPrefix;
        BigDecimal price;
        if ("monthly".equalsIgnoreCase(planId)) {
            planPrefix = "SUB-MON";
            price      = monthlyPrice;
        } else {
            planPrefix = "SUB-YEA";
            price      = yearlyPrice;
        }

        // Apply coupon (yearly only)
        if (couponCode != null && !couponCode.isBlank()) {
            if (!"yearly".equalsIgnoreCase(planId)) {
                throw new BadRequestException("Coupons are only valid for the Annual plan");
            }
            price = couponService.applyCoupon(couponCode, user, price);
        }

        String orderId = planPrefix + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        PaymentTransaction txn = transactionRepository.save(
            PaymentTransaction.builder()
                .user(user)
                .payzoneOrderId(orderId)   // stores the CMI oid
                .transactionType("SUBSCRIPTION")
                .amount(price)
                .currency(subscriptionCurrency)
                .status(PaymentStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build()
        );

        Map<String, String> formParams = buildFormParams(orderId, price, user);
        return CmiInitiateResponse.builder()
                .transactionId(txn.getId())
                .gatewayUrl(gatewayUrl)
                .formParams(formParams)
                .build();
    }

    // ── Course purchase initiation ────────────────────────────────────────────

    @Transactional
    public CmiInitiateResponse initiateCmiCoursePayment(UUID courseId, User user) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        if (!course.getRequiresPurchase()) {
            throw new BadRequestException("This course does not require purchase");
        }
        if (enrollmentService.isUserEnrolled(user, course)) {
            throw new BadRequestException("You already have access to this course");
        }

        String orderId = "CRS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        PaymentTransaction txn = transactionRepository.save(
            PaymentTransaction.builder()
                .user(user)
                .payzoneOrderId(orderId)
                .transactionType("COURSE_PURCHASE")
                .referenceId(courseId)
                .amount(course.getPrice())
                .currency("MAD")
                .status(PaymentStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build()
        );

        Map<String, String> formParams = buildFormParams(orderId, course.getPrice(), user);
        return CmiInitiateResponse.builder()
                .transactionId(txn.getId())
                .gatewayUrl(gatewayUrl)
                .formParams(formParams)
                .build();
    }

    // ── CMI server-to-server callback ─────────────────────────────────────────

    /**
     * Validates the CMI callback request and triggers payment processing.
     *
     * @param params  All POST params sent by CMI (flat key→value map)
     * @return "ACTION=POSTAUTH", "APPROVED", or "FAILURE" as plain text
     */
    @Transactional
    public String handleCmiCallback(Map<String, String> params) {
        log.info("CMI callback received — oid={} ProcReturnCode={} paramKeys={}",
                params.get("oid"), params.get("ProcReturnCode"), params.keySet());

        try {
            // 1. Find HASH (case-insensitive — CMI may send as "HASH" or "hash")
            String receivedHash = params.entrySet().stream()
                    .filter(e -> e.getKey().equalsIgnoreCase("hash"))
                    .map(Map.Entry::getValue)
                    .findFirst()
                    .orElse(null);

            if (receivedHash == null) {
                log.error("CMI callback missing HASH field — oid={} allKeys={}",
                        params.get("oid"), params.keySet());
                return "FAILURE";
            }

            // 2. Find HASHPARAMSVAL — CMI always includes this for ver3 callbacks.
            //    The correct callback verification is:
            //      SHA-512(HASHPARAMSVAL + "|" + storeKey) → Base64 == HASH
            //    CMI uses HASHPARAMSVAL (not a re-sorted full-param hash) for callback integrity.
            String hashParamsVal = params.entrySet().stream()
                    .filter(e -> e.getKey().equalsIgnoreCase("hashparamsval"))
                    .map(Map.Entry::getValue)
                    .findFirst()
                    .orElse(null);

            log.debug("CMI callback hash fields — HASHPARAMSVAL_present={} HASH_prefix={}",
                    hashParamsVal != null,
                    receivedHash.length() > 8 ? receivedHash.substring(0, 8) + "…" : receivedHash);

            String computedHash;
            if (hashParamsVal != null) {
                // Standard CMI ver3 callback verification using HASHPARAMSVAL
                computedHash = computeCallbackHash(hashParamsVal);
                log.debug("CMI callback using HASHPARAMSVAL path — computedHash_prefix={}",
                        computedHash.length() > 8 ? computedHash.substring(0, 8) + "…" : computedHash);
            } else {
                // Fallback: no HASHPARAMSVAL — recompute from all sorted params
                log.warn("CMI callback missing HASHPARAMSVAL — falling back to sort-all-params hash");
                computedHash = computeHash(params);
            }

            if (!computedHash.equals(receivedHash)) {
                log.error("CMI callback HASH mismatch — oid={} storeKey_prefix={} received={} computed={} HASHPARAMSVAL_prefix={}",
                        params.get("oid"),
                        storeKey.length() > 4 ? storeKey.substring(0, 4) + "***" : "???",
                        receivedHash.length() > 12 ? receivedHash.substring(0, 12) + "…" : receivedHash,
                        computedHash.length() > 12 ? computedHash.substring(0, 12) + "…" : computedHash,
                        hashParamsVal != null
                                ? (hashParamsVal.length() > 40 ? hashParamsVal.substring(0, 40) + "…" : hashParamsVal)
                                : "N/A");
                return "FAILURE";
            }

            log.info("CMI callback HASH verified OK — oid={}", params.get("oid"));

            // 2. Check return code
            String procReturnCode = params.getOrDefault("ProcReturnCode", "");
            String oid            = params.getOrDefault("oid", "");
            String authCode       = params.getOrDefault("AuthCode", "");

            if ("00".equals(procReturnCode)) {
                // 3. Process successful payment
                paymentService.processPaymentCallback(oid, "SUCCESS", authCode);
                log.info("CMI payment SUCCESS — oid={} authCode={}", oid, authCode);
                return "ACTION=POSTAUTH";
            } else {
                // Authorization refused / error — acknowledge without processing
                paymentService.processPaymentCallback(oid, "FAILED", authCode);
                log.warn("CMI payment REFUSED — oid={} procReturnCode={}", oid, procReturnCode);
                return "APPROVED";
            }

        } catch (Exception e) {
            log.error("CMI callback processing error: {}", e.getMessage(), e);
            return "FAILURE";
        }
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    /**
     * Builds all CMI form parameters for a given order (subscription or course).
     * Computes and appends the HASH before returning.
     */
    private Map<String, String> buildFormParams(String orderId, BigDecimal amount, User user) {
        // Use a TreeMap sorted case-insensitively — required for correct hash order
        TreeMap<String, String> params = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);

        params.put("clientid",      clientId);
        params.put("oid",           orderId);
        params.put("amount",        String.format("%.2f", amount));
        params.put("currency",      currency);          // 504 = MAD
        params.put("okUrl",         okUrl);
        params.put("failUrl",       failUrl);
        params.put("callbackUrl",   callbackUrl);
        params.put("shopurl",       shopUrl);
        params.put("storetype",     "3D_PAY_HOSTING");
        params.put("trantype",      "PreAuth");
        params.put("hashAlgorithm", "ver3");
        params.put("lang",          "fr");
        params.put("rnd",           UUID.randomUUID().toString().replace("-", "").substring(0, 20));
        params.put("email",         user.getEmail());
        params.put("BillToName",    sanitizeName(user.getFullName()));
        params.put("tel",           sanitizeTel(user.getPhone()));
        params.put("refreshtime",   "5");
        // encoding is included in form but EXCLUDED from hash
        params.put("encoding",      "UTF-8");

        // Compute HASH over all params except "hash" and "encoding"
        try {
            String hash = computeHash(params);
            params.put("HASH", hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-512 not available", e);
        }

        // Return as a LinkedHashMap for stable ordering in JSON (cosmetic only)
        return new LinkedHashMap<>(params);
    }

    /**
     * Computes the CMI SHA-512 hash (hashAlgorithm=ver3).
     *
     * Algorithm:
     *   1. Sort all param names case-insensitively
     *   2. Exclude "hash" and "encoding" (case-insensitive)
     *   3. Escape each value:  \ → \\   and   | → \|
     *   4. Concatenate:  val1|val2|...|valN|storeKey
     *   5. SHA-512 → raw bytes → Base64
     *
     * This is identical to PHP:
     *   base64_encode(pack('H*', hash('sha512', $hashval)))
     */
    String computeHash(Map<String, String> params) throws NoSuchAlgorithmException {
        // Build sorted view — TreeMap already uses CASE_INSENSITIVE_ORDER if passed one,
        // but params could be a plain HashMap from the callback. Re-sort to be safe.
        TreeMap<String, String> sorted = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        sorted.putAll(params);

        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : sorted.entrySet()) {
            String key = entry.getKey();
            if (key.equalsIgnoreCase("hash") || key.equalsIgnoreCase("encoding")) {
                continue; // excluded from hash
            }
            sb.append(escapeValue(entry.getValue())).append("|");
        }
        // Append the store key (also escaped)
        sb.append(escapeValue(storeKey));

        MessageDigest sha512 = MessageDigest.getInstance("SHA-512");
        byte[] digest = sha512.digest(sb.toString().getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(digest);
    }

    /**
     * Computes the CMI callback hash using HASHPARAMSVAL.
     *
     * CMI's callback integrity check (ver3):
     *   HASH == Base64(SHA-512(HASHPARAMSVAL + "|" + storeKey))
     *
     * HASHPARAMSVAL is sent by CMI in the callback POST body — it is the
     * pre-concatenated, escaped param-value string CMI used to build the hash.
     * We just append our storeKey and verify.
     */
    private String computeCallbackHash(String hashParamsVal) throws NoSuchAlgorithmException {
        // Append the store key (escaped, though our key contains no \ or |)
        String hashInput = hashParamsVal + "|" + escapeValue(storeKey);
        MessageDigest sha512 = MessageDigest.getInstance("SHA-512");
        byte[] digest = sha512.digest(hashInput.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(digest);
    }

    /** Escapes a CMI parameter value: \ → \\   |  → \| */
    private String escapeValue(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("|", "\\|");
    }

    /**
     * Strips diacritics and non-ASCII characters from a name.
     * CMI billing fields must not contain accents or special characters.
     */
    private String sanitizeName(String name) {
        if (name == null || name.isBlank()) return "Customer";
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD);
        return normalized.replaceAll("[^\\x00-\\x7F]", "")
                         .replaceAll("[^a-zA-Z0-9 \\-]", "")
                         .trim();
    }

    /** Returns a safe phone string (digits, +, spaces only). */
    private String sanitizeTel(String phone) {
        if (phone == null || phone.isBlank()) return "0000000000";
        return phone.replaceAll("[^0-9+ ]", "").trim();
    }
}
