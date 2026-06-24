export type CatalogProduct = {
  handle: string;
  title: string;
  image: string;
  price?: {amount: string; currencyCode: string};
};

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({length: m + 1}, (_, i) =>
    Array.from({length: n + 1}, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

export function fuzzySearch(
  catalog: CatalogProduct[],
  query: string,
  limit = 6,
): {results: CatalogProduct[]; suggestion: string} {
  if (!query.trim()) return {results: [], suggestion: ''};
  const q = query.toLowerCase();

  const exact = catalog.filter(
    (p) => p.title.toLowerCase().includes(q) || p.handle.toLowerCase().includes(q),
  ).slice(0, limit);
  if (exact.length > 0) return {results: exact, suggestion: ''};

  const allWords = new Set<string>();
  catalog.forEach((p) => {
    p.title.toLowerCase().split(/\s+/).forEach((w) => allWords.add(w));
    p.handle.replace(/-/g, ' ').split(/\s+/).forEach((w) => allWords.add(w));
  });

  let bestWord = '';
  let bestDist = Infinity;
  let bestLenDiff = Infinity;
  for (const word of allWords) {
    // Skip very short catalog words ("tee", "ss", etc). They appear in nearly
    // every title, so matching one returns the whole catalog and any 3-4 letter
    // typo lands within edit range of them.
    if (word.length < 4) continue;
    const d = levenshtein(q, word);
    const lenDiff = Math.abs(q.length - word.length);
    // Tight, length-scaled typo tolerance: real typos are 1-2 edits. A loose
    // threshold lets unrelated words ("meow") match common words and flood
    // results, so cap it relative to the longer word.
    const maxLen = Math.max(q.length, word.length);
    const threshold = maxLen <= 4 ? 1 : maxLen <= 7 ? 2 : 3;
    if (d <= threshold && (d < bestDist || (d === bestDist && lenDiff < bestLenDiff))) {
      bestDist = d;
      bestWord = word;
      bestLenDiff = lenDiff;
    }
  }

  if (bestWord) {
    const fuzzy = catalog.filter(
      (p) => p.title.toLowerCase().includes(bestWord) || p.handle.toLowerCase().includes(bestWord),
    ).slice(0, limit);
    if (fuzzy.length > 0) return {results: fuzzy, suggestion: bestWord};
  }

  return {results: [], suggestion: ''};
}
