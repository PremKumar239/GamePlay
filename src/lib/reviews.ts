export type StoreReview = {
  id: string;
  stars: number;
  postedAt: string;
  body: string;
  author?: string;
};

export type ReviewsPayload = {
  name: string;
  rating: number;
  count: number;
  stars: Record<1 | 2 | 3 | 4 | 5, number> | null;
  reviews: StoreReview[];
  source: 'google' | 'fallback';
  live: boolean;
  fetchedAt: string;
};

export type ReviewSort = 'newest' | 'highest' | 'lowest';

export const googlePlace = {
  name: 'GAME PLAY BAHRIA',
  rating: 4.7,
  count: 106,
  mapsQuery: 'GAME PLAY BAHRIA 1st Floor, 66B, Sector C Commercial Area, Bahria Town, Lahore',
  stars: { 5: 85, 4: 14, 3: 4, 2: 2, 1: 1 } as Record<1 | 2 | 3 | 4 | 5, number>,
};

export const googleReviews: StoreReview[] = [
  {
    id: 'gpb-1',
    stars: 5,
    postedAt: '2026-01-23',
    body: 'I\'m absolutely thrilled with my PS5 purchase from Game Play. The console is in pristine condition, and it\'s been a seamless experience overall. The staff were super helpful, and delivery was lightning-fast. Game Play exceeded my expectations with their excellent customer service and competitive pricing. I\'d definitely recommend them to anyone looking for a reliable gaming store.',
  },
  {
    id: 'gpb-2',
    stars: 5,
    postedAt: '2026-01-21',
    body: 'Just wanted to share my experience with GamePlay Bahria. Yesterday I bought a PS5 from them. The staff was nice and cooperative and the product was delivered on time. I was done with them in just 2 hours with all of the stuff I wanted. Would really recommend them to anyone looking to buy consoles or accessories in Bahria Town Lahore.',
  },
  {
    id: 'gpb-3',
    stars: 5,
    postedAt: '2025-11-26',
    body: 'Amazing trustworthy vendor. Bought a good-condition PS5 from them. Highly recommended.',
  },
  {
    id: 'gpb-4',
    stars: 5,
    postedAt: '2025-11-04',
    body: 'Brilliant service and really cooperative staff. I ordered my PS5 Pro with offline games installation from here and they delivered with 100% perfection.',
  },
  {
    id: 'gpb-5',
    stars: 5,
    postedAt: '2025-10-28',
    body: 'I purchased a Nintendo Switch Lite from GAME PLAY. Despite being in Karachi I decided to go for Game Play because of the amazing price, service, and reliability. I plan on making more purchases in the future.',
  },
  {
    id: 'gpb-6',
    stars: 5,
    postedAt: '2025-10-22',
    body: 'Recently visited Game Play Bahria and bought a Ghost of Yotei limited edition controller. I was given the best price and I highly recommend this place. They offer a variety of PS4 and PS5 games, consoles, and accessories at a very reasonable price and their staff is welcoming too.',
  },
  {
    id: 'gpb-7',
    stars: 5,
    postedAt: '2025-10-18',
    body: 'Brilliant and express service as always. My go-to place to order PlayStation stuff. Highly recommended. Owner is a great guy to deal with as well.',
  },
  {
    id: 'gpb-8',
    stars: 5,
    postedAt: '2025-10-06',
    body: 'A one-stop shop for console gamers. Got a PS5 Pro, controllers and gift cards, and they really provide support. Highly recommended.',
  },
];

export function recommendPercent(place: { count: number; rating?: number; stars: Record<1 | 2 | 3 | 4 | 5, number> | null } = googlePlace) {
  if (!place.stars) return Math.round(((place.rating ?? googlePlace.rating) / 5) * 100);
  const positive = place.stars[5] + place.stars[4];
  return Math.round((positive / place.count) * 100);
}

export function filterReviews(reviews: StoreReview[], query = '', sort: ReviewSort = 'newest', stars = 0) {
  const needle = query.trim().toLowerCase();
  const filtered = reviews.filter(review => {
    if (stars && review.stars !== stars) return false;
    return !needle || review.body.toLowerCase().includes(needle);
  });
  return filtered.sort((a, b) => {
    if (sort === 'highest') return b.stars - a.stars || b.postedAt.localeCompare(a.postedAt);
    if (sort === 'lowest') return a.stars - b.stars || b.postedAt.localeCompare(a.postedAt);
    return b.postedAt.localeCompare(a.postedAt);
  });
}

export function fallbackReviewsPayload(): ReviewsPayload {
  return {
    name: googlePlace.name,
    rating: googlePlace.rating,
    count: googlePlace.count,
    stars: googlePlace.stars,
    reviews: googleReviews,
    source: 'fallback',
    live: false,
    fetchedAt: new Date().toISOString(),
  };
}

export function reviewId(author: string, postedAt: string, body: string) {
  return `${author}|${postedAt}|${body.slice(0, 48)}`.toLowerCase().replace(/\s+/g, ' ').slice(0, 180);
}

type GooglePlaceReview = {
  author_name?: string;
  rating?: number;
  text?: string;
  time?: number;
  relative_time_description?: string;
};

export function mapGooglePlaceDetails(result: {
  name?: string;
  rating?: number;
  user_ratings_total?: number;
  reviews?: GooglePlaceReview[];
}, previous: StoreReview[] = []): ReviewsPayload {
  const incoming = (result.reviews ?? []).map(review => {
    const postedAt = review.time ? new Date(review.time * 1000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    const author = String(review.author_name || 'Google reviewer').trim();
    const body = String(review.text || '').trim();
    return {
      id: reviewId(author, postedAt, body),
      author,
      stars: Math.min(5, Math.max(1, Math.round(Number(review.rating) || 5))),
      postedAt,
      body,
    } satisfies StoreReview;
  }).filter(review => review.body);
  const merged = new Map<string, StoreReview>();
  for (const review of [...previous, ...incoming]) merged.set(review.id, review);
  const reviews = [...merged.values()].sort((a, b) => b.postedAt.localeCompare(a.postedAt)).slice(0, 80);
  return {
    name: String(result.name || googlePlace.name),
    rating: Number(result.rating) || googlePlace.rating,
    count: Number(result.user_ratings_total) || googlePlace.count,
    stars: null,
    reviews,
    source: 'google',
    live: true,
    fetchedAt: new Date().toISOString(),
  };
}

export function relativeReviewDate(postedAt: string, now = new Date()) {
  const then = postedAt.includes('T') ? new Date(postedAt) : new Date(`${postedAt}T12:00:00`);
  if (Number.isNaN(then.getTime())) return postedAt;
  const days = Math.max(0, Math.round((now.getTime() - then.getTime()) / 86_400_000));
  if (days < 1) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return months === 1 ? '1 month ago' : `${months} months ago`;
  const years = Math.round(days / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}
