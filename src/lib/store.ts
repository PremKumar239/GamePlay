import consoleImage from '@/assets/product-0.jpg';
import controllerImage from '@/assets/product-1.jpg';
import headsetImage from '@/assets/product-2.jpg';
import keyboardImage from '@/assets/product-3.jpg';
import mouseImage from '@/assets/product-4.jpg';
import handheldImage from '@/assets/product-5.jpg';
import gameImage from '@/assets/games-banner.jpg';
import appleCard from '@/assets/gift-card-apple.jpg';
import playstationCard from '@/assets/gift-card-playstation.jpg';
import xboxCard from '@/assets/gift-card-xbox.jpg';
import nintendoCard from '@/assets/gift-card-nintendo.jpg';
import steamCard from '@/assets/gift-card-steam.jpg';
import itunesCard from '@/assets/gift-card-itunes.jpg';
import robloxCard from '@/assets/gift-card-roblox.jpg';
import playstationCategory from '@/assets/category-playstation.png';
import xboxCategory from '@/assets/category-xbox.png';
import metaCategory from '@/assets/category-meta.png';
import mobilesCategory from '@/assets/category-mobiles.png';
import laptopCategory from '@/assets/category-laptop.png';
import giftCardsCategory from '@/assets/category-gift-cards.jpg';
import { supabase } from '@/lib/supabase';

const productImages: Record<string, string> = {
  'product-0': consoleImage,
  'product-1': controllerImage,
  'product-2': headsetImage,
  'product-3': keyboardImage,
  'product-4': mouseImage,
  'product-5': handheldImage,
  'games-banner': gameImage,
};

