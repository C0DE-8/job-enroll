const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const categories = require("../services/categories.service");

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const rows = await categories.listCategories(req.query);
  res.json({ ok: true, data: rows });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const category = await categories.getCategory(req.params.id);

  if (!category) {
    return res.status(404).json({ ok: false, error: "Category not found" });
  }

  res.json({ ok: true, data: category });
}));

module.exports = router;
