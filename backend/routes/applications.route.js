const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const applications = require("../services/applications.service");

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const rows = await applications.listApplications(req.query);
  res.json({ ok: true, data: rows });
}));

router.post("/", asyncHandler(async (req, res) => {
  const result = await applications.createApplication(req.body);
  res.status(201).json({ ok: true, data: result });
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const result = await applications.updateApplication(req.params.id, req.body);
  res.json({ ok: true, data: result });
}));

module.exports = router;
