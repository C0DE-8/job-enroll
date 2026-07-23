const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const auth = require("../services/auth.service");

const router = express.Router();

router.post("/register", asyncHandler(async (req, res) => {
  const result = await auth.register(req.body);
  res.status(201).json({ ok: true, data: result });
}));

router.post("/login", asyncHandler(async (req, res) => {
  const user = await auth.login(req.body);
  res.json({ ok: true, data: user });
}));

module.exports = router;
