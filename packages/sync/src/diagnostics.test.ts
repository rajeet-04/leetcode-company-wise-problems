import { describe, expect, it } from "vitest";
import { deriveSyncDiagnostics } from "./diagnostics";

describe("deriveSyncDiagnostics",()=>{
  it("reports connected after a successful exchange",()=>{
    expect(deriveSyncDiagnostics({lastAttemptAt:"2026-08-19T00:00:00.000Z",lastSuccessAt:"2026-08-19T00:00:01.000Z",lastError:null,pendingMutations:0},"2026-08-19T00:00:02.000Z").state).toBe("connected");
  });
  it("reports error when the latest attempt failed",()=>{
    const result=deriveSyncDiagnostics({lastAttemptAt:"2026-08-19T00:00:02.000Z",lastSuccessAt:"2026-08-19T00:00:01.000Z",lastError:"bridge-timeout",pendingMutations:3},"2026-08-19T00:00:03.000Z");
    expect(result.state).toBe("error");
    expect(result.pendingMutations).toBe(3);
  });
  it("reports unavailable before any successful exchange",()=>{
    expect(deriveSyncDiagnostics({lastAttemptAt:"2026-08-19T00:00:00.000Z",lastSuccessAt:null,lastError:null,pendingMutations:1},"2026-08-19T00:00:10.000Z").state).toBe("unavailable");
  });
});
