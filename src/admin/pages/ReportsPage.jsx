import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ReportsPage = () => {
  const { apiCall } = useAuth();
  const [dailyData, setDailyData] = useState(null);
  const [summaryData, setSummaryData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [selectedDate]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const [daily, summary] = await Promise.all([
        apiCall(`/admin/reports/daily?date=${selectedDate}`),
        apiCall('/admin/reports/summary'),
      ]);
      if (daily.success) setDailyData(daily.data);
      if (summary.success) setSummaryData(summary.data);
    } catch (err) {
      console.error('Reports error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const summary = dailyData?.summary || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">รายงาน</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-gray-500 text-sm">ออเดอร์ทั้งหมด</p>
          <p className="text-3xl font-bold text-gray-900">{summary.total_orders || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-gray-500 text-sm">สำเร็จ</p>
          <p className="text-3xl font-bold text-green-600">{summary.completed_orders || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-gray-500 text-sm">ยกเลิก</p>
          <p className="text-3xl font-bold text-red-600">{summary.cancelled_orders || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-gray-500 text-sm">ยอดขาย</p>
          <p className="text-3xl font-bold text-primary">
            ฿{parseFloat(summary.total_revenue || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hourly Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">ยอดขายรายชั่วโมง</h3>
          <div className="space-y-2">
            {dailyData?.hourly?.map((h) => (
              <div key={h.hour} className="flex items-center gap-3">
                <span className="w-16 text-sm text-gray-500">{String(h.hour).padStart(2, '0')}:00</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (parseFloat(h.revenue) / Math.max(...dailyData.hourly.map(x => parseFloat(x.revenue) || 1))) * 100)}%`,
                    }}
                  ></div>
                </div>
                <span className="w-20 text-right text-sm font-medium">
                  ฿{parseFloat(h.revenue).toLocaleString()}
                </span>
              </div>
            ))}
            {(!dailyData?.hourly || dailyData.hourly.length === 0) && (
              <p className="text-center text-gray-400 py-4">ไม่มีข้อมูล</p>
            )}
          </div>
        </div>

        {/* Top Items */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">เมนูขายดี</h3>
          <div className="space-y-3">
            {dailyData?.topItems?.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">{item.quantity} จาน</p>
                  <p className="text-sm text-gray-500">฿{parseFloat(item.revenue || 0).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {(!dailyData?.topItems || dailyData.topItems.length === 0) && (
              <p className="text-center text-gray-400 py-4">ไม่มีข้อมูล</p>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Breakdown */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">ประเภทการจัดส่ง</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dailyData?.deliveryBreakdown?.map((d) => (
            <div key={d.delivery_type} className="p-4 bg-gray-50 rounded-xl text-center">
              <span className="material-symbols-outlined text-3xl text-primary mb-2">
                {d.delivery_type === 'pickup' ? 'storefront' : 'local_shipping'}
              </span>
              <p className="font-medium">{getDeliveryLabel(d.delivery_type)}</p>
              <p className="text-2xl font-bold text-gray-900">{d.count}</p>
              <p className="text-sm text-gray-500">฿{parseFloat(d.revenue).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">ยอดขาย 7 วันล่าสุด</h3>
        <table className="w-full">
          <thead className="border-b">
            <tr>
              <th className="text-left py-3 text-gray-500">วันที่</th>
              <th className="text-right py-3 text-gray-500">ออเดอร์</th>
              <th className="text-right py-3 text-gray-500">ยอดขาย</th>
            </tr>
          </thead>
          <tbody>
            {summaryData.map((row) => (
              <tr key={row.date} className="border-b hover:bg-gray-50">
                <td className="py-3">
                  {new Date(row.date).toLocaleDateString('th-TH', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </td>
                <td className="py-3 text-right">{row.order_count}</td>
                <td className="py-3 text-right font-bold text-primary">
                  ฿{parseFloat(row.revenue).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const getDeliveryLabel = (type) => {
  const labels = {
    pickup: 'รับที่ร้าน',
    free_delivery: 'ส่งฟรี',
    easy_delivery: 'Easy Delivery',
  };
  return labels[type] || type;
};

export default ReportsPage;
