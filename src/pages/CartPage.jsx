import React, { useState } from 'react';
import { Icon, Button, ConfirmModal } from '../components/common';
import { useCart } from '../context/CartContext';

const CartPage = ({ onBack, onCheckout }) => {
  const { cart, updateQty, removeFromCart, clearCart, subtotal, totalItems, updateItemNote } = useCart();
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, index: null, item: null });

  const handleDecrease = (index, item) => {
    if (item.qty === 1) {
      // Show confirmation when reducing to 0
      setDeleteConfirm({ show: true, index, item });
    } else {
      updateQty(index, -1);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.index !== null) {
      removeFromCart(deleteConfirm.index);
    }
    setDeleteConfirm({ show: false, index: null, item: null });
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background-light">
        <Header title="ตะกร้าสินค้า" showBack onBack={onBack} />
        <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
          <Icon name="shopping_cart" className="text-7xl mb-4 text-gray-300" />
          <p className="text-lg font-medium">ตะกร้าว่างเปล่า</p>
          <p className="text-sm mt-2">เพิ่มสินค้าเพื่อเริ่มสั่งอาหาร</p>
          <Button onClick={onBack} variant="primary" className="mt-6">
            ดูเมนู
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light pb-40">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Icon name="arrow_back_ios_new" className="text-xl" />
            </button>
            <h1 className="font-bold text-lg text-gray-900">ตะกร้าสินค้า</h1>
          </div>
          <button
            onClick={clearCart}
            className="text-red-500 text-sm font-medium hover:text-red-600"
          >
            ล้างทั้งหมด
          </button>
        </div>
      </header>

      {/* Cart Items */}
      <main className="px-4 py-4">
        <div className="space-y-3">
          {cart.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex gap-4">
                {/* Image */}
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                  <p className="text-primary font-bold mt-1">฿{item.price}</p>

                  {/* Note */}
                  <div className="mt-1">
                    {item.note ? (
                      <button
                        onClick={() => {
                          const newNote = prompt('แก้ไขรายละเอียดพิเศษ:', item.note);
                          if (newNote !== null) {
                            updateItemNote(index, newNote);
                          }
                        }}
                        className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Icon name="edit_note" className="text-sm" />
                        <span className="truncate max-w-[120px]">{item.note}</span>
                        <Icon name="edit" className="text-xs" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const newNote = prompt('เพิ่มรายละเอียดพิเศษ:', '');
                          if (newNote) {
                            updateItemNote(index, newNote);
                          }
                        }}
                        className="text-xs text-gray-400 flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        <Icon name="add" className="text-sm" />
                        <span>เพิ่มหมายเหตุ</span>
                      </button>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => handleDecrease(index, item)}
                        className="w-8 h-8 rounded-md hover:bg-white flex items-center justify-center transition-colors"
                      >
                        <Icon name={item.qty === 1 ? 'delete' : 'remove'} className="text-lg" />
                      </button>
                      <span className="w-6 text-center font-bold">{item.qty}</span>
                      <button
                        onClick={() => updateQty(index, 1)}
                        className="w-8 h-8 rounded-md bg-primary text-white flex items-center justify-center"
                      >
                        <Icon name="add" className="text-lg" />
                      </button>
                    </div>
                    <span className="font-bold text-gray-900">
                      ฿{(item.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add More */}
        <button
          onClick={onBack}
          className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors"
        >
          <Icon name="add" className="text-xl" />
          <span>เพิ่มรายการอื่น</span>
        </button>
      </main>

      {/* Bottom Summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-bottom">
        <div className="max-w-lg mx-auto">
          {/* Summary */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">รวม ({totalItems} รายการ)</span>
            <span className="text-2xl font-bold text-gray-900">฿{subtotal.toLocaleString()}</span>
          </div>

          {/* Checkout Button */}
          <Button onClick={onCheckout} variant="primary" size="lg" className="w-full" iconRight="arrow_forward">
            ดำเนินการสั่งซื้อ
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, index: null, item: null })}
        onConfirm={handleConfirmDelete}
        title="ลบรายการนี้?"
        message={`คุณต้องการลบ "${deleteConfirm.item?.name}" ออกจากตะกร้าหรือไม่?`}
        confirmText="ลบ"
        cancelText="ยกเลิก"
        type="danger"
      />
    </div>
  );
};

// Simple Header for this page
const Header = ({ title, showBack, onBack }) => (
  <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 safe-area-top">
    <div className="flex items-center gap-3 max-w-lg mx-auto">
      {showBack && (
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
          <Icon name="arrow_back_ios_new" className="text-xl" />
        </button>
      )}
      <h1 className="font-bold text-lg text-gray-900">{title}</h1>
    </div>
  </header>
);

export default CartPage;
