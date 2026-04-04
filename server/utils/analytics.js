function track(event, data = {}) {
  console.log(`[analytics] ${event}`, data);
}

module.exports = { track };
