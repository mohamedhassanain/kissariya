import { createContext } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  shop_id: string;
  shop_name: string;
  whatsapp_number: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  cartByShop: Record<string, CartItem[]>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);