import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const MenuPage = () => {
  const { apiCall } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadMenu();
    loadCategories();
  }, []);

  const loadMenu = async () => {
    setIsLoading(true);
    try {
      const result = await apiCall('/admin/menu');
      if (result.success) {
        setMenuItems(result.data);
      }
    } catch (err) {
      console.error('Menu error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const result = await apiCall('/menu/categories');
      if (result.success) {
        setCategories(result.data);
      }
    } catch (err) {
      console.error('Categories error:', err);
    }
  };

  const toggleAvailable = async (item) => {
    try {
      await apiCall(`/admin/menu/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: !item.is_available }),
      });
      loadMenu();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editItem) {
        await apiCall(`/admin/menu/${editItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData),
        });
      } else {
        await apiCall('/admin/menu', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }
      loadMenu();
      setEditItem(null);
      setShowAddModal(false);
    } catch (err) {
      console.error('Save error:', err);
      alert('ไม่สามารถบันทึกได้');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('ต้องการลบเมนูนี้?')) return;
    try {
      await apiCall(`/admin/menu/${id}`, { method: 'DELETE' });
      loadMenu();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Group by category
  const groupedMenu = menuItems.reduce((acc, item) => {
    const cat = item.category_name || 'อื่นๆ';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">จัดการเมนู</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          เพิ่มเมนู
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedMenu).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-lg font-bold text-gray-700 mb-4">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl p-4 shadow-sm border ${!item.is_available ? 'opacity-50 border-red-200' : 'border-gray-100'
                      }`}
                  >
                    <div className="flex gap-4">
                      <img
                        src={item.image_url || '/logo.png'}
                        alt={item.name}
                        className="w-20 h-20 rounded-xl object-cover"
                        onError={(e) => (e.target.src = '/logo.png')}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
                        <p className="text-primary font-bold">฿{item.price}</p>
                        <div className="flex gap-1 mt-2">
                          {item.is_recommended && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">แนะนำ</span>
                          )}
                          {!item.is_available && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">หมด</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => toggleAvailable(item)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${item.is_available
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                      >
                        {item.is_available ? 'ตั้งเป็นหมด' : 'พร้อมขาย'}
                      </button>
                      <button
                        onClick={() => setEditItem(item)}
                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-2 bg-gray-100 text-red-600 rounded-xl hover:bg-red-100"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editItem) && (
        <MenuModal
          item={editItem}
          categories={categories}
          onClose={() => {
            setEditItem(null);
            setShowAddModal(false);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

const MenuModal = ({ item, categories, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: item?.name || '',
    nameEn: item?.name_en || '',
    description: item?.description || '',
    price: item?.price || '',
    imageUrl: item?.image_url || '',
    categoryId: item?.category_id || '',
    isAvailable: item?.is_available ?? true,
    isRecommended: item?.is_recommended ?? false,
    isSpicy: item?.is_spicy ?? false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      alert('กรุณากรอกชื่อและราคา');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b p-6">
          <h2 className="text-xl font-bold">{item ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">ชื่อเมนู *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">ราคา (บาท) *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">หมวดหมู่</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">URL รูปภาพ</label>
            <input
              type="text"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">คำอธิบาย</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary"
              rows={2}
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isRecommended}
                onChange={(e) => setForm({ ...form, isRecommended: e.target.checked })}
                className="w-5 h-5 rounded text-primary"
              />
              แนะนำ
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isSpicy}
                onChange={(e) => setForm({ ...form, isSpicy: e.target.checked })}
                className="w-5 h-5 rounded text-primary"
              />
              เผ็ด
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuPage;
