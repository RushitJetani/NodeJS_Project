require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const db = require("./db-operation/db");
const routes = require("./routes/routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set secure: true in production
  })
);

// Set EJS as the template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const token = req.cookies.jwt; // Access JWT from cookies
  if (!token) {
    console.log("No token provided.");
    return res.status(401).send("Access denied. No token provided.");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add user info to the request object
    next();
  } catch (error) {
    console.log("Invalid or expired token:", error.message);
    return res.status(403).send("Invalid or expired token");
  }
}

// Middleware to check for Admin role
function checkAdmin(req, res, next) {
  if (req.user && req.user.role === "admin") {
    return next(); // Allow access if the user is admin
  } else {
    return res.status(403).send("Access denied. Admins only.");
  }
}

app.get("/adminadd", authenticateToken, checkAdmin, (req, res) => {
  res.render("update", {
    airbnb: {
      _id: "",
      listing_url: "",
      description: "",
      neighborhood_overview: "",
      cancellation_policy: "",
      property_type: "",
      room_type: "",
      accommodates: "",
      price: "",
    },
  });
});


// Routes
app.use("/", routes);

// Registration Route
app.get("/register", (req, res) => {
  res.render("register");
});

// Login Route
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send("Invalid email or password");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send("Invalid email or password");

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    req.session.user = { id: user._id, role: user.role };

    res.redirect("/search");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Logout Route
app.post("/logout", (req, res) => {
  res.clearCookie("jwt");
  req.session.destroy();
  res.status(200).send("Logged out successfully");
});

// Insert Route (Protected by JWT and Admin Check)
app.get("/insert", authenticateToken, checkAdmin, (req, res) => {
  res.send("Welcome to the insert page. Admin access granted.");
});

app.post("/insert", authenticateToken, checkAdmin, async (req, res) => {
  try {
    console.log("Received data for insertion:", req.body); // Debug request data
    const airbnb = await db.addNewAirBnB(req.body); // Add new AirBnB data
    res.status(201).json(airbnb);
  } catch (error) {
    console.error("Error inserting data:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Search Routes
app.get("/search", (req, res) => {
  res.render("search-form");
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
    console.error("Error fetching search results:", error.message);
    res.status(500).json({ error: error.message });
  }
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
