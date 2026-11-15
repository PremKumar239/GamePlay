import { query } from '@/lib/db';
import { fallbackReviewsPayload, mapGooglePlaceDetails, type ReviewsPayload, type StoreReview } from '@/lib/reviews';

const CACHE_MINUTES = 30;
const SEARCH_QUERY = 'GAME PLAY BAHRIA Sector C Commercial Area Bahria Town Lahore';

type CacheRow = { payload: ReviewsPayload; fetched_at: string | Date };

async function ensureCacheTable() {
  await query(`
    create table if not exists public.google_reviews_cache (
      id integer primary key default 1 check (id = 1),
      payload jsonb not null,
      fetched_at timestamptz not null default now()
    )
  `);
}

function apiKey() {
  return process.env.GOOGLE_PLACES_API_KEY?.trim() || '';
}

function configuredPlaceId() {
  return process.env.GOOGLE_PLACE_ID?.trim() || '';
}

function googleUrl(path: string, params: Record<string, string>) {
  const url = new URL(`https://maps.googleapis.com/maps/api/place/${path}/json`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set('key', apiKey());
  return url;
}

async function findPlaceId() {
  const known = configuredPlaceId();
  if (known) return known;
  const url = googleUrl('findplacefromtext', {
    input: SEARCH_QUERY,
    inputtype: 'textquery',
    fields: 'place_id,name',
  });
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Google place search failed (${response.status})`);
  const data = await response.json() as { status?: string; candidates?: { place_id?: string }[]; error_message?: string };
  if (data.status !== 'OK' || !data.candidates?.[0]?.place_id) {
    throw new Error(data.error_message || `Google place search returned ${data.status || 'no result'}`);
  }
  return data.candidates[0].place_id;
}

async function fetchGoogleReviews(previous: StoreReview[]) {
  const placeId = await findPlaceId();
  const url = googleUrl('details', {
    place_id: placeId,
    fields: 'name,rating,user_ratings_total,reviews',
    reviews_sort: 'newest',
  });
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Google reviews failed (${response.status})`);
  const data = await response.json() as {
    status?: string;
    error_message?: string;
    result?: { name?: string; rating?: number; user_ratings_total?: number; reviews?: { author_name?: string; rating?: number; text?: string; time?: number }[] };
  };
  if (data.status !== 'OK' || !data.result) {
    throw new Error(data.error_message || `Google reviews returned ${data.status || 'no result'}`);
  }
  return mapGooglePlaceDetails(data.result, previous);
}

export async function getStoreReviews(force = false): Promise<ReviewsPayload> {
  const fallback = fallbackReviewsPayload();
  try {
    await ensureCacheTable();
    const cached = await query<CacheRow>('select payload, fetched_at from google_reviews_cache where id = 1');
    const row = cached.rows[0];
    const payload = row?.payload;
    const ageMs = row ? Date.now() - new Date(row.fetched_at).getTime() : Infinity;
    if (!force && payload?.reviews && ageMs < CACHE_MINUTES * 60_000) return payload;

    if (!apiKey()) return payload ?? fallback;

    const live = await fetchGoogleReviews(payload?.reviews ?? fallback.reviews);
    await query(
      `insert into google_reviews_cache (id, payload, fetched_at)
       values (1, $1::jsonb, now())
       on conflict (id) do update set payload = excluded.payload, fetched_at = now()`,
      [JSON.stringify(live)],
    );
    return live;
  } catch (error) {
    console.error('Google reviews refresh failed:', error instanceof Error ? error.message : 'unknown error');
    try {
      const cached = await query<CacheRow>('select payload from google_reviews_cache where id = 1');
      if (cached.rows[0]?.payload) return cached.rows[0].payload;
    } catch {
      // Keep the static Bahria reviews if Google or the cache table is unavailable.
    }
    return fallback;
  }
}
