const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const blogs = require("../services/blogs.service");

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const rows = await blogs.listBlogs(req.query);
  res.json({ ok: true, data: rows });
}));

router.get("/categories/list", asyncHandler(async (req, res) => {
  const rows = await blogs.listBlogCategories();
  res.json({ ok: true, data: rows });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const blog = await blogs.getBlog(req.params.id);

  if (!blog) {
    return res.status(404).json({ ok: false, error: "Blog post not found" });
  }

  res.json({ ok: true, data: blog });
}));

router.get("/:id/comments", asyncHandler(async (req, res) => {
  const blog = await blogs.getBlog(req.params.id);

  if (!blog) {
    return res.status(404).json({ ok: false, error: "Blog post not found" });
  }

  const comments = await blogs.listComments(blog.id, { ...req.query, status: req.query.status || "approved" });
  res.json({ ok: true, data: comments });
}));

router.post("/:id/comments", asyncHandler(async (req, res) => {
  const blog = await blogs.getBlog(req.params.id);

  if (!blog) {
    return res.status(404).json({ ok: false, error: "Blog post not found" });
  }

  const result = await blogs.createComment(blog.id, req.body);
  res.status(201).json({ ok: true, data: result });
}));

module.exports = router;
