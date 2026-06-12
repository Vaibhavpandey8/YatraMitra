const Location = require("../models/Location");
const _ = require("lodash");

exports.locationById = async (req, res, next, id) => {
  const location = await Location.findById(id);

  if (!location) {
    return res.status(400).json({
      error: "Location not found"
    });
  }
  req.location = location; // adds location object in req with location info
  next();
};

exports.add = async (req, res) => {
  const location = new Location(req.body);

  await location.save();

  res.json(location);
};

exports.getLocations = async (req, res) => {
  const location = await Location.find({}).sort({ name: 1 });

  res.json(location);
};

exports.read = async (req, res) => {
  res.json(req.location);
};

exports.update = async (req, res) => {
  let location = req.location;

  location = _.extend(location, req.body);

  await location.save();

  res.json(location);
};

exports.remove = async (req, res) => {
  let location = req.location;

  await location.remove();

  res.json({ message: "Location removed successfully" });
};

exports.removeAll = async (req, res) => {
  try {
    const deleteResult = await Location.deleteMany({});
    res.json({
      message: `${deleteResult.deletedCount} locations deleted successfully.`,
      count: deleteResult.deletedCount
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Could not delete locations." });
  }
};

exports.bulkCreate = async (req, res) => {
  const { locations } = req.body;
  if (!locations || !Array.isArray(locations)) {
    return res.status(400).json({ error: "Invalid bulk data. Expected an array of locations." });
  }

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const locData of locations) {
    try {
      const { name, district } = locData;

      if (!name || !name.trim()) {
        errorCount++;
        errors.push({ name: name || "unknown", error: "Name is a required field." });
        continue;
      }

      if (!district || !district.trim()) {
        errorCount++;
        errors.push({ name, error: "District is a required field." });
        continue;
      }

      const trimmedName = name.trim();
      const trimmedDistrict = district.trim().toLowerCase();

      // Check if location already exists with the same name
      const locExists = await Location.findOne({
        name: { $regex: new RegExp("^" + trimmedName + "$", "i") }
      });

      if (locExists) {
        errorCount++;
        errors.push({ name: trimmedName, error: `Location '${trimmedName}' is already added.` });
        continue;
      }

      const newLocation = new Location({
        name: trimmedName,
        district: trimmedDistrict
      });

      await newLocation.save();
      successCount++;
    } catch (err) {
      errorCount++;
      errors.push({ name: locData.name || "unknown", error: err.message || "Unknown error occurred." });
    }
  }

  return res.json({ successCount, errorCount, errors });
};
