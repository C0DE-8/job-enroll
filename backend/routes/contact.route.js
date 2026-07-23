const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const contact = require("../services/contact.service");

const router = express.Router();

router.post("/", asyncHandler(async (req, res) => {
  const result = await contact.createContactMessage(req.body);
  res.status(201).json({ ok: true, data: result });
}));

module.exports = router;
