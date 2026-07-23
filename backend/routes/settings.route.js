const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const settings = require("../services/settings.service");

const router = express.Router();

router.get("/payment", asyncHandler(async (req, res) => {
  const paymentSettings = await settings.getPaymentSettings();
  res.json({ ok: true, data: paymentSettings });
}));

module.exports = router;
