import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import API, { refreshUserToken } from "../../client/src/api/api";
import { AuthProvider } from "../../client/src/context/AuthContext";
import gameProgressService from "../../client/src/services/GameProgressService";

jest.mock("../../client/src/services/GameProgressService", () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
  },
}));

jest.mock("../../client/src/api/api", () => {
  const requestHandlers = [];
  const api = {
    __requestHandlers: requestHandlers,
    __lastConfig: null,
    defaults: { headers: { common: {} } },
    interceptors: {
      request: {
        use: jest.fn((fulfilled) => {
          requestHandlers.push(fulfilled);
          return requestHandlers.length - 1;
        }),
      },
      response: {
        use: jest.fn(),
      },
    },
    get: jest.fn(async (url) => {
      let config = { url, headers: {} };

      for (const handler of requestHandlers) {
        config = (await handler(config)) || config;
      }

      api.__lastConfig = config;
      return {
        data: {
          id: "user-1",
          username: "alice",
          experience: 500,
          level: 5,
        },
      };
    }),
    post: jest.fn(),
  };

  return {
    __esModule: true,
    default: api,
    loginUser: jest.fn(),
    registerUser: jest.fn(),
    verifyToken: jest.fn(),
    logoutUser: jest.fn(),
    refreshUserToken: jest.fn(),
    logPersistentError: jest.fn(),
  };
});

const tokenExpiringIn = (seconds) => {
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + seconds,
    }),
  ).toString("base64");

  return `e30.${payload}.sig`;
};

describe("AuthContext regression coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    API.__requestHandlers.length = 0;
    API.__lastConfig = null;
    localStorage.clear();
  });

  it("hydrates the profile with the refreshed token after cold-start refresh", async () => {
    const staleToken = tokenExpiringIn(60);
    const refreshedToken = tokenExpiringIn(60 * 60);

    localStorage.setItem("token", staleToken);
    localStorage.setItem("refreshToken", "refresh-token");
    localStorage.setItem("user", JSON.stringify({ id: "user-1", username: "alice" }));
    refreshUserToken.mockResolvedValue({ token: refreshedToken });

    render(
      <AuthProvider>
        <div>ready</div>
      </AuthProvider>,
    );

    expect(await screen.findByText("ready")).toBeInTheDocument();

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith("/api/users/me");
    });
    expect(API.__lastConfig.headers.Authorization).toBe(
      `Bearer ${refreshedToken}`,
    );
    expect(gameProgressService.init).toHaveBeenCalledWith(
      expect.objectContaining({ experience: 500 }),
    );
  });
});
