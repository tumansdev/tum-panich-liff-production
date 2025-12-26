import React, { useState } from 'react';
import { Icon } from '../common';
import { useCart } from '../../context/CartContext';

const MenuItemModal = ({ isOpen, onClose, item }) => {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const { addToCart } = useCart();

  if (!isOpen || !item) return null;

  const handleAddToCart = () => {
    // Always add items separately when quantity > 1
    // This allows each item to have its own note
    if (quantity > 1) {
      for (let i = 0; i < quantity; i++) {
        addToCart({
          ...item,
          note: note.trim(),
          forceNewEntry: true, // Always create separate entries
        }, 1);
      }
    } else {
      addToCart({
        ...item,
        note: note.trim(),
        forceNewEntry: true, // Each item is always separate
      }, 1);
    }
    onClose();
    setQuantity(1);
    setNote('');
  };

  const price = parseFloat(item.price) || 0;
  const totalPrice = price * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
        >
          <Icon name="close" className="text-xl text-gray-600" />
        </button>

        {/* Image */}
        <div className="relative h-48 bg-gray-100">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x200?text=🍜';
            }}
          />
          {item.is_recommended && (
            <span className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
              แนะนำ
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5 max-h-[50vh] overflow-y-auto">
          {/* Title & Price */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
              {item.name_en && (
                <p className="text-sm text-gray-500">{item.name_en}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary">฿{price.toFixed(0)}</p>
              {item.rating && (
                <div className="flex items-center gap-1 text-sm text-yellow-500">
                  <Icon name="star" filled className="text-sm" />
                  <span>{item.rating}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-gray-600 text-sm mb-4">{item.description}</p>
          )}

          {/* Special Note */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Icon name="edit_note" className="text-lg mr-1 align-middle" />
              รายละเอียดพิเศษ (ไม่บังคับ)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ไม่ใส่ผัก, เพิ่มพริก, ไม่เอาน้ำซุป..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              rows={2}
            />
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">จำนวน</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Icon name="remove" />
              </button>
              <span className="text-xl font-bold w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
              >
                <Icon name="add" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-0">
          <button
            onClick={handleAddToCart}
            className="w-full py-4 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors active:scale-[0.98]"
          >
            <Icon name="add_shopping_cart" />
            <span>เพิ่มลงตะกร้า</span>
            <span className="ml-2">฿{totalPrice.toFixed(0)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuItemModal;
