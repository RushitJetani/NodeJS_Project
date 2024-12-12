require("dotenv").config();
const mongoose = require("mongoose");

// Schema for AirBnB
const AirBnBSchema = new mongoose.Schema(
  {
    _id: String,
    listing_url: String,
    description: String,
    neighborhood_overview: String,
    cancellation_policy: String,
    property_type: String,
    room_type: String,
    accommodates: Number,
    price: mongoose.Schema.Types.Decimal128,
    images: {
      picture_url: String,
    },
    review_scores: {
      review_scores_rating: Number,
    },
  },
  { collection: "listingsAndReviews" }
);
  

// Create the model
const AirBnB = mongoose.model("AirBnB", AirBnBSchema);

module.exports = {
  initialize: async () => {
    const connectionString = process.env.MONGODB_URI;
    if (!connectionString) {
      console.error("MONGODB_URI is not defined in the .env file");
      throw new Error("Missing MongoDB connection string");
    }
    try {
      await mongoose.connect(connectionString, {});
      console.log("Database connection established");
    } catch (error) {
      console.error("Database connection failed", error.message);
      throw error;
    }
  },

  addNewAirBnB: async (data) => {
    try {
      const newAirBnB = new AirBnB(data);
      return await newAirBnB.save();
    } catch (error) {
      console.error("Error adding new AirBnB:", error.message);
      throw error;
    }
  },

  getAllAirBnBs: async (page = 1, perPage = 5, property_type) => {
    let query = {};

    if (property_type) {
      query.property_type = new RegExp("^" + property_type + "$", "i");
    }

    try {
      const totalCount = await AirBnB.countDocuments(query);
      const totalPages = totalCount > 0 ? Math.ceil(totalCount / perPage) : 1;

      const airbnbs = await AirBnB.find(query)
        .sort({ _id: 1 })
        .skip((page - 1) * perPage)
        .limit(perPage);

      // Add the review_scores_rating to the airbnb data
      const airbnbsWithRating = airbnbs.map((airbnb) => ({
        ...airbnb.toObject(),
        review_scores_rating:
          airbnb.review_scores?.review_scores_rating || "N/A", // Default to "N/A" if no rating
      }));

      return {
        airbnbs: airbnbsWithRating,
        totalPages,
        currentPage: page,
        totalCount,
      };
    } catch (error) {
      console.error("Error retrieving AirBnBs:", error.message);
      throw error;
    }
  },

  getAirBnBById: async (id) => {
    try {
      return await AirBnB.findById(id).select(
        "listing_url description neighborhood_overview cancellation_policy property_type room_type accommodates price images review_score_value"
      );
    } catch (error) {
      console.error("Error retrieving AirBnB by ID:", error.message);
      throw error;
    }
  },

  updateAirBnBById: async (data, id) => {
    try {
      return await AirBnB.findByIdAndUpdate(id, data, { new: true });
    } catch (error) {
      console.error("Error updating AirBnB:", error.message);
      throw error;
    }
  },

  deleteAirBnBById: async (id) => {
    try {
      return await AirBnB.findByIdAndDelete(id);
    } catch (error) {
      console.error("Error deleting AirBnB:", error.message);
      throw error;
    }
  },
};
