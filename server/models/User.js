const mongoose = require("mongoose");
const { v1 } = require("uuid");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 32,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 32,
    },
    email: {
      type: String,
      trim: true,
    },
    info: {
      type: String,
      trim: true,
      maxlength: 32,
    },
    phone: {
      type: Number,
      max: 9999999999,
    },
    hashed_password: {
      type: String,
      required: false,
    },
    photo: {
      type: String,
    },
    resetPasswordLink: {
      type: String,
      default: "",
    },
    salt: String,
    isVerified: {
      type: Boolean,
      default: false,
    },
    wallet: {
      type: Number,
      default: 500,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    totalCashbackEarned: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Pre-save hook to auto-generate unique referral codes
userSchema.pre("save", async function(next) {
  if (this.isNew && !this.referralCode) {
    let namePart = this.name ? this.name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase() : "USER";
    if (!namePart) namePart = "USER";
    let isUnique = false;
    let code = "";
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      code = `YM${namePart}${randomPart}`;
      const existing = await mongoose.models.User.findOne({ referralCode: code });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    this.referralCode = code;
  }
  next();
});


// virtual field
userSchema
  .virtual("password")
  .set(function (password) {
    // create temporary variable called _password
    this._password = password;
    // generate a timestamp
    this.salt = v1();
    // encryptPassword()
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

// methods
userSchema.methods = {
  authenticate: function (plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },

  encryptPassword: function (password) {
    if (!password) return "";
    try {
      return crypto
        .createHmac("sha1", this.salt)
        .update(password)
        .digest("hex");
    } catch (err) {
      return "";
    }
  },
};

module.exports = mongoose.model("User", userSchema);
