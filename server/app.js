const express = require("express");
const cors = require("cors");

const app = express();

// setup middleware
app.use(cors());

app.get("/", async (req, res, next) => {
  return res.json({ message: "welcome to typing arena" });
});

module.exports = app;
