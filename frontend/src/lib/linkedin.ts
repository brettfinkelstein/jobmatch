function asPhrase(term: string): string {
  const trimmed = term.trim();
  if (!trimmed) return "";
  return /\s/.test(trimmed) ? `"${trimmed}"` : trimmed;
}

interface AlumniSearchTerms {
  organization?: string;
  company?: string;
  school?: string;
  keyword?: string;
  hiringSignal?: boolean;
}

// LinkedIn has no dedicated "currently hiring" filter for people search, so we
// bias toward it with an OR-group of phrases people commonly use in their
// headline/about/posts when they're recruiting for their team.
const HIRING_SIGNAL_GROUP =
  '(hiring OR "we\'re hiring" OR "join our team" OR recruiting OR "open roles")';

/**
 * LinkedIn's people-search keyword field supports Boolean operators
 * (AND/OR/NOT, "quoted phrases", parentheses for grouping). Combining terms
 * with AND avoids the loose OR-of-every-word matching that makes a bare
 * "Theta Chi" search mostly noise.
 */
export function buildLinkedInPeopleSearchUrl(terms: AlumniSearchTerms): string {
  const parts = [terms.organization, terms.company, terms.school, terms.keyword]
    .map((t) => (t ? asPhrase(t) : ""))
    .filter(Boolean);

  if (terms.hiringSignal) {
    parts.push(HIRING_SIGNAL_GROUP);
  }

  const params = new URLSearchParams({ keywords: parts.join(" AND ") });
  return `https://www.linkedin.com/search/results/people/?${params.toString()}`;
}
