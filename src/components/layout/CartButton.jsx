import React from 'react';
import { Icon } from '../common';
import { useCart } from '../../context/CartContext';

const CartButton = ({ onClick }) => {
  const { totalItems, subtotal } = useCart();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-30 flex justify-center">
      <button
        onClick={onClick}
        className="w-full max-w-lg bg-gray-900 text-white p-4 rounded-2xl shadow-xl flex justify-between items-center hover:scale-[1.02] transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold animate-bounce">
            {totalItems}
          </div>
          <span className="text-gray-300 text-sm">รายการในตะกร้า</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">฿{subtotal.toLocaleString()}</span>
          <Icon name="arrow_forward" className="text-gray-500" />
        </div>
      </button>
    </div>
  );
};

export default CartButton;
