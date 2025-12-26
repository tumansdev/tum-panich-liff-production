import React from 'react';
import { Icon, Button } from '../components/common';
import { BANK_INFO } from '../services/api';

const SuccessPage = ({ orderData, onGoHome, onTrackOrder }) => {
  const { orderNumber, total, deliveryType } = orderData || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-6">
      {/* Success Animation */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full bg-green-100 flex items-center justify-center animate-bounce-slow">
          <Icon name="check_circle" className="text-7xl text-green-500" filled />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-ping">
          <Icon name="celebration" className="text-white text-lg" />
        </div>
      </div>

      {/* Success Message */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
        สั่งอาหารสำเร็จ! 🎉
      </h1>
      <p className="text-gray-500 text-center mb-8">
        ขอบคุณที่ใช้บริการตั้มพานิช
      </p>

      {/* Order Details Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-gray-100 mb-8">
        {/* Shop Logo */}
        <div className="flex justify-center mb-4">
          <img
            src={BANK_INFO.logoUrl}
            alt="ตั้มพานิช"
            className="w-20 h-20 rounded-full shadow-md"
          />
        </div>

        <div className="text-center mb-4 pb-4 border-b border-dashed border-gray-200">
          <p className="text-sm text-gray-500">หมายเลขออเดอร์</p>
          <p className="text-2xl font-bold text-primary">{orderNumber || 'TP-XXXXXX'}</p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">ยอดชำระ</span>
            <span className="text-xl font-bold text-gray-900">
              ฿{(total || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">การรับอาหาร</span>
            <span className="font-medium">
              {deliveryType === 'pickup' ? 'รับที่ร้าน' : 'จัดส่ง'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">สถานะ</span>
            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">
              รอยืนยัน
            </span>
          </div>
        </div>

        {/* Note */}
        <div className="mt-4 p-3 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-700 flex items-start gap-2">
            <Icon name="info" className="text-lg flex-shrink-0" />
            <span>
              ทางร้านจะยืนยันออเดอร์และแจ้งเวลาเตรียมอาหาร
              ภายใน 5-10 นาที
            </span>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        <Button
          onClick={onTrackOrder}
          variant="primary"
          size="lg"
          className="w-full"
          icon="local_shipping"
        >
          ติดตามออเดอร์
        </Button>
        <Button
          onClick={onGoHome}
          variant="outline"
          size="lg"
          className="w-full"
        >
          กลับหน้าหลัก
        </Button>
      </div>

      {/* Contact */}
      <p className="mt-8 text-sm text-gray-400 text-center">
        มีปัญหา? ติดต่อ <span className="text-primary font-medium">035-XXX-XXX</span>
      </p>
    </div>
  );
};

export default SuccessPage;
