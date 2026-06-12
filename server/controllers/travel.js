const Travel = require("../models/Travel");
const _ = require("lodash");

exports.travelById = async (req, res, next, id) => {
  const travel = await Travel.findById(id);

  if (!travel) {
    return res.status(400).json({
      error: "Travel not found"
    });
  }
  req.travel = travel; // adds travel object in req with travel info
  next();
};

exports.add = async (req, res) => {
  const travel = new Travel(req.body);

  await travel.save();

  res.json(travel);
};

exports.getTravels = async (req, res) => {
  const travel = await Travel.find({}).sort({ name: 1 });

  res.json(travel);
};

exports.read = async (req, res) => {
  res.json(req.travel);
};

exports.update = async (req, res) => {
  let travel = req.travel;

  travel = _.extend(travel, req.body);

  await travel.save();

  res.json(travel);
};

exports.remove = async (req, res) => {
  let travel = req.travel;

  await travel.remove();

  res.json({ message: "Travel removed successfully" });
};

exports.removeAll = async (req, res) => {
  try {
    const deleteResult = await Travel.deleteMany({});
    res.json({
      message: `${deleteResult.deletedCount} travels deleted successfully.`,
      count: deleteResult.deletedCount
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Could not delete travels." });
  }
};

exports.bulkCreate = async (req, res) => {
  const { travels } = req.body;
  if (!travels || !Array.isArray(travels)) {
    return res.status(400).json({ error: "Invalid bulk data. Expected an array of travels." });
  }

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const travelData of travels) {
    try {
      const { name } = travelData;

      if (!name) {
        errorCount++;
        errors.push({ name: "unknown", error: "Name is a required field." });
        continue;
      }

      const travelExists = await Travel.findOne({ name: { $regex: new RegExp("^" + name.trim() + "$", "i") } });
      if (travelExists) {
        errorCount++;
        errors.push({ name, error: `Travel agency '${name}' is already added.` });
        continue;
      }

      const travel = new Travel({ name: name.trim() });
      await travel.save();
      successCount++;
    } catch (err) {
      errorCount++;
      errors.push({ name: travelData.name || "unknown", error: err.message || "Unknown error occurred." });
    }
  }

  return res.json({ successCount, errorCount, errors });
};
