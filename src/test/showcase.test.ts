import { describe, expect, it } from 'vitest';
import { isShowcaseController } from '@/components/product-showcase';
import type { Product } from '@/lib/store';

function product(name: string, extra: Partial<Product> = {}): Product {
  return { id: 1, name, category: 'Controllers', image: '', price: 1, group: 'PlayStation', subcategory: 'Controllers', ...extra };
}

describe('Controllers showcase', () => {
  it('keeps handheld and fight-stick controllers', () => {
    expect(isShowcaseController(product('Sony DualSense Wireless Controller for PlayStation 5 - White'))).toBe(true);
    expect(isShowcaseController(product('Sony DUALSHOCK 4 Wireless Controller for PlayStation 4 - Black'))).toBe(true);
    expect(isShowcaseController(product('Microsoft Xbox Series X Wireless Controller Carbon Black', { group: 'Xbox' }))).toBe(true);
    expect(isShowcaseController(product('HORI Fighting Stick Mini for PS5, PS4 and PC'))).toBe(true);
  });

  it('leaves racing gear and controller accessories out of the section', () => {
    expect(isShowcaseController(product('PXN HB S Racing Handbrake (PC Only)'))).toBe(false);
    expect(isShowcaseController(product('Logitech G923 TRUEFORCE Racing Wheel and Pedals for PlayStation 5'))).toBe(false);
    expect(isShowcaseController(product('DeadSkull Playseat Racing Simulator – P705B'))).toBe(false);
    expect(isShowcaseController(product('DOBE Switch 2 Controller Grip – TNS-3163'))).toBe(false);
    expect(isShowcaseController(product('DOBE PS5 Controller Silicone Cover – TP5-0541'))).toBe(false);
  });
});
