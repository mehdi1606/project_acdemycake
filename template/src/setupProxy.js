/**
 * CRA dev-server proxy (Express middleware).
 *
 * CMI auto-submits a hidden form POST to okUrl / failUrl after every payment.
 * The React dev server can't serve index.html for a POST → "Cannot POST /…"
 *
 * This catches any POST to /payment/callback and converts it to a GET redirect
 * so the React SPA boots normally.
 *
 * NOTE: In production the same conversion is done by the Spring Boot
 * /api/v1/payments/cmi/return endpoint, so nginx never sees the POST.
 */
module.exports = function (app) {
  app.post('/payment/callback', (req, res) => {
    res.redirect(302, '/payment/callback');
  });
};
