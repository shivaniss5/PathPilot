
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const crypto = require("crypto");
require("dotenv").config();

const Roadmap = require("./models/Roadmap");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 5000;
const TOKEN_SECRET =
  process.env.TOKEN_SECRET || process.env.MONGODB_URI;

app.use(cors());
app.use(express.json({ limit: "20kb" }));

function makeToken(user) {
  const payload = Buffer.from(
    JSON.stringify({
      id: String(user._id),
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : "";

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return res.status(401).json({
      message: "Please log in to continue.",
    });
  }

  const expected = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payload)
    .digest();

  const actual = Buffer.from(signature, "base64url");

  if (
    actual.length !== expected.length ||
    !crypto.timingSafeEqual(actual, expected)
  ) {
    return res.status(401).json({
      message: "Invalid session. Please log in again.",
    });
  }

  let data;

  try {
    data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );
  } catch {
    return res.status(401).json({
      message: "Invalid session. Please log in again.",
    });
  }

  if (!data.id || data.exp < Date.now()) {
    return res.status(401).json({
      message: "Your session expired. Please log in again.",
    });
  }

  req.userId = data.id;
  next();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function safeUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
  };
}

app.get("/", (req, res) => {
  res.send("PathPilot API is running!");
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (name.length < 2) {
      return res.status(400).json({
        message: "Please enter your name (at least 2 characters).",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters.",
      });
    }

    if (await User.findOne({ email })) {
      return res.status(409).json({
        message: "An account with this email already exists. Please log in.",
      });
    }

    const { salt, hash } = hashPassword(password);

    const user = await User.create({
      name,
      email,
      passwordSalt: salt,
      passwordHash: hash,
    });

    res.status(201).json({
      token: makeToken(user),
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({
      message: "Registration failed. Please try again.",
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email });

    if (!user || !user.passwordSalt || !user.passwordHash) {
      return res.status(401).json({
        message: "Email or password is incorrect.",
      });
    }

    const { hash } = hashPassword(password, user.passwordSalt);
    const expected = Buffer.from(user.passwordHash, "hex");
    const actual = Buffer.from(hash, "hex");

    if (
      expected.length !== actual.length ||
      !crypto.timingSafeEqual(expected, actual)
    ) {
      return res.status(401).json({
        message: "Email or password is incorrect.",
      });
    }

    res.json({
      token: makeToken(user),
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      message: "Login failed. Please try again.",
    });
  }
});

app.get("/api/roadmap/:careerTitle", authRequired, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({
      userId: req.userId,
      careerTitle: req.params.careerTitle,
    });

    res.json(
      roadmap || {
        careerTitle: req.params.careerTitle,
        completedMilestones: [],
      }
    );
  } catch (error) {
    res.status(500).json({
      message: "Could not load roadmap progress.",
    });
  }
});

app.post("/api/roadmap", authRequired, async (req, res) => {
  try {
    const { careerTitle, completedMilestones } = req.body;

    if (
      typeof careerTitle !== "string" ||
      !Array.isArray(completedMilestones) ||
      !completedMilestones.every(Number.isInteger)
    ) {
      return res.status(400).json({
        message: "Invalid roadmap progress.",
      });
    }

    const roadmap = await Roadmap.findOneAndUpdate(
      {
        userId: req.userId,
        careerTitle,
      },
      {
        userId: req.userId,
        careerTitle,
        completedMilestones,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.json(roadmap);
  } catch (error) {
    console.error("Save progress error:", error.message);
    res.status(500).json({
      message: "Could not save roadmap progress.",
    });
  }
});

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
