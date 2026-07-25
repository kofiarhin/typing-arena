const express = require("express");
const { getStatus } = require("../controllers/systemStatusController");

const router = express.Router();

router.get("/", getStatus);

module.exports = router;
