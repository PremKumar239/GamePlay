import consoleImage from '@/assets/product-0.jpg';
import controllerImage from '@/assets/product-1.jpg';
import headsetImage from '@/assets/product-2.jpg';
import keyboardImage from '@/assets/product-3.jpg';
import mouseImage from '@/assets/product-4.jpg';
import handheldImage from '@/assets/product-5.jpg';
import gameImage from '@/assets/games-banner.jpg';
import xboxImage from '@/assets/gift-xbox.jpg';
import giftImage from '@/assets/gift-playstation.jpg';
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
  phone: '0323 5551600', closingTime: '11:30 PM',
};
export const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.name} ${business.address}`)}`;
export const whatsapp = (text: string) => `https://wa.me/923235551600?text=${encodeURIComponent(text)}`;
export type Product = { id: number; name: string; category: string; image: string; price: number; oldPrice?: number; badge?: string; group?: string; subcategory?: string };
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
  { name: 'PlayStation', label: 'Games, controllers, consoles and accessories', image: consoleImage, subcategories: ['Games', 'Controllers', 'Consoles', 'Accessories'] },
  { name: 'Xbox', label: 'Controllers, consoles and accessories', image: xboxImage, subcategories: ['Controllers', 'Consoles', 'Accessories'] },
  { name: 'Meta', label: 'Consoles and accessories', subcategories: ['Consoles', 'Accessories'] },
  { name: 'Nintendo', label: 'Games, controllers, consoles and accessories', image: handheldImage, subcategories: ['Games', 'Controllers', 'Consoles', 'Accessories'] },
  { name: 'Mobiles', label: 'Apple, Samsung, Mi and accessories', subcategories: ['Apple', 'Samsung', 'Mi', 'Accessories'] },
  { name: 'Laptop', label: 'Mac computers', subcategories: ['Mac'] },
  { name: 'Gift Cards', label: 'Ask the store about available cards', image: giftImage, subcategories: [] },
];
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
type ProductRow = { id: number; name: string; category: string; group_name: string | null; subcategory: string | null; image_key: string; price: number; old_price: number | null; badge: string | null };
export async function loadProductsFromDatabase(): Promise<Product[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('products').select('id,name,category,group_name,subcategory,image_key,price,old_price,badge').order('id');
  if (error || !data?.length) return null;
  return (data as ProductRow[]).map(row => ({
    id: row.id,
    name: row.name,
    category: row.category,
    group: row.group_name ?? undefined,
    subcategory: row.subcategory ?? undefined,
    image: productImages[row.image_key] ?? consoleImage,
    price: row.price,
    oldPrice: row.old_price ?? undefined,
    badge: row.badge ?? undefined,
  }));
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