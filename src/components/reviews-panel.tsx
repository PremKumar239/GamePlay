import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Search, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadReviews } from '@/lib/store';
import { fallbackReviewsPayload, filterReviews, recommendPercent, relativeReviewDate, type ReviewsPayload, type ReviewSort } from '@/lib/reviews';
import consoleImage from '@/assets/product-0.jpg';
import controllerImage from '@/assets/product-1.jpg';
import headsetImage from '@/assets/product-2.jpg';
import keyboardImage from '@/assets/product-3.jpg';
import mouseImage from '@/assets/product-4.jpg';
import handheldImage from '@/assets/product-5.jpg';
import gameImage from '@/assets/games-banner.jpg';
import playstationImage from '@/assets/category-playstation.png';
import xboxImage from '@/assets/category-xbox.png';
import metaImage from '@/assets/category-meta.png';

const photos = [handheldImage, controllerImage, consoleImage, gameImage, headsetImage, keyboardImage, mouseImage, playstationImage, xboxImage, metaImage];
const starLevels = [5, 4, 3, 2, 1] as const;

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="review-stars" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(level => (
        <Star key={level} size={size} fill={level <= value ? 'currentColor' : 'none'} className={level <= value ? 'is-on' : ''} />
      ))}
    </span>
  );
}

export function ReviewsPanel({ open, onClose, mapsUrl }: { open: boolean; onClose: () => void; mapsUrl: string }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<ReviewSort>('newest');
  const [stars, setStars] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bundle, setBundle] = useState<ReviewsPayload>(fallbackReviewsPayload);
  const visible = useMemo(() => filterReviews(bundle.reviews, query, sort, stars), [bundle.reviews, query, sort, stars]);
  const maxBar = bundle.stars ? Math.max(...starLevels.map(level => bundle.stars?.[level] ?? 0), 1) : 0;

  useEffect(() => {
    if (!open) return;
    let cancel = false;
    loadReviews().then(next => { if (!cancel) setBundle(next); });
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => {
      cancel = true;
      document.body.style.overflow = before;
      window.removeEventListener('keydown', close);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <section className="reviews-drawer" role="dialog" aria-modal="true" aria-label="Customer reviews" onClick={event => event.stopPropagation()}>
        <div className="reviews-head">
          <h2>Customer Reviews</h2>
          <Button variant="ghost" size="icon" autoFocus aria-label="Close reviews" onClick={onClose}><X /></Button>
        </div>
        <div className="reviews-score">
          <div>
            <strong>{bundle.rating.toFixed(1)}/5</strong>
            <Stars value={Math.round(bundle.rating)} size={16} />
            <p>Based on {bundle.count} Google reviews</p>
            <p className="reviews-recommend">{recommendPercent(bundle)}% would recommend</p>
          </div>
          {bundle.stars && (
            <ul className="reviews-bars">
              {starLevels.map(level => (
                <li key={level}>
                  <span>{level} ★</span>
                  <span className="reviews-bar"><i style={{ width: `${(bundle.stars?.[level] ?? 0) / maxBar * 100}%` }} /></span>
                  <small>{bundle.stars?.[level] ?? 0}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="reviews-photos">
          {photos.map((src, index) => <img key={`${index}-${src}`} src={src} alt="" />)}
        </div>
        <div className="reviews-tools">
          <label className="reviews-search">
            <Search size={16} />
            <input aria-label="Search reviews" placeholder="Search reviews" value={query} onChange={event => setQuery(event.target.value)} />
          </label>
          <Button type="button" variant="outline" size="sm" onClick={() => setFiltersOpen(!filtersOpen)}>Filters</Button>
          <select aria-label="Sort reviews" value={sort} onChange={event => setSort(event.target.value as ReviewSort)}>
            <option value="newest">Most recent</option>
            <option value="highest">Highest rating</option>
            <option value="lowest">Lowest rating</option>
          </select>
        </div>
        {filtersOpen && (
          <div className="reviews-star-filters">
            <button type="button" className={stars === 0 ? 'is-on' : ''} onClick={() => setStars(0)}>All stars</button>
            {starLevels.map(level => (
              <button type="button" key={level} className={stars === level ? 'is-on' : ''} onClick={() => setStars(stars === level ? 0 : level)}>{level} star</button>
            ))}
          </div>
        )}
        <p className="reviews-source">
          {bundle.live
            ? `Live Google reviews for ${bundle.name}. New reviews appear after Google publishes them (checked about every 30 minutes). Google sends up to 5 per refresh; earlier reviews stay saved here.`
            : `Showing saved Google reviews for ${bundle.name}. Add GOOGLE_PLACES_API_KEY in .env to refresh automatically.`}
        </p>
        {visible.length === 0 ? <p className="reviews-empty">No reviews match this search.</p> : visible.map(review => (
          <article className="review-card" key={review.id}>
            <div className="review-avatar" aria-hidden="true">{(review.author || 'G').slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{review.author || 'Google review'}</strong>
              <small>Google review · {bundle.name}</small>
              <div className="review-meta"><Stars value={review.stars} /> <span>{relativeReviewDate(review.postedAt)}</span></div>
              <p>{review.body}</p>
            </div>
          </article>
        ))}
        <Button asChild variant="outline" className="mt-4 w-full">
          <a href={mapsUrl} target="_blank" rel="noreferrer">Read all reviews on Google <ArrowUpRight /></a>
        </Button>
      </section>
    </div>
  );
}

export function ReviewsTab({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" className="reviews-tab" onClick={onOpen} aria-label="Open customer reviews">
      Reviews
    </button>
  );
}
