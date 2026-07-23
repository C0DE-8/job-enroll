const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const candidates = require("../services/candidates.service");

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const rows = await candidates.listCandidates(req.query);
  res.json({ ok: true, data: rows });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const candidate = await candidates.getCandidate(req.params.id);

  if (!candidate) {
    return res.status(404).json({ ok: false, error: "Candidate not found" });
  }

  res.json({ ok: true, data: candidate });
}));

router.post("/", asyncHandler(async (req, res) => {
  const result = await candidates.createCandidate(req.body);
  res.status(201).json({ ok: true, data: result });
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const result = await candidates.updateCandidate(req.params.id, req.body);
  res.json({ ok: true, data: result });
}));

module.exports = router;
