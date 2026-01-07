import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Artifact from "../Artifact";

const mockArtifact = {
  id: "test-artifact",
  name: "Test Artifact",
  description: "A test artifact for testing purposes",
  type: "scroll",
  rarity: "common",
  location: { x: 100, y: 100, mapName: "Test Map" },
  icon: "/assets/artifacts/scroll.svg",
  isCollected: false,
  isVisible: true,
};

const defaultProps = {
  artifact: mockArtifact,
  onArtifactClick: jest.fn(),
  onArtifactCollect: jest.fn(),
  isInInventory: false,
  showDetails: false,
};

const renderArtifact = (props = {}) => {
  return render(<Artifact {...defaultProps} {...props} />);
};

describe("Artifact Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders artifact with basic information", () => {
    renderArtifact();

    expect(screen.getByText("Test Artifact")).toBeInTheDocument();
    expect(
      screen.getByText("A test artifact for testing purposes"),
    ).toBeInTheDocument();
  });

  test("displays artifact icon", () => {
    renderArtifact();

    const icon = screen.getByAltText("Test Artifact icon");
    expect(icon).toBeInTheDocument();
    expect(icon.src).toContain("/assets/artifacts/scroll.svg");
  });

  test("shows rarity indicator", () => {
    renderArtifact();

    expect(screen.getByText("common")).toBeInTheDocument();
  });

  test("handles artifact click", () => {
    renderArtifact();

    const artifactElement = screen.getByTestId("artifact-test-artifact");
    fireEvent.click(artifactElement);

    expect(defaultProps.onArtifactClick).toHaveBeenCalledWith("test-artifact");
  });

  test("shows collect button when not in inventory", () => {
    renderArtifact({ isInInventory: false });

    expect(screen.getByText("Collect")).toBeInTheDocument();
  });

  test("hides collect button when in inventory", () => {
    renderArtifact({ isInInventory: true });

    expect(screen.queryByText("Collect")).not.toBeInTheDocument();
  });

  test("handles collect action", () => {
    renderArtifact();

    const collectButton = screen.getByText("Collect");
    fireEvent.click(collectButton);

    expect(defaultProps.onArtifactCollect).toHaveBeenCalledWith(
      "test-artifact",
    );
  });

  test("shows details when showDetails is true", () => {
    renderArtifact({ showDetails: true });

    expect(screen.getByText("Type: scroll")).toBeInTheDocument();
    expect(screen.getByText("Location: Test Map")).toBeInTheDocument();
  });

  test("hides details when showDetails is false", () => {
    renderArtifact({ showDetails: false });

    expect(screen.queryByText("Type: scroll")).not.toBeInTheDocument();
    expect(screen.queryByText("Location: Test Map")).not.toBeInTheDocument();
  });

  test("applies correct CSS classes based on rarity", () => {
    const { rerender } = renderArtifact({
      artifact: { ...mockArtifact, rarity: "legendary" },
    });

    const artifactElement = screen.getByTestId("artifact-test-artifact");
    expect(artifactElement).toHaveClass("artifact", "legendary");

    rerender(
      <Artifact
        {...defaultProps}
        artifact={{ ...mockArtifact, rarity: "epic" }}
      />,
    );
    expect(artifactElement).toHaveClass("artifact", "epic");
  });

  test("handles missing artifact data gracefully", () => {
    const incompleteArtifact = {
      id: "incomplete-artifact",
      name: "Incomplete Artifact",
    };

    renderArtifact({ artifact: incompleteArtifact });

    expect(screen.getByText("Incomplete Artifact")).toBeInTheDocument();
    expect(screen.getByText("No description available")).toBeInTheDocument();
  });

  test("shows collected state when artifact is collected", () => {
    renderArtifact({ artifact: { ...mockArtifact, isCollected: true } });

    expect(screen.getByText("Collected")).toBeInTheDocument();
  });

  test("applies disabled state when artifact is not visible", () => {
    renderArtifact({ artifact: { ...mockArtifact, isVisible: false } });

    const artifactElement = screen.getByTestId("artifact-test-artifact");
    expect(artifactElement).toHaveClass("artifact", "disabled");
  });

  test("handles image load error", async () => {
    renderArtifact();

    const icon = screen.getByAltText("Test Artifact icon");

    // Simulate image load error
    fireEvent.error(icon);

    await waitFor(() => {
      // Should show fallback content or handle error gracefully
      expect(icon).toBeInTheDocument();
    });
  });

  test("displays artifact type correctly", () => {
    renderArtifact({ showDetails: true });

    expect(screen.getByText("Type: scroll")).toBeInTheDocument();
  });

  test("displays artifact location correctly", () => {
    renderArtifact({ showDetails: true });

    expect(screen.getByText("Location: Test Map")).toBeInTheDocument();
  });
});
