const User = require("../models/User");
const jwt = require("jsonwebtoken");
const _ = require("lodash");

const { sendEmail } = require("../helpers");

exports.signup = async (req, res) => {
  const userExists = await User.findOne({ email: req.body.email });
  if (userExists)
    return res.status(403).json({
      error: "Email is taken!"
    });

  const newuser = new User(req.body);

  if (req.body.referredByCode) {
    const referrer = await User.findOne({ referralCode: req.body.referredByCode.toUpperCase().trim() });
    if (referrer) {
      newuser.referredBy = referrer._id;
      newuser.wallet = (newuser.wallet || 500) + 50;
      referrer.wallet = (referrer.wallet || 0) + 100;
      await referrer.save();
    }
  }

  const user = await newuser.save();

  user.salt = undefined;
  user.hashed_password = undefined;
  res.json(user);
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({
      error: "User with that email does not exist."
    });
  }

  if (!user.authenticate(password)) {
    return res.status(401).json({
      error: "Email and password do not match"
    });
  }

  const payload = {
    _id: user.id,
    name: user.name,
    email: user.email
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET
    // {expiresIn:"1h"}
  );

  return res.json({ token });
};

exports.requireUserSignin = async (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    const user = parseToken(token);
    if (!user) {
      return res.status(401).json({ error: "Not authorized! Token invalid or expired." });
    }

    const founduser = await User.findById(user._id).select("name");

    if (founduser) {
      req.userauth = founduser;
      next();
    } else res.status(401).json({ error: "Not authorized!" });
  } else {
    res.status(401).json({ error: "Not authorized" });
  }
};

exports.checkUserSignin = async (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    const user = parseToken(token);
    if (user) {
      const founduser = await User.findById(user._id).select("name");
      if (founduser) {
        req.userauth = founduser;
      }
    }
  }
  next();
};

