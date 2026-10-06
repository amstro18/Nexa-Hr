import kb from "./kb.json";

export type Source = { id: string; cite: string; title: string; text: string; form: string; contact: string };

const STOP = new Set(
  "a an and are can do does for get how i if in is it me my of on or the to what when where which with you your employee employees much many please tell about would could should have has had".split(" "),
);
const tok = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g)?.filter((w) => !STOP.has(w)) ?? [];

type Doc = { policyId: string; terms: string[] };
const docs: Doc[] = [
  ...kb.policies.map((p) => ({ policyId: p.id, terms: tok(`${p.cat} ${p.name} ${p.title} ${p.text} ${p.rule}`) })),
  ...kb.faqs.map((f) => ({ policyId: f.chunk, terms: tok(f.q) })),
];
const df = new Map<string, number>();
docs.forEach((d) => new Set(d.terms).forEach((t) => df.set(t, (df.get(t) ?? 0) + 1)));
const idf = (t: string) => Math.log((docs.length + 1) / ((df.get(t) ?? 0) + 1)) + 1;

/** Lexical TF-IDF retrieval over approved policies + FAQ paraphrases. Returns top policy chunks and a 0-1 confidence. */
export function retrieve(query: string, k = 4): { sources: Source[]; confidence: number } {
  const q = tok(query);
  if (!q.length) return { sources: [], confidence: 0 };
  const qn = Math.sqrt(q.reduce((s, t) => s + idf(t) ** 2, 0));
  const best = new Map<string, number>();
  for (const d of docs) {
    const set = new Set(d.terms);
    let dot = 0;
    for (const t of new Set(q)) if (set.has(t)) dot += idf(t) ** 2;
    if (!dot) continue;
    const dn = Math.sqrt([...set].reduce((s, t) => s + idf(t) ** 2, 0));
    const score = dot / (qn * dn);
    if (score > (best.get(d.policyId) ?? 0)) best.set(d.policyId, score);
  }
  const ranked = [...best.entries()].sort((a, b) => b[1] - a[1]).slice(0, k);
  const sources = ranked
    .map(([id]) => kb.policies.find((p) => p.id === id))
    .filter((p): p is (typeof kb.policies)[number] => !!p)
    .map((p) => ({
      id: p.id,
      cite: `${p.name} Policy §${p.section.split("-")[1] ?? p.section}`,
      title: p.title,
      text: p.text,
      form: p.form,
      contact: (kb.contacts as Record<string, string>)[p.contact] ?? "HR Helpdesk",
    }));
  return { sources, confidence: Math.min(1, ranked[0]?.[1] ?? 0) };
}
