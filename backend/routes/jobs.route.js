const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const jobs = require("../services/jobs.service");

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const rows = await jobs.listJobs(req.query);
  res.json({ ok: true, data: rows });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const job = await jobs.getJob(req.params.id);

  if (!job) {
    return res.status(404).json({ ok: false, error: "Job not found" });
  }

  res.json({ ok: true, data: job });
}));

router.post("/", asyncHandler(async (req, res) => {
  const result = await jobs.createJob(req.body);
  res.status(201).json({ ok: true, data: result });
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const result = await jobs.updateJob(req.params.id, req.body);
  res.json({ ok: true, data: result });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const result = await jobs.deleteJob(req.params.id);
  res.json({ ok: true, data: result });
}));

module.exports = router;
