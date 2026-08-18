# Phase 02 CI checkpoint

Verified source commit: 34afae56e00f84ab76c1019842430d80c335a7ad

- PASS: workspace install
- PASS: shared unit tests
- PASS: frontend Next route types
- FAIL(2): frontend typecheck
- FAIL(1): frontend production build
- PASS: frontend search is shared-only

## Failure output
```text
### frontend typecheck
$ tsc --noEmit
../packages/intelligence/src/core.ts(111,69): error TS2769: No overload matches this call.
  Overload 1 of 3, '(callbackfn: (previousValue: 0 | 0.2 | 0.1 | 0.15 | 0.05, currentValue: 0 | 0.2 | 0.1 | 0.15 | 0.05, currentIndex: number, array: (0 | 0.2 | 0.1 | 0.15 | 0.05)[]) => 0 | 0.2 | 0.1 | 0.15 | 0.05, initialValue: 0 | ... 3 more ... | 0.05): 0 | ... 3 more ... | 0.05', gave the following error.
    Type 'number' is not assignable to type '0 | 0.2 | 0.1 | 0.15 | 0.05'.
  Overload 2 of 3, '(callbackfn: (previousValue: 0 | 0.2 | 0.1 | 0.15 | 0.05, currentValue: 0 | 0.2 | 0.1 | 0.15 | 0.05, currentIndex: number, array: (0 | 0.2 | 0.1 | 0.15 | 0.05)[]) => 0 | 0.2 | 0.1 | 0.15 | 0.05, initialValue: 0 | ... 3 more ... | 0.05): 0 | ... 3 more ... | 0.05', gave the following error.
    Type 'number' is not assignable to type '0 | 0.2 | 0.1 | 0.15 | 0.05'.
### frontend production build
$ next build
▲ Next.js 16.3.1 (Turbopack)
✓ Running next.config.ts took 26ms
⚠ No build cache found. Please configure build caching for faster rebuilds. Read more: https://nextjs.org/docs/messages/no-cache
Attention: Next.js now collects completely anonymous telemetry regarding usage.
This information is used to shape Next.js' roadmap and prioritize features.
You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
https://nextjs.org/telemetry

- Cache Components enabled

  Creating an optimized production build ...
✓ Compiled successfully in 5.9s
  Running TypeScript ...
../packages/intelligence/src/core.ts(111,69): error TS2769: No overload matches this call.
  Overload 1 of 3, '(callbackfn: (previousValue: 0 | 0.2 | 0.1 | 0.15 | 0.05, currentValue: 0 | 0.2 | 0.1 | 0.15 | 0.05, currentIndex: number, array: (0 | 0.2 | 0.1 | 0.15 | 0.05)[]) => 0 | 0.2 | 0.1 | 0.15 | 0.05, initialValue: 0 | ... 3 more ... | 0.05): 0 | ... 3 more ... | 0.05', gave the following error.
    Type 'number' is not assignable to type '0 | 0.2 | 0.1 | 0.15 | 0.05'.
  Overload 2 of 3, '(callbackfn: (previousValue: 0 | 0.2 | 0.1 | 0.15 | 0.05, currentValue: 0 | 0.2 | 0.1 | 0.15 | 0.05, currentIndex: number, array: (0 | 0.2 | 0.1 | 0.15 | 0.05)[]) => 0 | 0.2 | 0.1 | 0.15 | 0.05, initialValue: 0 | ... 3 more ... | 0.05): 0 | ... 3 more ... | 0.05', gave the following error.
    Type 'number' is not assignable to type '0 | 0.2 | 0.1 | 0.15 | 0.05'.
Failed to type check.

error: script "build" exited with code 1
```
