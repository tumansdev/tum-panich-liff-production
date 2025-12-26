import React from 'react';
import { Icon } from '../common';
import { useCart } from '../../context/CartContext';

const MenuCard = ({ item, onClick }) => {
  const { addToCart, cart, removeFromCart } = useCart();

  // Count how many separate cart entries exist for this item
  const inCart = cart.filter(cartItem => cartItem.id === item.id).reduce((sum, i) => sum + i.qty, 0);

  // Always add as a new separate entry so each item can have its own note
  const handleAddItem = (e) => {
    e.stopPropagation();
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image_url,
      note: '',
      forceNewEntry: true, // Each click creates a new separate item
    }, 1);
  };

  // Remove the last added item with this id
  const handleRemoveOne = (e) => {
    e.stopPropagation();
    // Find the last cart item with this id and remove it
    const lastIndex = cart.map((c, i) => ({ ...c, index: i }))
      .filter(c => c.id === item.id)
      .pop()?.index;
    if (lastIndex !== undefined) {
      removeFromCart(lastIndex);
    }
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl p-3 shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer"
    >
      <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Rating badge */}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
          <Icon name="star" className="text-yellow-500 text-sm" filled />
          <span className="text-xs font-bold">{item.rating || '5.0'}</span>
        </div>
        {/* Tags */}
        {item.is_spicy && (
          <div className="absolute top-2 left-2 bg-primary text-white px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">
            Spicy
          </div>
        )}
        {item.is_vegan && (
          <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">
            Vegan
          </div>
        )}
        {/* Sold out overlay */}
        {!item.is_available && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-600/90 text-white px-3 py-1.5 rounded-xl text-sm font-bold uppercase tracking-widest shadow-lg border border-white/20 transform -rotate-6">
              หมด
            </span>
          </div>
        )}
      </div>

      <h3 className="font-bold text-gray-900 line-clamp-1 mb-1">{item.name}</h3>
      <p className="text-xs text-gray-500 line-clamp-2 mb-3 h-8">{item.description}</p>

      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-primary">฿{item.price}</span>

        {!item.is_available ? (
          <button
            disabled
            className="h-9 w-9 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center cursor-not-allowed"
          >
            <Icon name="block" className="text-xl" />
          </button>
        ) : inCart > 0 ? (
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={handleRemoveOne}
              className="w-7 h-7 rounded-md hover:bg-white flex items-center justify-center transition-colors"
            >
              <Icon name="remove" className="text-sm" />
            </button>
            <span className="w-5 text-center text-sm font-bold">{inCart}</span>
            <button
              onClick={handleAddItem}
              className="w-7 h-7 rounded-md bg-primary text-white flex items-center justify-center"
            >
              <Icon name="add" className="text-sm" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddItem}
            className="h-9 w-9 rounded-full bg-gray-100 hover:bg-primary hover:text-white text-gray-900 flex items-center justify-center transition-colors"
          >
            <Icon name="add" className="text-xl" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MenuCard;
