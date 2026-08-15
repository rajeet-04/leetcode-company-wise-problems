# Leet Progress — Client-Side LeetCode Progress Import

## Goal

Build `leet-progress.vercel.app` as a **fully client-side (CSR) application** that can import a logged-in user's LeetCode solved-problem list **without sending the user's LeetCode session/cookies or progress data to our backend**.

Target use case:

> User is already logged into LeetCode in the browser. They want to import all problems that LeetCode marks as solved into Leet Progress.

For the currently inspected account, LeetCode's own progress GraphQL request reported `totalNum: 41`, with 37 entries having `questionStatus: "SOLVED"` and the remaining entries being attempted.

---

## Important Browser Security Finding

A normal page hosted at:

`https://leet-progress.vercel.app`

cannot directly read authenticated data from:

`https://leetcode.com`

because the two origins are different.

This does **not** work reliably from ordinary page JavaScript:

```js
fetch("https://leetcode.com/graphql/", {
  method: "POST",
  credentials: "include",
  ...
});
```

The browser applies cross-origin/CORS rules. The Vercel page cannot access LeetCode's authenticated response unless LeetCode explicitly permits that origin.

Likewise, a Vercel server/backend does not automatically inherit the user's browser LeetCode cookies.

Therefore:

```text
Pure Vercel CSR
    ↓
LeetCode authenticated GraphQL
```

is not the correct architecture.

---

# Key Finding: Execute the Request in LeetCode's Context

The useful property is that the exact GraphQL call is already made by LeetCode's own `/progress/` page.

If code executes **while the user is on `leetcode.com`**, the request to:

```text
https://leetcode.com/graphql/
```

is same-origin.

That allows the browser to attach the existing LeetCode authentication context without extracting or transmitting the session cookie.

The promising client-only approaches are:

1. **Bookmarklet** — lowest distribution friction; preferred first prototype.
2. **Userscript** — good alternative if bookmarklet restrictions/UX become problematic.
3. **Browser extension** — strongest/cleanest technical bridge, but distribution is more work.
4. Backend proxy — technically easy but violates the desired privacy model.

---

# Verified LeetCode GraphQL Request

Captured from:

`https://leetcode.com/progress/`

Request:

```text
POST https://leetcode.com/graphql/
```

Header:

```text
x-operation-name: userProgressQuestionList
```

Payload:

```json
{
  "query": "\n    query userProgressQuestionList($filters: UserProgressQuestionListInput) {\n  userProgressQuestionList(filters: $filters) {\n    totalNum\n    questions {\n      translatedTitle\n      frontendId\n      title\n      titleSlug\n      difficulty\n      lastSubmittedAt\n      numSubmitted\n      questionStatus\n      lastResult\n      topicTags {\n        name\n        nameTranslated\n        slug\n      }\n    }\n  }\n}\n    ",
  "variables": {
    "filters": {
      "skip": 0,
      "limit": 50
    }
  },
  "operationName": "userProgressQuestionList"
}
```

The current query can be minimized because the application only needs solved-problem identity.

Recommended minimal fields:

```graphql
query userProgressQuestionList($filters: UserProgressQuestionListInput) {
  userProgressQuestionList(filters: $filters) {
    totalNum
    questions {
      frontendId
      title
      titleSlug
      questionStatus
      lastResult
    }
  }
}
```

Recommended request from LeetCode context:

```js
const response = await fetch("/graphql/", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    "x-operation-name": "userProgressQuestionList"
  },
  body: JSON.stringify({
    operationName: "userProgressQuestionList",
    variables: {
      filters: {
        skip: 0,
        limit: 50
      }
    },
    query
  })
});

const payload = await response.json();
```

Do **not** copy or hard-code the user's `LEETCODE_SESSION`, CSRF token, Authorization value, or any other captured credential.

The user's actual session cookie was exposed in the original investigation and should be considered compromised; invalidate that session and sign in again.

---

# Response Semantics Verified

The response contains:

