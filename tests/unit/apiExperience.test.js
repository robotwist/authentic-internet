import { readFileSync } from "fs";
import path from "path";

const apiSource = readFileSync(
  path.join(process.cwd(), "client/src/api/api.js"),
  "utf8",
);

describe("updateUserExperience", () => {
  test("persists experience through the configured API client", () => {
    expect(apiSource).toContain("export const updateUserExperience");
    expect(apiSource).toContain(
      'getApi().put("/api/users/experience",',
    );
  });

  test("guards against the old user-id and stale fetch regressions", () => {
    const helperBody = apiSource.match(
      /export const updateUserExperience = async \(experience\) => \{[\s\S]*?\n\};/,
    );

    expect(helperBody?.[0]).toContain("Experience must be a finite number");
    expect(helperBody?.[0]).not.toContain("authToken");
    expect(helperBody?.[0]).not.toContain("API_URL");
  });
});
