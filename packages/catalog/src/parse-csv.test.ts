import { describe, expect, it } from "vitest";
import { parseCsv } from "./parse-csv";

describe("parseCsv", () => {
  it("preserves commas inside quoted fields", () => {
    const rows = parseCsv('Title,Topics\nTwo Sum,"Array, Hash Table"\n');
    expect(rows).toEqual([{ Title: "Two Sum", Topics: "Array, Hash Table" }]);
  });

  it("unescapes doubled quotes", () => {
    const rows = parseCsv('Title,Topics\n"Say ""Hello""","Array"\n');
    expect(rows[0]?.Title).toBe('Say "Hello"');
  });

  it("supports CRLF, LF, blank rows, and a missing trailing newline", () => {
    const rows = parseCsv("A,B\r\n1,2\r\n\r\n3,4\n5,6");
    expect(rows).toEqual([
      { A: "1", B: "2" },
      { A: "3", B: "4" },
      { A: "5", B: "6" },
    ]);
  });

  it("trims headers and values", () => {
    expect(parseCsv(" A , B \n x , y ")).toEqual([{ A: "x", B: "y" }]);
  });
});