```json
{
  "data": {
    "userProgressQuestionList": {
      "totalNum": 41,
      "questions": [
        {
          "frontendId": "560",
          "title": "Subarray Sum Equals K",
          "titleSlug": "subarray-sum-equals-k",
          "questionStatus": "SOLVED",
          "lastResult": "AC"
        }
      ]
    }
  }
}
```

Relevant fields:

- `totalNum` — total number of progress entries returned by this endpoint.
- `frontendId` — LeetCode problem number.
- `title` — problem title.
- `titleSlug` — canonical slug.
- `questionStatus` — use this to determine whether the user has solved it.
- `lastResult` — normally `AC` for the solved entries observed.

For import purposes, use:

```js
questionStatus === "SOLVED"
```

as the primary solved criterion.

Do not infer solved status solely from `lastResult`.

---

# Pagination Requirement

The captured request uses:

```json
{
  "skip": 0,
  "limit": 50
}
```

That currently covers all 41 progress entries.

However, the implementation must not assume that users have <= 50 entries.

Correct algorithm:

```text
1. Request skip=0, limit=50.
2. Read totalNum.
3. Request subsequent pages:
   skip=50, 100, 150, ...
4. Stop after all totalNum entries are collected.
5. Filter questionStatus === "SOLVED".
6. Deduplicate by frontendId or titleSlug.
```

Pseudocode:

```js
async function fetchAllProgress() {
  const limit = 50;
  let skip = 0;
  let totalNum = Infinity;
  const questions = [];

  while (skip < totalNum) {
    const page = await fetchProgressPage(skip, limit);

    totalNum = page.totalNum;
    questions.push(...page.questions);

    skip += limit;

    if (page.questions.length === 0) break;
  }

  return questions;
}
```

---

# Privacy Architecture

Desired architecture:

```text
                    USER DEVICE
┌─────────────────────────────────────────────────────┐
│                                                     │
│  LeetCode tab                                       │
│      │                                              │
│      │ authenticated same-origin GraphQL request    │
│      ▼                                              │
│  /graphql/                                          │
│      │                                              │
│      ▼                                              │
│  solved problem data                                │
│      │                                              │
│      ▼                                              │
│  local bridge (bookmarklet/userscript/extension)    │
│      │                                              │
│      │ derived data only                            │
│      ▼                                              │
│  leet-progress.vercel.app                           │
│      │                                              │
│      ▼                                              │
│  React state / IndexedDB                             │
│                                                     │
└─────────────────────────────────────────────────────┘

Vercel server:
- serves static application
- MUST NOT receive LeetCode session cookies
- MUST NOT proxy authenticated LeetCode requests
- MUST NOT store imported progress by default
```

The ideal data flow is:

```text
LeetCode session
      ↓
LeetCode itself / browser context
      ↓
GraphQL response
      ↓
filter to solved problems
      ↓
send only derived problem data to the app
      ↓
local storage / IndexedDB
```

Never:

```text
LeetCode session
      ↓
Vercel server
```

---

# Cross-Window Communication

A practical no-extension prototype can use a user-triggered bookmarklet/script running on LeetCode.

Conceptual flow:

```text
leet-progress.vercel.app
        │
        │ open/focus
        ▼
leetcode.com/progress/
        │
        │ user explicitly runs connector
        ▼
same-origin GraphQL request
        │
        ▼
solved problems
        │
        │ window.opener.postMessage(...)
        ▼
leet-progress.vercel.app
```

The receiver must validate the origin and message shape.

Conceptual receiver:

```js
window.addEventListener("message", (event) => {
  if (!isExpectedOrigin(event.origin)) return;
  if (event.data?.type !== "LEETCODE_PROGRESS") return;

  const problems = event.data.problems;

  // Validate schema before using/storing.
  // Save locally only.
});
```

Do not use a wildcard target origin such as:

```js
postMessage(data, "*")
```

when sending sensitive or user-specific data.

Use the exact expected origin where possible.

---

# Bookmarklet / Same-Origin Principle

The important security property is not that the Vercel site gains LeetCode privileges.

It does not.

Instead:

