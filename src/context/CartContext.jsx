import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('tumpanich_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('tumpanich_cart', JSON.stringify(cart));
  }, [cart]);

  // Add item to cart
  // Items with same id but different notes are treated as separate entries
  // Items with notes get a unique cartItemId to prevent merging
  const addToCart = (item, qty = 1) => {
    setCart((prev) => {
      // If item has a note, check if we should force separate entry
      const hasNote = item.note && item.note.trim() !== '';
      const forceNewEntry = item.forceNewEntry || false;

      // Only try to merge if there's no note and not forcing new entry
      if (!hasNote && !forceNewEntry) {
        // Check if item with same id AND no note exists
        const existingIndex = prev.findIndex(
          (i) => i.id === item.id &&
            !i.note &&
            JSON.stringify(i.options) === JSON.stringify(item.options)
        );

        if (existingIndex > -1) {
          // Update quantity for matching item
          const updated = [...prev];
          updated[existingIndex].qty += qty;
          return updated;
        }
      }

      // Add as new item with unique cartItemId
      const cartItemId = `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return [...prev, {
        ...item,
        cartItemId,
        qty: qty,
        note: item.note || '',
      }];
    });
  };

  // Update item quantity
  const updateQty = (index, delta) => {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[index].qty + delta;

      if (newQty <= 0) {
        // Remove item
        updated.splice(index, 1);
      } else {
        updated[index].qty = newQty;
      }

      return updated;
    });
  };

  // Update item by id
  const updateQtyById = (id, delta) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  // Remove item from cart
  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove by id
  const removeById = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Update item note
  const updateItemNote = (index, note) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index].note = note;
      return updated;
    });
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('tumpanich_cart');
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  // Get item quantity by id
  const getItemQty = (id) => {
    const item = cart.find((i) => i.id === id);
    return item ? item.qty : 0;
  };

  const value = {
    cart,
    addToCart,
    updateQty,
    updateQtyById,
    removeFromCart,
    removeById,
    updateItemNote,
    clearCart,
    subtotal,
    totalItems,
    getItemQty,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
