import fs from "fs";
import path from "path";

const readSource = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("server critical regression guards", () => {
  it("keeps /api/worlds routes on the existing WorldInstance model", () => {
    const source = readSource("server/routes/worlds.js");

    expect(source).toContain("import WorldInstance from '../models/World.js'");
    expect(source).toContain("const world = new WorldInstance({");
    expect(source).toContain("worldId: createWorldId()");
    expect(source).not.toMatch(/\bnew World\(/);
    expect(source).not.toMatch(/\bWorld\.find/);
  });

  it("does not create a required-creator database row for the public main world", () => {
    const source = readSource("server/routes/worlds.js");
    const mainRouteStart = source.indexOf("router.get('/main'");
    const nextRouteStart = source.indexOf("// Get user's development worlds", mainRouteStart);
    const mainRouteSource = source.slice(mainRouteStart, nextRouteStart);

    expect(mainRouteSource).toContain("res.json({");
    expect(mainRouteSource).toContain("worldId: MAIN_WORLD_ID");
    expect(mainRouteSource).not.toContain(".save(");
  });

  it("rejects suspended or banned users in legacy token middleware", () => {
    const source = readSource("server/middleware/authMiddleware.js");

    expect(source).toContain('import User from "../models/User.js"');
    expect(source).toContain("await User.findById(decoded.userId)");
    expect(source).toContain('user.accountStatus !== "active"');
    expect(source).toContain("return res.status(403)");
  });
});