```text
Vercel app
  ──cannot──> authenticated LeetCode response

LeetCode page code
  ──can──> /graphql/ because it is executing on leetcode.com
```

The bookmarklet therefore acts as a tiny user-triggered bridge.

The user action is necessary because a normal website cannot arbitrarily inject JavaScript into another origin.

---

# Possible Bookmarklet Prototype

A proof-of-concept connector can be generated as a bookmarklet or as a small userscript.

Basic logic:

```js
(async () => {
  const query = `
    query userProgressQuestionList($filters: UserProgressQuestionListInput) {
      userProgressQuestionList(filters: $filters) {
        totalNum
        questions {
          frontendId
          title
          titleSlug
          questionStatus
          lastResult
        }
      }
    }
  `;

  const limit = 50;
  let skip = 0;
  let totalNum = Infinity;
  const all = [];

  while (skip < totalNum) {
    const res = await fetch("/graphql/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-operation-name": "userProgressQuestionList"
      },
      body: JSON.stringify({
        operationName: "userProgressQuestionList",
        variables: {
          filters: { skip, limit }
        },
        query
      })
    });

    if (!res.ok) {
      throw new Error(`LeetCode GraphQL HTTP ${res.status}`);
    }

    const json = await res.json();

    if (json.errors) {
      throw new Error("LeetCode GraphQL returned errors");
    }

    const result = json?.data?.userProgressQuestionList;

    if (!result) {
      throw new Error("Unexpected LeetCode response");
    }

    totalNum = result.totalNum;
    all.push(...result.questions);

    if (result.questions.length === 0) break;

    skip += limit;
  }

  const solved = all
    .filter(q => q.questionStatus === "SOLVED")
    .map(q => ({
      id: q.frontendId,
      title: q.title,
      slug: q.titleSlug
    }));

  // Send only the derived solved list back to the original app window.
  if (window.opener) {
    window.opener.postMessage(
      {
        type: "LEETCODE_PROGRESS",
        version: 1,
        problems: solved
      },
      "https://leet-progress.vercel.app"
    );
  }
})();
```

This is **proof-of-concept logic**, not production-ready bookmarklet code yet.

---

# Recommended UX

Do not make users understand cookies, GraphQL, extensions, or origins.

Desired UX:

```text
[ Import from LeetCode ]

Step 1
Open LeetCode and log in.

Step 2
Open the import helper / bookmarklet.

Step 3
Click "Import".

Done.
```

Possible result:

```text
Imported 37 solved problems
```

Everything else remains client-side.

---

# Security Requirements

## Never collect

- `LEETCODE_SESSION`
- passwords
- Authorization bearer/session values
- CSRF cookies as application data
- LeetCode submission source code unless explicitly required

## Never send to backend

- authenticated cookies
- raw GraphQL response if it contains unnecessary account information
- user submission history unless the product explicitly requires server-side storage

## Only return the minimum necessary data

For the current feature:

```json
{
  "id": "560",
  "title": "Subarray Sum Equals K",
  "slug": "subarray-sum-equals-k"
}
```

If the app only needs IDs/slugs, send only IDs/slugs.

## Validate cross-window messages

Validate:

- `event.origin`
- `event.data.type`
- schema/version
- problem count/shape
- allowed string lengths/types

---

# Alternative: Userscript

If bookmarklet UX proves unreliable, a userscript is the next candidate.

Example:

```text
Tampermonkey / Violentmonkey
        ↓
runs on:
https://leetcode.com/progress/*
        ↓
GraphQL
        ↓
derived solved list
        ↓
message/redirect to Vercel app
```

Advantages:

- tiny script
- no extension store
- no Chrome extension review
- still client-side
- runs directly in the LeetCode origin

Disadvantage:

- user must install a userscript manager
- browser userscript UX varies by browser/manager

---

# Alternative: Browser Extension

If the project grows and you want the most reliable bridge:

```text
Vercel CSR
   ↕
MV3 extension
   ↕
LeetCode
```

The extension can make authenticated requests with the relevant host permissions.

But distribution is a product/UX concern:

