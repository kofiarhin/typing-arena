require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("./app");
const initSockets = require("./sockets");
const { PORT, MONGODB_URI } = require("./config/env");

const server = http.createServer(app);

initSockets(server);

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI environment variable");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });
