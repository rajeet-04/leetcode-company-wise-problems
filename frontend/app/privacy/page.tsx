const ISSUE_URL = "https://github.com/rajeet-04/leetcode-company-wise-problems/issues";

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 lg:px-10">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#6878e8]">Privacy policy</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Your preparation data stays in your browser.</h1>
      <p className="mt-5 max-w-3xl text-sm leading-7 text-black/55">
        Leet Progress is a local-first LeetCode interview-preparation companion. It does not use a cloud user database. Personal preparation data is processed and stored in your browser profile so the website and extension can show progress, recommendations, plans, revision state and readiness.
      </p>
      <p className="mt-3 text-xs font-medium text-black/40">Last updated: August 20, 2026</p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card
          title="LeetCode data handled locally"
          items={[
            "The current LeetCode problem URL/slug so Leet Progress can show matching company intelligence.",
            "Your solved-problem history when you use automatic history reconciliation on LeetCode Progress.",
            "A submission result such as Accepted, Wrong Answer, Time Limit Exceeded or Runtime Error so local progress can update automatically.",
            "A submission identifier, timestamp, runtime or memory value when LeetCode includes it, used only to deduplicate the same observed submission locally.",
          ]}
        />
        <Card
          title="Preparation data stored locally"
          items={[
            "Solved and attempted problems, attempts and timestamps.",
            "Target companies, interview plans and manual plan overrides.",
            "Revision dates, confidence, revisit state and local notes/preferences.",
            "Personal readiness and analytics derived from your local progress.",
          ]}
        />
        <Card
          title="What is fetched remotely"
          items={[
            "The public company/problem catalog from leet.rajeet.in.",
            "Catalog version and checksum metadata used to detect safe public-data updates.",
            "Normal website resources when you visit leet.rajeet.in.",
            "No personal progress is included in the public catalog requests.",
          ]}
        />
        <Card
          title="Local website ↔ extension sync"
          items={[
            "Sync is limited to the exact Leet Progress website origin in the same browser profile.",
            "The website and extension exchange versioned local mutations through the extension bridge.",
            "There is no Leet Progress cloud synchronization backend and chrome.storage.sync is not used.",
            "Portable backup/import is the user-controlled migration path between profiles or devices.",
          ]}
        />
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-semibold">LeetCode authentication</h2>
        <div className="mt-3 space-y-3 text-sm leading-7 text-black/55">
          <p>
            For solved-history reconciliation, Leet Progress asks LeetCode for your own progress using your existing LeetCode session in the page you already opened. We do not collect your LeetCode password, copy authentication cookies, or send your LeetCode credentials to Leet Progress servers.
          </p>
          <p>
            The solved-history request is sent to LeetCode itself. The resulting solved problem slugs are reduced to the local progress state needed for Leet Progress and remain in browser-local storage.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Sale, advertising and sharing</h2>
        <div className="mt-3 space-y-3 text-sm leading-7 text-black/55">
          <p>Personal preparation data is not sold. It is not shared with advertisers or rented to data brokers.</p>
          <p>Leet Progress does not use personal progress for personalized advertising and does not upload hidden progress telemetry or remote user profiles.</p>
          <p>LeetCode remains a separate third-party service. Requests needed to read your own progress or observe your own submission result stay within your existing LeetCode browsing session.</p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Retention and deletion</h2>
        <div className="mt-3 space-y-3 text-sm leading-7 text-black/55">
          <p>
            Local preparation data is kept until you remove it. You can delete extension data by clearing Leet Progress extension storage or uninstalling the extension. Website-local data can be deleted by clearing site data for leet.rajeet.in in your browser.
          </p>
          <p>
            Uninstalling the extension removes its extension-local storage, but a separately stored website replica may remain until you clear the website&apos;s site data. Backups you export are files you control and must be deleted separately if you no longer want them.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Security and public catalog updates</h2>
        <p className="mt-3 text-sm leading-7 text-black/55">
          The extension periodically checks leet.rajeet.in for public catalog metadata and downloads a new public JSON catalog only when its version/checksum changes. Downloaded catalog data is validated before it replaces the last known good local snapshot. Catalog data is never evaluated as executable code.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Questions or privacy requests</h2>
        <p className="mt-3 text-sm leading-7 text-black/55">
          For privacy questions, data-handling concerns or deletion help, open a support issue in the project repository. Do not include passwords, cookies or other authentication secrets in an issue.
        </p>
        <a
          href={ISSUE_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-full border border-black/10 px-4 py-2.5 text-xs font-semibold hover:border-black/20 focus:outline-none focus:ring-2 focus:ring-[#6878e8]"
        >
          GitHub support issues ↗
        </a>
      </section>
    </main>
  );
}

function Card({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-2xl border border-black/10 bg-white p-5">
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-black/55">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
