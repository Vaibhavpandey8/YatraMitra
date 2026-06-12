const Booking = require("../models/Booking");
const Bus = require("../models/Bus");
const Guest = require("../models/Guest");
const _ = require("lodash");
const { sendEmail } = require("../helpers/mailer");

exports.bookingById = async (req, res, next, id) => {
  const booking = await Booking.findById(id).populate("bus owner guest user");

  if (!booking) {
    return res.status(400).json({
      error: "booking not found"
    });
  }
  req.booking = booking; // adds booking object in req with booking info
  next();
};

exports.getAllBookings = async (req, res) => {
  const bookings = await Booking.find({}).populate("bus owner guest user self");

  res.json(bookings);
};

exports.getOwnerBookings = async (req, res) => {
  const bookings = await Booking.find({ owner: req.ownerauth }).populate(
    "bus owner guest user self"
  );

  res.json(bookings);
};

exports.postBooking = async (req, res) => {
  const booking = new Booking(req.body);
  if (req.body.journeyDate) {
    booking.journeyDate = req.body.journeyDate;
  }
  if (req.userauth) {
    booking.user = req.userauth;
    const User = require("../models/User");
    const userDoc = await User.findById(req.userauth._id);
    if (userDoc) {
      let updated = false;
      if (req.body.phone && (!userDoc.phone || userDoc.phone !== req.body.phone)) {
        userDoc.phone = req.body.phone;
        updated = true;
      }
      if (req.body.address && (!userDoc.address || userDoc.address !== req.body.address)) {
        userDoc.address = req.body.address;
        updated = true;
      }
      if (updated) {
        await userDoc.save();
      }
    }
  } else {
    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    const address = req.body.address;

    let user = await Guest.findOne({ phone });

    if (user) {
      user = _.extend(user, req.body);
      await user.save();
      booking.guest = user;
    } else {
      const guest = new Guest({ name, email, phone, address });
      await guest.save();
      booking.guest = guest;
    }
  }

  const bus = await Bus.findOne({ slug: req.bus.slug }).populate("startLocation endLocation travel");

  if (!bus) {
    return res.status(400).json({
      error: "Bus not found"
    });
  }

  // Calculate dynamic fare
  const { applyDynamicPricing } = require("../helpers/pricing");
  const pricedBus = applyDynamicPricing(bus);
  const dynamicPrice = pricedBus.fare;

  // Calculate promo code discount
  let discountAmount = 0;
  if (req.body.promoCode) {
    const promo = req.body.promoCode.trim().toUpperCase();
    if (promo === "FIRST100" && req.userauth) {
      const hasAnyBooking = await Booking.findOne({ user: req.userauth._id });
      if (!hasAnyBooking) {
        discountAmount = 100;
        booking.promoCode = "FIRST100";
      }
    } else if (promo.startsWith("WEEKEND20")) {
      const jDate = req.body.journeyDate || booking.journeyDate;
      if (jDate) {
        const dateObj = new Date(jDate);
        const day = dateObj.getDay();
        if (day === 0 || day === 6) {
          discountAmount = Math.round(dynamicPrice * 0.2);
          booking.promoCode = "WEEKEND20";
        }
      }
    } else if (promo.startsWith("GROUP15")) {
      const numSeats = req.body.numSeats || 1;
      if (numSeats >= 4) {
        discountAmount = Math.round(dynamicPrice * 0.15);
        booking.promoCode = "GROUP15";
      }
    }
  }

  const finalPrice = Math.max(0, dynamicPrice - discountAmount);
  booking.price = finalPrice.toString();

  if (
    bus.seatsAvailable < (req.body.passengers || booking.passengers) ||
    bus.isAvailable !== true ||
    bus.soldSeat.includes(booking.seatNumber) ||
    bus.bookedSeat.includes(booking.seatNumber)
  ) {
    return res.status(400).json({
      error: "Not available"
    });
  }

  // Enforce adjacent seat locking for male/other booking next to female
  const seatNumber = booking.seatNumber;
  const gender = req.body.gender || "male";
  booking.gender = gender;

  const femaleSeats = bus.femaleSeats || [];
  const getAdjacentSeat = (seat) => {
    if (!seat) return null;
    const match = seat.match(/^([A-Za-z]+)(\d+)$/);
    if (!match) return null;
    const prefix = match[1];
    const num = parseInt(match[2], 10);
    const adjNum = num % 2 === 0 ? num - 1 : num + 1;
    return prefix + adjNum;
  };

  if (gender !== "female") {
    const adjSeat = getAdjacentSeat(seatNumber);
    if (adjSeat && femaleSeats.includes(adjSeat)) {
      return res.status(400).json({
        error: `Seat ${seatNumber} cannot be booked by a male/other passenger because adjacent seat ${adjSeat} is booked by a female.`
      });
    }
  }

  let isPaidWithWallet = false;
  let userDoc = null;
  if (req.body.payWithWallet && req.userauth) {
    const User = require("../models/User");
    userDoc = await User.findById(req.userauth._id);
    if (!userDoc) {
      return res.status(404).json({ error: "User not found!" });
    }
    const deductionPrice = finalPrice;
    if (userDoc.wallet < deductionPrice) {
      return res.status(400).json({ error: "Insufficient wallet balance!" });
    }
    userDoc.wallet -= deductionPrice;
    await userDoc.save();
    booking.verification = "payed";
    isPaidWithWallet = true;
  }

  bus.seatsAvailable -= req.body.passengers || booking.passengers;

  if (isPaidWithWallet) {
    bus.soldSeat.push(booking.seatNumber);
  } else {
    bus.bookedSeat.push(booking.seatNumber);
  }

  if (gender === "female") {
    if (!bus.femaleSeats) bus.femaleSeats = [];
    bus.femaleSeats.push(seatNumber);
    bus.markModified("femaleSeats");
  }

  // Calculate and credit 5% cashback to user wallet
  if (req.userauth) {
    const ticketPrice = Number(booking.price || bus.fare);
    if (!isNaN(ticketPrice) && ticketPrice > 0) {
      const cashback = Math.round(ticketPrice * 0.05);
      booking.cashbackEarned = cashback;
      
      if (!userDoc) {
        const User = require("../models/User");
        userDoc = await User.findById(req.userauth._id);
      }
      
      if (userDoc) {
        userDoc.wallet = (userDoc.wallet || 0) + cashback;
        userDoc.totalCashbackEarned = (userDoc.totalCashbackEarned || 0) + cashback;
        await userDoc.save();
      }
    }
  }

  booking.bus = bus;
  booking.owner = bus.owner;

  await booking.save();
  await bus.save();

  if (global.io) {
    global.io.to(`bus:${bus.slug}`).emit("seat-booked-confirmed", {
      slug: bus.slug,
      seatNumber: booking.seatNumber,
      gender: booking.gender,
      verification: booking.verification
    });
  }

  // Send Email invoice for all bookings
  try {
    const travelName = bus.travel ? bus.travel.name : "YatraMitra Travels";
    const busNumber = bus.busNumber || "N/A";
    const busType = bus.type || "N/A";
    const startLocation = bus.startLocation ? bus.startLocation.name : "N/A";
    const endLocation = bus.endLocation ? bus.endLocation.name : "N/A";
    const journeyDate = booking.journeyDate || bus.journeyDate || "N/A";
    const departureTime = bus.departure_time || "N/A";
    const passengerName = req.body.name || (userDoc ? userDoc.name : "Valued Customer");
    const passengerPhone = req.body.phone || "N/A";
    const passengerEmail = req.body.email || (userDoc ? userDoc.email : "traveler@yatramitra.com");
    const paidPrice = booking.price || bus.fare;

    const emailData = {
      from: `"YatraMitra" <${process.env.userEmail}>`,
      to: passengerEmail,
      subject: `YatraMitra E-Ticket Booking - Seat ${booking.seatNumber}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px; color: #00BCD4;">YATRAMITRA</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">Your Trusted Travel Partner</p>
          </div>
          
          <div style="padding: 24px; color: #333333; background-color: #f8fafc;">
            <div style="text-align: center; margin-bottom: 24px;">
              ${isPaidWithWallet ? 
                `<span style="background-color: #dcfce7; color: #15803d; padding: 6px 16px; border-radius: 9999px; font-weight: 600; font-size: 12px; text-transform: uppercase; border: 1px solid #bbf7d0;">Ticket Confirmed (Paid via Wallet)</span>` :
                `<span style="background-color: #fef3c7; color: #d97706; padding: 6px 16px; border-radius: 9999px; font-weight: 600; font-size: 12px; text-transform: uppercase; border: 1px solid #fde68a;">Booking Pending Verification</span>`
              }
            </div>
            
            <h3 style="margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; color: #1e293b; font-size: 16px;">Journey Details</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 40%;">Travel Agency:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${travelName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Bus Number:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${busNumber}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Bus Type:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${busType}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Route:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #00BCD4;">${startLocation} to ${endLocation}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Journey Date:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${journeyDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Departure Time:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${departureTime}</td>
              </tr>
            </table>

            <h3 style="margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; color: #1e293b; font-size: 16px;">Passenger & Seat Info</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 40%;">Passenger Name:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${passengerName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Seat Number:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #ec4899;">${booking.seatNumber} (${gender.toUpperCase()})</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Phone:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">${passengerPhone}</td>
              </tr>
            </table>

            <h3 style="margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; color: #1e293b; font-size: 16px;">Invoice Summary</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 40%;">Ticket Fare:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #1e293b;">Rs. ${bus.fare}</td>
              </tr>
              ${booking.cashbackEarned ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Cashback Earned (5%):</td>
                <td style="padding: 6px 0; font-weight: 600; color: #22c55e;">Rs. ${booking.cashbackEarned} (Added to Wallet)</td>
              </tr>
              ` : ''}
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 10px 0 0 0; color: #1e293b; font-weight: 700; font-size: 16px;">Total Cost:</td>
                <td style="padding: 10px 0 0 0; font-weight: 700; color: #22c55e; font-size: 18px;">Rs. ${paidPrice}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 4px 0;">Thank you for choosing YatraMitra. Have a safe and comfortable journey!</p>
            <p style="margin: 0;">For support, contact us at support@yatramitra.com</p>
          </div>
        </div>
      `
    };

    sendEmail(emailData);
  } catch (err) {
    console.error("Error sending ticket email:", err);
  }

  res.json(booking);
};

exports.postSold = async (req, res) => {
  const booking = new Booking(req.body);
  booking.self = req.ownerauth;

  const bus = await Bus.findOne({ slug: req.bus.slug });

  if (
    bus.seatsAvailable < booking.passengers ||
    bus.isAvailable !== true ||
    bus.soldSeat.includes(booking.seatNumber) ||
    bus.bookedSeat.includes(booking.seatNumber)
  ) {
    return res.status(400).json({
      error: "Not available"
    });
  }

  bus.seatsAvailable -= booking.passengers;

  bus.soldSeat.push(booking.seatNumber);

  booking.bus = bus;
  booking.owner = bus.owner;
  booking.verification = "payed";

  await booking.save();
  await bus.save();

  res.json(booking);
};

exports.changeVerificationStatus = async (req, res) => {
  const booking = req.booking;
  const newVerification = req.body.verification;

  booking.verification = newVerification;
  await booking.save();

  if (booking.bus) {
    const bus = await Bus.findById(booking.bus._id);
    if (bus) {
      const seat = booking.seatNumber;
      if (newVerification === "verified" || newVerification === "payed") {
        const bookIndex = bus.bookedSeat.indexOf(seat);
        if (bookIndex !== -1) {
          bus.bookedSeat.splice(bookIndex, 1);
        }
        if (!bus.soldSeat.includes(seat)) {
          bus.soldSeat.push(seat);
        }
      } else {
        const soldIndex = bus.soldSeat.indexOf(seat);
        if (soldIndex !== -1) {
          bus.soldSeat.splice(soldIndex, 1);
        }
        if (!bus.bookedSeat.includes(seat)) {
          bus.bookedSeat.push(seat);
        }
      }
      await bus.save();
    }
  }

  res.json(booking);
};

exports.deleteBooking = async (req, res) => {
  const booking = req.booking;

  const bus = await Bus.findOne({ slug: booking.bus.slug });

  if (booking.verification === "payed" || booking.verification === "verified") {
    const removeIndexSold = bus.soldSeat
      .map(seat => seat.toString())
      .indexOf(booking.seatNumber);

    if (removeIndexSold !== -1) {
      bus.soldSeat.splice(removeIndexSold, 1);
    }
  } else {
    const removeIndexBook = bus.bookedSeat
      .map(seat => seat.toString())
      .indexOf(booking.seatNumber);

    if (removeIndexBook !== -1) {
      bus.bookedSeat.splice(removeIndexBook, 1);
    }
  }

  if (booking.gender === "female" && bus.femaleSeats) {
    const femaleIndex = bus.femaleSeats
      .map(seat => seat.toString())
      .indexOf(booking.seatNumber);
    if (femaleIndex !== -1) {
      bus.femaleSeats.splice(femaleIndex, 1);
      bus.markModified("femaleSeats");
    }
  }

  await booking.remove();
  await bus.save();

  res.json(booking);
};

exports.unsoldSeat = async (req, res) => {
  try {
    const bus = await Bus.findOne({ slug: req.bus.slug });

    if (!bus) {
      return res.status(400).json({ error: "Bus not found" });
    }

    const seatNumber = req.body.seatNumber;

    // Remove from soldSeat array
    const soldIndex = bus.soldSeat
      .map(seat => seat.toString())
      .indexOf(seatNumber);

    if (soldIndex === -1) {
      return res.status(400).json({ error: "Seat is not in sold list" });
    }

    bus.soldSeat.splice(soldIndex, 1);
    bus.seatsAvailable += 1;

    // Check if the booking we are removing had gender === "female"
    const bookingToRemove = await Booking.findOne({
      bus: bus._id,
      seatNumber: seatNumber,
      verification: "payed"
    });

    if (bookingToRemove && bookingToRemove.gender === "female" && bus.femaleSeats) {
      const femaleIndex = bus.femaleSeats
        .map(seat => seat.toString())
        .indexOf(seatNumber);
      if (femaleIndex !== -1) {
        bus.femaleSeats.splice(femaleIndex, 1);
        bus.markModified("femaleSeats");
      }
    }

    // Also remove the associated booking
    await Booking.findOneAndRemove({
      bus: bus._id,
      seatNumber: seatNumber,
      verification: "payed"
    });

    await bus.save();

    res.json({ message: "Seat is now available", seatNumber });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const User = require("../models/User");
    const userDoc = await User.findById(req.userauth._id);
    if (!userDoc) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find any Guest booking accounts that match this user's email
    const matchingGuests = await Guest.find({ email: userDoc.email });
    const guestIds = matchingGuests.map(g => g._id);

    // Fetch bookings belonging to this User ID OR any Guest IDs matching their email
    const bookings = await Booking.find({
      $or: [
        { user: userDoc._id },
        { guest: { $in: guestIds } }
      ]
    })
      .populate({
        path: "bus",
        populate: {
          path: "startLocation endLocation travel"
        }
      })
      .populate("guest")
      .sort({ createdAt: -1 });
    
    // Filter out bookings with deleted/missing bus objects
    const validBookings = bookings.filter(b => b.bus);
    res.json(validBookings);
  } catch (err) {
    console.error("Error fetching user bookings:", err);
    res.status(500).json({ error: "Could not fetch bookings" });
  }
};
