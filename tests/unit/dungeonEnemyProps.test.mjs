import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import Module from "node:module";
import { createRequire } from "node:module";
import { transformSync } from "@babel/core";
import { JSDOM } from "jsdom";

const require = createRequire(import.meta.url);

const dom = new JSDOM(
  "<!doctype html><html><body><div id=\"root\"></div></body></html>",
  { url: "http://localhost" },
);
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};

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
const Enemy = require("../../client/src/components/Combat/Enemy.jsx").default;
const { propsForDungeonEnemy } = DungeonModule;

const entranceKeese = {
  id: "entrance_enemy_0",
  type: "keese_dungeon",
  position: { x: 3, y: 3 },
  health: 1,
};

function renderEnemy(props) {
  const rootEl = document.createElement("div");
  document.body.appendChild(rootEl);
  const root = createRoot(rootEl);
  act(() => {
    root.render(React.createElement(Enemy, props));
  });
  return { rootEl, root };
}

test("dungeon enemy props use pixel position and health", () => {
  assert.deepEqual(propsForDungeonEnemy(entranceKeese), {
    type: "keese_dungeon",
    position: { x: 192, y: 192 },
    health: 1,
  });

  const source = fs.readFileSync(
    new URL("../../client/src/components/Dungeons/Dungeon.jsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /propsForDungeonEnemy\(enemy\)/);
  assert.doesNotMatch(source, /initialPosition=\{enemy\.position\}/);
});

test("Enemy throws when only initialPosition is passed", () => {
  assert.throws(
    () =>
      renderEnemy({
        type: "keese_dungeon",
        initialPosition: entranceKeese.position,
        initialHealth: entranceKeese.health,
        playerPosition: { x: 448, y: 320 },
      }),
    /Cannot read properties of undefined \(reading 'x'\)/,
  );
});

test("Enemy renders at the dungeon tile when given mapped props", () => {
  const { rootEl, root } = renderEnemy({
    ...propsForDungeonEnemy(entranceKeese),
    playerPosition: { x: 448, y: 320 },
  });

  const enemy = rootEl.querySelector(".enemy");
  assert.ok(enemy, "enemy element should mount");
  assert.equal(enemy.style.left, "192px");
  assert.equal(enemy.style.top, "192px");
  assert.equal(enemy.getAttribute("data-health"), "1");
  act(() => root.unmount());
});
