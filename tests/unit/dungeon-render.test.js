import React from "react";
import { render, screen } from "@testing-library/react";
import Dungeon from "../../client/src/components/Dungeons/Dungeon";

const dungeonData = {
  id: "test_dungeon",
  name: "Test Dungeon",
  rooms: {
    entrance: {
      id: "entrance",
      name: "Entrance Hall",
      width: 3,
      height: 3,
      startPosition: { x: 1, y: 1 },
      layout: ["WWW", "W.W", "WWW"],
      doors: {},
      enemies: [],
    },
  },
};

describe("Dungeon", () => {
  test("renders the entrance room without crashing", () => {
    expect(() => {
      render(
        <Dungeon
          dungeonData={dungeonData}
          playerPosition={{ x: 64, y: 64 }}
          playerKeys={0}
          hasBossKey={false}
        />,
      );
    }).not.toThrow();

    expect(screen.getByText("Entrance Hall")).toBeInTheDocument();
  });
});
