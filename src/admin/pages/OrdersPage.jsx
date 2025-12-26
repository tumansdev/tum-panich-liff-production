import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ORDER_STATUSES = [
  { id: 'all', label: 'ทั้งหมด', color: 'gray' },
  { id: 'pending', label: 'รอยืนยัน', color: 'yellow' },
  { id: 'confirmed', label: 'ยืนยันแล้ว', color: 'blue' },
  { id: 'cooking', label: 'กำลังทำ', color: 'orange' },
  { id: 'ready', label: 'พร้อมส่ง', color: 'green' },
  { id: 'delivered', label: 'ส่งแล้ว', color: 'purple' },
  { id: 'completed', label: 'เสร็จสิ้น', color: 'green' },
  { id: 'cancelled', label: 'ยกเลิก', color: 'red' },
];

const STATUS_FLOW = {
  pending: { next: 'confirmed', btn: 'ยืนยัน', icon: 'check', color: 'bg-blue-500 hover:bg-blue-600' },
  confirmed: { next: 'cooking', btn: 'เริ่มทำ', icon: 'skillet', color: 'bg-orange-500 hover:bg-orange-600' },
  cooking: { next: 'ready', btn: 'พร้อมส่ง', icon: 'inventory_2', color: 'bg-green-500 hover:bg-green-600' },
  ready: { next: 'delivered', btn: 'ส่งแล้ว', icon: 'local_shipping', color: 'bg-purple-500 hover:bg-purple-600' },
  delivered: { next: 'completed', btn: 'เสร็จสิ้น', icon: 'done_all', color: 'bg-gray-500 hover:bg-gray-600' },
};

const OrdersPage = () => {
  const { apiCall } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  const loadOrders = async () => {
    try {
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const result = await apiCall(`/admin/orders${params}`);
      if (result.success) {
        setOrders(result.data);
      }
    } catch (err) {
      console.error('Orders error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const result = await apiCall(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (result.success) {
        loadOrders();
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('ไม่สามารถอัพเดทสถานะได้');
    }
  };

  const getStatusColor = (status) => {
    const statusObj = ORDER_STATUSES.find((s) => s.id === status);
    const colors = {
      yellow: 'bg-yellow-100 text-yellow-700',
      blue: 'bg-blue-100 text-blue-700',
      orange: 'bg-orange-100 text-orange-700',
      green: 'bg-green-100 text-green-700',
      purple: 'bg-purple-100 text-purple-700',
      red: 'bg-red-100 text-red-700',
      gray: 'bg-gray-100 text-gray-700',
    };
    return colors[statusObj?.color] || colors.gray;
  };

  const getOrderCounts = () => {
    const pending = orders.filter(o => o.status === 'pending').length;
    const cooking = orders.filter(o => o.status === 'cooking').length;
    return { pending, cooking };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">จัดการออเดอร์</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">อัพเดทอัตโนมัติทุก 10 วินาที</span>
          <button
            onClick={loadOrders}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors"
          >
            <span className="material-symbols-outlined">refresh</span>
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {ORDER_STATUSES.map((status) => (
          <button
            key={status.id}
            onClick={() => setFilterStatus(status.id)}
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${filterStatus === status.id
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Orders List - Card Style for Quick Actions */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl">
            <span className="material-symbols-outlined text-5xl mb-2">inbox</span>
            <p>ไม่พบออเดอร์</p>
          </div>
        ) : (
          orders.map((order) => {
            const nextAction = STATUS_FLOW[order.status];
            return (
              <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono font-bold text-primary text-lg">{order.order_number}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {ORDER_STATUSES.find((s) => s.id === order.status)?.label}
                      </span>
                      <span className="text-sm text-gray-400">
                        {new Date(order.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Items Preview */}
                    <div className="text-sm text-gray-600 mb-2">
                      {order.items?.map((item, i) => (
                        <span key={i}>
                          {item.name} x{item.quantity}
                          {item.note && <span className="text-orange-500"> ({item.note})</span>}
                          {i < order.items.length - 1 && ', '}
                        </span>
                      ))}
                    </div>

                    {/* Customer & Total */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">
                        <span className="material-symbols-outlined text-sm align-middle mr-1">person</span>
                        {order.display_name || 'ไม่ระบุ'}
                      </span>
                      <span className="font-bold text-lg">฿{parseFloat(order.total).toLocaleString()}</span>
                      <span className="text-gray-400">
                        {order.delivery_type === 'pickup' ? '🏪 รับที่ร้าน' : '🛵 จัดส่ง'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2">
                    {nextAction && (
                      <button
                        onClick={() => updateStatus(order.id, nextAction.next)}
                        className={`${nextAction.color} text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors`}
                      >
                        <span className="material-symbols-outlined text-lg">{nextAction.icon}</span>
                        {nextAction.btn}
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                      title="ดูรายละเอียด"
                    >
                      <span className="material-symbols-outlined">info</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateStatus}
        />
      )}
    </div>
  );
};

const OrderDetailModal = ({ order, onClose, onUpdateStatus }) => {
  const nextAction = STATUS_FLOW[order.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">ออเดอร์ {order.order_number}</h2>
            <p className="text-gray-500 text-sm">
              {new Date(order.created_at).toLocaleString('th-TH')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-bold mb-3">ข้อมูลลูกค้า</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">ชื่อ:</span> {order.display_name || '-'}</p>
              <p><span className="text-gray-500">โทร:</span> {order.customer_phone || '-'}</p>
              <p><span className="text-gray-500">การจัดส่ง:</span> {getDeliveryLabel(order.delivery_type)}</p>
              {order.delivery_address && (
                <p><span className="text-gray-500">ที่อยู่:</span> {order.delivery_address}</p>
              )}
              {order.delivery_lat && order.delivery_lng && (
                <a
                  href={`https://maps.google.com/?q=${order.delivery_lat},${order.delivery_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  📍 ดูตำแหน่งบนแผนที่
                </a>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="font-bold mb-3">รายการอาหาร</h3>
            <div className="space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">{item.name} x{item.quantity}</p>
                    {item.note && (
                      <p className="text-sm text-orange-600">📝 {item.note}</p>
                    )}
                  </div>
                  <span className="font-bold">฿{parseFloat(item.subtotal).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-4 text-lg font-bold">
              <span>รวมทั้งหมด</span>
              <span className="text-primary">฿{parseFloat(order.total).toLocaleString()}</span>
            </div>
          </div>

          {/* Slip */}
          {order.slip_image_url && (
            <div>
              <h3 className="font-bold mb-3">หลักฐานการโอน</h3>
              <img
                src={order.slip_image_url}
                alt="Slip"
                className="max-w-xs rounded-xl shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        {nextAction && (
          <div className="sticky bottom-0 bg-gray-50 p-6 border-t">
            <button
              onClick={() => onUpdateStatus(order.id, nextAction.next)}
              className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 ${nextAction.color}`}
            >
              <span className="material-symbols-outlined">{nextAction.icon}</span>
              {nextAction.btn}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const getDeliveryLabel = (type) => {
  const labels = {
    pickup: 'รับที่ร้าน',
    free_delivery: 'ส่งฟรี (ในเขต)',
    easy_delivery: 'ไรเดอร์ Easy Delivery',
  };
  return labels[type] || type;
};

export default OrdersPage;
