const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const ratingSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      maxlength: 500,
      trim: true
    },
    user: {
      type: ObjectId,
      ref: "User",
      required: true
    },
    bus: {
      type: ObjectId,
      ref: "Bus",
      required: true
    }
  },
  { timestamps: true }
);

// Ensure a user can only rate a bus once
ratingSchema.index({ user: 1, bus: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);
