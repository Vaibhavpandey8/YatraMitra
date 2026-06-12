const Owner = require("../models/Owner");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const { sendEmail } = require("../helpers/mailer");

// Temporary store for pending signups awaiting OTP verification
const pendingSignups = {};

exports.signup = async (req, res) => {
  const ownerExists = await Owner.findOne({ email: req.body.email });
  if (ownerExists)
    return res.status(403).json({
      error: "Email is taken!"
    });

  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  console.log("SIGNUP OTP FOR:", req.body.email, "| OTP:", code);

  // Store pending signup data temporarily (15 min TTL)
  pendingSignups[req.body.email] = {
    data: req.body,
    otp: code,
    expires: new Date(Date.now() + 15 * 60 * 1000)
  };

  // Send OTP to Gmail
  const emailData = {
    from: `"YatraMitra CRM" <${process.env.userEmail}>`,
    to: req.body.email,
    subject: "YatraMitra - Verify Your Email",
    text: `Your OTP verification code is ${code}. It is valid for 15 minutes.`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 30px; border-radius: 10px; background: #0f172a; color: #e2e8f0;">
             <h2 style="color: #00BCD4;">YatraMitra CRM</h2>
             <h3>Verify Your Email Address</h3>
             <p>Hi ${req.body.name || "there"},</p>
             <p>Thank you for registering! Please use the OTP below to verify your email and complete your registration:</p>
             <div style="text-align: center; margin: 30px 0;">
               <span style="font-size: 2rem; font-weight: bold; letter-spacing: 8px; color: #00BCD4; background: #1e293b; padding: 15px 30px; border-radius: 8px;">${code}</span>
             </div>
             <p style="color: #94a3b8;">This code expires in 15 minutes. If you did not register, please ignore this email.</p>
           </div>`
  };
  await sendEmail(emailData);

  return res.json({ otpSent: true, email: req.body.email });
};

exports.resendSignupOtp = async (req, res) => {
  const { email } = req.body;
  const pending = pendingSignups[email];

  if (!pending) {
    return res.status(400).json({ error: "No pending registration found. Please fill the sign-up form again." });
  }

  // Generate a fresh OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  console.log("RESEND OTP FOR:", email, "| OTP:", code);
  pending.otp = code;
  pending.expires = new Date(Date.now() + 15 * 60 * 1000);

  const emailData = {
    from: `"YatraMitra CRM" <${process.env.userEmail}>`,
    to: email,
    subject: "YatraMitra - New Verification Code",
    text: `Your new OTP verification code is ${code}. It is valid for 15 minutes.`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 30px; border-radius: 10px; background: #0f172a; color: #e2e8f0;">
             <h2 style="color: #00BCD4;">YatraMitra CRM</h2>
             <h3>New Verification Code</h3>
             <p>Here is your new OTP code:</p>
             <div style="text-align: center; margin: 30px 0;">
               <span style="font-size: 2rem; font-weight: bold; letter-spacing: 8px; color: #00BCD4; background: #1e293b; padding: 15px 30px; border-radius: 8px;">${code}</span>
             </div>
             <p style="color: #94a3b8;">This code expires in 15 minutes.</p>
           </div>`
  };
  await sendEmail(emailData);

  return res.json({ otpSent: true, email });
};

