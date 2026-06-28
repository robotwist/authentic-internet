import express from "express";
import request from "supertest";
import { jest } from "@jest/globals";
import {
  buildMonotonicExperienceUpdate,
  isValidExperienceTotal,
} from "../utils/experience.js";

const findByIdAndUpdate = jest.fn();

jest.unstable_mockModule("../models/User.js", () => ({
  default: {
    findByIdAndUpdate,
  },
}));

jest.unstable_mockModule("../middleware/authMiddleware.js", () => ({
  default: (req, _res, next) => {
    req.user = { userId: "user-1" };
    next();
  },
}));

const { default: userRoutes } = await import("../routes/userRoutes.js");

describe("experience persistence helpers", () => {
  it("builds a monotonic Mongo update so stale totals cannot lower XP", () => {
    expect(buildMonotonicExperienceUpdate(250)).toEqual({
      $max: { experience: 250 },
    });
  });

  it("rejects invalid experience totals before they reach persistence", () => {
    expect(isValidExperienceTotal(0)).toBe(true);
    expect(isValidExperienceTotal(125)).toBe(true);
    expect(isValidExperienceTotal(-1)).toBe(false);
    expect(isValidExperienceTotal(Number.NaN)).toBe(false);
    expect(isValidExperienceTotal("125")).toBe(false);
    expect(() => buildMonotonicExperienceUpdate(-1)).toThrow(
      "Experience must be a finite non-negative number",
    );
  });
});

describe("PUT /experience", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(userRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("persists XP with $max so stale client totals cannot lower server XP", async () => {
    const select = jest.fn().mockResolvedValue({
      username: "ada",
      email: "ada@example.com",
      experience: 500,
      level: 6,
    });
    findByIdAndUpdate.mockReturnValue({ select });

    const response = await request(app)
      .put("/experience")
      .send({ experience: 5 });

    expect(response.status).toBe(200);
    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      "user-1",
      { $max: { experience: 5 } },
      { new: true },
    );
    expect(select).toHaveBeenCalledWith("username email experience level");
  });

  it("rejects invalid totals before writing to the database", async () => {
    const response = await request(app)
      .put("/experience")
      .send({ experience: -1 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Experience must be a finite non-negative number",
    );
    expect(findByIdAndUpdate).not.toHaveBeenCalled();
  });
});
