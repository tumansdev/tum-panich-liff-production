import React from 'react';
import { Icon, Button } from '../components/common';
import { BANK_INFO } from '../services/api';

const ContactPage = () => {
  const handleCall = () => {
    window.location.href = 'tel:035-XXX-XXX';
  };

  const handleOpenMap = () => {
    window.open('https://maps.app.goo.gl/tn5Rd6pNdyEWrWdF8', '_blank');
  };

  return (
    <div className="min-h-screen bg-background-light pb-24">
      {/* Map Placeholder */}
      <div className="h-48 bg-gray-200 relative overflow-hidden">
        <img
          src="https://maps.googleapis.com/maps/api/staticmap?center=อ่างทอง&zoom=15&size=400x200&markers=color:red%7Cอ่างทอง&key=placeholder"
          alt="Map"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={handleOpenMap}
            className="bg-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 hover:bg-gray-50"
          >
            <Icon name="map" className="text-primary" />
            <span className="font-medium">ดูแผนที่ใน Google Maps</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="px-4 py-6 space-y-4">
        {/* Shop Info Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <img
              src={BANK_INFO.logoUrl}
              alt="ตั้มพานิช"
              className="w-16 h-16 rounded-full shadow-md"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">ตั้มพานิช</h1>
              <p className="text-sm text-gray-500">ก๋วยเตี๋ยวหมูแดงย่างถ่าน</p>
              <div className="flex items-center gap-1 mt-1">
                <Icon name="star" className="text-yellow-500 text-sm" filled />
                <span className="text-sm font-bold">4.9</span>
                <span className="text-xs text-gray-400">(120+ รีวิว)</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 font-medium">เปิดให้บริการ</span>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Icon name="location_on" className="text-gray-400 text-xl mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">ที่อยู่</p>
                <p className="text-sm text-gray-600">
                  123 ถ.เทศบาล ต.บ้านแพน อ.เมือง จ.อ่างทอง 14000
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Icon name="schedule" className="text-gray-400 text-xl mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">เวลาทำการ</p>
                <p className="text-sm text-gray-600">
                  จันทร์ - เสาร์: 07:00 - 15:00 น.
                </p>
                <p className="text-sm text-red-500">อาทิตย์: หยุด</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Icon name="phone" className="text-gray-400 text-xl mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">โทรศัพท์</p>
                <p className="text-sm text-primary font-medium">035-XXX-XXX</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={handleCall} variant="primary" className="w-full" icon="call">
            โทรสั่งอาหาร
          </Button>
          <Button onClick={handleOpenMap} variant="outline" className="w-full" icon="directions">
            นำทาง
          </Button>
        </div>

        {/* Social */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">ติดตามเรา</h3>
          <div className="flex gap-3">
            <button className="flex-1 p-3 bg-green-100 rounded-xl flex items-center justify-center gap-2 text-green-700 font-medium hover:bg-green-200">
              <Icon name="chat" className="text-xl" />
              LINE
            </button>
            <button className="flex-1 p-3 bg-blue-100 rounded-xl flex items-center justify-center gap-2 text-blue-700 font-medium hover:bg-blue-200">
              <Icon name="public" className="text-xl" />
              Facebook
            </button>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Icon name="delivery_dining" className="text-primary" />
            บริการจัดส่ง
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Icon name="storefront" className="text-gray-400 text-xl" />
              <div>
                <p className="font-medium text-gray-900">รับที่ร้าน / ทานที่ร้าน</p>
                <p className="text-xs text-gray-500">ฟรี</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Icon name="two_wheeler" className="text-gray-400 text-xl" />
              <div>
                <p className="font-medium text-gray-900">ส่งฟรีโดยทางร้าน</p>
                <p className="text-xs text-gray-500">ภายในรัศมี 2 กม.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Icon name="local_shipping" className="text-gray-400 text-xl" />
              <div>
                <p className="font-medium text-gray-900">ไรเดอร์ Easy Delivery</p>
                <p className="text-xs text-gray-500">ระยะเกิน 2 กม. (ชำระค่าส่งปลายทาง)</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactPage;
