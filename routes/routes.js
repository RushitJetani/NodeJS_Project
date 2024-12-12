const express = require("express");
const db = require("../db-operation/db");
const { query, param, validationResult } = require("express-validator");
const router = express.Router();

// Add new AirBnB
router.post("/api/AirBnBs", async (req, res) => {
  try {
    const airbnb = await db.addNewAirBnB(req.body);
    res.status(201).json(airbnb);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Add Route



// Get all AirBnBs with validation and pagination
router.get(
  "/api/AirBnBs",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("perPage")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Items per page must be a positive integer"),
    query("property_type")
      .optional()
      .isString()
      .withMessage("Property type must be a string"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, perPage = 5, property_type } = req.query;

    // Convert page and perPage to numbers, ensuring they are valid
    const currentPage = Math.max(1, parseInt(page));
    const itemsPerPage = Math.max(1, parseInt(perPage));

    try {
      // Fetch airbnbs based on pagination and property type
      const airbnbs = await db.getAllAirBnBs(
        currentPage,
        itemsPerPage,
        property_type
      );

      // Calculate total number of AirBnBs (assuming you have a function for total count)
      const totalCount = await db.getTotalAirBnBsCount(property_type);
      const totalPages = Math.ceil(totalCount / itemsPerPage); // Calculate total pages

      // Render the search results with the required data
      res.render("search-results", {
        airbnbs,
        property_type,
        currentPage, // Pass currentPage to the view
        totalPages, // Pass totalPages to the view
        totalCount, // Optionally pass the totalCount for debugging
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get AirBnB by ID
router.get(
  "/api/AirBnBs/:id",
  [
    param("id").isString().withMessage("ID must be a string"), // Allow string as ID
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const airbnb = await db.getAirBnBById(req.params.id);
      if (!airbnb) return res.status(404).json({ error: "AirBnB not found" });
      res.json(airbnb);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get AirBnB reviews by ID
router.get(
  "/api/AirBnBs/review/:id",
  [
    param("id").isString().withMessage("ID must be a string"), // Allow string as ID
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const airbnb = await db.getAirBnBReviewsById(req.params.id);
      if (!airbnb) return res.status(404).json({ error: "Reviews not found" });
      res.json(airbnb.reviews);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update AirBnB by ID
router.put(
  "/api/AirBnBs/:id",
  [param("id").isString().withMessage("ID must be a string")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const updated = await db.updateAirBnBById(req.body, req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete AirBnB by ID
router.delete(
  "/api/AirBnBs/:id",
  [param("id").isString().withMessage("ID must be a string")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      await db.deleteAirBnBById(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
