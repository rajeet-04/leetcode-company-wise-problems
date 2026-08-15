"use client";

export function MultiSelect({ label, options, values, onChange }: { label: string; options: string[]; values: string[]; onChange: (values: string[]) => void }) {
  const toggle = (option: string) => onChange(values.includes(option) ? values.filter((value) => value !== option) : [...values, option]);
  return (
    <details className="multi-select relative min-w-[140px]">
      <summary className="flex h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl bg-[#f4f4f2] px-3 text-xs font-medium text-black/65 outline-none focus-visible:ring-2 focus-visible:ring-[#6878e8]">
        <span className="truncate">{values.length ? `${label} · ${values.length}` : label}</span><span aria-hidden="true" className="text-[10px] text-black/35">▾</span>
      </summary>
      <div className="absolute right-0 top-12 z-20 max-h-72 min-w-full overflow-y-auto rounded-2xl border border-black/10 bg-white p-2 shadow-2xl">
        <div className="flex items-center justify-between px-2 py-1.5"><span className="text-[10px] font-semibold uppercase tracking-[.12em] text-black/40">Select any</span>{values.length > 0 && <button onClick={() => onChange([])} className="text-[11px] font-semibold text-[#6878e8]">Clear</button>}</div>
        {options.map((option) => <label key={option} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs text-black/70 hover:bg-black/[.035]"><input type="checkbox" checked={values.includes(option)} onChange={() => toggle(option)} className="size-3.5 accent-[#6878e8]"/><span className="whitespace-nowrap">{option}</span></label>)}
      </div>
    </details>
  );
}
