import { createContext, useContext, useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';
type ShoppingState = {
  cart: Record<number, number>; setCart: Dispatch<SetStateAction<Record<number, number>>>;
  favorites: number[]; setFavorites: Dispatch<SetStateAction<number[]>>;
};
const ShoppingContext = createContext<ShoppingState | null>(null);
export function ShoppingProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Record<number, number>>({});
  const [favorites, setFavorites] = useState<number[]>([]);
  return <ShoppingContext.Provider value={{ cart, setCart, favorites, setFavorites }}>{children}</ShoppingContext.Provider>;
}
export function useShopping() {
  const value = useContext(ShoppingContext);
  if (!value) throw new Error('ShoppingProvider is required');
  return value;
}