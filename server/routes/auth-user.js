const express = require("express");

const {
  signup,
  signin,
  socialLogin,
  forgotPassword,
  resetPassword,
  generateOtp,
  verifyOtp
} = require("../controllers/auth-user");

const { userSignupValidator, passwordResetValidator } = require("../validator");

const router = express.Router();

router.post("/signup", userSignupValidator, signup);
router.post("/signin", signin);
router.post("/social-login", socialLogin);

router.post("/generate-otp", generateOtp);
router.post("/verify-otp", verifyOtp);

router.put("/forgot-password", forgotPassword);
router.put("/reset-password", passwordResetValidator, resetPassword);

module.exports = router;