exports.verifySignupOtp = async (req, res) => {
  const { email, otp } = req.body;
  const pending = pendingSignups[email];

  if (!pending) {
    return res.status(400).json({ error: "No pending registration for this email. Please sign up again." });
  }

  if (new Date() > pending.expires) {
    delete pendingSignups[email];
    return res.status(400).json({ error: "OTP has expired. Please sign up again." });
  }

  if (pending.otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP. Please try again." });
  }

  // OTP correct – create the owner account
  delete pendingSignups[email];
  const newOwner = new Owner(pending.data);
  const owner = await newOwner.save();

  owner.salt = undefined;
  owner.hashed_password = undefined;
  return res.json({ success: true, owner });
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;
  const owner = await Owner.findOne({ email });

  if (!owner) {
    return res.status(401).json({
      error: "Owner with that email does not exist."
    });
  }

  if (!owner.authenticate(password)) {
    return res.status(401).json({
      error: "Email and password do not match."
    });
  }

  // Direct login – no OTP required at signin
  const payload = {
    _id: owner.id,
    name: owner.name,
    email: owner.email,
    role: owner.role,
    refresh_hash: owner.salt,
    avatar: owner.photo || null
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
  return res.json({ token });
};

exports.verifyOtp = async (req, res) => {
  // Legacy endpoint kept for backward compatibility – delegates to verifySignupOtp logic
  return exports.verifySignupOtp(req, res);
};

// ── FORGOT PASSWORD ────────────────────────────────────────────
const pendingResets = {}; // { email: { otp, expires } }

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });

  const owner = await Owner.findOne({ email });
  if (!owner) {
    return res.status(404).json({ error: "No account found with that email." });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  console.log("FORGOT PASSWORD OTP FOR:", email, "| OTP:", code);

  pendingResets[email] = {
    otp: code,
    expires: new Date(Date.now() + 15 * 60 * 1000) // 15 min
  };

  const emailData = {
    from: `"YatraMitra CRM" <${process.env.userEmail}>`,
    to: email,
    subject: "YatraMitra - Reset Your Password",
    text: `Your password reset code is ${code}. It is valid for 15 minutes.`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 30px; border-radius: 10px; background: #0f172a; color: #e2e8f0;">
             <h2 style="color: #00BCD4;">YatraMitra CRM</h2>
             <h3>Password Reset Request</h3>
             <p>Hi ${owner.name},</p>
             <p>We received a request to reset your password. Use the code below:</p>
             <div style="text-align: center; margin: 30px 0;">
               <span style="font-size: 2rem; font-weight: bold; letter-spacing: 8px; color: #00BCD4; background: #1e293b; padding: 15px 30px; border-radius: 8px;">${code}</span>
             </div>
             <p style="color: #94a3b8;">This code expires in 15 minutes. If you did not request this, please ignore this email — your password will not be changed.</p>
           </div>`
  };
  await sendEmail(emailData);

  return res.json({ otpSent: true, email });
};

exports.verifyForgotOtp = async (req, res) => {
  const { email, otp } = req.body;
  const pending = pendingResets[email];

  if (!pending) {
    return res.status(400).json({ error: "No password reset was requested for this email." });
  }
  if (new Date() > pending.expires) {
    delete pendingResets[email];
    return res.status(400).json({ error: "OTP has expired. Please request a new one." });
  }
  if (pending.otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP. Please try again." });
  }

  // Mark as verified — allow password reset
  pending.verified = true;
  return res.json({ verified: true });
};

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  const pending = pendingResets[email];

  if (!pending || !pending.verified) {
    return res.status(400).json({ error: "OTP not verified. Please complete verification first." });
  }
  if (new Date() > pending.expires) {
    delete pendingResets[email];
    return res.status(400).json({ error: "Session expired. Please start again." });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const owner = await Owner.findOne({ email });
  if (!owner) return res.status(404).json({ error: "Account not found." });

  owner.password = newPassword; // triggers the virtual setter + hashing
  await owner.save();
  delete pendingResets[email];

  return res.json({ success: true, message: "Password reset successfully." });
};
// ── END FORGOT PASSWORD ────────────────────────────────────────

exports.refreshToken = async (req, res) => {
  if (req.body && req.body._id) {
    const owner = await Owner.findOne({ _id: req.body._id });

    const payload = {
      _id: owner.id,
      name: owner.name,
      email: owner.email,
      role: owner.role,
      refresh_hash: owner.salt,
      avatar: owner.photo || null
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET /*{ expiresIn: 5 }*/
    );

    return res.json({ token });
  }
  return res.json({ error: "Invalid content" });
};

exports.requireOwnerSignin = async (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    const owner = parseToken(token);

    const foundowner = await Owner.findById(owner._id).select("name role salt hashed_password");

    if (foundowner) {
      req.ownerauth = foundowner;
      next();
    } else res.status(401).json({ error: "Not authorized!" });
  } else {
    res.status(401).json({ error: "Not authorized" });
  }
};

function parseToken(token) {
  try {
    return jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
  } catch (err) {
    return false;
  }
}

exports.requireSuperadminSignin = async (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    const owner = parseToken(token);

    const foundowner = await Owner.findById(owner._id).select("name role");

    if (foundowner && foundowner.role === "superadmin") {
      req.ownerauth = foundowner;
      next();
    } else res.status(401).json({ error: "Not authorized!" });
  } else {
    res.status(401).json({ error: "Not authorized" });
  }
};

exports.isPoster = (req, res, next) => {
  let sameUser =
    req.bus &&
    req.ownerauth &&
    req.bus.owner._id.toString() === req.ownerauth._id.toString();
  let adminUser =
    req.bus && req.ownerauth && req.ownerauth.role === "superadmin";

  let isPoster = sameUser || adminUser;

  if (!isPoster) {
    return res.status(403).json({
      error: "User is not authorized to perform this action"
    });
  }
  next();
};

exports.isBookingOwner = (req, res, next) => {
  let sameUser =
    req.booking &&
    req.ownerauth &&
    req.booking.owner._id.toString() === req.ownerauth._id.toString();

  let adminUser =
    req.booking && req.ownerauth && req.ownerauth.role === "superadmin";

  let isPoster = sameUser || adminUser;

  if (!isPoster) {
    return res.status(403).json({
      error: "User is not authorized to perform this action"
    });
  }
  next();
};

exports.isAuth = (req, res, next) => {
  let user =
    req.ownerprofile &&
    req.ownerauth &&
    req.ownerprofile._id.toString() === req.ownerauth._id.toString();
  if (!user) {
    return res.status(403).json({
      error: "Access denied"
    });
  }
  next();
};
