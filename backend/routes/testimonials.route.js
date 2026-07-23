const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const testimonials = require("../services/testimonials.service");

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const rows = await testimonials.listTestimonials(req.query);
  res.json({ ok: true, data: rows });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const testimonial = await testimonials.getTestimonial(req.params.id);

  if (!testimonial) {
    return res.status(404).json({ ok: false, error: "Testimonial not found" });
  }

  res.json({ ok: true, data: testimonial });
}));

module.exports = router;
