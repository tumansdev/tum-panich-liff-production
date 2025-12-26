import React, { useState, useEffect } from 'react';
import { Icon, Button, Loading } from '../components/common';
import { getOrderTracking, ORDER_STATUS, BANK_INFO, SHOP_INFO } from '../services/api';
import { useUser } from '../context/UserContext';
import { useOrderWebSocket } from '../hooks/useOrderWebSocket';

const TrackingPage = ({ orderNumber, onBack, onGoHome }) => {
  const { getAuthForApi } = useUser();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // WebSocket for real-time updates
  const { isConnected, orderStatus } = useOrderWebSocket(orderNumber);

  // Initial load
  useEffect(() => {
    loadTracking();
  }, [orderNumber]);

  // Update order when WebSocket receives update
  useEffect(() => {
    if (orderStatus) {
      console.log('🔔 Real-time update received:', orderStatus);
      // Merge WebSocket update with current order
      setOrder((prev) => ({
        ...prev,
        ...orderStatus,
      }));
    }
  }, [orderStatus]);

  // Fallback polling if WebSocket is not connected (every 30 seconds)
  useEffect(() => {
    if (isConnected) return; // WebSocket is handling updates

    const interval = setInterval(loadTracking, 30000);
    return () => clearInterval(interval);
  }, [isConnected, orderNumber]);

  const loadTracking = async () => {
    try {
      setError(null);
      // Use auth object with access token for secure API call
      const auth = getAuthForApi();
      const response = await getOrderTracking(orderNumber, auth);
      if (response.success) {
        setOrder(response.data);
      } else {
        console.error('Tracking API error:', response);
        setError(response.error || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (err) {
      console.error('Failed to load tracking:', err);
      setError('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="กำลังโหลดสถานะ..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-light flex flex-col items-center justify-center p-6">
        <Icon name="error" className="text-6xl text-red-400 mb-4" />
        <p className="text-gray-600 font-medium text-center">{error}</p>
        <div className="flex gap-3 mt-6">
          <Button onClick={loadTracking} variant="primary" icon="refresh">
            ลองใหม่
          </Button>
          <Button onClick={onGoHome} variant="outline">
            กลับหน้าหลัก
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background-light flex flex-col items-center justify-center p-6">
        <Icon name="error" className="text-6xl text-gray-300 mb-4" />
        <p className="text-gray-600 font-medium">ไม่พบออเดอร์</p>
        <Button onClick={onGoHome} variant="primary" className="mt-6">
          กลับหน้าหลัก
        </Button>
      </div>
    );
  }

  const status = ORDER_STATUS[order.status] || ORDER_STATUS.pending;

  return (
    <div className="min-h-screen bg-background-light pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Icon name="arrow_back_ios_new" className="text-xl" />
              </button>
            )}
            <h1 className="font-bold text-lg text-gray-900">ติดตามออเดอร์</h1>
          </div>
          {/* Connection Status */}
          <div className={`flex items-center gap-1 text-xs ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
            {isConnected ? 'Live' : 'Offline'}
          </div>
        </div>
      </header>

      {/* Order Number */}
      <div className="bg-white px-4 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-4">
            <img
              src={BANK_INFO.logoUrl}
              alt="ตั้มพานิช"
              className="w-12 h-12 rounded-full shadow-md"
            />
            <div>
              <p className="text-sm text-gray-500">หมายเลขออเดอร์</p>
              <p className="text-xl font-bold text-primary">{order.order_number}</p>
            </div>
          </div>
          <div
            className="px-4 py-2 rounded-full text-sm font-bold animate-pulse"
            style={{
              backgroundColor: `${getStatusColor(order.status)}20`,
              color: getStatusColor(order.status),
            }}
          >
            {status.label}
          </div>
        </div>
      </div>

      {/* Status Animation */}
      <div className="bg-gradient-to-b from-white to-transparent px-4 py-8">
        <div className="max-w-lg mx-auto text-center">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
              <Icon name={status.icon} className="text-5xl text-primary" />
            </div>
            {['cooking', 'out_for_delivery'].includes(order.status) && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="w-3 h-3 bg-white rounded-full animate-ping"></span>
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mt-4">{getStatusMessage(order.status)}</h2>
          {order.estimated_time && (
            <p className="text-gray-500 mt-2">
              เวลาโดยประมาณ: <span className="font-bold text-primary">{order.estimated_time} นาที</span>
            </p>
          )}
        </div>
      </div>

      {/* Timeline */}
      <main className="px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Icon name="timeline" className="text-primary" />
            สถานะการสั่งซื้อ
          </h3>

          <div className="relative pl-8">
            {/* Timeline line */}
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200"></div>

            {(order.timeline || getDefaultTimeline(order.status)).map((step, i) => (
              <div key={step.step} className="relative pb-6 last:pb-0">
                {/* Dot */}
                <div
                  className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center -translate-x-1/2 ${step.completed
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-400'
                    }`}
                >
                  {step.completed ? (
                    <Icon name="check" className="text-sm" />
                  ) : (
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  )}
                </div>

                {/* Content */}
                <div className="ml-4">
                  <p className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  {step.time && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(step.time).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rider Info (if applicable) */}
        {order.status === 'out_for_delivery' && order.rider_name && (
          <div className="max-w-lg mx-auto mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="two_wheeler" className="text-primary" />
              ข้อมูลไรเดอร์
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name="person" className="text-2xl text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{order.rider_name}</p>
                <p className="text-sm text-gray-500">{order.rider_phone}</p>
              </div>
              <a
                href={`tel:${order.rider_phone}`}
                className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600"
              >
                <Icon name="call" className="text-xl" />
              </a>
            </div>
          </div>
        )}

        {/* Delivery Info */}
        <div className="max-w-lg mx-auto mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Icon name="location_on" className="text-primary" />
            ข้อมูลการรับ
          </h3>
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900">
              {order.delivery_type === 'pickup' ? 'รับที่ร้าน' : 'จัดส่ง'}
            </p>
            {order.delivery_address && (
              <p className="mt-2">{order.delivery_address}</p>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 safe-area-bottom">
        <div className="max-w-lg mx-auto flex gap-3">
          <Button onClick={onGoHome} variant="outline" className="flex-1">
            กลับหน้าหลัก
          </Button>
          <a href={`tel:${SHOP_INFO.phone}`} className="flex-1">
            <Button variant="primary" className="w-full" icon="support_agent">
              ติดต่อร้าน
            </Button>
          </a>
        </div>
      </div>
    </div>
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

function getStatusMessage(status) {
  const messages = {
    pending: 'รอยืนยันจากทางร้าน',
    confirmed: 'ทางร้านได้รับออเดอร์แล้ว',
    cooking: 'กำลังปรุงอาหารให้คุณ',
    ready: 'อาหารพร้อมแล้ว!',
    out_for_delivery: 'กำลังจัดส่งให้คุณ',
    delivered: 'จัดส่งสำเร็จ',
    completed: 'เสร็จสิ้น ขอบคุณครับ!',
    cancelled: 'ออเดอร์ถูกยกเลิก',
  };
  return messages[status] || 'กำลังดำเนินการ';
}

function getDefaultTimeline(currentStatus) {
  const steps = [
    { step: 'pending', label: 'รอยืนยัน' },
    { step: 'confirmed', label: 'ยืนยันแล้ว' },
    { step: 'cooking', label: 'กำลังปรุง' },
    { step: 'ready', label: 'พร้อมส่ง/รับ' },
    { step: 'delivered', label: 'เสร็จสิ้น' },
  ];

  const statusOrder = ['pending', 'confirmed', 'cooking', 'ready', 'out_for_delivery', 'delivered', 'completed'];
  const currentIndex = statusOrder.indexOf(currentStatus);

  return steps.map((step, i) => ({
    ...step,
    completed: i <= currentIndex,
    time: i <= currentIndex ? new Date() : null,
  }));
}

function getSampleOrder() {
  return {
    order_number: 'TP-ABC123',
    status: 'cooking',
    delivery_type: 'free_delivery',
    delivery_address: '123 ถ.เทศบาล อ.เมือง จ.อ่างทอง',
    estimated_time: 15,
    created_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    cooking_at: new Date().toISOString(),
  };
}

export default TrackingPage;