- Load Unpacked is annoying for normal users.
- An unlisted Chrome Web Store extension is easier to install.
- Publishing still requires review and privacy/permission disclosures.
- The extension should perform the authenticated request locally rather than export session cookies.

Therefore the extension should be considered a **later reliability/distribution option**, not the first prototype.

---

# What Is NOT Feasible

## Pure client-side Vercel fetch

```js
fetch("https://leetcode.com/graphql/", {
  credentials: "include"
})
```

from `leet-progress.vercel.app` cannot be assumed to work.

## iframe scraping

```html
<iframe src="https://leetcode.com/progress/"></iframe>
```

does not give the Vercel page access to the iframe's DOM/data because it is cross-origin.

## Vercel server inheriting browser cookies

It does not.

## Automatic installation of an unpublished `.crx`

A website cannot silently install an unpacked/private extension for ordinary Chrome users.

---

# Current Verified Account State

From the supplied GraphQL response:

```text
Progress entries: 41
Solved: 37
Attempted: 4
```

The response was generated by the LeetCode `userProgressQuestionList` operation with:

```text
skip: 0
limit: 50
```

The implementation should still support pagination for future users.

---

# Recommended Implementation Plan

## Phase 1 — Verify connector

Build a small bookmarklet/userscript that:

1. Runs on `leetcode.com`.
2. Calls `/graphql/`.
3. Uses the `userProgressQuestionList` operation.
4. Paginates until `totalNum` is reached.
5. Filters `questionStatus === "SOLVED"`.
6. Produces a minimal JSON list.
7. Sends the list to the originating `leet-progress.vercel.app` tab.

## Phase 2 — Build handshake

Vercel app:

1. Generate a random one-time nonce.
2. Open LeetCode with the nonce encoded in a URL parameter or temporary state.
3. Listen for `postMessage`.
4. Verify origin.
5. Verify nonce.
6. Validate payload.
7. Store locally.

This prevents unrelated pages/windows from injecting arbitrary progress payloads.

## Phase 3 — Local storage

Use IndexedDB for persisted progress.

Suggested logical object:

```ts
type SolvedProblem = {
  id: string;
  title: string;
  slug: string;
};
```

Optional metadata can be stored locally if future features require it.

## Phase 4 — UX experiment

First test:

```text
Open LeetCode → run connector → import
```

before investing in an extension.

If the bookmarklet experience is acceptable, stop there.

If not, upgrade the connector to a userscript.

If reliability/UX demands it, implement the MV3 extension.

---

# Important Caveat

The `userProgressQuestionList` GraphQL query is an **internal LeetCode web operation**, not a stable, documented public API contract.

LeetCode can change:

- operation name
- query schema
- field names
- required headers
- authorization behavior
- endpoint behavior
- anti-bot protections
- progress data representation

Therefore the connector should be isolated in one module and fail gracefully when the GraphQL response changes.

Do not couple the rest of the app directly to LeetCode's internal API format.

---

# Codex Task

Implement a prototype for `leet-progress.vercel.app` with these constraints:

1. Keep the main app 100% CSR.
2. Do not create a backend proxy for LeetCode.
3. Do not collect or transmit LeetCode session cookies.
4. Prototype a user-triggered LeetCode-side connector using a bookmarklet or userscript.
5. Execute `userProgressQuestionList` from `leetcode.com`.
6. Paginate using `skip` and `limit`.
7. Filter `questionStatus === "SOLVED"`.
8. Return only minimal solved-problem metadata.
9. Transfer data back to the Vercel app using a secure, nonce-based `postMessage` handshake.
10. Persist imported progress locally using IndexedDB.
11. Clearly handle:
   - not logged in
   - GraphQL errors
   - network failures
   - missing opener window
   - changed LeetCode response schema
   - malformed cross-window messages
12. Keep the LeetCode connector isolated behind a small adapter/module so it can later be replaced by a userscript or MV3 extension without rewriting the app.
13. Do not hard-code credentials or any session-related values.
14. Make the import flow easy for a normal user to understand.

The first implementation should prioritize a working browser prototype over visual polish.
