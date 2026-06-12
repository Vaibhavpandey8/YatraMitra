const Bus = require("../models/Bus");
const Rating = require("../models/Rating");
const _ = require("lodash");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { checkDateAvailability } = require("../helpers");
const { applyPricingToBuses, applyDynamicPricing } = require("../helpers/pricing");

exports.busBySlug = async (req, res, next, slug) => {
  const bus = await Bus.findOne({ slug }).populate("owner", "name role");
  if (!bus) {
    return res.status(400).json({
      error: "Bus not found"
    });
  }
  req.bus = bus; // adds bus object in req with bus info
  next();
};

exports.read = (req, res) => {
  return res.json(applyDynamicPricing(req.bus));
};

exports.getBuses = async (req, res) => {
  const buses = await Bus.find()
    .populate("owner", "name")
    .populate("travel", "name")
    .sort({ created: -1 });

  res.json(applyPricingToBuses(buses));
};

exports.getAllAvailableBuses = async (req, res) => {
  const buses = await Bus.find({ isAvailable: true })
    .populate("owner", "name phone")
    .populate("travel", "name")
    .sort({ created: -1 });

  res.json(applyPricingToBuses(buses));
};

exports.getAllUnavailableBuses = async (req, res) => {
  const buses = await Bus.find({ isAvailable: false })
    .populate("owner", "name phone")
    .populate("travel", "name")
    .sort({ created: -1 });

  res.json(applyPricingToBuses(buses));
};

exports.getAvailableBusesOfOwner = async (req, res) => {
  const buses = await Bus.find({ owner: req.ownerauth, isAvailable: true })
    .populate("owner", "name")
    .populate("travel", "name")
    .sort({ created: -1 });

  res.json(applyPricingToBuses(buses));
};

exports.getUnavailableBusesOfOwner = async (req, res) => {
  const buses = await Bus.find({ owner: req.ownerauth, isAvailable: false })
    .populate("owner", "name")
    .populate("travel", "name")
    .sort({ created: -1 });

  res.json(applyPricingToBuses(buses));
};

const resolveLocationIds = async (locationParam) => {
  if (!locationParam) return [];
  const mongoose = require("mongoose");
  if (mongoose.Types.ObjectId.isValid(locationParam)) {
    return [locationParam];
  }
  
  const Location = require("../models/Location");
  const cleanParam = locationParam.trim().toLowerCase();
  
  let searchPrefix = cleanParam;
  if (cleanParam === "delhi") {
    searchPrefix = "delhi";
  } else if (cleanParam === "uttar pradesh" || cleanParam === "up") {
    searchPrefix = "up";
  } else if (cleanParam === "rajasthan") {
    searchPrefix = "rajasthan";
  }
  
  const locs = await Location.find({
    district: { $regex: new RegExp("^" + searchPrefix + "(\\s|$|-)", "i") }
  });
  return locs.map(l => l._id);
};

exports.searchBus = async (req, res) => {
  if (_.size(req.query) < 1)
    return res.status(400).json({ error: "Invalid query" });

  const { startLocation, endLocation, journeyDate } = req.query;
  
  if (startLocation && endLocation && startLocation.trim().toLowerCase() === endLocation.trim().toLowerCase()) {
    return res.json([]);
  }

  const startLocationIds = await resolveLocationIds(startLocation);
  const endLocationIds = await resolveLocationIds(endLocation);

  const query = {
    startLocation: { $in: startLocationIds },
    endLocation: { $in: endLocationIds },
    isAvailable: true
  };
  if (journeyDate) {
    query.journeyDate = journeyDate;
  }

  const buses = await Bus.find(query)
    .populate("travel", "name")
    .populate("startLocation", "name")
    .populate("endLocation", "name");

  return res.json(applyPricingToBuses(buses));
};

exports.searchBusByFilter = async (req, res) => {
  const { startLocation, endLocation, journeyDate, travel, type } = req.body;

  if (startLocation && endLocation && startLocation.trim().toLowerCase() === endLocation.trim().toLowerCase()) {
    return res.json([]);
  }

  const startLocationIds = await resolveLocationIds(startLocation);
  const endLocationIds = await resolveLocationIds(endLocation);

  const query = {
    startLocation: { $in: startLocationIds },
    endLocation: { $in: endLocationIds },
    isAvailable: true,
    travel: { $in: travel },
    type: { $in: type }
  };
  if (journeyDate) {
    query.journeyDate = journeyDate;
  }

  const buses = await Bus.find(query)
    .populate("travel", "name")
    .populate("startLocation", "name")
    .populate("endLocation", "name");
  res.json(applyPricingToBuses(buses));
};

