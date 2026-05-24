export const COMMUNITY_CATEGORIES = [
  { key: "sleep", label: "Sleep" },
  { key: "focus", label: "Focus" },
  { key: "relax", label: "Relax" },
  { key: "nature", label: "Nature" },
  { key: "urban", label: "Urban" },
] as const;

export type CommunityCategoryKey = (typeof COMMUNITY_CATEGORIES)[number]["key"];

const TAG_RULES: { tag: CommunityCategoryKey; pattern: RegExp }[] = [
  { tag: "sleep", pattern: /\b(sleep|bed|night|dream|rest)\b/i },
  { tag: "focus", pattern: /\b(focus|study|work|concentrat|deep work)\b/i },
  { tag: "relax", pattern: /\b(relax|calm|meditat|peace|spa|zen)\b/i },
  { tag: "nature", pattern: /\b(nature|forest|rain|ocean|bird|wind|thunder|cricket|river|mountain)\b/i },
  { tag: "urban", pattern: /\b(urban|city|coffee|cafe|train|traffic|street|subway)\b/i },
];

export function inferTagsFromPrompt(prompt: string): CommunityCategoryKey[] {
  const tags = new Set<CommunityCategoryKey>();
  for (const rule of TAG_RULES) {
    if (rule.pattern.test(prompt)) {
      tags.add(rule.tag);
    }
  }
  if (tags.size === 0) {
    tags.add("relax");
  }
  return [...tags];
}
