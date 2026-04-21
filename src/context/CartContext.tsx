import React, { createContext, useContext, useState, useCallback } from "react";
import { Product, CartItem, ProductVariant } from "@/types/product";

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, variant?: ProductVariant) => void;
  removeFromCart: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const buildCartKey = (productId: string, variant?: ProductVariant) =>
  variant ? `${productId}::${variant.id ?? variant.label}` : productId;

const itemKey = (item: CartItem) => buildCartKey(item.id, item.selectedVariant);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback(
    (product: Product, variant?: ProductVariant) => {
      setItems((prevItems) => {
        const key = buildCartKey(product.id, variant);
        const existingItem = prevItems.find((item) => itemKey(item) === key);
        if (existingItem) {
          return prevItems.map((item) =>
            itemKey(item) === key
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          );
        }
        // If a variant is provided, override the price with the variant price
        const effectivePrice = variant ? variant.price : product.price;
        return [
          ...prevItems,
          {
            ...product,
            price: effectivePrice,
            quantity: 1,
            selectedVariant: variant,
          },
        ];
      });
    },
    [],
  );

  const removeFromCart = useCallback((cartKey: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => itemKey(item) !== cartKey),
    );
  }, []);

  const updateQuantity = useCallback((cartKey: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => itemKey(item) !== cartKey));
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        itemKey(item) === cartKey ? { ...item, quantity } : item,
      ),
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
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const getCartItemKey = (item: CartItem): string =>
  item.selectedVariant
    ? `${item.id}::${item.selectedVariant.id ?? item.selectedVariant.label}`
    : item.id;
