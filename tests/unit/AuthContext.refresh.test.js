import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import API, { refreshUserToken } from "../../client/src/api/api";
import { AuthProvider, useAuth } from "../../client/src/context/AuthContext";

jest.mock("../../client/src/api/api", () => {
  const mockApi = {
    post: jest.fn(),
    get: jest.fn(),
    defaults: { headers: { common: {} } },
    interceptors: {
      request: {
        use: jest.fn(() => 1),
        eject: jest.fn(),
      },
      response: {
        use: jest.fn(() => 2),
        eject: jest.fn(),
      },
    },
  };

  return {
    __esModule: true,
    default: mockApi,
    loginUser: jest.fn(),
    registerUser: jest.fn(),
    verifyToken: jest.fn(),
    logoutUser: jest.fn(),
    refreshUserToken: jest.fn(),
    logPersistentError: jest.fn(),
  };
});

const createToken = (expiresInSeconds) => {
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    }),
  ).toString("base64");

  return `header.${payload}.signature`;
};

const AuthProbe = () => {
  const { isAuthenticated, user } = useAuth();
  return (
    <div data-testid="auth-state">
      {isAuthenticated ? `authenticated:${user.username}` : "anonymous"}
    </div>
  );
};

describe("AuthContext refresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test("refreshes an expiring access token through the refresh cookie", async () => {
    const expiringToken = createToken(60);
    const refreshedToken = createToken(3600);

    localStorage.setItem("token", expiringToken);
    localStorage.setItem(
      "user",
      JSON.stringify({ id: "user-1", username: "tester" }),
    );

    API.post.mockResolvedValue({
      data: { success: true, token: refreshedToken },
    });
    API.get.mockResolvedValue({
      data: { id: "user-1", username: "tester", characterName: "Tester" },
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith("/api/auth/refresh");
    });

    expect(refreshUserToken).not.toHaveBeenCalled();
    expect(localStorage.getItem("token")).toBe(refreshedToken);
    expect(await screen.findByTestId("auth-state")).toHaveTextContent(
      "authenticated:tester",
    );
  });
});