exports.create = async (req, res) => {
  const busExists = await Bus.findOne({ busNumber: req.body.busNumber });
  if (busExists)
    return res.status(403).json({
      error: "Bus is already added!"
    });

  if (req.file !== undefined) {
    const { filename: image } = req.file;

    //Compress image
    await sharp(req.file.path)
      .resize(800)
      .jpeg({ quality: 100 })
      .toFile(path.resolve(req.file.destination, "resized", image));
    fs.unlinkSync(req.file.path);
    req.body.image = "busimage/resized/" + image;
  }

  if (req.body.boardingPoints) {
    req.body.boardingPoints = req.body.boardingPoints.split(",");
  }

  if (req.body.droppingPoints) {
    req.body.droppingPoints = req.body.droppingPoints.split(",");
  }

  const bus = new Bus(req.body);
  bus.seatsAvailable = req.body.numberOfSeats

  if (!checkDateAvailability(req.body.journeyDate)) {
    bus.isAvailable = false;
  }

  bus.owner = req.ownerauth;

  await bus.save();

  res.json(bus);
};

exports.update = async (req, res) => {
  if (req.file !== undefined) {
    const { filename: image } = req.file;

    //Compress image
    await sharp(req.file.path)
      .resize(800)
      .jpeg({ quality: 100 })
      .toFile(path.resolve(req.file.destination, "resized", image));
    fs.unlinkSync(req.file.path);
    req.body.image = "busimage/resized/" + image;
  }

  let bus = req.bus;
  bus = _.extend(bus, req.body);

  if (!checkDateAvailability(req.body.journeyDate)) {
    bus.isAvailable = false;
  }

  await bus.save();

  res.json(bus);
};

exports.remove = async (req, res) => {
  let bus = req.bus;
  await bus.remove();
  res.json({ message: "Bus removed successfully" });
};

exports.bulkCreate = async (req, res) => {
  const Location = require("../models/Location");
  const Travel = require("../models/Travel");

  const { buses } = req.body;
  if (!buses || !Array.isArray(buses)) {
    return res.status(400).json({ error: "Invalid bulk data. Expected an array of buses." });
  }

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const busData of buses) {
    try {
      const { busNumber, name, startLocation, endLocation, travel } = busData;

      if (!busNumber || !name) {
        errorCount++;
        errors.push({ busNumber: busNumber || "unknown", error: "Name and Bus Number are required fields." });
        continue;
      }

      // 1. Check if bus already exists
      const busExists = await Bus.findOne({ busNumber });
      if (busExists) {
        errorCount++;
        errors.push({ busNumber, error: `Bus Number ${busNumber} is already added.` });
        continue;
      }

      // 2. Resolve startLocation by name (case-insensitive)
      let startLocId = null;
      if (startLocation) {
        const loc = await Location.findOne({ name: { $regex: new RegExp("^" + startLocation.trim() + "$", "i") } });
        if (loc) {
          startLocId = loc._id;
        } else {
          errorCount++;
          errors.push({ busNumber, error: `Start location '${startLocation}' not found in database.` });
          continue;
        }
      } else {
        errorCount++;
        errors.push({ busNumber, error: "Start location is required." });
        continue;
      }

      // 3. Resolve endLocation by name (case-insensitive)
      let endLocId = null;
      if (endLocation) {
        const loc = await Location.findOne({ name: { $regex: new RegExp("^" + endLocation.trim() + "$", "i") } });
        if (loc) {
          endLocId = loc._id;
        } else {
          errorCount++;
          errors.push({ busNumber, error: `End location '${endLocation}' not found in database.` });
          continue;
        }
      } else {
        errorCount++;
        errors.push({ busNumber, error: "End location is required." });
        continue;
      }

      // 4. Resolve travel agency by name (case-insensitive)
      let travelId = null;
      if (travel) {
        const trav = await Travel.findOne({ name: { $regex: new RegExp("^" + travel.trim() + "$", "i") } });
        if (trav) {
          travelId = trav._id;
        } else {
          errorCount++;
          errors.push({ busNumber, error: `Travel agency '${travel}' not found in database.` });
          continue;
        }
      } else {
        errorCount++;
        errors.push({ busNumber, error: "Travel agency is required." });
        continue;
      }

      // 5. Parse arrays
      let parsedBoarding = [];
      if (busData.boardingPoints) {
        parsedBoarding = typeof busData.boardingPoints === "string" 
          ? busData.boardingPoints.split(",").map(p => p.trim()) 
          : busData.boardingPoints;
      }

      let parsedDropping = [];
      if (busData.droppingPoints) {
        parsedDropping = typeof busData.droppingPoints === "string" 
          ? busData.droppingPoints.split(",").map(p => p.trim()) 
          : busData.droppingPoints;
      }

      let parsedFeatures = [];
      if (busData.features) {
        parsedFeatures = typeof busData.features === "string" 
          ? busData.features.split(",").map(f => f.trim()) 
          : busData.features;
      }

      const newBusData = {
        ...busData,
        startLocation: startLocId,
        endLocation: endLocId,
        travel: travelId,
        boardingPoints: parsedBoarding,
        droppingPoints: parsedDropping,
        features: parsedFeatures,
        seatsAvailable: busData.numberOfSeats || 30,
        numberOfSeats: busData.numberOfSeats || 30,
        owner: req.ownerauth._id
      };

      if (!checkDateAvailability(busData.journeyDate)) {
        newBusData.isAvailable = false;
      } else {
        newBusData.isAvailable = busData.isAvailable !== undefined ? busData.isAvailable : true;
      }

      const bus = new Bus(newBusData);
      await bus.save();
      successCount++;
    } catch (err) {
      errorCount++;
      errors.push({ busNumber: busData.busNumber || "unknown", error: err.message || "Unknown error occurred." });
    }
  }

  return res.json({ successCount, errorCount, errors });
};

