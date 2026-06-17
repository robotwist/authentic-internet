import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PixelGridEditor, {
  hasPaintedPixels,
} from "../../client/src/components/UI/PixelGridEditor";

const createGrid = (painted = false) =>
  Array(32)
    .fill(null)
    .map((_, y) =>
      Array(32)
        .fill("transparent")
        .map((color, x) => (painted && x === 0 && y === 0 ? "#000000" : color)),
    );

describe("PixelGridEditor", () => {
  let getContextSpy;
  let toDataURLSpy;
  let mockContext;

  beforeEach(() => {
    mockContext = {
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      stroke: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      drawImage: jest.fn(),
      getImageData: jest.fn(),
      imageSmoothingEnabled: false,
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
    };

    getContextSpy = jest
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(mockContext);
    toDataURLSpy = jest
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockReturnValue("data:image/png;base64,painted");
  });

  afterEach(() => {
    getContextSpy.mockRestore();
    toDataURLSpy.mockRestore();
  });

  test("detects whether a grid contains visible pixels", () => {
    expect(hasPaintedPixels(createGrid(false))).toBe(false);
    expect(hasPaintedPixels(createGrid(true))).toBe(true);
  });

  test("rejects saving a fully transparent sprite", () => {
    const onSave = jest.fn();

    render(
      <PixelGridEditor onSave={onSave} compact initialSprite={createGrid(false)} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /save & play/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        dataURL: null,
        isEmpty: true,
      }),
    );
    expect(toDataURLSpy).not.toHaveBeenCalled();
  });

  test("exports a non-empty existing grid", () => {
    const onSave = jest.fn();

    render(
      <PixelGridEditor onSave={onSave} compact initialSprite={createGrid(true)} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /save & play/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        dataURL: "data:image/png;base64,painted",
      }),
    );
    expect(toDataURLSpy).toHaveBeenCalledWith("image/png");
  });
});
