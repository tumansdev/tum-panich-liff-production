import React, { useState, useEffect } from 'react';
import { Header, BottomNav } from '../components/layout';
import { Icon, Loading } from '../components/common';
import { useUser } from '../context/UserContext';
import { getUserProfile, updateUserProfile } from '../services/api';

const ProfilePage = ({ onNavigate }) => {
  const { user, isLoading: liffLoading } = useUser();
  const [profile, setProfile] = useState({
    phone: '',
    email: '',
    address: '',
    birthday: '',
    dietary_notes: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user?.userId) {
      loadProfile();
    }
  }, [user?.userId]);

  const loadProfile = async () => {
    try {
      const response = await getUserProfile(user.userId);
      if (response.success && response.data) {
        setProfile({
          phone: response.data.phone || '',
          email: response.data.email || '',
          address: response.data.address || '',
          birthday: response.data.birthday || '',
          dietary_notes: response.data.dietary_notes || '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const handleSave = async () => {
    if (!user?.userId) return;

    setIsSaving(true);
    try {
      const response = await updateUserProfile(user.userId, profile);
      if (response.success) {
        setMessage({ type: 'success', text: 'บันทึกข้อมูลเรียบร้อย!' });
        setIsEditing(false);
      } else {
        setMessage({ type: 'error', text: 'ไม่สามารถบันทึกได้' });
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  if (liffLoading) {
    return <Loading message="กำลังโหลดข้อมูล..." />;
  }

  return (
    <div className="min-h-screen bg-background-light pb-24">
      <Header title="โปรไฟล์" />

      <main className="px-4 pt-4">
        {/* LINE Profile Card */}
        <div className="bg-gradient-to-br from-primary to-primary-hover rounded-2xl p-6 text-white mb-6 shadow-lg">
          <div className="flex items-center gap-4">
            <img
              src={user?.pictureUrl || 'https://api.dicebear.com/9.x/avataaars/svg?seed=User'}
              alt="Profile"
              className="w-20 h-20 rounded-full border-4 border-white/20"
            />
            <div>
              <h2 className="text-xl font-bold">{user?.displayName || 'ผู้ใช้งาน'}</h2>
              <p className="text-white/80 text-sm">LINE Account</p>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <Icon name="verified" className="text-green-300" />
                <span className="text-green-300">เชื่อมต่อแล้ว</span>
              </div>
            </div>
          </div>
        </div>

        {/* Message Toast */}
        {message.text && (
          <div className={`mb-4 p-4 rounded-xl flex items-center gap-2 animate-slide-up ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
            <Icon name={message.type === 'success' ? 'check_circle' : 'error'} />
            <span>{message.text}</span>
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Icon name="person" className="text-primary" />
              ข้อมูลส่วนตัว
            </h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-primary text-sm font-medium flex items-center gap-1"
            >
              <Icon name={isEditing ? 'close' : 'edit'} className="text-lg" />
              {isEditing ? 'ยกเลิก' : 'แก้ไข'}
            </button>
          </div>

          <div className="space-y-4">
            {/* Phone */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">เบอร์โทรศัพท์</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                disabled={!isEditing}
                placeholder="0xx-xxx-xxxx"
                className={`w-full p-3 rounded-xl border ${isEditing ? 'border-primary bg-white' : 'border-gray-100 bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-primary/30`}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">อีเมล</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled={!isEditing}
                placeholder="example@email.com"
                className={`w-full p-3 rounded-xl border ${isEditing ? 'border-primary bg-white' : 'border-gray-100 bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-primary/30`}
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">ที่อยู่จัดส่ง</label>
              <textarea
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                disabled={!isEditing}
                placeholder="บ้านเลขที่, หมู่บ้าน, ถนน, ตำบล, อำเภอ, จังหวัด"
                rows={3}
                className={`w-full p-3 rounded-xl border ${isEditing ? 'border-primary bg-white' : 'border-gray-100 bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none`}
              />
            </div>

            {/* Dietary Notes */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                <Icon name="restaurant" className="text-sm mr-1 align-middle" />
                หมายเหตุการสั่งอาหาร
              </label>
              <input
                type="text"
                value={profile.dietary_notes}
                onChange={(e) => setProfile({ ...profile, dietary_notes: e.target.value })}
                disabled={!isEditing}
                placeholder="เช่น แพ้ถั่ว, ไม่ทานเนื้อหมู"
                className={`w-full p-3 rounded-xl border ${isEditing ? 'border-primary bg-white' : 'border-gray-100 bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-primary/30`}
              />
            </div>

            {/* Save Button */}
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Icon name="save" />
                    <span>บันทึกข้อมูล</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => onNavigate('orders')}
            className="w-full p-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon name="receipt_long" className="text-primary" />
              </div>
              <span className="font-medium">ประวัติการสั่งซื้อ</span>
            </div>
            <Icon name="chevron_right" className="text-gray-400" />
          </button>

          <button
            onClick={() => onNavigate('contact')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Icon name="store" className="text-green-600" />
              </div>
              <span className="font-medium">ข้อมูลร้านค้า</span>
            </div>
            <Icon name="chevron_right" className="text-gray-400" />
          </button>
        </div>
      </main>

      <BottomNav activeTab="profile" onTabChange={onNavigate} />
    </div>
  );
};

export default ProfilePage;
