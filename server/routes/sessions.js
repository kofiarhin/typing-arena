const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/sessionController");

router.post("/", sessionController.createSession);
router.get("/:gameId", sessionController.getSession);
router.post("/:gameId/end", sessionController.endSession);

module.exports = router;
