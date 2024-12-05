require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db-operation/db");
const routes = require("./routes/routes");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", routes);

app.get("/search", (req, res) => {
  res.render("search-form"); // Render the form page using EJS
});

app.post("/search", async (req, res) => {
  const { page = 1, perPage = 5, property_type } = req.body;

  try {
    const { airbnbs, totalPages, totalCount } = await db.getAllAirBnBs(
      parseInt(page),
      parseInt(perPage),
      property_type
    );

    res.render("search-results", {
      airbnbs,
      page: parseInt(page),
      perPage: parseInt(perPage),
      property_type,
      currentPage: parseInt(page),
      totalPages,
      totalCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registration Route
app.get("/register", (req, res) => {
  res.render("register");
});

// Registration Post Route
app.post("/register", async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).send("Passwords do not match");
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("Email is already registered");
    }

    const newUser = new User({
      username,
      email,
      password,
    });

    newUser.password = await bcrypt.hash(password, 10);
    await newUser.save();

    res.redirect("/login");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Login Route
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send("Email or password is incorrect");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("Email or password is incorrect");
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("jwt", token, { httpOnly: true, secure: true });
    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Logout Route
app.post("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.status(200).send("Logged out successfully");
});

// Initialize Database and Start Server
(async () => {
  try {
    await db.initialize();
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
})();
