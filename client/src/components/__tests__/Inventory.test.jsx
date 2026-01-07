import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Inventory from "../Inventory";

const mockCharacter = {
  id: "test-character",
  username: "testuser",
  level: 5,
  experience: 150,
  inventory: [
    {
      id: "artifact-1",
      name: "Test Artifact 1",
      description: "First test artifact",
      type: "scroll",
      rarity: "common",
    },
    {
      id: "artifact-2",
      name: "Test Artifact 2",
      description: "Second test artifact",
      type: "weapon",
      rarity: "rare",
    },
  ],
};

const mockArtifacts = [
  {
    id: "artifact-1",
    name: "Test Artifact 1",
    description: "First test artifact",
    type: "scroll",
    rarity: "common",
    location: { x: 100, y: 100, mapName: "Test Map" },
  },
  {
    id: "artifact-2",
    name: "Test Artifact 2",
    description: "Second test artifact",
    type: "weapon",
    rarity: "rare",
    location: { x: 200, y: 200, mapName: "Test Map" },
  },
];

const defaultProps = {
  character: mockCharacter,
  inventory: mockCharacter.inventory,
  artifacts: mockArtifacts,
  currentArea: "Test Map",
  onClose: jest.fn(),
  onManageUserArtifact: jest.fn(),
};

const renderInventory = (props = {}) => {
  return render(<Inventory {...defaultProps} {...props} />);
};

describe("Inventory Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders inventory container", () => {
    renderInventory();

    expect(screen.getByTestId("inventory-container")).toBeInTheDocument();
  });

  test("displays character information", () => {
    renderInventory();

    expect(screen.getByText("testuser")).toBeInTheDocument();
    expect(screen.getByText("Level 5")).toBeInTheDocument();
    expect(screen.getByText("150 XP")).toBeInTheDocument();
  });

  test("displays inventory items", () => {
    renderInventory();

    expect(screen.getByText("Test Artifact 1")).toBeInTheDocument();
    expect(screen.getByText("Test Artifact 2")).toBeInTheDocument();
  });

  test("shows empty state when inventory is empty", () => {
    renderInventory({ inventory: [] });

    expect(screen.getByText("Your inventory is empty")).toBeInTheDocument();
  });

  test("handles inventory item click", () => {
    renderInventory();

    const firstItem = screen.getByText("Test Artifact 1");
    fireEvent.click(firstItem);

    // Should show item details or trigger selection
    expect(screen.getByText("First test artifact")).toBeInTheDocument();
  });

  test("displays artifact details when selected", () => {
    renderInventory();

    const firstItem = screen.getByText("Test Artifact 1");
    fireEvent.click(firstItem);

    expect(screen.getByText("Type: scroll")).toBeInTheDocument();
    expect(screen.getByText("Rarity: common")).toBeInTheDocument();
  });

  test("handles close button", () => {
    renderInventory();

    const closeButton = screen.getByTestId("close-inventory");
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test("shows artifact management options", () => {
    renderInventory();

    const firstItem = screen.getByText("Test Artifact 1");
    fireEvent.click(firstItem);

    expect(screen.getByText("Place")).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  test("handles place artifact action", () => {
    renderInventory();

    const firstItem = screen.getByText("Test Artifact 1");
    fireEvent.click(firstItem);

    const placeButton = screen.getByText("Place");
    fireEvent.click(placeButton);

    expect(defaultProps.onManageUserArtifact).toHaveBeenCalledWith(
      mockCharacter.inventory[0],
      "place",
    );
  });

  test("handles update artifact action", () => {
    renderInventory();

    const firstItem = screen.getByText("Test Artifact 1");
    fireEvent.click(firstItem);

    const updateButton = screen.getByText("Update");
    fireEvent.click(updateButton);

    expect(defaultProps.onManageUserArtifact).toHaveBeenCalledWith(
      mockCharacter.inventory[0],
      "update",
    );
  });

  test("handles delete artifact action", () => {
    renderInventory();

    const firstItem = screen.getByText("Test Artifact 1");
    fireEvent.click(firstItem);

    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);

    expect(defaultProps.onManageUserArtifact).toHaveBeenCalledWith(
      mockCharacter.inventory[0],
      "delete",
    );
  });

  test("shows message input for artifacts", () => {
    renderInventory();

    const firstItem = screen.getByText("Test Artifact 1");
    fireEvent.click(firstItem);

    expect(
      screen.getByPlaceholderText("Add a personal note about this artifact..."),
    ).toBeInTheDocument();
  });

  test("handles message saving", async () => {
    renderInventory();

    const firstItem = screen.getByText("Test Artifact 1");
    fireEvent.click(firstItem);

    const messageInput = screen.getByPlaceholderText(
      "Add a personal note about this artifact...",
    );
    fireEvent.change(messageInput, { target: { value: "Test message" } });

    const saveButton = screen.getByText("Save Message");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Message saved!")).toBeInTheDocument();
    });
  });

  test("shows artifact rarity indicators", () => {
    renderInventory();

    const commonItem = screen
      .getByText("Test Artifact 1")
      .closest(".inventory-item");
    const rareItem = screen
      .getByText("Test Artifact 2")
      .closest(".inventory-item");

    expect(commonItem).toHaveClass("common");
    expect(rareItem).toHaveClass("rare");
  });

  test("displays current area information", () => {
    renderInventory();

    expect(screen.getByText("Current Area: Test Map")).toBeInTheDocument();
  });

  test("handles keyboard navigation", () => {
    renderInventory();

    // Test arrow key navigation
    fireEvent.keyDown(document, { key: "ArrowDown" });
    fireEvent.keyDown(document, { key: "ArrowUp" });
    fireEvent.keyDown(document, { key: "Enter" });

    // Should handle navigation without errors
    expect(screen.getByTestId("inventory-container")).toBeInTheDocument();
  });

  test("shows loading state when fetching data", () => {
    renderInventory({ isLoading: true });

    expect(screen.getByText("Loading inventory...")).toBeInTheDocument();
  });

  test("handles error state", () => {
    renderInventory({ error: "Failed to load inventory" });

    expect(
      screen.getByText("Error: Failed to load inventory"),
    ).toBeInTheDocument();
  });

  test("filters artifacts by type", () => {
    renderInventory();

    const filterButton = screen.getByText("Filter by Type");
    fireEvent.click(filterButton);

    const scrollFilter = screen.getByText("Scroll");
    fireEvent.click(scrollFilter);

    // Should only show scroll artifacts
    expect(screen.getByText("Test Artifact 1")).toBeInTheDocument();
    expect(screen.queryByText("Test Artifact 2")).not.toBeInTheDocument();
  });

  test("sorts artifacts by rarity", () => {
    renderInventory();

    const sortButton = screen.getByText("Sort by Rarity");
    fireEvent.click(sortButton);

    // Should sort artifacts by rarity (rare first, then common)
    const items = screen.getAllByTestId(/inventory-item/);
    expect(items[0]).toHaveTextContent("Test Artifact 2"); // rare
    expect(items[1]).toHaveTextContent("Test Artifact 1"); // common
  });
});