exports.removeAll = async (req, res) => {
  try {
    const ownerId = req.ownerauth._id;
    const isSuperadmin = req.ownerauth.role === "superadmin";

    let query = {};
    if (!isSuperadmin) {
      query = { owner: ownerId };
    }

    const deleteResult = await Bus.deleteMany(query);
    res.json({
      message: `${deleteResult.deletedCount} buses deleted successfully.`,
      count: deleteResult.deletedCount
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Could not delete buses." });
  }
};

exports.rateBus = async (req, res) => {
  try {
    const { busId, rating, review } = req.body;
    const userId = req.userauth._id;

    if (!busId || !rating) {
      return res.status(400).json({ error: "Bus ID and Rating are required!" });
    }

    const ratingVal = Number(rating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5!" });
    }

    // Check if the bus exists
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ error: "Bus not found!" });
    }

    // Find if user already rated this bus, upsert it
    let ratingDoc = await Rating.findOne({ user: userId, bus: busId });
    if (ratingDoc) {
      ratingDoc.rating = ratingVal;
      ratingDoc.review = review || "";
      await ratingDoc.save();
    } else {
      ratingDoc = new Rating({
        user: userId,
        bus: busId,
        rating: ratingVal,
        review: review || ""
      });
      await ratingDoc.save();
    }

    // Re-calculate average rating and total ratings for this bus
    const ratings = await Rating.find({ bus: busId });
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : 0;

    bus.averageRating = averageRating;
    bus.totalRatings = totalRatings;
    await bus.save();

    res.json({
      message: "Thank you for your rating!",
      averageRating,
      totalRatings
    });
  } catch (err) {
    console.error("Error rating bus:", err);
    res.status(500).json({ error: "Could not submit rating!" });
  }
};

exports.resetSeats = async (req, res) => {
  try {
    const bus = req.bus;
    bus.bookedSeat = [];
    bus.soldSeat = [];
    bus.femaleSeats = [];
    bus.seatsAvailable = bus.numberOfSeats;
    await bus.save();

    const Booking = require("../models/Booking");
    await Booking.deleteMany({ bus: bus._id });

    if (global.io) {
      global.io.to(`bus:${bus.slug}`).emit("seats-reset", { slug: bus.slug });
    }

    res.json({ message: "All seats have been reset!", bus });
  } catch (err) {
    res.status(400).json({ error: err.message || "Could not reset seats." });
  }
};

