const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const { requireAdmin, requireAuth } = require("../middleware/auth");
const admin = require("../services/admin.service");
const categories = require("../services/categories.service");
const jobs = require("../services/jobs.service");
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

router.get("/categories", asyncHandler(async (req, res) => {
  const rows = await categories.listCategories(req.query);
  res.json({ ok: true, data: rows });
}));

router.post("/categories", asyncHandler(async (req, res) => {
  const result = await categories.createCategory(req.body);
  res.status(201).json({ ok: true, data: result });
}));

router.put("/categories/:id", asyncHandler(async (req, res) => {
  const result = await categories.updateCategory(req.params.id, req.body);
  res.json({ ok: true, data: result });
}));

router.delete("/categories/:id", asyncHandler(async (req, res) => {
  const result = await categories.deleteCategory(req.params.id);
  res.json({ ok: true, data: result });
}));

router.get("/jobs", asyncHandler(async (req, res) => {
  const rows = await jobs.listJobs({ ...req.query, limit: req.query.limit || 100 });
  res.json({ ok: true, data: rows });
}));

router.post("/jobs", asyncHandler(async (req, res) => {
  const result = await jobs.createJob(req.body);
  res.status(201).json({ ok: true, data: result });
}));

router.put("/jobs/:id", asyncHandler(async (req, res) => {
  const result = await jobs.updateJob(req.params.id, req.body);
  res.json({ ok: true, data: result });
}));

router.delete("/jobs/:id", asyncHandler(async (req, res) => {
  const result = await jobs.deleteJob(req.params.id);
  res.json({ ok: true, data: result });
}));

module.exports = router;
