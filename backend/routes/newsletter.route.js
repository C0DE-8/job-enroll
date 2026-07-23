const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const newsletter = require("../services/newsletter.service");

const router = express.Router();

router.post("/", asyncHandler(async (req, res) => {
  const result = await newsletter.subscribe(req.body);
  res.status(201).json({ ok: true, data: result });
}));

module.exports = router;
