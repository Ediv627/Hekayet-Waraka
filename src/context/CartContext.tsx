import React, { createContext, useContext, useState, useCallback } from 'react';
import { Product, CartItem, ProductVariant } from '@/types/product';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, variant?: ProductVariant) => void;
  removeFromCart: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Composite key: product id + variant id (or 'base')
export const getCartItemKey = (item: CartItem | { id: string; selectedVariant?: ProductVariant }): string =>
  `${item.id}__${item.selectedVariant?.id || 'base'}`;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: Product, variant?: ProductVariant) => {
    setItems((prevItems) => {
      const newKey = `${product.id}__${variant?.id || 'base'}`;
      const existingItem = prevItems.find((item) => getCartItemKey(item) === newKey);
      if (existingItem) {
        return prevItems.map((item) =>
          getCartItemKey(item) === newKey ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      const effectivePrice = variant ? variant.price : product.price;
      return [...prevItems, { ...product, price: effectivePrice, quantity: 1, selectedVariant: variant }];
    });
  }, []);

  const removeFromCart = useCallback((key: string) => {
    setItems((prevItems) => prevItems.filter((item) => getCartItemKey(item) !== key));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => getCartItemKey(item) !== key));
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        getCartItemKey(item) === key ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const finalPrice = item.price - (item.discount || 0);
    return sum + finalPrice * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
