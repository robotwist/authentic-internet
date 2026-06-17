import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import CharacterCreator from "../../client/src/pages/CharacterCreator";
import API from "../../client/src/api/api";

const mockNavigate = jest.fn();
const mockUpdateUser = jest.fn();
let mockUser;
let mockEditorProps;

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true },
);

jest.mock("../../client/src/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
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
  return function MockPixelGridEditor(props) {
    mockEditorProps = props;
    return (
      <button type="button" onClick={() => props.onSave({ dataURL: null })}>
        Mock empty save
      </button>
    );
  };
});

describe("CharacterCreator", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
    mockUpdateUser.mockClear();
    API.put.mockReset();
    mockEditorProps = null;
    mockUser = {
      id: "user-1",
      username: "hero",
      characterSprite: "data:image/png;base64,existing",
    };
  });

  test("passes the saved character sprite into the editor", () => {
    render(<CharacterCreator />);

    expect(mockEditorProps.initialSprite).toBe(
      "data:image/png;base64,existing",
    );
  });

  test("does not call the server for an empty sprite save", () => {
    render(<CharacterCreator />);

    fireEvent.click(screen.getByRole("button", { name: /mock empty save/i }));

    expect(API.put).not.toHaveBeenCalled();
    expect(
      screen.getByText(/paint at least a few pixels on your character/i),
    ).toBeInTheDocument();
  });
});
