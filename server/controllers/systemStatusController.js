const { getSystemStatus } = require("../services/systemStatusService");

function getStatus(req, res, next) {
  try {
    return res.status(200).json(getSystemStatus());
  } catch (err) {
    return next(err);
  }
}

module.exports = { getStatus };
