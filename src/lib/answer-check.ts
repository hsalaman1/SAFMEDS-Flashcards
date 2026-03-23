/**
 * Answer validation utilities for the Fluency Strategies Quiz.
 */

/** Lowercase, trim whitespace, strip leading/trailing punctuation. */
export function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '')
}

/** Simple Levenshtein distance (two-row DP). */
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  let curr = new Array<number>(n + 1)

  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[n]
}

/** Check a typed answer against the correct term. */
export function checkTypedAnswer(
  userInput: string,
  correctTerm: string
): 'correct' | 'close' | 'wrong' {
  const a = normalizeAnswer(userInput)
  const b = normalizeAnswer(correctTerm)
  if (a === b) return 'correct'
  if (b.length > 6 && levenshtein(a, b) <= 1) return 'close'
  return 'wrong'
}

/**
 * Generate a masked version of a term showing first and last letter.
 * e.g. "Reinforcement" → "R___________t"
 */
export function generateMask(term: string): string {
  const t = term.trim()
  if (t.length <= 2) return t
  const middle = '_'.repeat(t.length - 2)
  return t[0] + middle + t[t.length - 1]
}

/**
 * Generate a hint: first letter + word length.
 * e.g. "Reinforcement" → "R... (13 letters)"
 */
export function generateHint(term: string): string {
  const t = term.trim()
  if (t.length === 0) return ''
  return `${t[0]}... (${t.length} letters)`
}
