require('dotenv').config();  // ✅ Load .env first
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bodyParser = require("body-parser");
const path = require("path");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const User = require("./models/User");
const Resume = require("./models/Resume");

const app = express();

// ✅ Use environment Mongo URI or fallback local
const mongoUrl = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/resumeBuilder";

// ✅ Ensure resumes folder exists
const resumesDir = path.join(process.cwd(), "resumes");
if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir);

// ✅ Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ✅ Session (ENV secret + ENV mongoURL)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoUrl,
    }),
  })
);

// ✅ Connect to MongoDB
mongoose
  .connect(mongoUrl)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ==========================================
// ✅ Routes Start
// ==========================================

// Redirect root
app.get("/", (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  res.redirect("/resume");
});

// Login page
app.get("/login", (req, res) => res.render("index", { error: null }));

// Login user
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    return res.render("index", { error: "Invalid credentials" });
  }

  req.session.userId = user._id;
  res.redirect("/resume");
});

// Register route
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = new User({ email, password });
    await user.save();
    req.session.userId = user._id;
    res.redirect("/resume");
  } catch {
    res.render("index", { error: "User already exists" });
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// Resume form page
app.get("/resume", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const resume = await Resume.findOne({ userId: req.session.userId });
  res.render("resume", { resume });
});

// ✅ Generate PDF
app.post("/generate", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const { name, role, summary, skills, education, projects, experience, additional } = req.body;

  await Resume.findOneAndUpdate(
    { userId: req.session.userId },
    {
      name,
      role,
      summary,
      skills: (skills || "").split(",").map(s => s.trim()).filter(Boolean),
      education: (education || "").split(",").map(s => s.trim()).filter(Boolean),
      projects: (projects || "").split(",").map(s => s.trim()).filter(Boolean),
      experience: (experience || "").split(",").map(s => s.trim()).filter(Boolean),
      additional: (additional || "").split(",").map(s => s.trim()).filter(Boolean),
    },
    { upsert: true }
  );

  const doc = new PDFDocument({ margin: 50 });
  const fileName = `${name.replace(/\s+/g, "_")}_Resume.pdf`;
  const filePath = path.join(resumesDir, fileName);

  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  // Title
  doc.fillColor("#6a1b9a").fontSize(28).text(name);
  doc.fillColor("#8e24aa").fontSize(18).text(role);
  doc.moveDown(1);

  const addSection = (title, items) => {
    if (!items || items.length === 0) return;
    doc.fillColor("#6a1b9a").fontSize(16).text(title);
    doc.fillColor("#000").fontSize(12);
    items.forEach(item => doc.text(`• ${item}`));
    doc.moveDown(1);
  };

  addSection("Summary", [summary]);
  addSection("Skills", (skills || "").split(","));
  addSection("Education", (education || "").split(","));
  addSection("Projects", (projects || "").split(","));
  addSection("Experience", (experience || "").split(","));
  addSection("Additional Information", (additional || "").split(","));

  doc.end();

  writeStream.on("finish", () => {
    res.download(filePath, fileName, () => {
      fs.unlinkSync(filePath);
    });
  });
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
