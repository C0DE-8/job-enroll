require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const db = require("./db");
const errorHandler = require("./middleware/error-handler");

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    ok: true,
    name: "job-listing-backend",
    routes: [
      "/health",
      "/api/jobs",
      "/api/categories",
      "/api/companies",
      "/api/candidates",
      "/api/testimonials",
      "/api/applications",
      "/api/auth",
      "/api/admin",
      "/api/settings",
      "/api/contact",
      "/api/newsletter"
    ]
  });
});

app.get("/health", async (req, res) => {
  try {
    const status = await db.status();
    res.json({ ok: true, gateway: status });
  } catch (error) {
    res.status(503).json({ ok: false, error: error.message });
  }
});

app.use("/api/jobs", require("./routes/jobs.route"));
app.use("/api/categories", require("./routes/categories.route"));
app.use("/api/companies", require("./routes/companies.route"));
app.use("/api/candidates", require("./routes/candidates.route"));
app.use("/api/testimonials", require("./routes/testimonials.route"));
app.use("/api/applications", require("./routes/applications.route"));
app.use("/api/auth", require("./routes/auth.route"));
app.use("/api/admin", require("./routes/admin.route"));
app.use("/api/settings", require("./routes/settings.route"));
app.use("/api/contact", require("./routes/contact.route"));
app.use("/api/newsletter", require("./routes/newsletter.route"));

app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Route not found" });
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Job listing backend running on port ${port}`);
});
