# Phase 00 CI checkpoint

Verified source commit: c499a772aa1a29fd43d878b7b4bd58a7b40013e9

- PASS: frontend frozen install
- PASS: Next route type generation
- PASS: frontend typecheck
- PASS: frontend production build
- PASS: root workspace install
- FAIL(1): shared Vitest suite

  Last output:
      - ESM syntax in a file loaded as CommonJS (vitest.config.ts:1:1). Use a `.mjs` extension or set `"type": "module"` in the closest package.json
    Set `VITE_CONFIG_NATIVE_IGNORE_WARNING=true` to suppress this warning.[39m
    
    [1m[30m[46m RUN [49m[39m[22m [36mv4.1.10 [39m[90m/home/runner/work/leetcode-company-wise-problems/leetcode-company-wise-problems[39m
    
     [31m❯[39m packages/types/src/workspace-smoke.test.ts [2m([22m[2m0 test[22m[2m)[22m
     [32m✓[39m packages/types/src/index.test.ts [2m([22m[2m1 test[22m[2m)[22m[32m 3[2mms[22m[39m
    
    [31m⎯⎯⎯⎯⎯⎯[39m[1m[41m Failed Suites 1 [49m[22m[31m⎯⎯⎯⎯⎯⎯⎯[39m
    
    [41m[1m FAIL [22m[49m packages/types/src/workspace-smoke.test.ts[2m [ packages/types/src/workspace-smoke.test.ts ][22m
    [31m[1mError[22m: Cannot find package '@leet-progress/analytics' imported from /home/runner/work/leetcode-company-wise-problems/leetcode-company-wise-problems/packages/types/src/workspace-smoke.test.ts[39m
    [36m [2m❯[22m packages/types/src/workspace-smoke.test.ts:[2m2:1[22m[39m
        [90m  1|[39m [35mimport[39m { describe[33m,[39m expect[33m,[39m it } [35mfrom[39m [32m"vitest"[39m[33m;[39m
        [90m  2|[39m [35mimport[39m { [33mANALYTICS_PACKAGE_VERSION[39m } [35mfrom[39m [32m"@leet-progress/analytics"[39m[33m;[39m
        [90m   |[39m [31m^[39m
        [90m  3|[39m [35mimport[39m { [33mCATALOG_PACKAGE_VERSION[39m } [35mfrom[39m [32m"@leet-progress/catalog"[39m[33m;[39m
        [90m  4|[39m import { INTELLIGENCE_PACKAGE_VERSION } from "@leet-progress/intellige…
    
    [31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯[22m[39m
    
    
    [2m Test Files [22m [1m[31m1 failed[39m[22m[2m | [22m[1m[32m1 passed[39m[22m[90m (2)[39m
    [2m      Tests [22m [1m[32m1 passed[39m[22m[90m (1)[39m
    [2m   Start at [22m 18:03:19
    [2m   Duration [22m 136ms[2m (transform 35ms, setup 0ms, import 27ms, tests 3ms, environment 0ms)[22m
    
    
    ::error file=/home/runner/work/leetcode-company-wise-problems/leetcode-company-wise-problems/packages/types/src/workspace-smoke.test.ts,title=packages/types/src/workspace-smoke.test.ts,line=2,column=1::Error: Cannot find package '@leet-progress/analytics' imported from /home/runner/work/leetcode-company-wise-problems/leetcode-company-wise-problems/packages/types/src/workspace-smoke.test.ts%0A ❯ packages/types/src/workspace-smoke.test.ts:2:1%0A%0A⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯%0ASerialized Error: { code: 'ERR_MODULE_NOT_FOUND' }%0A
    error: script "test" exited with code 1
