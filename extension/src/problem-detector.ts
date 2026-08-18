export function extractProblemSlug(pathname: string): string | null {
  const match = pathname.match(/^\/problems\/([^/?#]+)\/?/i);
  return match?.[1]?.toLowerCase() ?? null;
}

export function createLocationWatcher(onSlug: (slug: string | null) => void, intervalMs = 500) {
  let lastHref = "";
  const check = () => {
    if (location.href === lastHref) return;
    lastHref = location.href;
    onSlug(extractProblemSlug(location.pathname));
  };
  check();
  window.addEventListener("popstate", check);
  const timer = window.setInterval(check, intervalMs);
  return () => {
    window.removeEventListener("popstate", check);
    window.clearInterval(timer);
  };
}
