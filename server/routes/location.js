const router = require("express").Router();
const {
  requireSuperadminSignin,
} = require("../controllers/auth-owner");
const {
  add,
  update,
  read,
  remove,
  getLocations,
  locationById,
  removeAll,
  bulkCreate
} = require("../controllers/location");

router
  .route("/")
  .get(getLocations)
  .post(requireSuperadminSignin, add)
  .delete(requireSuperadminSignin, removeAll);

router.post("/bulk-upload", requireSuperadminSignin, bulkCreate);

router
  .route("/:id")
  .get(requireSuperadminSignin, read)
  .put(requireSuperadminSignin, update)
  .delete(requireSuperadminSignin, remove);

router.param("id", locationById);

module.exports = router;
