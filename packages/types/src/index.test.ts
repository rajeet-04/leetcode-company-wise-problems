import { describe, expect, it } from "vitest";
import { DOMAIN_SCHEMA_VERSION } from "./index";

describe("domain package", () => {
  it("exposes the current schema version", () => {
    expect(DOMAIN_SCHEMA_VERSION).toBe(1);
  });
});
