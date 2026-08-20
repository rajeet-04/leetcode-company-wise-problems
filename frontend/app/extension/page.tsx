import type { Metadata } from "next";
import Image from "next/image";

const REPO = "https://github.com/rajeet-04/leetcode-company-wise-problems";
const GITHUB_GUIDE = `${REPO}/blob/main/docs/EXTENSION_INSTALL.md`;
const CHROMIUM_ZIP = `${REPO}/releases/latest/download/leet-progress-chromium.zip`;
const FIREFOX_ZIP = `${REPO}/releases/latest/download/leet-progress-firefox.zip`;

export const metadata: Metadata = {
  title: "Install Leet Progress Extension",
  description:
    "Install the local-first Leet Progress browser extension from GitHub and sync your solved LeetCode history.",
};

const steps = [
  {
    n: "1",
    title: "Download the extension from GitHub",
    body: "Download the latest Chromium ZIP from the GitHub Release and extract it to a permanent folder. Do not load the ZIP itself.",
  },
  {
    n: "2",
    title: "Open the browser extensions page",
    body: "In Microsoft Edge open edge://extensions. In Chrome use chrome://extensions. Turn Developer mode on, then choose Load unpacked.",
  },
  {
    n: "3",
    title: "Select the extracted folder",
    body: "Choose the folder that directly contains manifest.json and service-worker.js. Leet Progress should appear in the extensions list with an active service worker.",
  },
  {
    n: "4",
    title: "Sync your LeetCode progress",
    body: "Open LeetCode while signed in, then visit leetcode.com/progress/. The extension reconciles your solved history automatically and keeps the data in this browser profile.",
  },
] as const;

export default function ExtensionSetupPage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#6878e8]">
            Browser extension
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
            Install Leet Progress from GitHub.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-black/55 sm:text-base">
            Until the extension is published in a browser store, install the
            packaged release build as an unpacked developer extension. The
            downloadable package and the canonical setup instructions live on
            GitHub.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={CHROMIUM_ZIP}
              className="rounded-full bg-[#171717] px-5 py-3 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#6878e8]"
            >
              Download Chromium ZIP
            </a>
            <a
              href={GITHUB_GUIDE}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-black/10 bg-white px-5 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6878e8]"
            >
              Open GitHub install guide ↗
            </a>
            <a
              href={`${REPO}/releases/latest`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-4 py-3 text-xs font-semibold text-black/55 hover:text-black focus:outline-none focus:ring-2 focus:ring-[#6878e8]"
            >
              Latest release ↗
            </a>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <article
              key={step.n}
              className="rounded-[24px] border border-black/10 bg-white p-5 sm:p-6"
            >
              <div className="grid size-8 place-items-center rounded-full bg-[#6878e8] text-xs font-bold text-white">
                {step.n}
              </div>
              <h2 className="mt-4 text-lg font-semibold tracking-tight">
                {step.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-black/55">
                {step.body}
              </p>
            </article>
          ))}
        </div>

        <section className="mt-10 rounded-[28px] border border-black/10 bg-white p-4 sm:p-6">
          <div className="mb-5 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#6878e8]">
              Visual guide · Edge
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Developer mode → Load unpacked
            </h2>
            <p className="mt-2 text-sm leading-6 text-black/55">
              The screenshots below show the exact controls in Microsoft Edge.
              Chrome uses the same unpacked-extension flow on
              chrome://extensions.
            </p>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <figure className="overflow-hidden rounded-2xl border border-black/10 bg-black/[.02]">
              <Image
                src="/edge-developer-mode.jpg"
                alt="Microsoft Edge extensions page with Developer mode enabled and Load unpacked visible"
                width={1000}
                height={625}
                className="h-auto w-full"
                priority
              />
              <figcaption className="border-t border-black/10 px-4 py-3 text-xs text-black/50">
                1. Enable Developer mode and click{" "}
                <strong className="text-black/70">Load unpacked</strong>.
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-black/10 bg-black/[.02]">
              <Image
                src="/edge-extension-loaded.jpg"
                alt="Leet Progress loaded successfully in Microsoft Edge extensions with a service worker"
                width={1000}
                height={625}
                className="h-auto w-full"
              />
              <figcaption className="border-t border-black/10 px-4 py-3 text-xs text-black/50">
                2. A successful install shows{" "}
                <strong className="text-black/70">Leet Progress</strong> with a
                service worker inspect link.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
          <article className="rounded-[24px] border border-black/10 bg-white p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#6878e8]">
              After installation
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              Open LeetCode Progress once.
            </h2>
            <p className="mt-2 text-sm leading-6 text-black/55">
              Visit{" "}
              <strong className="text-black/70">leetcode.com/progress/</strong>{" "}
              while signed in. The extension automatically reads the
              solved-problem set using your existing LeetCode session and merges
              it into local extension state. The website then syncs with that
              local extension replica.
            </p>
            <a
              href="https://leetcode.com/progress/"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex rounded-full bg-[#171717] px-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#6878e8]"
            >
              Open LeetCode Progress ↗
            </a>
          </article>
          <article className="rounded-[24px] border border-black/10 bg-white p-5 sm:p-6">
            <p className="text-sm font-semibold">Firefox</p>
            <p className="mt-2 text-xs leading-5 text-black/50">
              A Firefox package is published beside the Chromium package.
              Firefox uses its temporary/debug add-on flow and its sidebar
              behavior differs from Chromium.
            </p>
            <a
              href={FIREFOX_ZIP}
              className="mt-4 inline-flex rounded-full border border-black/10 px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6878e8]"
            >
              Download Firefox ZIP
            </a>
          </article>
        </section>

        <p className="mt-6 text-xs leading-5 text-black/45">
          Unpacked extensions are developer-mode installs. Keep the extracted
          folder in place; deleting or moving it can break the installed
          extension. User progress remains browser-local.
        </p>
      </section>
    </main>
  );
}
