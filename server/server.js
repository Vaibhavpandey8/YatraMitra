// Packages
const expressValidator = require("express-validator");
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
require("express-async-errors");
const cors = require("cors");
require("dotenv").config();
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
global.io = io;

// Import methods
const { runEveryMidnight, dbConnection, errorHandler } = require("./helpers");
const logger = require("./helpers/logger");
const runSeed = require("./seeds");

// Database Connection
dbConnection();
runSeed();

// Middlewares
logger(app);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(expressValidator());
app.use(express.static("public"));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Routes
app.get("/", (req, res) => {
  res.redirect("/api/users");
});

app.use("/api/auth-owner", require("./routes/auth-owner"));
app.use("/api/auth-user", require("./routes/auth-user"));
app.use("/api/bookings", require("./routes/booking"));
app.use("/api/bus", require("./routes/bus"));
app.use("/api/guests", require("./routes/guest"));
app.use("/api/locations", require("./routes/location"));
app.use("/api/owners", require("./routes/owner"));
app.use("/api/travels", require("./routes/travel"));
app.use("/api/users", require("./routes/user"));

// Error handling middleware
app.use(function (err, req, res, next) {
  return res.status(500).json({
    error: errorHandler(err) || "Something went wrong!",
  });
});

// Run every-midnight to check if bus deporting date is passed
runEveryMidnight();

const activeHolds = {};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join-bus-room", ({ slug }) => {
    socket.join(`bus:${slug}`);
    console.log(`Socket ${socket.id} joined room bus:${slug}`);
  });

  socket.on("seat-selection-toggle", ({ slug, seat, action }) => {
    socket.to(`bus:${slug}`).emit("seat-selection-broadcast", { seat, action });

    // Track active selection holds per socket connection
    if (action === "select") {
      if (!activeHolds[socket.id]) {
        activeHolds[socket.id] = { slug, seats: new Set() };
      }
      activeHolds[socket.id].seats.add(seat);
    } else if (action === "deselect") {
      if (activeHolds[socket.id]) {
        activeHolds[socket.id].seats.delete(seat);
        if (activeHolds[socket.id].seats.size === 0) {
          delete activeHolds[socket.id];
        }
      }
    }
  });

  socket.on("seat-booked-confirmed", ({ slug, seatNumber, gender, verification }) => {
    socket.to(`bus:${slug}`).emit("seat-booked-broadcast", { seatNumber, gender, verification });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    const holdInfo = activeHolds[socket.id];
    if (holdInfo) {
      const { slug, seats } = holdInfo;
      // Broadcast release event for all seats held by this disconnected user
      seats.forEach(seat => {
        socket.to(`bus:${slug}`).emit("seat-selection-broadcast", { seat, action: "deselect" });
      });
      delete activeHolds[socket.id];
    }
  });
});

const port = process.env.PORT || 8525;

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
