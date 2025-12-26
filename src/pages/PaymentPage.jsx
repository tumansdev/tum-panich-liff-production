import React, { useState, useEffect } from 'react';
import { Icon, Button } from '../components/common';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { DELIVERY_OPTIONS, BANK_INFO } from '../services/api';

// ... (constants stay same)

const PaymentPage = ({ onBack, onSuccess, orderData }) => {
  const { cart, subtotal, clearCart } = useCart();
  const { user, apiCall } = useUser();

  const [step, setStep] = useState(1);
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [distance, setDistance] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discount, setDiscount] = useState(0);

  // Load saved data
  const PAYMENT_FORM_KEY = 'tum_panich_payment_form';
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PAYMENT_FORM_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.phone) setPhone(data.phone);
        if (data.deliveryAddress) setDeliveryAddress(data.deliveryAddress);
      }
    } catch (e) {
      console.error('Failed to load saved form', e);
    }
  }, []);

  // Save form data
  useEffect(() => {
    const data = { phone, deliveryAddress };
    localStorage.setItem(PAYMENT_FORM_KEY, JSON.stringify(data));
  }, [phone, deliveryAddress]);

  const deliveryFee = deliveryType === 'pickup' ? 0 : (distance && distance > 2 ? 'COD' : 0);
  const total = subtotal - discount + (typeof deliveryFee === 'number' ? deliveryFee : 0);

  const handleSlipChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSlipFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    setIsLoadingLocation(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        // Mock distance calculation for now (or implement Haversine)
        // In real app, calculate distance from shop to user
        const shopLat = 13.7563; // Example BKK
        const shopLng = 100.5018;

        // Simple distance calc (Pythagoras on lat/lng - roughly)
        const R = 6371; // km
        const dLat = (latitude - shopLat) * Math.PI / 180;
        const dLon = (longitude - shopLng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(shopLat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km

        setDistance(d);
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Location error:', error);
        setLocationError('ไม่สามารถระบุตำแหน่งได้ กรุณาเปิด GPS');
        setIsLoadingLocation(false);
      }
    );
  };

  const copyLocation = () => {
    if (userLocation) {
      const text = `${userLocation.lat},${userLocation.lng}`;
      navigator.clipboard.writeText(text);
      alert('คัดลอกพิกัดแล้ว');
    }
  };

  const handleSubmit = async () => {
    if (!slipFile && !slipPreview) {
      alert('กรุณาแนบสลิปการโอนเงิน');
      return;
    }

    if (!phone) {
      alert('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare order items
      const orderItems = cart.map(item => ({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.qty,
        note: item.note || null,
        options: item.options || [],
      }));

      const orderPayload = {
        lineUserId: user?.userId,
        items: orderItems,
        deliveryType,
        deliveryAddress: deliveryType !== 'pickup' ? deliveryAddress : null,
        deliveryLat: userLocation?.lat || null,
        deliveryLng: userLocation?.lng || null,
        deliveryDistance: distance || null,
        subtotal,
        deliveryFee: typeof deliveryFee === 'number' ? deliveryFee : 0,
        discount,
        total,
        couponId: null,
      };

      // 1. Create Order
      const orderRes = await apiCall('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      });

      if (!orderRes.success) {
        throw new Error(orderRes.error || 'ไม่สามารถสร้างออเดอร์ได้');
      }

      const { orderId, orderNumber } = orderRes.data;

      // 2. Upload Slip
      if (slipFile) {
        try {
          const formData = new FormData();
          formData.append('slip', slipFile);

          const slipRes = await apiCall(`/orders/${orderId}/slip`, {
            method: 'POST',
            body: formData
          });

          if (!slipRes.success) {
            console.error('Slip Upload Failed API:', slipRes.error);
            alert('อัพโหลดสลิปไม่สำเร็จ กรุณาแจ้งร้านค้า\n(Order Created: ' + orderNumber + ')');
            // Consider not failing the whole flow? 
            // Or prompt retry? For now, we proceed but warn.
          }
        } catch (slipError) {
          console.error('Slip upload exception:', slipError);
          alert('อัพโหลดสลิปไม่สำเร็จ (Network Error)');
        }
      }

      // Success
      clearCart();
      localStorage.removeItem(PAYMENT_FORM_KEY);

      onSuccess({
        orderNumber,
        orderId,
        total,
        deliveryType,
      });

    } catch (error) {
      console.error('Order failed:', error);
      alert('เกิดข้อผิดพลาด: ' + (error.message || 'กรุณาลองใหม่'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 safe-area-top">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
            <Icon name="arrow_back_ios_new" className="text-xl" />
          </button>
          <h1 className="font-bold text-lg text-gray-900">
            {step === 1 ? 'เลือกวิธีรับอาหาร' : 'ชำระเงิน'}
          </h1>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
            1
          </div>
          <div className={`w-12 h-1 rounded ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
            2
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500 px-2">
          <span>การจัดส่ง</span>
          <span>ชำระเงิน</span>
        </div>
      </div>

      <main className="px-4">
        {step === 1 && (
          <>
            {/* Delivery Options */}
            <div className="space-y-3 mb-6">
              {Object.values(DELIVERY_OPTIONS).map((option) => (
                <button
                  key={option.id}
                  onClick={() => setDeliveryType(option.id)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${deliveryType === option.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 bg-white hover:border-primary/50'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${deliveryType === option.id ? 'border-primary' : 'border-gray-300'
                      }`}>
                      {deliveryType === option.id && (
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{option.label}</h3>
                      {option.description && (
                        <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                      )}
                      <p className="text-sm text-primary font-bold mt-2">
                        {option.fee === 0 ? 'ฟรี' : option.fee === 'COD' ? 'ชำระปลายทาง' : `฿${option.fee}`}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Address Input (for delivery) */}
            {deliveryType !== 'pickup' && (
              <div className="mb-6">
                {/* Location Share Button */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <Icon name="my_location" className="text-lg mr-1 align-middle" />
                    แชร์โลเคชั่น
                  </label>

                  {isLoadingLocation ? (
                    <div className="bg-primary/5 rounded-xl p-6 text-center">
                      {/* Animated Map */}
                      <div className="relative w-24 h-24 mx-auto mb-4">
                        <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-ping"></div>
                        <div className="absolute inset-2 border-4 border-primary/50 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
                        <div className="absolute inset-4 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon name="location_on" className="text-4xl text-primary animate-bounce" />
                        </div>
                      </div>
                      <p className="text-primary font-medium">กำลังวัดระยะทาง...</p>
                    </div>
                  ) : userLocation ? (
                    <div className="bg-gray-50 rounded-xl p-4">
                      {/* Distance Result */}
                      <div className={`flex items-center gap-3 p-4 rounded-xl mb-3 ${distance <= 2 ? 'bg-green-100' : 'bg-orange-100'}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${distance <= 2 ? 'bg-green-500' : 'bg-orange-500'}`}>
                          <Icon name={distance <= 2 ? 'check_circle' : 'delivery_dining'} className="text-2xl text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            ระยะทาง: {distance.toFixed(1)} กม.
                          </p>
                          <p className={`text-sm ${distance <= 2 ? 'text-green-700' : 'text-orange-700'}`}>
                            {distance <= 2 ? '✅ อยู่ในเขตส่งฟรี!' : '🚴 จัดส่งผ่านไรเดอร์ (ชำระค่าส่งแยก)'}
                          </p>
                        </div>
                      </div>

                      {/* Copy & Re-share buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={copyLocation}
                          className="flex-1 py-3 bg-gray-200 rounded-xl text-gray-700 font-medium flex items-center justify-center gap-2 hover:bg-gray-300 transition-colors"
                        >
                          <Icon name="content_copy" />
                          คัดลอกโลเคชั่น
                        </button>
                        <button
                          onClick={handleGetLocation}
                          className="flex-1 py-3 bg-primary/10 rounded-xl text-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors"
                        >
                          <Icon name="refresh" />
                          วัดใหม่
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleGetLocation}
                      className="w-full py-4 bg-primary/10 border-2 border-dashed border-primary/50 rounded-xl text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors"
                    >
                      <Icon name="share_location" className="text-2xl" />
                      แชร์โลเคชั่นของคุณ
                    </button>
                  )}

                  {locationError && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <Icon name="error" className="text-lg" />
                      {locationError}
                    </p>
                  )}
                </div>

                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ที่อยู่จัดส่ง (เพิ่มเติม) *
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="เช่น บ้านหลังสีฟ้า, ซอย 3..."
                  rows={2}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                />
              </div>
            )}

            {/* Phone */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                เบอร์โทรศัพท์ *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08X-XXX-XXXX"
                className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {/* Phone - moved above for all delivery types */}
          </>
        )}

        {step === 2 && (
          <>
            {/* Payment Info */}
            <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Icon name="account_balance" className="text-primary" />
                ข้อมูลการโอนเงิน
              </h3>

              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <img
                  src={BANK_INFO.qrCodeUrl}
                  alt="QR Payment"
                  className="w-48 h-48 rounded-xl shadow-lg"
                />
              </div>

              {/* Bank Details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">ธนาคาร</span>
                  <span className="font-medium">{BANK_INFO.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">เลขบัญชี</span>
                  <span className="font-bold text-primary">{BANK_INFO.account}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ชื่อบัญชี</span>
                  <span className="font-medium">{BANK_INFO.owner}</span>
                </div>
                {BANK_INFO.branch && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">สาขา</span>
                    <span className="font-medium">{BANK_INFO.branch}</span>
                  </div>
                )}
              </div>

              {/* Amount to pay */}
              <div className="mt-4 p-4 bg-primary/10 rounded-xl text-center">
                <p className="text-sm text-gray-600">ยอดที่ต้องชำระ</p>
                <p className="text-3xl font-bold text-primary">฿{total.toLocaleString()}</p>
              </div>
            </div>

            {/* Slip Upload */}
            <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Icon name="receipt_long" className="text-primary" />
                แนบสลิปการโอนเงิน
              </h3>

              {slipPreview ? (
                <div className="relative">
                  <img
                    src={slipPreview}
                    alt="Slip preview"
                    className="w-full h-64 object-contain rounded-xl bg-gray-100"
                  />
                  <button
                    onClick={() => {
                      setSlipFile(null);
                      setSlipPreview(null);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Icon name="close" className="text-lg" />
                  </button>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-all">
                    <Icon name="cloud_upload" className="text-5xl text-gray-400 mb-2" />
                    <p className="text-gray-600 font-medium">แตะเพื่ออัพโหลดสลิป</p>
                    <p className="text-sm text-gray-400 mt-1">รองรับ JPG, PNG</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSlipChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">สรุปรายการ</h3>
          <div className="space-y-3 text-sm">
            {cart.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-gray-600">
                  {item.name} x{item.qty}
                </span>
                <span className="font-medium">฿{(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
            <hr className="my-3" />
            <div className="flex justify-between">
              <span className="text-gray-600">ราคาอาหาร</span>
              <span>฿{subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>ส่วนลด</span>
                <span>-฿{discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">ค่าจัดส่ง</span>
              <span>{deliveryFee === 0 ? 'ฟรี' : `฿${deliveryFee}`}</span>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between text-lg font-bold">
              <span>รวมทั้งหมด</span>
              <span className="text-primary">฿{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-bottom">
        <div className="max-w-lg mx-auto">
          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              variant="primary"
              size="lg"
              className="w-full"
              iconRight="arrow_forward"
              disabled={deliveryType !== 'pickup' && !deliveryAddress}
            >
              ไปชำระเงิน
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              variant="primary"
              size="lg"
              className="w-full"
              loading={isSubmitting}
              disabled={!slipFile}
            >
              ยืนยันการสั่งซื้อ
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
