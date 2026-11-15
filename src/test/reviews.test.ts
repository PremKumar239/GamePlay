import { describe, expect, it } from 'vitest';
import { filterReviews, googlePlace, googleReviews, recommendPercent, relativeReviewDate } from '@/lib/reviews';

describe('GAME PLAY Bahria reviews', () => {
  it('keeps the Google listing score from GAME PLAY Bahria', () => {
    expect(googlePlace.rating).toBe(4.7);
    expect(googlePlace.count).toBe(106);
    expect(Object.values(googlePlace.stars).reduce((sum, n) => sum + n, 0)).toBe(106);
  });

  it('counts four- and five-star reviews as recommendations', () => {
    expect(recommendPercent()).toBe(93);
  });

  it('searches review text and sorts by newest first', () => {
    const found = filterReviews(googleReviews, 'switch lite');
    expect(found[0]?.body).toMatch(/Nintendo Switch Lite/i);
    expect(filterReviews(googleReviews, '', 'newest')[0]?.postedAt).toBe('2026-01-23');
  });

  it('formats review dates relative to today', () => {
    expect(relativeReviewDate('2026-11-15', new Date('2026-11-15T18:00:00'))).toBe('Today');
    expect(relativeReviewDate('2026-10-16', new Date('2026-11-15T12:00:00'))).toBe('1 month ago');
  });
});
