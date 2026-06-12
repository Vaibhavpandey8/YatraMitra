const express = require("express");
const router = express.Router();
const { requireOwnerSignin, isPoster } = require("../controllers/auth-owner");
const { requireUserSignin } = require("../controllers/auth-user");

const {
  read,
  create,
  update,
  remove,
  busBySlug,
  getBuses,
  searchBus,
  searchBusByFilter,
  getAvailableBusesOfOwner,
  getUnavailableBusesOfOwner,
  getAllAvailableBuses,
  getAllUnavailableBuses,
  bulkCreate,
  removeAll,
  rateBus,
  resetSeats
} = require("../controllers/bus");

const { uploadBusImage } = require("../helpers");

router
  .route("/")
  .get(getBuses)
  .post(requireOwnerSignin, uploadBusImage, create)
  .delete(requireOwnerSignin, removeAll);

router.post("/bulk-upload", requireOwnerSignin, bulkCreate);

router.get(
  "/owner-bus-available",
  requireOwnerSignin,
  getAvailableBusesOfOwner
);
router.get(
  "/owner-bus-unavailable",
  requireOwnerSignin,
  getUnavailableBusesOfOwner
);

router.get("/all-bus-available", getAllAvailableBuses);
router.get("/all-bus-unavailable", getAllUnavailableBuses);

router.get("/search", searchBus);
router.post("/filter", searchBusByFilter);
router.post("/rate", requireUserSignin, rateBus);

router.post("/:busSlug/reset-seats", requireOwnerSignin, isPoster, resetSeats);

router
  .route("/:busSlug")
  .get(read)
  .put(requireOwnerSignin, isPoster, uploadBusImage, update)
  .delete(requireOwnerSignin, isPoster, remove);


router.param("busSlug", busBySlug);

module.exports = router;
