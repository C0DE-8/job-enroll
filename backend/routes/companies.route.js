const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const companies = require("../services/companies.service");

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const rows = await companies.listCompanies(req.query);
  res.json({ ok: true, data: rows });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const company = await companies.getCompany(req.params.id);

  if (!company) {
    return res.status(404).json({ ok: false, error: "Company not found" });
  }

  res.json({ ok: true, data: company });
}));

router.post("/", asyncHandler(async (req, res) => {
  const result = await companies.createCompany(req.body);
  res.status(201).json({ ok: true, data: result });
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const result = await companies.updateCompany(req.params.id, req.body);
  res.json({ ok: true, data: result });
}));

module.exports = router;
