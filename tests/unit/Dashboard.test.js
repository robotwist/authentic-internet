import React from "react";
import { render, waitFor } from "@testing-library/react";
import Dashboard, { hasSavedCharacter } from "../../client/src/pages/Dashboard";
import API from "../../client/src/api/api";
import { useAuth } from "../../client/src/context/AuthContext";

const mockNavigate = jest.fn();
const mockUnlockAchievement = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock("../../client/src/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../client/src/context/AchievementContext", () => ({
  ACHIEVEMENTS: { FIRST_STEP: { id: "FIRST_STEP" } },
  useAchievements: () => ({
    unlockAchievement: mockUnlockAchievement,
  }),
}));

jest.mock("../../client/src/api/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock("../../client/src/components/Constants", () => ({
  MAPS: [
    {
      name: "Main",
      artifacts: [],
    },
  ],
}));

jest.mock("../../client/src/components/DailyQuote", () => () => (
  <div data-testid="daily-quote" />
));
jest.mock("../../client/src/components/SkillTree", () => () => (
  <div data-testid="skill-tree" />
));
jest.mock("../../client/src/components/DailyChallenges", () => () => (
  <div data-testid="daily-challenges" />
));
jest.mock("../../client/src/components/TitleArea", () => () => (
  <div data-testid="title-area" />
));
jest.mock("../../client/src/components/QuestLog", () => () => (
  <div data-testid="quest-log" />
));
jest.mock("../../client/src/components/PowerManagement", () => () => (
  <div data-testid="power-management" />
));

describe("Dashboard character redirect", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    useAuth.mockReturnValue({
      user: { id: "user-1", username: "Ada" },
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const mockDashboardRequests = (characterRequest) => {
    API.get.mockImplementation((url) => {
      if (url === "/api/worlds/my-worlds") {
        return Promise.resolve({ data: [] });
      }
      if (url === "/api/users/user-1") {
        return characterRequest;
      }
      return Promise.reject(new Error(`Unexpected API call: ${url}`));
    });
  };

  test("recognizes saved character data from auth or fetched profile", () => {
    expect(hasSavedCharacter({ characterSprite: "data:image/png;base64,a" })).toBe(true);
    expect(hasSavedCharacter({ hasCharacterSprite: true })).toBe(true);
    expect(hasSavedCharacter({}, { characterSprite: "data:image/png;base64,b" })).toBe(true);
    expect(hasSavedCharacter({}, {})).toBe(false);
  });

  test("waits for character fetch before redirecting users without a sprite in auth state", async () => {
    mockDashboardRequests(
      Promise.resolve({
        data: { id: "user-1", characterSprite: "data:image/png;base64,saved" },
      }),
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith("/api/users/user-1");
    });

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalledWith("/character-creator", {
        replace: true,
      });
    });
  });

  test("does not redirect when the character lookup fails and character state is unknown", async () => {
    mockDashboardRequests(Promise.reject(new Error("network unavailable")));

    render(<Dashboard />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to load character data:",
        expect.any(Error),
      );
    });

    expect(mockNavigate).not.toHaveBeenCalledWith("/character-creator", {
      replace: true,
    });
  });

  test("redirects after server confirms the user has no saved character", async () => {
    mockDashboardRequests(Promise.resolve({ data: { id: "user-1" } }));

    render(<Dashboard />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/character-creator", {
        replace: true,
      });
    });
  });
});