function parseToken(token) {
  try {
    return jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

exports.isUser = (req, res, next) => {
  let user =
    req.userprofile &&
    req.userauth &&
    req.userprofile._id.toString() === req.userauth._id.toString();
  if (!user) {
    return res.status(403).json({
      error: "Access denied"
    });
  }
  next();
};

exports.refreshToken = async (req, res) => {
  if (req.body && req.body.token) {
    const parsed = parseToken(`Bearer ${req.body.token}`);

    const user = await User.findById(parsed._id);

    const payload = {
      _id: user.id,
      name: user.name,
      email: user.email
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET
      // {expiresIn:"1h"}
    );

    return res.json({ token });
  }
  return res.json({ error: "Invalid content" });
};

exports.socialLogin = async (req, res) => {
  // try signup by finding user with req.email
  let user = await User.findOne({ email: req.body.email });
  if (!user) {
    // create a new user and login
    user = new User(req.body);
    
    if (req.body.referredByCode) {
      const referrer = await User.findOne({ referralCode: req.body.referredByCode.toUpperCase().trim() });
      if (referrer) {
        user.referredBy = referrer._id;
        user.wallet = (user.wallet || 500) + 50;
        referrer.wallet = (referrer.wallet || 0) + 100;
        await referrer.save();
      }
    }
    
    req.userprofile = user;
    await user.save();
    // generate a token with user id and secret
    const token = jwt.sign(
      { _id: user._id, iss: "NODEAPI" },
      process.env.JWT_SECRET
    );
    // return response with user and token to frontend client
    const { _id, name, email, photo } = user;
    return res.json({ token, user: { _id, name, email, photo } });
  } else {
    // update existing user with new social info and login
    req.userprofile = user;
    user = _.extend(user, req.body);
    user.save();
    // generate a token with user id and secret
    const token = jwt.sign(
      { _id: user._id, iss: "NODEAPI" },
      process.env.JWT_SECRET
    );
    // return response with user and token to frontend client
    const { _id, name, email, photo } = user;
    return res.json({ token, user: { _id, name, email, photo } });
  }
};

exports.forgotPassword = async (req, res) => {
  if (!req.body) return res.status(400).json({ error: "No request body" });
  if (!req.body.email)
    return res.status(400).json({ error: "No Email in request body" });

  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user)
    return res.status(401).json({
      error: "User with that email does not exist!"
    });

  // generate a token with user id and secret
  const token = jwt.sign(
    { _id: user._id, iss: "NODEAPI" },
    process.env.JWT_SECRET
  );

  const clientUrl = req.headers.origin || process.env.CLIENT_URL || "http://localhost:3000";

  // email data
  const emailData = {
    from: "noreply@yatramitra.com",
    to: email,
    subject: "YatraMitra Password Reset Instructions",
    text: `Please use the following link to reset your password: ${clientUrl}/reset-password/${token}`,
    html: `<p>Please use the following link to reset your password:</p> <p><a href="${clientUrl}/reset-password/${token}">${clientUrl}/reset-password/${token}</a></p>`
  };

  try {
    user.resetPasswordLink = token;
    await user.save();
    sendEmail(emailData);
    return res.status(200).json({
      message: `Email has been sent to ${email}. Follow the instructions to reset your password.`
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;
  if (!resetPasswordLink) {
    return res.status(400).json({ error: "Reset link token is required" });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long" });
  }

  let user = await User.findOne({ resetPasswordLink });
  if (!user)
    return res.status(401).json({
      error: "Invalid or expired reset link!"
    });

  const updatedFields = {
    password: newPassword,
    resetPasswordLink: ""
  };

  user = _.extend(user, updatedFields);
  user.updated = Date.now();

  try {
    await user.save();
    return res.json({
      message: `Great! Now you can login with your new password.`
    });
  } catch (err) {
    return res.status(400).json({
      error: err.message
    });
  }
};

const otpStore = {};

exports.generateOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email address is required" });
  }

  const key = email.toLowerCase().trim();
  const user = await User.findOne({ email: key });
  if (!user) {
    return res.status(404).json({ error: "User with this email does not exist. Please sign up first." });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store it (expires in 5 minutes)
  otpStore[key] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000
  };

  // Securely print OTP ONLY on server terminal console for developer reference
  console.log(`[SECURE SERVER OTP GENERATED] For ${key}: ${otp}`);

  // Send Real Email OTP
  try {
    const emailData = {
      from: "noreply@yatramitra.com",
      to: key,
      subject: "YatraMitra Login Verification Code",
      text: `Your YatraMitra Verification Code is: ${otp}. Valid for 5 minutes.`,
      html: `<p>Your YatraMitra Verification Code is: <strong>${otp}</strong></p><p>This code is valid for 5 minutes. Please do not share this code with anyone.</p>`
    };
    sendEmail(emailData);
    console.log(`[EMAIL DISPATCH] Real OTP email successfully sent to ${key}`);
  } catch (err) {
    console.error("[EMAIL DISPATCH ERROR] Failed to send email:", err.message);
  }

  return res.json({
    message: "OTP sent successfully. Please check your email inbox."
  });
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  console.log(`[VERIFY OTP START] req.body:`, { email, otp });
  if (!email) {
    console.warn(`[VERIFY OTP ERROR] Missing email`);
    return res.status(400).json({ error: "Email address is required" });
  }

  const key = email.toLowerCase().trim();
  const user = await User.findOne({ email: key });

  if (!user) {
    console.warn(`[VERIFY OTP ERROR] User not found for key:`, key);
    return res.status(404).json({ error: "User not found" });
  }

  console.log(`[VERIFY OTP] Stored otpStore keys:`, Object.keys(otpStore));
  const record = otpStore[key];
  if (!record) {
    console.warn(`[VERIFY OTP ERROR] No record found in otpStore for key:`, key);
    return res.status(400).json({ error: "OTP has not been generated or has expired" });
  }

  console.log(`[VERIFY OTP] Stored record:`, record, `Submitted OTP:`, otp);

  if (record && record.expires < Date.now()) {
    console.warn(`[VERIFY OTP ERROR] OTP has expired for key:`, key);
    delete otpStore[key];
    return res.status(400).json({ error: "OTP has expired" });
  }

  const savedOtp = record ? record.otp : null;
  if (savedOtp !== otp) {
    console.warn(`[VERIFY OTP ERROR] OTP mismatch. Expected: "${savedOtp}", Got: "${otp}"`);
    return res.status(400).json({ error: "Invalid OTP code" });
  }

  // Clear OTP on successful verify
  if (record) {
    delete otpStore[key];
  }

  console.log(`[VERIFY OTP SUCCESS] Authenticating user:`, user.email);

  // Generate JWT token
  const payload = {
    _id: user.id,
    name: user.name,
    email: user.email
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET
  );

  return res.json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      photo: user.photo
    }
  });
};
