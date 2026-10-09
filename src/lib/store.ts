import consoleImage from '@/assets/product-0.jpg';
import controllerImage from '@/assets/product-1.jpg';
import headsetImage from '@/assets/product-2.jpg';
import keyboardImage from '@/assets/product-3.jpg';
import mouseImage from '@/assets/product-4.jpg';
import handheldImage from '@/assets/product-5.jpg';
import gameImage from '@/assets/games-banner.jpg';

export const business = {
  name: 'GAME PLAY', rating: 4.8, reviews: 76,
  address: '1st Floor, 66B, Sector C Commercial Area, Bahria Town, Lahore, 56000, Pakistan',
  phone: '0323 5551600', closingTime: '11:30 PM',
};
export const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.name} ${business.address}`)}`;
export const whatsapp = (text: string) => `https://wa.me/923235551600?text=${encodeURIComponent(text)}`;
export type Product = { id: number; name: string; category: string; image: string; price: number; oldPrice?: number; badge?: string };
export const products: Product[] = [
  { id: 1, name: 'PlayStation 5 Slim — Disc Edition, 1TB', category: 'Consoles', image: consoleImage, price: 169999, oldPrice: 179999, badge: 'BEST SELLER' },
  { id: 2, name: 'DualSense Wireless Controller — White', category: 'Controllers', image: controllerImage, price: 19999, oldPrice: 22499, badge: 'HOT DEAL' },
  { id: 3, name: 'Premium Over-Ear Gaming Headset', category: 'Headsets', image: headsetImage, price: 12499 },
  { id: 4, name: 'Nintendo Switch — Neon Blue & Red', category: 'Consoles', image: handheldImage, price: 74999, badge: 'POPULAR' },
  { id: 5, name: 'RGB Mechanical Gaming Keyboard', category: 'Keyboards', image: keyboardImage, price: 14999, oldPrice: 17999, badge: 'HOT DEAL' },
  { id: 6, name: 'Wireless Performance Gaming Mouse', category: 'Mice', image: mouseImage, price: 8999 },
  { id: 7, name: 'Action & Adventure — PlayStation Games', category: 'Games', image: gameImage, price: 14999, badge: 'NEW ARRIVAL' },
  { id: 8, name: 'DualSense Controller & Headset Bundle', category: 'Controllers', image: controllerImage, price: 29999, oldPrice: 32498, badge: 'BUNDLE DEAL' },
];
export const categories = [
  { name: 'Consoles', label: 'PlayStation & Nintendo', image: consoleImage },
  { name: 'Games', label: 'Your next adventure', image: handheldImage },
  { name: 'Controllers', label: 'Take control', image: controllerImage },
  { name: 'Headsets', label: 'Hear every detail', image: headsetImage },
  { name: 'Keyboards', label: 'Built for every move', image: keyboardImage },
  { name: 'Mice', label: 'Precision meets speed', image: mouseImage },
];
export const money = (value: number) => `Rs. ${value.toLocaleString('en-PK')}`;
export function filterProducts(category: string, query: string, deals = false) {
  return products.filter(p => (category === 'All' || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase()) && (!deals || Boolean(p.oldPrice)));
}
export const cartTotal = (cart: Record<number, number>) => products.reduce((sum, p) => sum + p.price * (cart[p.id] ?? 0), 0);