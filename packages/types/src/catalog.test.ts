import { describe, expect, it } from "vitest";
import { CATALOG_SCHEMA_VERSION, type CompanyObservation } from "./catalog";

describe("catalog v2 domain model", () => {
  it("uses schema version 2", () => {
    expect(CATALOG_SCHEMA_VERSION).toBe(2);
  });

  it("represents a complete source observation", () => {
    const observation: CompanyObservation = {
      company: "Google",
      window: "30d",
      frequency: 100,
      acceptanceRate: 0.52,
    };

    expect(observation).toEqual({
      company: "Google",
      window: "30d",
      frequency: 100,
      acceptanceRate: 0.52,
    });
  });
});
