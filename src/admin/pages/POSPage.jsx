import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdminWebSocket } from '../../hooks/useOrderWebSocket';
import WalkInPOS from '../components/WalkInPOS';
import { printReceipt, printKitchenTicket } from '../utils/printUtils';

const POSPage = () => {
  const { apiCall } = useAuth();
  const { newOrders, orderUpdates } = useAdminWebSocket();
  const [activeTab, setActiveTab] = useState('incoming');
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [viewSlipOrder, setViewSlipOrder] = useState(null);

  // Sound effect
  const playSound = (type) => {
    const audio = new Audio(type === 'new' ? '/sounds/new-order.mp3' : '/sounds/bell.mp3');
    audio.play().catch(e => console.log('Audio play failed', e));
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load Pending
      const pendingRes = await apiCall('/admin/orders?status=pending&limit=50');
      if (pendingRes.success) setIncomingOrders(pendingRes.data);

      // Load Kitchen (Confirmed + Cooking)
      const [confirmedRes, cookingRes] = await Promise.all([
        apiCall('/admin/orders?status=confirmed&limit=50'),
        apiCall('/admin/orders?status=cooking&limit=50')
      ]);

      if (confirmedRes.success && cookingRes.success) {
        // Sort by time
        const combined = [...confirmedRes.data, ...cookingRes.data].sort((a, b) =>
          new Date(a.created_at) - new Date(b.created_at)
        );
        setKitchenOrders(combined);
      }
    } catch (err) {
      console.error('Load Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle WebSocket Updates
  useEffect(() => {
    if (newOrders.length > 0) {
      const latest = newOrders[0];
      // Check if already exists to avoid dupes
      if (!incomingOrders.find(o => o.order_number === latest.data.orderNumber)) {
        loadData(); // Reload to get full details
        playSound('new');
      }
    }
  }, [newOrders]);

  useEffect(() => {
    if (orderUpdates.length > 0) {
      loadData(); // Status changed elsewhere
    }
  }, [orderUpdates]);

  // Actions
  const updateStatus = async (orderId, status) => {
    try {
      await apiCall(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      loadData();
    } catch (err) {
      alert('Update failed');
    }
  };

  const handleVerifyPayment = async (orderId, action) => {
    try {
      await apiCall(`/admin/orders/${orderId}/verify-payment`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      setViewSlipOrder(null);
      loadData();
    } catch (err) {
      alert('Verify failed');
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 max-w-7xl mx-auto">
      {/* Top Bar / Tabs */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex gap-2 overflow-x-auto shrink-0">
        <POSRunTab
          id="incoming"
          icon="notifications_active"
          label="ออเดอร์เข้าใหม่"
          active={activeTab}
          onClick={setActiveTab}
          badge={incomingOrders.length}
          color="bg-red-500"
        />
        <POSRunTab
          id="kitchen"
          icon="skillet"
          label="ครัว / กำลังทำ"
          active={activeTab}
          onClick={setActiveTab}
          badge={kitchenOrders.filter(o => o.status === 'cooking').length}
          color="bg-orange-500"
        />
        <POSRunTab
          id="ready"
          icon="check_circle"
          label="พร้อมเสิร์ฟ"
          active={activeTab}
          onClick={setActiveTab}
        />
        <div className="w-px bg-gray-200 mx-2"></div>
        <POSRunTab
          id="walkin"
          icon="point_of_sale"
          label="ขายหน้าร้าน"
          active={activeTab}
          onClick={setActiveTab}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden bg-gray-50/50 rounded-2xl border border-gray-100 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        <div className="h-full overflow-y-auto p-4 custom-scrollbar">
          {activeTab === 'incoming' && (
            <IncomingView orders={incomingOrders} onUpdate={updateStatus} onViewSlip={setViewSlipOrder} />
          )}
          {activeTab === 'kitchen' && (
            <KitchenView orders={kitchenOrders} onUpdate={updateStatus} onViewSlip={setViewSlipOrder} />
          )}
          {activeTab === 'walkin' && (
            <WalkInPOS onOrderCreated={() => setActiveTab('incoming')} />
          )}
        </div>
      </div>

      {/* Slip Review Modal */}
      {viewSlipOrder && (
        <SlipModal
          order={viewSlipOrder}
          onClose={() => setViewSlipOrder(null)}
          onApprove={(id) => handleVerifyPayment(id, 'approve')}
          onReject={(id) => handleVerifyPayment(id, 'reject')}
        />
      )}
    </div>
  );
};

const POSRunTab = ({ id, icon, label, active, onClick, badge, color = 'bg-red-500' }) => (
  <button
    onClick={() => onClick(id)}
    className={`min-w-[160px] flex-1 flex items-center justify-center gap-3 py-4 rounded-xl transition-all font-bold relative ${active === id
      ? 'bg-primary text-white shadow-lg shadow-primary/30'
      : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
      }`}
  >
    <span className="material-symbols-outlined">{icon}</span>
    {label}
    {badge > 0 && (
      <span className={`absolute -top-2 -right-2 ${color} text-white text-xs w-6 h-6 flex items-center justify-center rounded-full shadow-md border-2 border-white`}>
        {badge}
      </span>
    )}
  </button>
);

const IncomingView = ({ orders, onUpdate, onViewSlip }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {orders.length === 0 && (
      <div className="col-span-full py-20 text-center text-gray-400">
        <span className="material-symbols-outlined text-6xl mb-2">inbox</span>
        <p>ไม่มีออเดอร์ใหม่</p>
      </div>
    )}
    {orders.map(order => (
      <OrderCard key={order.id} order={order} onViewSlip={onViewSlip}>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onUpdate(order.id, 'cancelled')}
            className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => {
              onUpdate(order.id, 'confirmed');
              // Auto print kitchen ticket? or optional?
              // For now, let's just accept. Kitchen prints in KitchenView.
            }}
            className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 shadow-lg shadow-green-500/30 transition-colors"
          >
            รับออเดอร์
          </button>
          <button
            onClick={() => printReceipt(order)}
            className="w-12 flex items-center justify-center bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
            title="Print Receipt"
          >
            <span className="material-symbols-outlined">print</span>
          </button>
        </div>
      </OrderCard>
    ))}
  </div>
);

const KitchenView = ({ orders, onUpdate, onViewSlip }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {orders.length === 0 && (
      <div className="col-span-full py-20 text-center text-gray-400">
        <span className="material-symbols-outlined text-6xl mb-2">skillet</span>
        <p>ครัวว่าง</p>
      </div>
    )}
    {orders.map(order => (
      <OrderCard key={order.id} order={order} onViewSlip={onViewSlip}>
        <div className="flex gap-2 mt-4">
          {order.status === 'confirmed' ? (
            <button
              onClick={() => onUpdate(order.id, 'cooking')}
              className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/30"
            >
              เริ่มทำอาหาร
            </button>
          ) : (
            <button
              onClick={() => onUpdate(order.id, 'ready')}
              className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 shadow-lg shadow-green-500/30"
            >
              ทำเสร็จแล้ว (พร้อมเสิร์ฟ)
            </button>
          )}
          <button
            onClick={() => printKitchenTicket(order)}
            className="w-12 flex items-center justify-center bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
            title="Print Ticket"
          >
            <span className="material-symbols-outlined">print</span>
          </button>
        </div>
      </OrderCard>
    ))}
  </div>
);

const OrderCard = ({ order, children, onViewSlip }) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col animate-fade-in-up">
    <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-50">
      <div>
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">#{order.order_number}</span>
          <span className="text-gray-500 text-xs">{new Date(order.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <p className="font-bold text-gray-900 mt-1">{order.delivery_type === 'delivery' ? '🛵 เดลิเวอรี่' : '🏠 ทานที่ร้าน'}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-xl text-primary">฿{order.total}</p>
        <p className={`text-xs font-bold ${order.payment_status === 'paid' ? 'text-green-500' : 'text-orange-500'}`}>
          {order.payment_status === 'paid' ? 'จ่ายแล้ว' : 'รอชำระ'}
        </p>
      </div>
    </div>

    <div className="flex-1 space-y-2 mb-4">
      {order.items.map((item, i) => (
        <div key={i} className="flex justify-between text-sm">
          <span className="text-gray-700 font-medium">
            <span className="text-primary mr-2">x{item.quantity}</span>
            {item.name}
          </span>
          {item.note && <p className="text-xs text-red-400 ml-6">{item.note}</p>}
        </div>
      ))}

      {order.slip_image_url && (
        <button
          onClick={() => onViewSlip(order)}
          className="w-full flex items-center justify-center gap-2 py-2 mt-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-bold"
        >
          <span className="material-symbols-outlined text-lg">image</span>
          ตรวจสอบสลิปโอนเงิน
        </button>
      )}

      {order.delivery_note && (
        <div className="bg-yellow-50 p-2 rounded-lg mt-2 text-xs text-yellow-700">
          Note: {order.delivery_note}
        </div>
      )}
    </div>

    {children}
  </div>
);

const SlipModal = ({ order, onClose, onApprove, onReject }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
    <div className="relative bg-white rounded-2xl max-w-sm w-full overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-lg">สลิปโอนเงิน #{order.order_number}</h3>
        <button onClick={onClose}><span className="material-symbols-outlined">close</span></button>
      </div>

      <div className="p-4 bg-gray-900 flex justify-center">
        <img
          src={order.slip_image_url}
          alt="Slip"
          className="max-h-[60vh] object-contain rounded-lg"
        />
      </div>

      <div className="p-4 flex gap-3">
        <button
          onClick={() => onReject(order.id)}
          className="flex-1 py-3 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200"
        >
          ปฏิเสธ
        </button>
        <button
          onClick={() => onApprove(order.id)}
          className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 shadow-lg shadow-green-500/30"
        >
          ยอดเงินถูกต้อง
        </button>
      </div>
    </div>
  </div>
);

export default POSPage;
