import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../../context/AuthContext";
import { GameStateProvider } from "../../context/GameStateContext";
import { AchievementProvider } from "../../context/AchievementContext";
import GameWorld from "../GameWorld";

// Mock the required dependencies
jest.mock("../../api/api", () => ({
  fetchCharacter: jest.fn(),
  updateCharacter: jest.fn(),
  fetchArtifacts: jest.fn(),
  createArtifact: jest.fn(),
  updateArtifact: jest.fn(),
  deleteArtifact: jest.fn(),
}));

jest.mock("../../utils/SoundManager", () => ({
  getInstance: jest.fn(() => ({
    initialize: jest.fn(),
    playMusic: jest.fn(),
    stopMusic: jest.fn(),
    playSound: jest.fn(),
    loadSound: jest.fn(),
  })),
}));

const renderGameWorld = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <GameStateProvider>
          <AchievementProvider>
            <GameWorld />
          </AchievementProvider>
        </GameStateProvider>
      </AuthProvider>
    </BrowserRouter>,
  );
};

describe("GameWorld Component", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  test("renders game container", () => {
    renderGameWorld();
    expect(screen.getByTestId("game-container")).toBeInTheDocument();
  });

  test("initializes with default state", () => {
    renderGameWorld();
    // Check that the game world is rendered
    expect(screen.getByTestId("game-container")).toBeInTheDocument();
  });

  test("handles character movement", async () => {
    renderGameWorld();

    // Simulate key press for movement
    fireEvent.keyDown(document, { key: "ArrowUp" });

    await waitFor(() => {
      // Verify that movement was handled
      expect(document.querySelector(".character")).toBeInTheDocument();
    });
  });

  test("toggles inventory visibility", () => {
    renderGameWorld();

    // Find and click inventory button
    const inventoryButton = screen.getByTestId("inventory-button");
    fireEvent.click(inventoryButton);

    // Check that inventory is shown
    expect(screen.getByTestId("inventory")).toBeInTheDocument();
  });

  test("handles artifact interactions", async () => {
    renderGameWorld();

    // Mock artifact data
    const mockArtifact = {
      id: "test-artifact",
      name: "Test Artifact",
      description: "A test artifact",
      location: { x: 100, y: 100, mapName: "Test Map" },
    };

    // Simulate artifact click
    const artifactElement = screen.getByTestId("artifact-test-artifact");
    fireEvent.click(artifactElement);

    await waitFor(() => {
      // Verify artifact interaction was handled
      expect(screen.getByText("Test Artifact")).toBeInTheDocument();
    });
  });

  test("handles NPC interactions", async () => {
    renderGameWorld();

    // Mock NPC data
    const mockNPC = {
      id: "test-npc",
      name: "Test NPC",
      position: { x: 100, y: 100 },
    };

    // Simulate NPC click
    const npcElement = screen.getByTestId("npc-test-npc");
    fireEvent.click(npcElement);

    await waitFor(() => {
      // Verify NPC dialog is shown
      expect(screen.getByText("Test NPC")).toBeInTheDocument();
    });
  });

  test("saves game progress", async () => {
    renderGameWorld();

    // Trigger game progress save
    const saveButton = screen.getByTestId("save-progress-button");
    fireEvent.click(saveButton);

    await waitFor(() => {
      // Verify that progress was saved
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  test("handles level completion", async () => {
    renderGameWorld();

    // Simulate level completion
    const levelCompleteEvent = new CustomEvent("levelComplete", {
      detail: { level: "level1" },
    });
    window.dispatchEvent(levelCompleteEvent);

    await waitFor(() => {
      // Verify level completion notification
      expect(screen.getByText("Level Complete!")).toBeInTheDocument();
    });
  });

  test("handles achievement unlocking", async () => {
    renderGameWorld();

    // Simulate achievement unlock
    const achievementEvent = new CustomEvent("achievementUnlocked", {
      detail: {
        id: "test-achievement",
        title: "Test Achievement",
        description: "A test achievement",
      },
    });
    window.dispatchEvent(achievementEvent);

    await waitFor(() => {
      // Verify achievement notification
      expect(screen.getByText("Test Achievement")).toBeInTheDocument();
    });
  });
});
