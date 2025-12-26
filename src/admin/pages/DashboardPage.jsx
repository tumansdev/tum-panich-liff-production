import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { apiCall } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const result = await apiCall('/admin/dashboard');
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'ออเดอร์วันนี้',
      value: data?.today?.orders || 0,
      icon: 'receipt_long',
      color: 'bg-blue-500',
    },
    {
      label: 'ยอดขายวันนี้',
      value: `฿${(data?.today?.revenue || 0).toLocaleString()}`,
      icon: 'payments',
      color: 'bg-green-500',
    },
    {
      label: 'รอดำเนินการ',
      value: data?.pendingOrders || 0,
      icon: 'pending_actions',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`${stat.color} w-14 h-14 rounded-xl flex items-center justify-center`}>
                <span className="material-symbols-outlined text-white text-2xl">{stat.icon}</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Breakdown & Top Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">สถานะออเดอร์วันนี้</h3>
          <div className="space-y-3">
            {data?.statusBreakdown?.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-gray-600 capitalize">{getStatusLabel(item.status)}</span>
                <span className="font-bold">{item.count}</span>
              </div>
            ))}
            {(!data?.statusBreakdown || data.statusBreakdown.length === 0) && (
              <p className="text-gray-400 text-center py-4">ยังไม่มีออเดอร์วันนี้</p>
            )}
          </div>
        </div>

        {/* Top Items */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">เมนูขายดีวันนี้</h3>
          <div className="space-y-3">
            {data?.topItems?.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">#{i + 1}</span>
                  <span className="text-gray-900">{item.name}</span>
                </div>
                <span className="text-gray-600">{item.quantity} จาน</span>
              </div>
            ))}
            {(!data?.topItems || data.topItems.length === 0) && (
              <p className="text-gray-400 text-center py-4">ยังไม่มีข้อมูลวันนี้</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const getStatusLabel = (status) => {
  const labels = {
    pending: 'รอยืนยัน',
    confirmed: 'ยืนยันแล้ว',
    cooking: 'กำลังทำ',
    ready: 'พร้อมส่ง',
    delivered: 'ส่งแล้ว',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก',
  };
  return labels[status] || status;
};

export default DashboardPage;
