import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Import Routes
import weatherRoute from "./routes/weather.js";
import disastersRoute from "./routes/disasters.js";
import riskRoute from "./routes/risk.js";
import authRoute from "./routes/auth.js";

dotenv.config();

// ✅ Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// API Routes
app.use("/api/weather", weatherRoute);
app.use("/api/disasters", disastersRoute);
app.use("/api/risk", riskRoute);
app.use("/api/auth", authRoute);

// HTTP + Socket.IO Server
const allowedOrigin = "http://localhost:5173";
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

console.log("Allowed origin:", allowedOrigin);

// ✅ Emit random alerts every 15s to ALL clients
const riskLevels = ["Low", "Moderate", "High", "Severe"];
setInterval(() => {
  const randomRisk = riskLevels[Math.floor(Math.random() * riskLevels.length)];
  if (randomRisk === "High" || randomRisk === "Severe") {
    io.emit("alert", {
      type: "critical",
      message: `🚨 ${randomRisk} Risk detected! Stay alert.`
    });
  } else {
    io.emit("alert", {
      type: "info",
      message: `✅ ${randomRisk} Risk. Situation under control.`
    });
  }
}, 15000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
