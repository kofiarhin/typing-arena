const express = require("express");
const cors = require("cors");
const { CLIENT_URL } = require("./config/env");
const sessionsRouter = require("./routes/sessions");
const systemStatusRouter = require("./routes/systemStatus");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: [CLIENT_URL].filter(Boolean),
    credentials: true,
  })
);

app.use("/api/system-status", systemStatusRouter);
app.use("/api/sessions", sessionsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);

module.exports = app;
