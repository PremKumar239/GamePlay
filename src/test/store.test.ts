import { describe, expect, it } from 'vitest';
import { business, filterProducts, cartTotal, whatsapp } from '@/lib/store';
describe('Supplied store details', () => {
  it('preserves the supplied rating', () => expect(business.rating).toBe(4.8));
  it('preserves the supplied review count', () => expect(business.reviews).toBe(76));
  it('preserves the supplied closing time', () => expect(business.closingTime).toBe('11:30 PM'));
  it('preserves the supplied phone number', () => expect(business.phone).toBe('0323 5551600'));
  it('preserves the supplied address', () => expect(business.address).toBe('1st Floor, 66B, Sector C Commercial Area, Bahria Town, Lahore, 56000, Pakistan'));
  it('uses the supplied phone for enquiries', () => expect(whatsapp('Hello')).toBe('https://wa.me/923235551600?text=Hello'));
});
describe('Shopping interactions', () => {
  it('filters consoles and matching product name', () => expect(filterProducts('Consoles', 'PlayStation').map(p => p.id)).toEqual([1]));
  it('excludes products without an offer when offers are selected', () => expect(filterProducts('All', '', true).map(p => p.id)).toEqual([1,2,5,8]));
  it('totals item quantities', () => expect(cartTotal({1:2,2:1})).toBe(359997));
  it('keeps PlayStation games separate from other groups', () => expect(filterProducts('PlayStation', '', false, 'Games').map(p => p.id)).toEqual([7]));
  it('lists every PlayStation product when the subcategory is open', () => expect(filterProducts('PlayStation', '').map(p => p.id)).toEqual([1, 2, 7, 8]));
  it('leaves an empty category empty', () => expect(filterProducts('Laptop', '', false, 'Mac')).toEqual([]));
});