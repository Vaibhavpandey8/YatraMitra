// Force nodemon reload to pick up new Razorpay keys from .env
const express = require("express");
const router = express.Router();
const { userById, read, getAllUsers, readMe, rechargeWallet, createRazorpayOrder, verifyRazorpayPayment } = require("../controllers/user");
const { requireUserSignin } = require("../controllers/auth-user");

router.get("/", getAllUsers);

router.get("/profile/me", requireUserSignin, readMe);
router.post("/wallet/recharge", requireUserSignin, rechargeWallet);
router.post("/wallet/razorpay-order", requireUserSignin, createRazorpayOrder);
router.post("/wallet/razorpay-verify", requireUserSignin, verifyRazorpayPayment);

router.get("/:userId", read);

router.param("userId", userById);
module.exports = router;