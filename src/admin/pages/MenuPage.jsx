import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const MenuPage = () => {
  const { apiCall } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [menuRes, catRes] = await Promise.all([
        apiCall('/admin/menu'),
        apiCall('/menu/categories')
      ]);

      if (menuRes.success) setMenuItems(menuRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error('Load Error:', err);
    } finally {
      setIsLoading(false);
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
      loadData();
      setEditItem(null);
      setShowAddModal(false);
    } catch (err) {
      console.error('Save error:', err);
      alert('บันทึกไม่สำเร็จ: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('ยืนยันการลบเมนูนี้?')) return;
    try {
      await apiCall(`/admin/menu/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error('Delete error:', err);
      alert('ลบไม่สำเร็จ');
    }
  };

  const toggleAvailable = async (item) => {
    try {
      await apiCall(`/admin/menu/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: !item.is_available }),
      });
      loadData();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  // Filter items
  const filteredItems = menuItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === 'all' || item.category_id.toString() === filterCategory;
    return matchSearch && matchCat;
  });

  // Group handling
  const uniqueCategories = [...new Set(menuItems.map(i => i.category_name || 'Uncategorized'))];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการเมนูอาหาร</h1>
          <p className="text-gray-500">ทั้งหมด {menuItems.length} รายการ</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/30"
        >
          <span className="material-symbols-outlined">add</span>
          เพิ่มเมนูใหม่
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            type="text"
            placeholder="ค้นหาเมนู..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
        >
          <option value="all">ทุกหมวดหมู่</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              onEdit={() => setEditItem(item)}
              onDelete={() => handleDelete(item.id)}
              onToggle={() => toggleAvailable(item)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {(showAddModal || editItem) && (
        <MenuModal
          item={editItem}
          categories={categories}
          apiCall={apiCall}
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

// Sub-components for better readability

const MenuCard = ({ item, onEdit, onDelete, onToggle }) => (
  <div className={`group bg-white rounded-2xl p-4 shadow-sm border transition-all hover:shadow-md ${!item.is_available ? 'opacity-75 border-gray-200 bg-gray-50' : 'border-gray-100'}`}>
    <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-gray-100">
      <img
        src={item.image_url || '/placeholder-food.png'}
        alt={item.name}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
        onError={(e) => (e.target.src = 'https://placehold.co/400x400?text=No+Image')}
      />
      {!item.is_available && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">หมด</span>
        </div>
      )}
      <div className="absolute top-2 right-2 flex gap-1">
        {item.is_recommended && <span className="bg-yellow-400 text-white text-xs px-2 py-1 rounded-full shadow-sm">แนะนำ</span>}
        {item.is_spicy && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">เผ็ด</span>}
      </div>
    </div>

    <div className="mb-4">
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-bold text-gray-900 line-clamp-1">{item.name}</h3>
        <span className="font-bold text-primary">฿{item.price}</span>
      </div>
      <p className="text-xs text-gray-500 mb-2">{item.category_name}</p>
      <p className="text-sm text-gray-600 line-clamp-2 h-10">{item.description || '-'}</p>
    </div>

    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
      <button
        onClick={onToggle}
        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${item.is_available
            ? 'bg-red-50 text-red-600 hover:bg-red-100'
            : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}
      >
        {item.is_available ? 'ปิดรับ' : 'เปิดขาย'}
      </button>
      <button onClick={onEdit} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
        <span className="material-symbols-outlined text-lg">edit</span>
      </button>
      <button onClick={onDelete} className="p-2 bg-gray-100 text-red-600 rounded-lg hover:bg-red-100">
        <span className="material-symbols-outlined text-lg">delete</span>
      </button>
    </div>
  </div>
);

const MenuModal = ({ item, categories, onClose, onSave, apiCall }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: item?.name || '',
    nameEn: item?.name_en || '',
    description: item?.description || '',
    price: item?.price || '',
    imageUrl: item?.image_url || '',
    categoryId: item?.category_id || (categories[0]?.id || ''),
    isAvailable: item?.is_available ?? true,
    isRecommended: item?.is_recommended ?? false,
    isSpicy: item?.is_spicy ?? false,
    isVegan: item?.is_vegan ?? false,
  });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await apiCall('/admin/menu/upload', {
        method: 'POST',
        body: formData
      });
      if (res.success) {
        setForm(prev => ({ ...prev, imageUrl: res.data.imageUrl }));
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('อัพโหลดรูปภาพไม่สำเร็จ');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in-up">

        {/* Modal Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">{item ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Image Upload Section */}
            <div className="flex flex-col items-center justify-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-40 h-40 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-all overflow-hidden group"
              >
                {form.imageUrl ? (
                  <>
                    <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-sm font-medium">เปลี่ยนรูปภาพ</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-400">
                    <span className="material-symbols-outlined text-4xl mb-1">add_photo_alternate</span>
                    <p className="text-xs">คลิกเพื่ออัพโหลด</p>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <p className="text-xs text-gray-500 mt-2">รองรับ JPG, PNG (Max 5MB)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">ชื่อเมนู (ไทย) *</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="เช่น ข้าวกะเพราหมูสับ"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">ชื่อเมนู (อังกฤษ)</label>
                  <input
                    type="text"
                    value={form.nameEn}
                    onChange={e => setForm({ ...form, nameEn: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="e.g. Basil Pork Rice"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">หมวดหมู่</label>
                  <select
                    value={form.categoryId}
                    onChange={e => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">ราคา (บาท) *</label>
                  <input
                    required
                    type="number"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={form.isRecommended}
                      onChange={e => setForm({ ...form, isRecommended: e.target.checked })}
                      className="w-5 h-5 text-primary rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">รายการแนะนำ</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={form.isSpicy}
                      onChange={e => setForm({ ...form, isSpicy: e.target.checked })}
                      className="w-5 h-5 text-red-500 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">รสเผ็ด</span>
                  </label>
                </div>

                <label className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={e => setForm({ ...form, isAvailable: e.target.checked })}
                    className="w-5 h-5 text-green-500 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">พร้อมขายทันที</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">คำอธิบายเพิ่มเติม</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none h-24 resize-none"
                placeholder="รายละเอียดเมนู..."
              />
            </div>

          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t bg-gray-50 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUploading}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors shadow-lg shadow-primary/30 disabled:opacity-50"
          >
            {isUploading ? 'กำหลังอัพโหลด...' : 'บันทึกข้อมูล'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default MenuPage;
