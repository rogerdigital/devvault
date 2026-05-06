import { describe, expect, it } from "vitest";

import { createProgram } from "../../src/cli/program.js";

describe("createProgram", () => {
  it("creates the DevVault CLI program", () => {
    const program = createProgram();

    expect(program.name()).toBe("devvault");
    expect(program.commands.map((command) => command.name())).toContain("status");
  });
});
