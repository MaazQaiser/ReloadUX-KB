/** Cosine similarity of two vectors: 1 is the same direction, 0 unrelated. Zero vectors score 0. */
export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  return normA === 0 || normB === 0 ? 0 : dot / Math.sqrt(normA * normB);
}

/** Share of distinct words two texts have in common (Jaccard), ignoring case and punctuation. */
export function wordOverlap(a: string, b: string): number {
  const words = (text: string) => new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  const left = words(a);
  const right = words(b);
  if (left.size === 0 || right.size === 0) return 0;
  const shared = [...left].filter((word) => right.has(word)).length;
  return shared / (left.size + right.size - shared);
}
