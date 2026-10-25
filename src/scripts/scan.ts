/**
 * "Does AI recommend you?" scan.
 *
 * With PUBLIC_SCAN_ENDPOINT set, the URL is POSTed there as JSON { url } and
 * the response (shape: ScanResult below) is rendered as is.
 *
 * Without it, a static site cannot read another website (browsers block
 * cross-site requests), so the page shows a DEMO result built from the
 * address alone. It is labelled as a demo everywhere it appears.
 */

export type Check = { id: string; label: string; score: number; note: string };
export type ScanResult = {
  url: string;
  score: number;
  summary: string;
  checks: Check[];
  demo: boolean;
};

const CHECKS: Omit<Check, 'score'>[] = [
  {
    id: 'crawl',
    label: 'Open to AI crawlers',
    note: 'Can GPTBot, ClaudeBot and PerplexityBot read your pages?',
  },
  {
    id: 'schema',
    label: 'Structured data',
    note: 'Schema.org markup that tells machines who you are and what you sell.',
  },
  {
    id: 'answers',
    label: 'Answer-ready content',
    note: 'Clear, quotable answers to the questions your buyers ask.',
  },
  {
    id: 'mentions',
    label: 'Mentions and citations',
    note: 'How often trusted sites talk about you, which models learn from.',
  },
  {
    id: 'render',
    label: 'Speed and rendering',
    note: 'Content that loads fast and is visible without running scripts.',
  },
  {
    id: 'llms',
    label: 'Clear site summary',
    note: 'An llms.txt and an About page that sum you up in one read.',
  },
];

export function normalizeUrl(raw: string): URL | null {
  let v = raw.trim();
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  try {
    const u = new URL(v);
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(u.hostname)) return null;
    return u;
  } catch {
    return null;
  }
}

// Small deterministic PRNG so the same address always gets the same demo numbers.
function seeded(text: string) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function demoResult(url: URL): ScanResult {
  const rand = seeded(url.hostname.replace(/^www\./, ''));
  const checks = CHECKS.map((c) => ({ ...c, score: Math.round(22 + rand() * 70) }));
  const score = Math.round(checks.reduce((s, c) => s + c.score, 0) / checks.length);
  return { url: url.href, score, summary: summaryFor(score), checks, demo: true };
}

export function summaryFor(score: number) {
  if (score >= 75) return 'AI assistants can find you. Now make sure they pick you first.';
  if (score >= 50) return 'You show up sometimes. A few fixes could make you the go-to answer.';
  return 'AI assistants are probably recommending someone else. Let’s change that.';
}

export async function runScan(url: URL): Promise<ScanResult> {
  const endpoint = import.meta.env.PUBLIC_SCAN_ENDPOINT as string | undefined;
  if (endpoint) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ url: url.href }),
    });
    if (!res.ok) throw new Error(`Scan failed (${res.status})`);
    const data = (await res.json()) as Omit<ScanResult, 'demo' | 'url'>;
    return { ...data, url: url.href, demo: false };
  }
  // Demo: give the animation a moment to play, like a real scan would.
  await new Promise((r) => setTimeout(r, 3600));
  return demoResult(url);
}
