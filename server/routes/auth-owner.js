const express = require("express");

const {
  signup,
  verifySignupOtp,
  resendSignupOtp,
  signin,
  refreshToken,
  verifyOtp,
  forgotPassword,
  verifyForgotOtp,
  resetPassword
} = require("../controllers/auth-owner");

const { userSignupValidator } = require("../validator");

const router = express.Router();

router.post("/signup", userSignupValidator, signup);
router.post("/verify-signup-otp", verifySignupOtp);
router.post("/resend-signup-otp", resendSignupOtp);
router.post("/signin", signin);
router.post("/verify-otp", verifyOtp);
router.post("/refreshtoken", refreshToken);

// Forgot password routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-forgot-otp", verifyForgotOtp);
router.post("/reset-password", resetPassword);



module.exports = router;