import { describe, expect, it } from 'vitest';
import { business, catalog, filterProducts, cartTotal, getProduct, mailTo, mergeCatalog, phoneLink, whatsapp, whatsappTo } from '@/lib/store';
describe('Supplied store details', () => {
  it('preserves the supplied rating', () => expect(business.rating).toBe(4.8));
  it('preserves the supplied review count', () => expect(business.reviews).toBe(76));
  it('preserves the supplied closing time', () => expect(business.closingTime).toBe('11:30 PM'));
  it('preserves the supplied phone number', () => expect(business.phone).toBe('0323 5551600'));
  it('preserves the supplied address', () => expect(business.address).toBe('1st Floor, 66B, Sector C Commercial Area, Bahria Town, Lahore, 56000, Pakistan'));
  it('uses the supplied phone for enquiries', () => expect(whatsapp('Hello')).toBe('https://wa.me/923235551600?text=Hello'));
  it('builds a call link from the local phone number', () => expect(phoneLink('0323 5551600')).toBe('tel:+923235551600'));
  it('builds a WhatsApp link from a stored number', () => expect(whatsappTo('923235551600', 'Hello')).toBe('https://wa.me/923235551600?text=Hello'));
  it('builds a contact email link', () => expect(mailTo(business.email, 'Hello', 'Body')).toBe(`mailto:${business.email}?subject=Hello&body=Body`));
});
describe('Shopping interactions', () => {
  it('filters consoles and matching product name', () => expect(filterProducts('Consoles', 'PlayStation').map(p => p.id)).toEqual([1]));
  it('excludes products without an offer when offers are selected', () => expect(filterProducts('All', '', true).map(p => p.id)).toEqual([1,2,5,8]));
  it('totals item quantities', () => expect(cartTotal({1:2,2:1})).toBe(359997));
  it('keeps PlayStation games separate from other groups', () => expect(filterProducts('PlayStation', '', false, 'Games').map(p => p.id)).toEqual([7]));
  it('lists every PlayStation product when the subcategory is open', () => expect(filterProducts('PlayStation', '').map(p => p.id)).toEqual([1, 2, 7, 8]));
  it('leaves an empty category empty', () => expect(filterProducts('Laptop', '', false, 'Mac')).toEqual([]));
  it('lists Vivo and OPPO under Mobiles', () => expect(catalog.find(group => group.name === 'Mobiles')?.subcategories).toEqual(['Apple', 'Samsung', 'Mi', 'Vivo', 'OPPO', 'Accessories']));
  it('lists the gift card brands', () => expect(catalog.find(group => group.name === 'Gift Cards')?.subcategories).toEqual(['Apple', 'PlayStation', 'Xbox', 'Nintendo eShop', 'Steam', 'iTunes', 'Roblox']));
  it('finds a product by id', () => expect(getProduct(2)?.name).toBe('DualSense Wireless Controller — White'));
  it('drops gift card brands outside the store list', () => expect(mergeCatalog([{ name: 'Gift Cards', label: 'Extra brands', subcategories: ['Steam', 'Google Play', 'Razer Gold'] }]).find(group => group.name === 'Gift Cards')?.subcategories).toEqual(['Steam', 'Apple', 'PlayStation', 'Xbox', 'Nintendo eShop', 'iTunes', 'Roblox']));
  it('keeps local subcategories when the database catalog is older', () => {
    const merged = mergeCatalog([{ name: 'Mobiles', label: 'Phones', subcategories: ['Apple'] }, { name: 'Cameras', label: 'Photo', subcategories: ['Lenses'] }]);
    expect(merged.find(group => group.name === 'Mobiles')?.subcategories).toEqual(['Apple', 'Samsung', 'Mi', 'Vivo', 'OPPO', 'Accessories']);
    expect(merged.some(group => group.name === 'Cameras')).toBe(true);
  });
  it('keeps Nintendo image unchanged while other shop categories have photos', () => {
    const nintendo = catalog.find(group => group.name === 'Nintendo');
    expect(nintendo?.image).toBe(catalog.find(group => group.name === 'Nintendo')?.image);
    expect(['PlayStation', 'Xbox', 'Meta', 'Mobiles', 'Laptop', 'Gift Cards'].every(name => Boolean(catalog.find(group => group.name === name)?.image))).toBe(true);
    const merged = mergeCatalog([{ name: 'Nintendo', label: 'Games', subcategories: ['Games'] }]);
    expect(merged.find(group => group.name === 'Nintendo')?.image).toBe(nintendo?.image);
  });
});