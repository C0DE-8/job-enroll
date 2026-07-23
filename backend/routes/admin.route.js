const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const { requireAdmin, requireAuth } = require("../middleware/auth");
const admin = require("../services/admin.service");
const settings = require("../services/settings.service");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/payment-settings", asyncHandler(async (req, res) => {
  const paymentSettings = await settings.getPaymentSettings();
  res.json({ ok: true, data: paymentSettings });
}));

router.put("/payment-settings", asyncHandler(async (req, res) => {
  const paymentSettings = await settings.updatePaymentSettings(req.body, req.user.id);
  res.json({ ok: true, data: paymentSettings });
}));

router.get("/employers/pending", asyncHandler(async (req, res) => {
  const employers = await admin.listPendingEmployers();
  res.json({ ok: true, data: employers });
}));

router.put("/employers/:id/verify", asyncHandler(async (req, res) => {
  const employer = await admin.verifyEmployer(req.params.id, req.user.id);

  if (!employer) {
    return res.status(404).json({ ok: false, error: "Employer not found" });
  }

  res.json({ ok: true, data: employer });
}));

module.exports = router;
