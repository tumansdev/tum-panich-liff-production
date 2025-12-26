import React, { useState, useEffect } from 'react';
import { Icon, Loading } from '../components/common';
import { useUser } from '../context/UserContext';
import { getOrdersByUser, ORDER_STATUS } from '../services/api';

const OrderHistoryPage = ({ onViewOrder }) => {
  const { user, getAuthForApi } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user?.userId) return;

    try {
      setLoading(true);
      // Use auth object with access token for secure API call
      const auth = getAuthForApi();
      const response = await getOrdersByUser(user.userId, auth);
      if (response.success) {
        setOrders(response.data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      // Use sample data for development
      setOrders(getSampleOrders());
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    if (filter === 'active') {
      return ['pending', 'confirmed', 'cooking', 'ready', 'out_for_delivery'].includes(order.status);
    }
    if (filter === 'completed') {
      return ['delivered', 'completed', 'cancelled'].includes(order.status);
    }
    return true;
  });

  if (loading) {
    return <Loading message="กำลังโหลดประวัติ..." />;
  }

  return (
    <div className="min-h-screen bg-background-light pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 safe-area-top">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Icon name="receipt_long" className="text-primary text-2xl" />
          <h1 className="font-bold text-lg text-gray-900">ประวัติการสั่งซื้อ</h1>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="px-4 py-4">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'active', label: 'กำลังดำเนินการ' },
            { id: 'completed', label: 'เสร็จสิ้น' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${filter === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <main className="px-4 space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Icon name="receipt_long" className="text-6xl text-gray-300 mb-3" />
            <p className="font-medium">ยังไม่มีออเดอร์</p>
            <p className="text-sm mt-1">สั่งอาหารเพื่อเริ่มต้นใช้งาน</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id || order.order_number}
              order={order}
              onClick={() => onViewOrder(order)}
            />
          ))
        )}
      </main>
    </div>
  );
};

const OrderCard = ({ order, onClick }) => {
  const status = ORDER_STATUS[order.status] || ORDER_STATUS.pending;
  const orderDate = new Date(order.created_at);

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-gray-900">{order.order_number}</p>
          <p className="text-xs text-gray-500">
            {orderDate.toLocaleDateString('th-TH', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{
            backgroundColor: `${getStatusColor(order.status)}20`,
            color: getStatusColor(order.status),
          }}
        >
          <Icon name={status.icon} className="text-sm align-middle mr-1" />
          {status.label}
        </div>
      </div>

      {/* Items Preview */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex -space-x-2">
          {(order.items || []).slice(0, 3).map((item, i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden"
            >
              <img
                src={item.image_url || 'https://via.placeholder.com/40'}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {(order.items?.length || 0) > 3 && (
            <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
              +{order.items.length - 3}
            </div>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {order.items?.length || 0} รายการ
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-gray-500 text-sm">ยอดรวม</span>
        <span className="font-bold text-primary">
          ฿{(order.total || 0).toLocaleString()}
        </span>
      </div>
    </button>
  );
};

function getStatusColor(status) {
  const colors = {
    pending: '#F59E0B',
    confirmed: '#3B82F6',
    cooking: '#F97316',
    ready: '#10B981',
    out_for_delivery: '#8B5CF6',
    delivered: '#10B981',
    completed: '#10B981',
    cancelled: '#EF4444',
  };
  return colors[status] || '#6B7280';
}

function getSampleOrders() {
  return [
    {
      id: 1,
      order_number: 'TP-ABC123',
      status: 'cooking',
      total: 180,
      created_at: new Date().toISOString(),
      items: [
        { name: 'บะหมี่หมูแดง', price: 60, quantity: 2 },
        { name: 'เกี๊ยวหมูทอด', price: 40, quantity: 1 },
      ],
    },
    {
      id: 2,
      order_number: 'TP-XYZ789',
      status: 'completed',
      total: 220,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      items: [
        { name: 'ข้าวหมูแดง', price: 60, quantity: 1 },
        { name: 'บะหมี่เกี๊ยวกุ้ง', price: 70, quantity: 2 },
      ],
    },
  ];
}

export default OrderHistoryPage;
