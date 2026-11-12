package com.academy.integration.cmi;

import com.academy.dto.response.CmiInitiateResponse;
import com.academy.entity.Course;
import com.academy.entity.Ebook;
import com.academy.entity.PaymentTransaction;
import com.academy.entity.User;
import com.academy.entity.enums.EbookStatus;
import com.academy.entity.enums.PaymentStatus;
import com.academy.exception.BadRequestException;
import com.academy.exception.ResourceNotFoundException;
import com.academy.repository.CourseRepository;
import com.academy.repository.PaymentTransactionRepository;
import com.academy.service.CouponService;
import com.academy.service.EnrollmentService;
import com.academy.service.EbookService;
import com.academy.service.MasterclassBookingService;
import com.academy.service.PaymentService;
import com.academy.service.SettingsService;
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
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
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
 *  INCOMING / CALLBACK (CMI → merchant, handleCmiCallback) — see verifyCallbackSignature:
 *   - Same ver3 algorithm over ALL posted params (except HASH / encoding), or
 *   - HASH == Base64(SHA-512(HASHPARAMSVAL + "|" + storeKey)) when HASHPARAMSVAL is
 *     proven to be built from this request's own fields (incl. oid + ProcReturnCode).
 *   - Unsigned or mismatching callbacks are rejected ("FAILURE"); there is no bypass.
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
    private final SettingsService             settingsService;
    private final EbookService                ebookService;
    private final MasterclassBookingService   masterclassBookingService;

    // ── Config ───────────────────────────────────────────────────────────────
    @Value("${cmi.client-id}")   private String clientId;
    @Value("${cmi.store-key}")   private String storeKey;
    @Value("${cmi.gateway-url}") private String gatewayUrl;
    @Value("${cmi.currency}")    private String currency;
    @Value("${cmi.callback-url}") private String callbackUrl;
    @Value("${cmi.ok-url}")       private String okUrl;
    @Value("${cmi.fail-url}")     private String failUrl;
    @Value("${cmi.shop-url}")     private String shopUrl;

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
            price      = settingsService.getMonthlyPrice();
        } else {
            planPrefix = "SUB-YEA";
            price      = settingsService.getYearlyPrice();
        }

        // Apply coupon (yearly only)
        if (couponCode != null && !couponCode.isBlank()) {
            if (!"yearly".equalsIgnoreCase(planId)) {
                throw new BadRequestException("Coupons are only valid for the Annual plan");
            }
            price = couponService.applyCoupon(couponCode, user, price);
            if (price.signum() <= 0) {
                // A card payment of 0.00 is refused by CMI; full-discount access is
                // granted by an admin (Users → Activate plan) instead.
                throw new BadRequestException("This coupon covers the full price — please contact support to activate your plan.");
            }
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
                .couponCode(couponCode != null && !couponCode.isBlank() ? couponCode.trim().toUpperCase() : null)
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

        // Only approved (published) courses can be bought.
        if (course.getStatus() != com.academy.entity.enums.CourseStatus.PUBLISHED) {
            throw new BadRequestException("This course is not available for purchase");
        }
        if (!course.getRequiresPurchase()) {
            throw new BadRequestException("This course does not require purchase");
        }
        if (enrollmentService.isUserEnrolled(user, course)) {
            throw new BadRequestException("You already have access to this course");
        }

        // LIVE masterclass: lock the course row, then check price / date / seats.
        // The PENDING transaction saved below holds a seat for a limited time, so
        // concurrent buyers can never outnumber the places left.
        boolean liveMasterclass = masterclassBookingService.isLiveMasterclass(course);
        if (liveMasterclass) {
            course = masterclassBookingService.lockCourse(courseId);
            masterclassBookingService.assertCanStartCardPayment(course, user);
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
                .expiresAt(liveMasterclass
                        ? LocalDateTime.now().plusMinutes(MasterclassBookingService.SEAT_HOLD_MINUTES)
                        : LocalDateTime.now().plusHours(1))
                .build()
        );

        if (liveMasterclass) {
            // Displayed availability now includes this hold.
            masterclassBookingService.evictCourseCachesAfterCommit();
        }

        Map<String, String> formParams = buildFormParams(orderId, course.getPrice(), user);
        return CmiInitiateResponse.builder()
                .transactionId(txn.getId())
                .gatewayUrl(gatewayUrl)
                .formParams(formParams)
                .build();
    }

    /**
     * Start a CMI payment for an ebook.
     *
     * Deliberately performs no subscription check: an ebook is a one-off purchase
     * that any signed-in student can make, with or without a plan.
     */
    public CmiInitiateResponse initiateCmiEbookPayment(UUID ebookId, User user) {
        Ebook ebook = ebookService.findById(ebookId);

        if (ebook.getStatus() != EbookStatus.PUBLISHED) {
            throw new BadRequestException("This ebook is not available for purchase");
        }
        if (ebookService.userOwns(user, ebook)) {
            throw new BadRequestException("You already own this ebook");
        }

        String orderId = "EBK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        PaymentTransaction txn = transactionRepository.save(
            PaymentTransaction.builder()
                .user(user)
                .payzoneOrderId(orderId)
                .transactionType("EBOOK_PURCHASE")
                .referenceId(ebookId)
                .amount(ebook.getPrice())
                .currency("MAD")
                .status(PaymentStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build()
        );

        Map<String, String> formParams = buildFormParams(orderId, ebook.getPrice(), user);
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
    // No outer transaction: settlement (processPaymentCallback) commits on its own, so a
    // failure inside it rolls back cleanly and CMI gets the plain-text "FAILURE"
    // instead of an HTTP 500 from an "unexpected rollback" at commit time.
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

            // 2. Verify the signature. A callback is only trusted when its HASH
            //    covers the fields we act on (oid, ProcReturnCode, amount); an
            //    unsigned or partially-signed callback is never accepted.
            String verifiedBy = verifyCallbackSignature(params, receivedHash);
            if (verifiedBy == null) {
                log.error("CMI callback REJECTED — invalid or unsigned HASH. oid={} keys={}",
                        params.get("oid"), params.keySet());
                return "FAILURE";
            }
            log.info("CMI callback HASH verified ({}) — oid={}", verifiedBy, params.get("oid"));

            // 3. Check return code
            String procReturnCode = params.getOrDefault("ProcReturnCode", "");
            String oid            = params.getOrDefault("oid", "");
            String authCode       = params.getOrDefault("AuthCode", "");

            if (transactionRepository.findByPayzoneOrderId(oid).isEmpty()) {
                log.error("CMI callback for unknown order — oid={} — not capturing", oid);
                return "APPROVED";
            }

            // 4. The signed amount must equal what we charged for this order.
            if ("00".equals(procReturnCode) && !amountMatches(oid, params.get("amount"))) {
                log.error("CMI callback amount mismatch — oid={} callbackAmount={} — not capturing",
                        oid, params.get("amount"));
                return "APPROVED";
            }

            if ("00".equals(procReturnCode)) {
                // 3. Process successful payment
                paymentService.processPaymentCallback(oid, "SUCCESS", authCode);

                // Capture the pre-authorised amount only when the order really
                // completed. It may have been refused (masterclass full, item
                // already owned) or ignored (order no longer pending — a replay);
                // then "APPROVED" acknowledges without debiting the card.
                boolean bookingRefused = transactionRepository.findByPayzoneOrderId(oid)
                        .map(t -> t.getStatus() != PaymentStatus.COMPLETED)
                        .orElse(true);
                if (bookingRefused) {
                    log.warn("CMI payment authorised but booking refused — not capturing. oid={}", oid);
                    return "APPROVED";
                }
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
        // Locale.ROOT: always "300.00", never "300,00" on a French-locale server.
        params.put("amount",        String.format(Locale.ROOT, "%.2f", amount));
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
        params.put("BillToName",    resolveBillToName(user));
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
     * Verifies the HASH of a CMI server-to-server callback.
     *
     * Accepted forms (both bind the fields we act on):
     *  1. CMI "ver3" callback hash — the official CMI sample: every POSTed
     *     parameter except HASH and encoding, sorted case-insensitively, values
     *     escaped and joined with "|", then the store key; Base64(SHA-512).
     *     Since oid, ProcReturnCode and amount are among the posted values,
     *     none of them can be altered without breaking the hash.
     *  2. HASHPARAMS / HASHPARAMSVAL — only when HASHPARAMSVAL is exactly the
     *     concatenation of the values of the fields named in HASHPARAMS (so the
     *     signed string really describes this request) and HASHPARAMS covers
     *     oid and ProcReturnCode.
     *
     * Anything else — including a callback with no usable signature — is
     * rejected. There is deliberately no "test mode" bypass.
     *
     * @return a short label of the method that verified it, or null when rejected
     */
    String verifyCallbackSignature(Map<String, String> params, String receivedHash)
            throws NoSuchAlgorithmException {
        if (receivedHash == null || receivedHash.isBlank() || storeKey == null || storeKey.isBlank()) {
            return null;
        }

        // 1. Full-parameter ver3 hash (CMI's documented callback algorithm).
        TreeMap<String, String> sorted = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        for (Map.Entry<String, String> e : params.entrySet()) {
            String v = e.getValue() == null ? "" : e.getValue();
            if (v.endsWith("\n")) v = v.substring(0, v.length() - 1); // CMI sample strips one trailing newline
            sorted.put(e.getKey(), v);
        }
        if (constantTimeEquals(computeHash(sorted), receivedHash)) {
            return "ver3-all-params";
        }

        // 2. HASHPARAMS + HASHPARAMSVAL, bound to the actual request values.
        String hashParams    = getIgnoreCase(params, "hashparams");
        String hashParamsVal = getIgnoreCase(params, "hashparamsval");
        if (hashParams != null && hashParamsVal != null) {
            List<String> names = new ArrayList<>();
            for (String n : hashParams.split(":")) {
                if (!n.isBlank()) names.add(n.trim());
            }
            boolean coversCriticalFields = names.stream().anyMatch(n -> n.equalsIgnoreCase("oid"))
                    && names.stream().anyMatch(n -> n.equalsIgnoreCase("ProcReturnCode"));
            if (coversCriticalFields) {
                StringBuilder rebuiltPlain = new StringBuilder();
                StringBuilder rebuiltEscaped = new StringBuilder();
                for (int i = 0; i < names.size(); i++) {
                    String v = getIgnoreCase(params, names.get(i));
                    if (v == null) v = "";
                    rebuiltPlain.append(v);
                    if (i > 0) rebuiltEscaped.append('|');
                    rebuiltEscaped.append(escapeValue(v));
                }
                boolean valMatchesRequest = hashParamsVal.equals(rebuiltPlain.toString())
                        || hashParamsVal.equals(rebuiltEscaped.toString());
                if (valMatchesRequest && constantTimeEquals(computeCallbackHash(hashParamsVal), receivedHash)) {
                    return "hashparamsval";
                }
            }
        }
        return null;
    }

    /** The signed callback amount must equal the transaction amount (tolerates "300,00"). */
    private boolean amountMatches(String oid, String callbackAmount) {
        if (callbackAmount == null || callbackAmount.isBlank()) {
            // Not posted at all: the signature already covers every posted field.
            log.warn("CMI callback without amount — relying on signature only. oid={}", oid);
            return true;
        }
        try {
            BigDecimal paid = new BigDecimal(callbackAmount.trim().replace(',', '.'));
            return transactionRepository.findByPayzoneOrderId(oid)
                    .map(t -> t.getAmount() != null && t.getAmount().compareTo(paid) == 0)
                    .orElse(false);
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private static String getIgnoreCase(Map<String, String> params, String key) {
        for (Map.Entry<String, String> e : params.entrySet()) {
            if (e.getKey().equalsIgnoreCase(key)) return e.getValue();
        }
        return null;
    }

    private static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
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
     * Resolves a non-empty BillToName for the CMI payment page.
     *
     * BillToName is a mandatory field on the CMI hosted page. The raw full name
     * may be empty, or may be written entirely in a non-Latin script (e.g. Arabic)
     * that {@link #sanitizeName} strips down to an empty string. In those cases we
     * fall back to the email local-part, then to a generic label — so the attribute
     * is NEVER sent empty.
     */
    private String resolveBillToName(User user) {
        String cleaned = sanitizeName(user.getFullName());
        if (!cleaned.isBlank()) {
            return cleaned;
        }
        // Full name missing or stripped to nothing → derive from the email local-part
        String email = user.getEmail();
        if (email != null && email.contains("@")) {
            String local = sanitizeName(email.substring(0, email.indexOf('@')));
            if (!local.isBlank()) {
                return local;
            }
        }
        return "Customer";
    }

    /**
     * Strips diacritics and non-ASCII characters from a name.
     * CMI billing fields must not contain accents or special characters.
     * May return an empty string (e.g. for a fully non-Latin name) — callers
     * must handle that via {@link #resolveBillToName}.
     */
    private String sanitizeName(String name) {
        if (name == null || name.isBlank()) return "";
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