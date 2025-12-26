import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { printReceipt } from '../utils/printUtils';

const WalkInPOS = ({ onOrderCreated }) => {
  const { apiCall } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const [menuRes, catRes] = await Promise.all([
        apiCall('/admin/menu'),
        apiCall('/menu/categories')
      ]);
      if (menuRes.success) setMenuItems(menuRes.data.filter(i => i.is_available));
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error('Data load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, note: '' }];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(i => i.quantity > 0));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);

    try {
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const payload = {
        lineUserId: 'Walk-in', // Special ID for walk-in
        items: cart.map(i => ({
          menuItemId: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          note: i.note
        })),
        deliveryType: 'pickup',
        deliveryAddress: 'Walk-in',
        deliveryLat: 0,
        deliveryLng: 0,
        subtotal: total,
        deliveryFee: 0,
        discount: 0,
        total: total,
      };

      const res = await apiCall('/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        // Auto Print Receipt
        try {
          // Flatten items for printer if needed, but API usually returns structured data
          // We need the full order object. The response might just be {success:true, data: {id: ...}}
          // If api returns full order, great. If not, we might construct it or fetch it.
          // Let's assume res.data is the order object.
          printReceipt(res.data);
        } catch (e) {
          console.error('Print failed', e);
          alert('ปริ้นใบเสร็จไม่สำเร็จ (แต่บันทึกออเดอร์แล้ว)');
        }

        alert('สร้างออเดอร์สำเร็จ!');
        setCart([]);
        if (onOrderCreated) onOrderCreated();
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('สร้างออเดอร์ไม่สำเร็จ');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return menuItems;
    return menuItems.filter(i => i.category_id.toString() === selectedCategory);
  }, [menuItems, selectedCategory]);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="flex h-full gap-4">
      {/* Menu Area (Left) */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Category Tabs */}
        <div className="flex gap-2 p-4 overflow-x-auto border-b border-gray-100">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px - 4 py - 2 rounded - lg whitespace - nowrap transition - colors ${selectedCategory === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } `}
          >
            ทั้งหมด
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id.toString())}
              className={`px - 4 py - 2 rounded - lg whitespace - nowrap transition - colors ${selectedCategory === cat.id.toString() ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } `}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="cursor-pointer group flex flex-col border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow active:scale-95 duration-100"
                >
                  <div className="h-32 bg-gray-100 overflow-hidden relative">
                    <img
                      src={item.image_url || '/placeholder-food.png'}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => (e.target.src = 'https://placehold.co/300x300?text=Food')}
                    />
                    <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-md text-xs font-bold text-gray-900 shadow-sm">
                      ฿{item.price}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 line-clamp-1">{item.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar (Right) */}
      <div className="w-96 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined">shopping_cart</span>
            ตะกร้าสินค้า
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              <span className="material-symbols-outlined text-4xl mb-2">remove_shopping_cart</span>
              <p>เลือกเมนูเพื่อเริ่มสั่ง</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center group">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">฿{item.price} x {item.quantity}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <span className="font-medium w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-between items-end mb-4">
            <span className="text-gray-600">ยอดรวม</span>
            <span className="text-2xl font-bold text-primary">฿{total.toLocaleString()}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkoutLoading}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {checkoutLoading ? 'กำลังบันทึก...' : 'รับเงิน / สั่งออเดอร์'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalkInPOS;
