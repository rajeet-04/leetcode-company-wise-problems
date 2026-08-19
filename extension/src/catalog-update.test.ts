import { describe, expect, it } from "vitest";
import type { CatalogProblem } from "@leet-progress/types";
import { sha256Hex, validateRemoteCatalog } from "./catalog-update";

const problems: CatalogProblem[] = [{ slug:"two-sum",title:"Two Sum",url:"https://leetcode.com/problems/two-sum/",difficulty:"EASY",topics:["Array"],observations:[{company:"Google",window:"30d",frequency:90,acceptanceRate:50}] }];

describe("remote public catalog validation",()=>{
  it("accepts matching schema and sha256",async()=>{
    const json=JSON.stringify(problems); const checksum=await sha256Hex(json);
    const result=await validateRemoteCatalog({schemaVersion:2,catalogVersion:"v2-test",checksum},json);
    expect(result).toEqual(problems);
  });
  it("rejects checksum mismatch",async()=>{
    await expect(validateRemoteCatalog({schemaVersion:2,catalogVersion:"v2-test",checksum:"deadbeef"},JSON.stringify(problems))).rejects.toThrow(/checksum/i);
  });
  it("rejects wrong schema and malformed catalog",async()=>{
    const json=JSON.stringify(problems); const checksum=await sha256Hex(json);
    await expect(validateRemoteCatalog({schemaVersion:1,catalogVersion:"old",checksum},json)).rejects.toThrow(/schema/i);
    const bad="{}"; await expect(validateRemoteCatalog({schemaVersion:2,catalogVersion:"v2",checksum:await sha256Hex(bad)},bad)).rejects.toThrow(/catalog/i);
  });
});
