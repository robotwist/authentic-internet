import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
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

const advanceTerminal = async (ms = 60000) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

describe("Level3Terminal", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("calls onComplete after the scripted exit narrative finishes", async () => {
    const onComplete = jest.fn();
    const onExit = jest.fn();

    render(
      <Level3Terminal
        artifacts={[]}
        character={{}}
        onComplete={onComplete}
        onExit={onExit}
        username="Tester"
      />,
    );

    await advanceTerminal();
    fireEvent.click(
      screen.getByRole("button", { name: /I wanted to express myself/i }),
    );

    await advanceTerminal();
    fireEvent.click(
      screen.getByRole("button", { name: /Something meaningful/i }),
    );

    await advanceTerminal();
    fireEvent.click(screen.getByRole("button", { name: /Exit terminal/i }));

    await advanceTerminal(10000);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onExit).not.toHaveBeenCalled();
  });

  it("keeps the explicit exit control as a non-completion exit", () => {
    const onComplete = jest.fn();
    const onExit = jest.fn();

    render(
      <Level3Terminal
        artifacts={[]}
        character={{}}
        onComplete={onComplete}
        onExit={onExit}
        username="Tester"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /EXIT TERMINAL/i }));

    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
