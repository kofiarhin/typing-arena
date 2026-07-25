const request = require("supertest");
const app = require("../app");

describe("GET /api/system-status", () => {
  it("returns a safe system status payload", async () => {
    const response = await request(app).get("/api/system-status");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.service).toBe("typing-arena-api");
    expect(typeof response.body.socketReady).toBe("boolean");
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
    expect(Object.keys(response.body).sort()).toEqual(
      ["service", "socketReady", "status", "timestamp"].sort()
    );

    const serialized = JSON.stringify(response.body).toLowerCase();
    for (const sensitiveKey of [
      "password",
      "token",
      "secret",
      "mongodb",
      "database",
      "hostname",
      "environment",
      "config",
    ]) {
      expect(serialized).not.toContain(sensitiveKey);
    }
  });
});
