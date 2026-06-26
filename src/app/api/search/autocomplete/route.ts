/**
 * GET /api/search/autocomplete?q=&type=&limit=
 *
 * Returns top search results for the given query.
 * Used by the search box for live autocomplete.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ensureIndexed, searchIndex } from '@/lib/search/engine';
import { sanitizeString, parseIntParam } from '@/lib/security/validate';
import type { SearchEntityType } from '@/lib/search/engine';

export async function GET(req: NextRequest) {
  const sp    = req.nextUrl.searchParams;
  const query = sanitizeString(sp.get('q') ?? '');
  const type  = sp.get('type') as SearchEntityType | null;
  const limit = parseIntParam(sp.get('limit'), 8, 1, 20);

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  await ensureIndexed();

  const results = searchIndex.search(query, {
    maxResults: limit,
    type:       type ?? undefined,
    minScore:   0.08,
  });

  return NextResponse.json({ results, query });
}
