const express = require("express");
const router = express.Router();
const { ownerById, read, update, getAllOwners, deleteOwner } = require("../controllers/owner");
const { requireOwnerSignin, requireSuperadminSignin, isAuth } = require("../controllers/auth-owner");
const { uploadOwnerAvatar } = require("../helpers");

router.get("/", getAllOwners);

router.get("/:ownerId", read);
router.put("/:ownerId", requireOwnerSignin, isAuth, uploadOwnerAvatar, update);
router.delete("/:ownerId", requireSuperadminSignin, deleteOwner);

router.param("ownerId", ownerById);

module.exports = router;