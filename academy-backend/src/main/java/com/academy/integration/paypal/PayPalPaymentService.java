package com.academy.integration.paypal;

import com.academy.entity.PaymentTransaction;
import com.academy.entity.User;
import com.academy.entity.enums.PaymentStatus;
import com.academy.exception.BadRequestException;
import com.academy.exception.ServiceUnavailableException;
import com.academy.integration.paypal.PayPalClient.PayPalException;
import com.academy.repository.CourseRepository;
import com.academy.repository.PaymentTransactionRepository;
import com.academy.service.EbookService;
import com.academy.service.PaymentService;
import com.academy.service.payment.CheckoutOrderService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;
import java.util.UUID;

/**
 * PayPal checkout (Orders v2, redirect flow), alongside CMI.
 *
 * 1. initiate*: the order is checked and saved PENDING exactly like a CMI order
 *    (same price, coupon, seat-hold rules), then a PayPal order is created for the
 *    same amount converted to the PayPal currency (MAD is not a PayPal currency).
 * 2. The buyer approves on PayPal and comes back to /paypal/return?token=ORDER_ID.
 * 3. complete(): the order is read back FROM PAYPAL (never trusted from the
 *    browser), captured, checked (our order ref, amount, currency), then settled
 *    through PaymentService.processPaymentCallback — the same path as CMI, so
 *    enrolment, membership, ebooks, masterclass seats and invoices behave alike.
 * 4. If settlement refuses the order (masterclass full, already owned, order no
 *    longer pending), the capture is refunded at once.
 * The webhook only says "look at order X" and re-runs complete().
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PayPalPaymentService {

    private final PayPalClient                 client;
    private final CheckoutOrderService         checkoutOrderService;
    private final PaymentService               paymentService;
    private final PaymentTransactionRepository transactionRepository;
    private final CourseRepository             courseRepository;
    private final EbookService                 ebookService;

    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${paypal.currency:EUR}")              private String currency;
    @Value("${paypal.mad-per-unit:10.80}")        private BigDecimal madPerUnit;
    @Value("${paypal.return-url}")                private String returnUrl;
    @Value("${paypal.cancel-url}")                private String cancelUrl;

    public boolean isEnabled() { return client.isConfigured(); }
    public String getCurrency() { return currency; }
    public BigDecimal getMadPerUnit() { return madPerUnit; }

    /** What PayPal will charge for a MAD price. */
    public BigDecimal convert(BigDecimal mad) {
        return mad.divide(madPerUnit, 2, RoundingMode.HALF_UP);
    }

    // ── Initiation ────────────────────────────────────────────────────────────

    public Initiated initiateSubscription(String planId, String couponCode, User user) {
        requireEnabled();
        PaymentTransaction txn = checkoutOrderService.prepareSubscription(planId, couponCode, user, CheckoutOrderService.METHOD_PAYPAL);
        String label = "monthly".equalsIgnoreCase(planId) ? "Monthly membership" : "Annual membership";
        return createPayPalOrder(txn, label);
    }

    public Initiated initiateCourse(UUID courseId, User user) {
        requireEnabled();
        PaymentTransaction txn = checkoutOrderService.prepareCourse(courseId, user, CheckoutOrderService.METHOD_PAYPAL);
        String label = courseRepository.findById(courseId).map(c -> c.getTitle()).orElse("Course");
        return createPayPalOrder(txn, label);
    }

    public Initiated initiateEbook(UUID ebookId, User user) {
        requireEnabled();
        PaymentTransaction txn = checkoutOrderService.prepareEbook(ebookId, user, CheckoutOrderService.METHOD_PAYPAL);
        String label = "Ebook: " + ebookService.findById(ebookId).getTitle();
        return createPayPalOrder(txn, label);
    }

    private Initiated createPayPalOrder(PaymentTransaction txn, String label) {
        String oid = txn.getPayzoneOrderId();
        BigDecimal value = convert(txn.getAmount());
        if (value.compareTo(new BigDecimal("0.01")) < 0) {
            failOrder(oid, "Amount too small for PayPal");
            throw new BadRequestException("This amount can't be paid with PayPal");
        }

        ObjectNode body = client.newObject();
        body.put("intent", "CAPTURE");
        ObjectNode unit = body.putArray("purchase_units").addObject();
        unit.put("reference_id", oid);
        unit.put("custom_id", oid);
        unit.put("invoice_id", oid);
        unit.put("description", cut("SARALÖWE Academy — " + label, 127));
        ObjectNode amount = unit.putObject("amount");
        amount.put("currency_code", currency);
        amount.put("value", value.toPlainString());

        ObjectNode ctx = body.putObject("payment_source").putObject("paypal").putObject("experience_context");
        ctx.put("brand_name", "SARALÖWE Academy");
        ctx.put("shipping_preference", "NO_SHIPPING");
        ctx.put("user_action", "PAY_NOW");
        ctx.put("return_url", returnUrl);
        ctx.put("cancel_url", cancelUrl);

        JsonNode order;
        try {
            order = client.createOrder(body, "create-" + oid);
        } catch (PayPalException e) {
            // Release the PENDING order at once (frees a held masterclass seat).
            failOrder(oid, "PayPal order could not be created: " + e.getMessage());
            throw new ServiceUnavailableException("PayPal is not available right now. Please try again or pay by card.");
        }

        String paypalOrderId = order.path("id").asText();
        String approveUrl = null;
        for (JsonNode link : order.path("links")) {
            String rel = link.path("rel").asText();
            if ("payer-action".equals(rel) || "approve".equals(rel)) {
                approveUrl = link.path("href").asText();
            }
        }
        if (paypalOrderId.isBlank() || approveUrl == null) {
            failOrder(oid, "PayPal returned no approval link");
            throw new ServiceUnavailableException("PayPal is not available right now. Please try again or pay by card.");
        }

        ObjectNode data = mapper.createObjectNode();
        data.put("gateway", "paypal");
        data.put("mode", client.isLive() ? "live" : "sandbox");
        data.put("orderId", paypalOrderId);
        data.put("value", value.toPlainString());
        data.put("currency", currency);
        data.put("madPerUnit", madPerUnit.toPlainString());
        transactionRepository.updateCallbackData(txn.getId(), data.toString());

        log.info("PayPal order created — oid={} paypalOrder={} {} {} (MAD {})",
                oid, paypalOrderId, value, currency, txn.getAmount());
        return Initiated.builder()
                .transactionId(txn.getId())
                .approveUrl(approveUrl)
                .chargedAmount(value)
                .chargedCurrency(currency)
                .build();
    }

    // ── Completion (browser return + webhook) ─────────────────────────────────

    public enum Outcome { SUCCESS, PENDING, FAILED }

    public record Result(Outcome outcome, UUID transactionId, String orderRef) {}

    /**
     * Brings our order in line with the PayPal order. Safe to call many times and
     * concurrently (return page + webhook): captures are idempotent at PayPal and
     * settlement only ever acts on a PENDING order.
     */
    public Result complete(String paypalOrderId) {
        JsonNode order = client.getOrder(paypalOrderId);
        String oid = order.path("purchase_units").path(0).path("custom_id").asText("");
        PaymentTransaction txn = transactionRepository.findByPayzoneOrderId(oid).orElse(null);
        if (txn == null || !paypalOrderId.equals(storedOrderId(txn).orElse(null))) {
            log.error("PayPal order {} does not match any of our orders (custom_id={})", paypalOrderId, oid);
            return new Result(Outcome.FAILED, null, oid);
        }
        UUID txnId = txn.getId();

        String status = order.path("status").asText();
        if ("APPROVED".equals(status)) {
            try {
                order = client.captureOrder(paypalOrderId, "capture-" + oid);
            } catch (PayPalException e) {
                if ("ORDER_ALREADY_CAPTURED".equals(e.getIssue())) {
                    order = client.getOrder(paypalOrderId);
                } else if ("INSTRUMENT_DECLINED".equals(e.getIssue()) || "PAYER_ACTION_REQUIRED".equals(e.getIssue())) {
                    settle(oid, "FAILED", paypalOrderId);
                    return new Result(Outcome.FAILED, txnId, oid);
                } else {
                    throw e;
                }
            }
            status = order.path("status").asText();
        }

        if (!"COMPLETED".equals(status)) {
            // CREATED / PAYER_ACTION_REQUIRED: buyer has not approved (yet). VOIDED: dead.
            if ("VOIDED".equals(status)) settle(oid, "CANCELLED", paypalOrderId);
            return new Result("VOIDED".equals(status) ? Outcome.FAILED : Outcome.PENDING, txnId, oid);
        }

        JsonNode capture = order.path("purchase_units").path(0).path("payments").path("captures").path(0);
        String captureId     = capture.path("id").asText("");
        String captureStatus = capture.path("status").asText("");
        recordCapture(txn, captureId);

        if ("PENDING".equals(captureStatus)) {
            // e.g. under PayPal review: the webhook PAYMENT.CAPTURE.COMPLETED finishes it.
            log.info("PayPal capture pending — oid={} capture={} reason={}", oid, captureId,
                    capture.path("status_details").path("reason").asText());
            return new Result(Outcome.PENDING, txnId, oid);
        }
        if (!"COMPLETED".equals(captureStatus)) {
            settle(oid, "FAILED", captureId);
            return new Result(Outcome.FAILED, txnId, oid);
        }

        // The captured money must be exactly what we asked for.
        String value = capture.path("amount").path("value").asText("");
        String cur   = capture.path("amount").path("currency_code").asText("");
        if (!amountMatches(txn, value, cur)) {
            log.error("PayPal amount mismatch — oid={} captured {} {} — refunding", oid, value, cur);
            refundQuietly(captureId, oid, "Amount mismatch");
            settle(oid, "FAILED", captureId);
            return new Result(Outcome.FAILED, txnId, oid);
        }

        settle(oid, "SUCCESS", captureId);

        PaymentStatus after = transactionRepository.findStatusById(txnId);
        if (after != PaymentStatus.COMPLETED) {
            // Settlement refused (masterclass full, already bought, order expired or
            // cancelled meanwhile): give the money back straight away.
            log.warn("PayPal paid but order refused (status {}) — refunding. oid={}", after, oid);
            refundQuietly(captureId, oid, "Your booking could not be confirmed, so your payment was refunded in full.");
            return new Result(Outcome.FAILED, txnId, oid);
        }
        log.info("PayPal payment SUCCESS — oid={} capture={}", oid, captureId);
        return new Result(Outcome.SUCCESS, txnId, oid);
    }

    /** Buyer pressed "Cancel and return" on PayPal: release the order. */
    public Result cancel(String paypalOrderId) {
        JsonNode order = client.getOrder(paypalOrderId);
        String oid = order.path("purchase_units").path(0).path("custom_id").asText("");
        PaymentTransaction txn = transactionRepository.findByPayzoneOrderId(oid).orElse(null);
        if (txn == null || !paypalOrderId.equals(storedOrderId(txn).orElse(null))) {
            return new Result(Outcome.FAILED, null, oid);
        }
        // Never cancel an order PayPal already has money for.
        if ("COMPLETED".equals(order.path("status").asText()) || "APPROVED".equals(order.path("status").asText())) {
            return complete(paypalOrderId);
        }
        settle(oid, "CANCELLED", paypalOrderId);
        return new Result(Outcome.FAILED, txn.getId(), oid);
    }

    public static boolean isPayPal(PaymentTransaction txn) {
        return CheckoutOrderService.METHOD_PAYPAL.equals(txn.getPaymentMethod());
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private void settle(String oid, String status, String ref) {
        paymentService.processPaymentCallback(oid, status, ref);
    }

    private void failOrder(String oid, String why) {
        try {
            paymentService.processPaymentCallback(oid, "FAILED", null);
        } catch (Exception e) {
            log.warn("Could not release order {}: {}", oid, e.getMessage());
        }
        log.warn("PayPal order {} released: {}", oid, why);
    }

    private void refundQuietly(String captureId, String oid, String note) {
        if (captureId == null || captureId.isBlank()) return;
        try {
            client.refundCapture(captureId, null, null, note, "auto-refund-" + captureId);
            log.info("PayPal capture {} refunded automatically (oid={})", captureId, oid);
        } catch (PayPalException e) {
            // Already refunded (replay) or PayPal down: logged for the admin to check.
            log.error("PayPal automatic refund FAILED — capture={} oid={} : {}", captureId, oid, e.getMessage());
        }
    }

    private boolean amountMatches(PaymentTransaction txn, String value, String cur) {
        JsonNode data = readData(txn);
        try {
            return data.path("currency").asText().equalsIgnoreCase(cur)
                    && new BigDecimal(data.path("value").asText()).compareTo(new BigDecimal(value)) == 0;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private void recordCapture(PaymentTransaction txn, String captureId) {
        JsonNode data = readData(txn);
        if (captureId.isBlank() || captureId.equals(data.path("captureId").asText())) return;
        ObjectNode copy = data.isObject() ? ((ObjectNode) data).deepCopy() : mapper.createObjectNode();
        copy.put("captureId", captureId);
        transactionRepository.updateCallbackData(txn.getId(), copy.toString());
    }

    private Optional<String> storedOrderId(PaymentTransaction txn) {
        String id = readData(txn).path("orderId").asText("");
        return id.isBlank() ? Optional.empty() : Optional.of(id);
    }

    private JsonNode readData(PaymentTransaction txn) {
        try {
            return txn.getCallbackData() == null ? mapper.createObjectNode() : mapper.readTree(txn.getCallbackData());
        } catch (Exception e) {
            return mapper.createObjectNode();
        }
    }

    private void requireEnabled() {
        if (!isEnabled()) throw new BadRequestException("PayPal is not available");
    }

    private static String cut(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max);
    }

    @Getter
    @Builder
    public static class Initiated {
        private final UUID transactionId;
        private final String approveUrl;
        private final BigDecimal chargedAmount;
        private final String chargedCurrency;
    }
}
