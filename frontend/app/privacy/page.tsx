export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 lg:px-10">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#6878e8]">Privacy</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Your preparation data stays in your browser.</h1>
      <p className="mt-5 max-w-2xl text-sm leading-6 text-black/55">Leet Progress is designed without a cloud user database. The website and extension keep progress, target companies, interview plans, revision state, notes and personal analytics locally in the browser profile.</p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card title="Stored locally" items={["Solved and attempted problems","Target companies","Interview plans and overrides","Revision and confidence state","Notes and personal analytics"]} />
        <Card title="May be fetched remotely" items={["Public company/problem catalog","Catalog version and checksum","Application assets and normal website resources"]} />
        <Card title="Not used for user data" items={["chrome.storage.sync","Supabase or Firebase user persistence","Remote progress/profile APIs","Hidden progress telemetry"]} />
        <Card title="Local website ↔ extension sync" items={["Same browser profile only","Exact Leet Progress origin bridge","Versioned idempotent mutations","No whole-state cloud synchronization"]} />
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Device changes</h2>
        <p className="mt-2 text-sm leading-6 text-black/55">Because personal data is intentionally not cloud-synced, a different browser profile or device does not automatically receive your progress. Portable local backup/import is the supported migration path.</p>
      </section>
    </main>
  );
}

function Card({ title, items }: { title: string; items: string[] }) {
  return <article className="rounded-2xl border border-black/10 bg-white p-5"><h2 className="font-semibold">{title}</h2><ul className="mt-3 space-y-2 text-sm text-black/55">{items.map((item)=><li key={item} className="flex gap-2"><span aria-hidden="true">•</span><span>{item}</span></li>)}</ul></article>;
}
