import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import Module from "node:module";
import { createRequire } from "node:module";
import { transformSync } from "@babel/core";
import { JSDOM } from "jsdom";

const require = createRequire(import.meta.url);

const dom = new JSDOM(
  '<!doctype html><html><body><div id="root"></div></body></html>',
  { url: "http://localhost" },
);
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const babelOptions = {
  babelrc: false,
  configFile: false,
  sourceType: "module",
  presets: [
    ["@babel/preset-env", { modules: "commonjs", targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
};

function compileClient(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const { code } = transformSync(source, { ...babelOptions, filename });
  module._compile(code, filename);
}

const originalJs = Module._extensions[".js"];
Module._extensions[".js"] = function compileJs(module, filename) {
  if (filename.includes(`${process.cwd()}/client/src/`)) {
    compileClient(module, filename);
    return;
  }
  originalJs(module, filename);
};
Module._extensions[".jsx"] = compileClient;
Module._extensions[".css"] = function compileCss(module, filename) {
  module._compile("module.exports = {};", filename);
};

const React = require("react");
const { createRoot } = require("react-dom/client");
const { act } = React;
const DungeonModule = require("../../client/src/components/Dungeons/Dungeon.jsx");
const Dungeon = DungeonModule.default;

const dungeonData = {
  id: "library_test",
  rooms: {
    entrance: {
      id: "entrance",
      name: "Entrance Hall",
      width: 4,
      height: 4,
      layout: ["WWWW", "W..W", "W..W", "WWWW"],
      startPosition: { x: 1, y: 1 },
      doors: {
        east: { leadsTo: "overworld_exit", locked: false },
      },
    },
  },
};

function renderDungeon(props) {
  const rootEl = document.createElement("div");
  document.body.appendChild(rootEl);
  const root = createRoot(rootEl);
  act(() => {
    root.render(React.createElement(Dungeon, props));
  });
  return { rootEl, root };
}

test("dungeon entrance renders instead of crashing the game", () => {
  const { rootEl, root } = renderDungeon({
    dungeonData,
    playerPosition: { x: 64, y: 64 },
    playerKeys: 0,
    hasBossKey: false,
  });

  assert.match(rootEl.textContent, /Entrance Hall/);
  act(() => root.unmount());
});

test("standing on an unlocked exit door leaves the dungeon", () => {
  let exits = 0;
  const { root, rootEl } = renderDungeon({
    dungeonData,
    playerPosition: { x: 3 * 64, y: 2 * 64 },
    onExit: () => {
      exits += 1;
    },
    playerKeys: 0,
    hasBossKey: false,
  });

  assert.equal(exits, 1);
  assert.match(rootEl.textContent, /Entrance Hall/);
  act(() => root.unmount());
});
