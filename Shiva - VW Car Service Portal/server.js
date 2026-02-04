import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.disable("x-powered-by");

const PORT = Number(process.env.PORT) || 3000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/vw-service";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2h";
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PROD = NODE_ENV === "production";

const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const defaultOrigins = [
  `http://localhost:${PORT}`,
  `http://127.0.0.1:${PORT}`,
];
const allowedOrigins = envOrigins.length ? envOrigins : defaultOrigins;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
      },
    },
  })
);

if (IS_PROD && JWT_SECRET === "dev-secret-change-me") {
  console.error("JWT_SECRET must be set in production.");
  process.exit(1);
}

mongoose.set("strictQuery", true);
mongoose
  .connect(MONGO_URI, { autoIndex: !IS_PROD })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

mongoose.connection.on("error", (error) => {
  console.error("MongoDB error:", error);
});

mongoose.connection.once("open", () => {
  console.log("MongoDB connected");
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 254,
    unique: true,
  },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const bookingSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  model: { type: String, required: true, trim: true, maxlength: 60 },
  reg: { type: String, required: true, trim: true, maxlength: 30 },
  tasks: { type: [String], required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  appointmentAt: { type: Date, required: true, index: true },
  notes: { type: String, default: "", maxlength: 1000 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

bookingSchema.pre("save", function saveHook(next) {
  this.updatedAt = new Date();
  next();
});

const User = mongoose.model("User", userSchema);
const Booking = mongoose.model("Booking", bookingSchema);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

function normalizeText(value, maxLen) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLen);
}

function normalizeEmail(value) {
  return normalizeText(value, 254).toLowerCase();
}

function normalizeUsername(value) {
  return normalizeText(value, 30);
}

function normalizeReg(value) {
  return normalizeText(value, 30).toUpperCase();
}

function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) return [];
  const cleaned = tasks
    .map((task) => normalizeText(String(task), 80))
    .filter(Boolean);
  return Array.from(new Set(cleaned));
}

function parseTime(value) {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value || "");
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
}

function buildAppointmentAt(dateValue, timeValue) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue || "")) return null;
  const [year, month, day] = dateValue.split("-").map(Number);
  const time = parseTime(timeValue);
  if (!time) return null;
  const appointmentAt = new Date(
    year,
    month - 1,
    day,
    time.hours,
    time.minutes,
    0,
    0
  );
  if (Number.isNaN(appointmentAt.getTime())) return null;
  return appointmentAt;
}

function validateBookingInput(body) {
  const model = normalizeText(body.model, 60);
  const reg = normalizeReg(body.reg);
  const tasks = normalizeTasks(body.tasks);
  const date = normalizeText(body.date, 10);
  const time = normalizeText(body.time, 10);
  const notes = normalizeText(body.notes || "", 1000);
  const appointmentAt = buildAppointmentAt(date, time);
  const errors = [];

  if (!model) errors.push("Model is required.");
  if (!reg) errors.push("Registration number is required.");
  if (tasks.length === 0) errors.push("At least one task is required.");
  if (!appointmentAt) errors.push("Valid date and time are required.");

  return {
    errors,
    data: { model, reg, tasks, date, time, notes, appointmentAt },
  };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function createToken(user) {
  return jwt.sign({ sub: user._id.toString() }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

function ensureObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

app.use("/api", apiLimiter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/register", authLimiter, async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const errors = [];

    if (!username) errors.push("Username is required.");
    if (!email || !isValidEmail(email)) errors.push("Email is invalid.");
    if (password.length < 8 || password.length > 72) {
      errors.push("Password must be 8-72 characters.");
    }

    if (errors.length) {
      return res.status(400).json({ errors });
    }

    const existing = await User.findOne({
      $or: [{ username }, { email }],
    }).lean();
    if (existing) {
      return res.status(409).json({ error: "Account already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, passwordHash });
    const token = createToken(user);
    return res.status(201).json({
      token,
      user: { id: user._id.toString(), username: user.username, email },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: "Account already exists." });
    }
    console.error("Register error:", error);
    return res.status(500).json({ error: "Failed to register." });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const identifier = normalizeText(req.body.identifier, 254);
    const password = String(req.body.password || "");
    if (!identifier || !password) {
      return res.status(400).json({ error: "Missing credentials." });
    }

    const lookupEmail = normalizeEmail(identifier);
    const lookupUsername = normalizeUsername(identifier);
    const user = await User.findOne({
      $or: [{ email: lookupEmail }, { username: lookupUsername }],
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = createToken(user);
    return res.json({
      token,
      user: { id: user._id.toString(), username: user.username, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Failed to login." });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch user." });
  }
});

app.get("/api/bookings", requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ owner: req.userId })
      .sort({ appointmentAt: 1 })
      .lean();
    return res.json(
      bookings.map((booking) => ({
        id: booking._id.toString(),
        model: booking.model,
        reg: booking.reg,
        tasks: booking.tasks,
        date: booking.date,
        time: booking.time,
        notes: booking.notes,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      }))
    );
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch bookings." });
  }
});

app.post("/api/bookings", requireAuth, async (req, res) => {
  try {
    const { errors, data } = validateBookingInput(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const booking = await Booking.create({ ...data, owner: req.userId });
    return res.status(201).json({
      id: booking._id.toString(),
      model: booking.model,
      reg: booking.reg,
      tasks: booking.tasks,
      date: booking.date,
      time: booking.time,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    });
  } catch (error) {
    console.error("Booking create error:", error);
    return res.status(500).json({ error: "Failed to save booking." });
  }
});

app.put("/api/bookings/:id", requireAuth, async (req, res) => {
  try {
    if (!ensureObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid booking id." });
    }
    const { errors, data } = validateBookingInput(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { ...data, updatedAt: new Date() },
      { new: true }
    );

    if (!booking) return res.status(404).json({ error: "Booking not found." });

    return res.json({
      id: booking._id.toString(),
      model: booking.model,
      reg: booking.reg,
      tasks: booking.tasks,
      date: booking.date,
      time: booking.time,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    });
  } catch (error) {
    console.error("Booking update error:", error);
    return res.status(500).json({ error: "Failed to update booking." });
  }
});

app.delete("/api/bookings/:id", requireAuth, async (req, res) => {
  try {
    if (!ensureObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid booking id." });
    }
    const booking = await Booking.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId,
    });
    if (!booking) return res.status(404).json({ error: "Booking not found." });
    return res.json({ message: "Booking deleted." });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete booking." });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname, { index: false }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/styles.css", (req, res) => {
  res.sendFile(path.join(__dirname, "styles.css"));
});

app.get("/script.js", (req, res) => {
  res.sendFile(path.join(__dirname, "script.js"));
});

app.use((err, req, res, next) => {
  if (err?.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS blocked this request." });
  }
  console.error("Server error:", err);
  return res.status(500).json({ error: "Unexpected server error." });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
