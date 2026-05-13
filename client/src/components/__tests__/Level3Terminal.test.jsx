import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Level3Terminal from "../Level3Terminal";

jest.mock("../utils/SoundManager", () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      isMuted: true,
      userInteracted: false,
      playSound: jest.fn(),
    })),
  },
}));

const renderTerminal = async (props = {}) => {
  const result = render(
    <Level3Terminal
      artifacts={[]}
      character={{}}
      username="Tester"
      {...props}
    />,
  );

  await act(async () => {});

  return result;
};

describe("Level3Terminal", () => {
  beforeEach(() => {
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("calls onComplete after the scripted exit narrative finishes", async () => {
    const onComplete = jest.fn();
    const onExit = jest.fn();

    await renderTerminal({ initialNarrative: "exit", onComplete, onExit });

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1), {
      timeout: 5000,
    });
    expect(onExit).not.toHaveBeenCalled();
  });

  it("keeps the explicit exit control as a non-completion exit", async () => {
    const onComplete = jest.fn();
    const onExit = jest.fn();

    await renderTerminal({ onComplete, onExit });

    fireEvent.click(screen.getByRole("button", { name: /EXIT TERMINAL/i }));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
