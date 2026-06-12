const User = require("../models/User");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_XXXXXXXXXXXXXX",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "YYYYYYYYYYYYYYYYYYYYYYYY"
  });
};

exports.getAllUsers = async (req, res) => {
  const users = await User.find().sort({ created: -1 }).select("name email phone createdAt updatedAt address");

  res.json(users);
};

exports.userById = async (req, res, next, id) => {
  const user = await User.findById(id);
  if (user) {
    user.salt = undefined;
    user.hashed_password = undefined;
    req.userprofile = user;
    next();
  } else {
    res.status(400).json({ error: "User not found!" });
  }
};

exports.read = (req, res) => {
  return res.json(req.userprofile);
};

exports.readMe = async (req, res) => {
  try {
    const user = await User.findById(req.userauth._id);
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    // Auto-generate referral code for existing users who don't have one yet
    if (!user.referralCode) {
      let namePart = user.name ? user.name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase() : "USER";
      if (!namePart) namePart = "USER";
      let isUnique = false;
      let code = "";
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        code = `YM${namePart}${randomPart}`;
        const existing = await User.findOne({ referralCode: code });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }
      user.referralCode = code;
      await user.save();
    }

    user.salt = undefined;
    user.hashed_password = undefined;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch profile!" });
  }
};

exports.rechargeWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    const rechargeAmount = Number(amount);
    if (isNaN(rechargeAmount) || rechargeAmount < 100) {
      return res.status(400).json({ error: "Minimum recharge amount is ₹100!" });
    }

    const user = await User.findById(req.userauth._id);
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    user.wallet = (user.wallet || 0) + rechargeAmount;
    await user.save();

    res.json({
      message: "Recharge successful!",
      wallet: user.wallet
    });
  } catch (err) {
    res.status(500).json({ error: "Could not process wallet recharge!" });
  }
};

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const orderAmount = Number(amount);
    if (isNaN(orderAmount) || orderAmount < 100) {
      return res.status(400).json({ error: "Minimum amount is ₹100!" });
    }

    const razorpay = getRazorpayInstance();
    const options = {
      amount: orderAmount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: `recharge_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    if (!order) {
      return res.status(500).json({ error: "Could not create Razorpay order" });
    }

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID || "rzp_test_XXXXXXXXXXXXXX"
    });
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    res.status(500).json({ error: "Could not initiate payment gateway transaction!" });
  }
};

exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
      return res.status(400).json({ error: "Missing required payment details!" });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "YYYYYYYYYYYYYYYYYYYYYYYY";
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Transaction verification failed! Signature mismatch." });
    }

    const user = await User.findById(req.userauth._id);
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    const creditAmount = Number(amount);
    if (isNaN(creditAmount) || creditAmount <= 0) {
      return res.status(400).json({ error: "Invalid payment amount!" });
    }

    user.wallet = (user.wallet || 0) + creditAmount;
    await user.save();

    res.json({
      message: "Wallet recharged successfully!",
      wallet: user.wallet
    });
  } catch (err) {
    console.error("Razorpay payment verification error:", err);
    res.status(500).json({ error: "Could not process transaction verification!" });
  }
};