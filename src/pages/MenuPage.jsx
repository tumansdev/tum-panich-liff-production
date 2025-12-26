import React, { useState, useEffect } from 'react';
import { Header, BottomNav, CartButton } from '../components/layout';
import { MenuCard, CategoryFilter, PromoBanner, MenuItemModal } from '../components/menu';
import { Loading, Skeleton } from '../components/common';
import { getMenu } from '../services/api';

const MenuPage = ({ onGoToCart }) => {
  const [menuData, setMenuData] = useState({ items: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      setLoading(true);
      const response = await getMenu();
      if (response.success) {
        setMenuData(response.data);
      }
    } catch (err) {
      console.error('Failed to load menu:', err);
      setError('ไม่สามารถโหลดเมนูได้');
      // Use sample data for development
      setMenuData({
        items: getSampleMenuItems(),
        categories: getSampleCategories(),
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter items
  const filteredItems = menuData.items.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.category_id?.toString() === selectedCategory.toString();
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background-light pb-32">
      <Header title="ตั้มพานิช" />

      {/* Promo Banner */}
      <PromoBanner
        title="ก๋วยเตี๋ยวหมูแดง สูตรต้นตำรับ"
        subtitle="หมูแดงย่างถ่าน เส้นทำสดทุกวัน"
        tag="Best Seller"
      />

      {/* Main Content */}
      <main className="px-4">
        {/* Search */}
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            type="text"
            placeholder="ค้นหาเมนู..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        {/* Category Filter */}
        {loading ? (
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="min-w-[80px] h-10 rounded-full" />
            ))}
          </div>
        ) : (
          <CategoryFilter
            categories={menuData.categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        )}

        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-3">
          {loading ? (
            // Skeleton Grid
            [1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
                <Skeleton className="w-full aspect-square rounded-xl mb-3" />
                <Skeleton className="w-3/4 h-4 mb-2" />
                <Skeleton className="w-1/2 h-3 mb-3" />
                <div className="flex justify-between items-center">
                  <Skeleton className="w-1/3 h-5" />
                  <Skeleton className="w-8 h-8 rounded-full" />
                </div>
              </div>
            ))
          ) : (
            filteredItems.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                onClick={() => {
                  if (item.is_available !== false) {
                    setSelectedItem(item);
                    setShowModal(true);
                  }
                }}
              />
            ))
          )}
        </div>

        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <span className="material-symbols-outlined text-5xl mb-2 block">search_off</span>
            <p>ไม่พบเมนูที่คุณค้นหา</p>
          </div>
        )}
      </main>

      {/* Floating Cart Button */}
      <CartButton onClick={onGoToCart} />

      {/* Menu Item Modal */}
      <MenuItemModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
      />
    </div>
  );
};

// Sample data for development
function getSampleCategories() {
  return [
    { id: 1, name: 'แนะนำ', icon: 'local_fire_department' },
    { id: 2, name: 'ก๋วยเตี๋ยว', icon: 'ramen_dining' },
    { id: 3, name: 'ข้าว', icon: 'rice_bowl' },
    { id: 4, name: 'กับข้าว', icon: 'lunch_dining' },
    { id: 5, name: 'ของทานเล่น', icon: 'tapas' },
    { id: 6, name: 'เครื่องดื่ม', icon: 'local_cafe' },
  ];
}

function getSampleMenuItems() {
  return [
    {
      id: 1,
      name: 'บะหมี่หมูแดงย่างถ่าน',
      description: 'เส้นทำเอง เหนียวนุ่ม หมูแดงย่างถ่านหอมๆ',
      price: 60,
      image_url: 'https://images.unsplash.com/photo-1543363363-cf292708307c?q=80&w=1000',
      category_id: 1,
      is_available: true,
      is_recommended: true,
      rating: 4.9,
    },
    {
      id: 2,
      name: 'บะหมี่เกี๊ยวกุ้งหมูแดง',
      description: 'เกี๊ยวกุ้งเต็มคำ ซุปกลมกล่อม',
      price: 70,
      image_url: 'https://images.unsplash.com/photo-1596626690463-c79435b7194d?q=80&w=1000',
      category_id: 1,
      is_available: true,
      rating: 4.8,
    },
    {
      id: 3,
      name: 'ข้าวหมูแดงไข่ยางมะตูม',
      description: 'น้ำราดสูตรลับ เคี่ยวจนเข้มข้น',
      price: 60,
      image_url: 'https://images.unsplash.com/photo-1626804475297-411d0c1737e4?q=80&w=1000',
      category_id: 3,
      is_available: true,
      rating: 4.7,
    },
    {
      id: 4,
      name: 'หมูแดงสับ (จานใหญ่)',
      description: 'สำหรับทานเล่น หรือแกล้ม หมักเข้าเนื้อ',
      price: 150,
      image_url: 'https://images.unsplash.com/photo-1555126634-323283e090fa?q=80&w=1000',
      category_id: 4,
      is_available: true,
      rating: 4.9,
    },
    {
      id: 5,
      name: 'เกี๊ยวหมูทอด',
      description: 'กรอบนอก นุ่มใน น้ำจิ้มรสเด็ด',
      price: 40,
      image_url: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?q=80&w=2070',
      category_id: 5,
      is_available: true,
      rating: 4.6,
    },
    {
      id: 6,
      name: 'ชาเย็น',
      description: 'ชาไทยหอมหวาน',
      price: 25,
      image_url: 'https://images.unsplash.com/photo-1558857563-b371033873b8?q=80&w=1000',
      category_id: 6,
      is_available: true,
      rating: 4.5,
    },
  ];
}

export default MenuPage;
