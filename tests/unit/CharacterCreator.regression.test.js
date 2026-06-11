import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CharacterCreator from "../../client/src/pages/CharacterCreator";
import API from "../../client/src/api/api";

const mockUpdateUser = jest.fn();
const mockExistingSprite = "data:image/png;base64,saved-character";

jest.mock("../../client/src/context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      username: "alice",
      characterSprite: mockExistingSprite,
    },
    updateUser: mockUpdateUser,
  }),
}));

jest.mock("../../client/src/api/api", () => ({
  __esModule: true,
  default: {
    put: jest.fn(),
  },
}));

jest.mock("../../client/src/components/UI/PixelGridEditor", () => {
  const emptyGrid = Array(32)
    .fill(null)
    .map(() => Array(32).fill("transparent"));

  return function MockPixelGridEditor(props) {
    return (
      <div
        data-testid="pixel-editor"
        data-initial-sprite={props.initialSprite}
      >
        <button
          type="button"
          onClick={() =>
            props.onSave({
              dataURL: "data:image/png;base64,blank-transparent",
              grid: emptyGrid,
            })
          }
        >
          Save blank sprite
        </button>
      </div>
    );
  };
});

describe("CharacterCreator regression coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads the existing sprite and refuses to overwrite it with a blank grid", () => {
    render(
      <MemoryRouter>
        <CharacterCreator />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("pixel-editor")).toHaveAttribute(
      "data-initial-sprite",
      mockExistingSprite,
    );

    fireEvent.click(screen.getByText("Save blank sprite"));

    expect(API.put).not.toHaveBeenCalled();
    expect(
      screen.getByText("Paint at least a few pixels on your character"),
    ).toBeInTheDocument();
  });
});