export const business = {
  name: 'GAME PLAY', rating: 4.8, reviews: 76,
  address: '1st Floor, 66B, Sector C Commercial Area, Bahria Town, Lahore, 56000, Pakistan',
  phone: '0323 5551600', email: 'gameplay@gmail.com', closingTime: '11:30 PM',
};
export const mailTo = (email: string, subject: string, body: string) => `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
export const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.name} ${business.address}`)}`;
export const whatsapp = (text: string) => whatsappTo('923235551600', text);
export const whatsappTo = (number: string, text: string) => `https://wa.me/${internationalNumber(number)}?text=${encodeURIComponent(text)}`;
export const phoneLink = (phone: string) => `tel:+${internationalNumber(phone)}`;
function internationalNumber(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('0') ? `92${digits.slice(1)}` : digits;
}
export type Product = { id: number; name: string; category: string; image: string; price: number; oldPrice?: number; badge?: string; group?: string; subcategory?: string; description?: string; stock?: number };
export const products: Product[] = [
  { id: 1, name: 'PlayStation 5 Slim — Disc Edition, 1TB', category: 'Consoles', group: 'PlayStation', subcategory: 'Consoles', image: consoleImage, price: 169999, oldPrice: 179999, badge: 'BEST SELLER' },
  { id: 2, name: 'DualSense Wireless Controller — White', category: 'Controllers', group: 'PlayStation', subcategory: 'Controllers', image: controllerImage, price: 19999, oldPrice: 22499, badge: 'HOT DEAL' },
  { id: 3, name: 'Premium Over-Ear Gaming Headset', category: 'Headsets', image: headsetImage, price: 12499 },
  { id: 4, name: 'Nintendo Switch — Neon Blue & Red', category: 'Consoles', group: 'Nintendo', subcategory: 'Consoles', image: handheldImage, price: 74999, badge: 'POPULAR' },
  { id: 5, name: 'RGB Mechanical Gaming Keyboard', category: 'Keyboards', image: keyboardImage, price: 14999, oldPrice: 17999, badge: 'HOT DEAL' },
  { id: 6, name: 'Wireless Performance Gaming Mouse', category: 'Mice', image: mouseImage, price: 8999 },
  { id: 7, name: 'Action & Adventure — PlayStation Games', category: 'Games', group: 'PlayStation', subcategory: 'Games', image: gameImage, price: 14999, badge: 'NEW ARRIVAL' },
  { id: 8, name: 'DualSense Controller & Headset Bundle', category: 'Controllers', group: 'PlayStation', subcategory: 'Controllers', image: controllerImage, price: 29999, oldPrice: 32498, badge: 'BUNDLE DEAL' },
];
export type CatalogGroup = { name: string; label: string; image?: string; subcategories: string[] };
export const catalog: CatalogGroup[] = [
  { name: 'PlayStation', label: 'Games, controllers, consoles and accessories', image: playstationCategory, subcategories: ['Games', 'Controllers', 'Consoles', 'Accessories'] },
  { name: 'Xbox', label: 'Controllers, consoles and accessories', image: xboxCategory, subcategories: ['Controllers', 'Consoles', 'Accessories'] },
  { name: 'Meta', label: 'Consoles and accessories', image: metaCategory, subcategories: ['Consoles', 'Accessories'] },
  { name: 'Nintendo', label: 'Games, controllers, consoles and accessories', image: handheldImage, subcategories: ['Games', 'Controllers', 'Consoles', 'Accessories'] },
  { name: 'Mobiles', label: 'Apple, Samsung, Mi, Vivo, OPPO and accessories', image: mobilesCategory, subcategories: ['Apple', 'Samsung', 'Mi', 'Vivo', 'OPPO', 'Accessories'] },
  { name: 'Laptop', label: 'Mac computers', image: laptopCategory, subcategories: ['Mac'] },
  { name: 'Gift Cards', label: 'Apple, PlayStation, Xbox, Nintendo eShop, Steam, iTunes and Roblox', image: giftCardsCategory, subcategories: ['Apple', 'PlayStation', 'Xbox', 'Nintendo eShop', 'Steam', 'iTunes', 'Roblox'] },
];
export type GiftBrand = { name: string; tone: string; image: string };
export const giftBrands: GiftBrand[] = [
  { name: 'Apple', tone: 'apple', image: appleCard },
  { name: 'PlayStation', tone: 'ps', image: playstationCard },
  { name: 'Xbox', tone: 'xbox', image: xboxCard },
  { name: 'Nintendo eShop', tone: 'nintendo', image: nintendoCard },
  { name: 'Steam', tone: 'steam', image: steamCard },
  { name: 'iTunes', tone: 'itunes', image: itunesCard },
  { name: 'Roblox', tone: 'roblox', image: robloxCard },
];
export const giftAmounts = [1500, 3000, 5000, 8000, 12000, 20000, 35000];
export const shopSearch = (category = 'All', sub = '', q = '', deals = false) => ({ category, sub, q, deals });
export const categories = [
  { name: 'Consoles', label: 'PlayStation & Nintendo', image: consoleImage },
  { name: 'Games', label: 'Your next adventure', image: handheldImage },
  { name: 'Controllers', label: 'Take control', image: controllerImage },
  { name: 'Headsets', label: 'Hear every detail', image: headsetImage },
  { name: 'Keyboards', label: 'Built for every move', image: keyboardImage },
  { name: 'Mice', label: 'Precision meets speed', image: mouseImage },
];
export const money = (value: number) => `Rs. ${value.toLocaleString('en-PK')}`;
export const getProduct = (id: number, source: Product[] = products) => source.find(product => product.id === id) ?? null;
type ProductRow = { id: number; name: string; category: string; group_name: string | null; subcategory: string | null; image_key: string; image_url?: string | null; price: number; old_price: number | null; badge: string | null; description?: string | null; stock?: number | null };
export async function loadProductsFromDatabase(): Promise<Product[] | null> {
  const db = supabase;
  if (!db) return null;
  const read = (columns: string) => db.from('products').select(columns).order('id');
  let result = await read('id,name,category,group_name,subcategory,image_key,image_url,price,old_price,badge,description,stock');
  if (result.error) result = await read('id,name,category,group_name,subcategory,image_key,image_url,price,old_price,badge');
  if (result.error) result = await read('id,name,category,group_name,subcategory,image_key,price,old_price,badge');
  const { data, error } = result;
  if (error || !data?.length) return null;
  return (data as unknown as ProductRow[]).map(row => {
    const product: Product = {
      id: row.id,
      name: row.name,
      category: row.category,
      image: row.image_url || productImages[row.image_key] || consoleImage,
      price: row.price,
    };
    if (row.group_name) product.group = row.group_name;
    if (row.subcategory) product.subcategory = row.subcategory;
    if (row.old_price != null) product.oldPrice = row.old_price;
    if (row.badge) product.badge = row.badge;
    if (row.description) product.description = row.description;
    if (typeof row.stock === 'number') product.stock = row.stock;
    return product;
  });
}
type CategoryRow = { id: number; name: string; label: string | null; sort_order: number };
type SubcategoryRow = { category_id: number; name: string; sort_order: number };
export function mergeCatalog(remote: CatalogGroup[] | null) {
  if (!remote?.length) return catalog;
  const byName = new Map(remote.map(group => [group.name, group]));
  const merged = catalog.map(local => {
    const remoteGroup = byName.get(local.name);
    if (!remoteGroup) return local;
    const subcategories = local.name === 'Gift Cards' ? remoteGroup.subcategories.filter(sub => local.subcategories.includes(sub)) : [...remoteGroup.subcategories];
    for (const sub of local.subcategories) if (!subcategories.includes(sub)) subcategories.push(sub);
    const group: CatalogGroup = { name: local.name, label: local.name === 'Gift Cards' ? local.label : remoteGroup.label || local.label, subcategories };
    const image = local.image ?? remoteGroup.image;
    if (image) group.image = image;
    return group;
  });
  for (const group of remote) if (!catalog.some(local => local.name === group.name)) merged.push(group);
  return merged;
}
export async function loadCatalogFromDatabase(): Promise<CatalogGroup[] | null> {
  if (!supabase) return null;
  const categories = await supabase.from('categories').select('id,name,label,sort_order').order('sort_order');
  if (categories.error || !categories.data?.length) return null;
  const subs = await supabase.from('subcategories').select('category_id,name,sort_order').order('sort_order');
  if (subs.error) return null;
  const images = new Map(catalog.map(group => [group.name, group.image]));
  return (categories.data as CategoryRow[]).map(row => {
    const group: CatalogGroup = {
      name: row.name,
      label: row.label || '',
      subcategories: ((subs.data ?? []) as SubcategoryRow[]).filter(sub => sub.category_id === row.id).sort((a, b) => a.sort_order - b.sort_order).map(sub => sub.name),
    };
    const image = images.get(row.name);
    if (image) group.image = image;
    return group;
  });
}
export type StoreFacts = { name: string; phone: string; whatsappNumber: string; address: string; closingTime: string };
export const defaultFacts: StoreFacts = { name: business.name, phone: business.phone, whatsappNumber: '923235551600', address: business.address, closingTime: business.closingTime };
export async function loadStoreFacts(): Promise<StoreFacts | null> {
  if (!supabase) return null;
  const result = await supabase.from('store_settings').select('store_name,phone,whatsapp_number,address,closing_time').eq('id', 1).maybeSingle();
  if (result.error || !result.data) return null;
  return {
    name: result.data.store_name || business.name,
    phone: result.data.phone || business.phone,
    whatsappNumber: result.data.whatsapp_number || defaultFacts.whatsappNumber,
    address: result.data.address || business.address,
    closingTime: result.data.closing_time || business.closingTime,
  };
}
export async function placeEnquiry(name: string, phone: string, items: { product_id: number; quantity: number }[]) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('place_enquiry', { buyer_name: name, buyer_phone: phone, buyer_note: '', items });
  if (error) throw new Error(error.message);
  return data as string;
}
export async function placeContactMessage(name: string, email: string, phone: string, message: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('place_contact_message', {
    buyer_name: name,
    buyer_email: email,
    buyer_phone: phone,
    buyer_message: message,
  });
  if (error) throw new Error(error.message);
  return data as number;
}
export function filterProducts(category: string, query: string, deals = false, subcategory = '', source: Product[] = products) {
  return source.filter(p => {
    const inGroup = category !== 'All' && p.group === category;
    const inLegacy = category !== 'All' && p.category === category;
    const matchesCategory = category === 'All' || inGroup || inLegacy;
    const matchesSub = !subcategory || (p.group === category && p.subcategory === subcategory);
    return matchesCategory && matchesSub && p.name.toLowerCase().includes(query.toLowerCase()) && (!deals || Boolean(p.oldPrice));
  });
}
export const cartTotal = (cart: Record<number, number>) => products.reduce((sum, p) => sum + p.price * (cart[p.id] ?? 0), 0);