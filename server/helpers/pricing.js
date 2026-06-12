const mongoose = require("mongoose");

/**
 * Calculates dynamic fare for a bus document on the fly.
 * - 10% surge on weekends (Saturday & Sunday).
 * - 15% discount if departure is within 2 hours and seats are still available.
 * Last-minute discount takes priority over surge pricing.
 */
exports.applyDynamicPricing = (busDoc) => {
  if (!busDoc) return null;
  const bus = busDoc.toObject ? busDoc.toObject() : busDoc;
  
  let finalFare = bus.fare;
  let pricingStatus = "normal"; // "normal" | "surge" | "discount"
  
  if (!bus.journeyDate || !bus.fare) {
    bus.originalFare = bus.fare;
    bus.pricingStatus = pricingStatus;
    return bus;
  }

  // Parse journeyDate using local timezone constructor to prevent UTC shift
  const dateParts = bus.journeyDate.split("-").map(Number);
  const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // 1. Check for Weekend Surge (10% increase)
  if (isWeekend) {
    finalFare = Math.round(bus.fare * 1.10);
    pricingStatus = "surge";
  }

  // 2. Check for Last-Minute Discount (15% discount)
  // Departure must be in the future, less than 2 hours away, and seats available
  if (bus.departure_time && bus.seatsAvailable > 0) {
    try {
      const timeParts = bus.departure_time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (timeParts) {
        let hours = parseInt(timeParts[1], 10);
        const minutes = parseInt(timeParts[2], 10);
        const ampm = timeParts[3];
        
        if (ampm) {
          if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
          if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
        }

        // Construct departure DateTime in local timezone
        const departureDateTime = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], hours, minutes, 0, 0);

        const now = new Date();
        const diffMs = departureDateTime.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours > 0 && diffHours <= 2) {
          finalFare = Math.round(bus.fare * 0.85);
          pricingStatus = "discount";
        }
      }
    } catch (e) {
      console.error("Error parsing departure time in dynamic pricing:", e);
    }
  }

  bus.originalFare = bus.fare;
  bus.fare = finalFare;
  bus.pricingStatus = pricingStatus;
  
  return bus;
};

/**
 * Applies dynamic pricing helper to a single bus or an array of buses.
 */
exports.applyPricingToBuses = (buses) => {
  if (!buses) return buses;
  if (Array.isArray(buses)) {
    return buses.map(b => exports.applyDynamicPricing(b));
  }
  return exports.applyDynamicPricing(buses);
};
