import { describe, expect, it } from "vitest";
import { classifyCommand } from "../src/main/security/commandPolicy";

describe("classifyCommand", () => {
  it("treats tests as safe", () => {
    expect(classifyCommand("npm test")).toMatchObject({
      risk: "SAFE",
      requiresApproval: false,
    });
  });

  it("requires approval for dependency changes", () => {
    expect(classifyCommand("npm install zod")).toMatchObject({
      risk: "MODIFYING",
      requiresApproval: true,
    });
  });

  it("requires approval for destructive git operations", () => {
    expect(classifyCommand("git reset --hard HEAD~1")).toMatchObject({
      risk: "DESTRUCTIVE",
      requiresApproval: true,
    });
  });

  it("requires approval for remote pushes", () => {
    expect(classifyCommand("git push origin main")).toMatchObject({
      risk: "EXTERNAL",
      requiresApproval: true,
    });
  });
});
