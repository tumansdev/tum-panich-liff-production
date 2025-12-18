import React, { useState, useEffect } from 'react';
import liff from '@line/liff';
import './App.css';
import { ShoppingCart, Trash2, ChevronLeft, CreditCard, Upload, X, CheckCircle, MapPin, Phone, Facebook, Clock, Utensils, BookOpen, Home, Star, Quote } from 'lucide-react';

// --- 1. ข้อมูลเมนูอาหาร (Mock Data) ---
const MENU_ITEMS = [
  {
    id: 1,
    name: 'บะหมี่หมูแดงย่างถ่าน',
    price: 60,
    image: 'https://images.unsplash.com/photo-1543363363-cf292708307c?q=80&w=1000',
    category: 'Recommended',
    desc: 'เส้นทำเอง เหนียวนุ่ม หมูแดงย่างถ่านหอมๆ'
  },
  {
    id: 2,
    name: 'บะหมี่เกี๊ยวกุ้งหมูแดง',
    price: 70,
    image: 'https://images.unsplash.com/photo-1596626690463-c79435b7194d?q=80&w=1000',
    category: 'Recommended',
    desc: 'เกี๊ยวกุ้งเต็มคำ ซุปกลมกล่อม'
  },
  {
    id: 3,
    name: 'ข้าวหมูแดงไข่ยางมะตูม',
    price: 60,
    image: 'https://images.unsplash.com/photo-1626804475297-411d0c1737e4?q=80&w=1000',
    category: 'Rice',
    desc: 'น้ำราดสูตรลับ เคี่ยวจนเข้มข้น'
  },
  {
    id: 4,
    name: 'หมูแดงสับ (จานใหญ่)',
    price: 150,
    image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?q=80&w=1000',
    category: 'Side Dish',
    desc: 'สำหรับทานเล่น หรือแกล้ม หมักเข้าเนื้อ'
  },
  {
    id: 5,
    name: 'เกี๊ยวหมูทอด',
    price: 40,
    image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?q=80&w=2070',
    category: 'Appetizer',
    desc: 'กรอบนอก นุ่มใน น้ำจิ้มรสเด็ด'
  },
];

const BANK_INFO = {
  name: "ธนาคารกสิกรไทย (KBank)",
  account: "099-2-XXXXX-X",
  owner: "นายตั้ม พานิช"
};

const TumPanichApp = () => {
  // --- 2. State จัดการข้อมูล ---
  const [activeTab, setActiveTab] = useState('menu'); // menu, story, contact
  const [view, setView] = useState('main'); // main (tabs), cart, payment, success
  const [cart, setCart] = useState([]);
  const [profile, setProfile] = useState(null);
  const [slipImage, setSlipImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // เชื่อมต่อ LINE LIFF
  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const liffProfile = await liff.getProfile();
        setProfile({
          userId: liffProfile.userId,
          displayName: liffProfile.displayName,
          pictureUrl: liffProfile.pictureUrl
        });
      } catch (error) {
        console.error('LIFF init error:', error);
        // Fallback สำหรับ development mode
        if (import.meta.env.DEV) {
          setProfile({
            userId: 'DEV_USER',
            displayName: 'Developer Mode',
            pictureUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Dev'
          });
        }
      }
    };

    initLiff();
  }, []);

  // --- 3. Functions ระบบตระกร้า ---
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) return { ...i, qty: Math.max(0, i.qty + delta) };
      return i;
    }).filter(i => i.qty > 0));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  // --- 4. หน้าจอต่างๆ (Screens) ---

  // A. หน้าเมนูอาหาร (หน้าแรก)
  const MenuScreen = () => (
    <div className="pb-24 pt-4 px-4 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">หิวไหมครับ?</h2>
          <p className="text-gray-500 text-sm">ตั้มพานิช ยินดีต้อนรับครับ</p>
        </div>
        {profile && (
          <img src={profile.pictureUrl} className="w-10 h-10 rounded-full border-2 border-orange-100 shadow-sm" alt="Profile" />
        )}
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-500 rounded-2xl p-5 text-white shadow-lg shadow-orange-200 mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <p className="font-bold text-lg flex items-center gap-2"><Star className="fill-white text-white" size={20} /> หมูแดงย่างถ่าน</p>
          <p className="text-sm opacity-90 mt-1">สูตรลับเฉพาะที่อยากให้คุณลอง</p>
        </div>
        <div className="absolute right-0 top-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-4 -mt-4"></div>
      </div>

      {/* Food Grid */}
      <div className="grid gap-4">
        {MENU_ITEMS.map(item => (
          <div key={item.id} className="bg-white p-3 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.05)] border border-stone-100 flex gap-4 hover:border-orange-200 transition-colors">
            <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
              <img src={item.image} className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500" alt={item.name} />
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <h3 className="font-bold text-gray-900 leading-tight text-base">{item.name}</h3>
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.desc}</p>
              </div>
              <div className="flex justify-between items-end mt-2">
                <span className="text-orange-600 font-bold text-lg">฿{item.price}</span>
                {cart.find(c => c.id === item.id) ? (
                  <div className="flex items-center bg-stone-100 rounded-lg p-1 gap-2 shadow-inner">
                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded shadow text-orange-600 font-bold active:scale-90 transition-transform">-</button>
                    <span className="font-bold text-sm w-4 text-center">{cart.find(c => c.id === item.id).qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-orange-600 rounded shadow text-white font-bold active:scale-90 transition-transform">+</button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(item)}
                    className="bg-stone-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md active:scale-95 transition-all hover:bg-stone-800"
                  >
                    ใส่ตะกร้า
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // B. หน้าเรื่องราว (Story) - ฉบับเต็ม
  const StoryScreen = () => (
    <div className="pb-24 pt-4 px-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-6 border-l-4 border-orange-500 pl-3">
        <h2 className="text-2xl font-bold text-gray-800">จากวิกฤตสู่ตำนาน</h2>
        <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-bold">Story</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="relative h-64">
          <img
            src="https://images.unsplash.com/photo-1555126634-323283e090fa?q=80&w=1000"
            className="w-full h-full object-cover"
            alt="Chef Cooking"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
            <h3 className="text-white font-bold text-xl leading-snug shadow-black drop-shadow-md">
              "รสชาติแห่งการเริ่มต้นใหม่ ที่ใส่หัวใจลงไปในหมูแดงทุกชิ้น"
            </h3>
          </div>
        </div>

        <div className="p-6 space-y-6">

          <div className="bg-stone-50 p-4 rounded-xl border-l-4 border-orange-500 italic text-gray-700 font-medium">
            "เมื่อชีวิตพาทุกอย่างกลับมาที่ศูนย์... ผมจึงเริ่มต้นนับหนึ่งใหม่ด้วย 'ก๋วยเตี๋ยว' ที่ผมรัก"
          </div>

          <div className="space-y-4 text-gray-600 text-sm leading-7">
            <p className="font-bold text-gray-800 text-lg">
              "คนเราล้มได้... แต่ต้องลุกให้เป็น และต้องลุกให้ <span className="text-orange-600">'อร่อย'</span> กว่าเดิม"
            </p>

            <p>
              ผมชื่อ <strong>'ตั้ม'</strong> ครับ... ชีวิตผมผ่านการทำธุรกิจมาหลายอย่าง และสารภาพตามตรงว่าครั้งล่าสุดมัน <strong>"พังไม่เป็นท่า"</strong> จนผมต้องถอยกลับมาตั้งหลักที่บ้านเกิดที่อ่างทอง
            </p>

            <p>
              ในวันที่ท้อแท้ สิ่งที่เยียวยาผมได้กลับเป็นสิ่งที่เรียบง่ายที่สุด คือความทรงจำของ <strong>"เด็กชายที่รักก๋วยเตี๋ยวป๊อกๆ"</strong> ผมเป็นคนชอบทานก๋วยเตี๋ยวมาก ชอบจนลองทำทานเอง ลองผิดลองถูกอยู่ในครัวเล็กๆ ที่บ้าน
            </p>

            <p>
              จุดเปลี่ยนสำคัญเกิดขึ้นเมื่อผมทำแจกเพื่อนบ้าน... เสียงตอบรับไม่ใช่แค่ "กินได้" แต่ทุกคนบอกว่า <strong>"ทำอีกนะ"</strong> โดยเฉพาะ <strong>"หมูแดง"</strong> ที่ใครกินก็ติดใจ
            </p>

            <p>
              วินาทีนั้น ผมตระหนักได้ว่า บางทีความสุขและความสำเร็จอาจไม่ได้อยู่ที่ธุรกิจใหญ่โตไกลตัว แต่อยู่ที่การได้ทำของอร่อยๆ ให้คนทานแล้วมีความสุข
            </p>
          </div>

          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 relative mt-4">
            <Quote className="absolute top-4 left-4 text-orange-200 w-8 h-8 -z-0" />
            <p className="text-orange-900 font-medium text-center relative z-10 leading-relaxed">
              ร้าน "ตั้มพานิช" จึงถือกำเนิดขึ้น ไม่ใช่แค่ร้านก๋วยเตี๋ยว แต่คือ "โอกาสครั้งที่สอง" ของผม ที่พิถีพิถันกับหมูแดงทุกชิ้น เส้นทุกคำ เพื่อส่งต่อรสชาติแห่งความตั้งใจนี้... ให้ถึงมือคุณ
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // C. หน้าติดต่อ (Contact)
  const ContactScreen = () => (
    <div className="pb-24 pt-4 px-4 space-y-4 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-3">ข้อมูลร้าน</h2>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 space-y-4">
        <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 shadow-sm"><Clock size={24} /></div>
          <div>
            <p className="font-bold text-gray-800">เวลาเปิด-ปิด</p>
            <p className="text-sm text-gray-500">09:00 - 16:00 น. (หยุดวันพุธ)</p>
          </div>
        </div>
        <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-sm"><Phone size={24} /></div>
          <div>
            <p className="font-bold text-gray-800">โทรศัพท์</p>
            <a href="tel:0812345678" className="text-sm text-blue-600 font-medium">081-234-5678</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shadow-sm"><Facebook size={24} /></div>
          <div>
            <p className="font-bold text-gray-800">Facebook</p>
            <a href="#" className="text-sm text-indigo-600 font-medium">@TumPanichAngThong</a>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-2 shadow-sm border border-stone-100">
        <p className="font-bold text-gray-800 px-3 py-3 flex items-center gap-2"><MapPin size={20} className="text-red-500" /> แผนที่ร้าน</p>
        <div className="w-full aspect-video bg-gray-200 rounded-xl overflow-hidden relative shadow-inner">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3864.090623253773!2d100.450!3d14.580!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDM0JzQ4LjAiTiAxMDDCsDI3JzAwLjAiRQ!5e0!3m2!1sen!2sth!4v1620000000000!5m2!1sen!2sth"
            width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy"
            title="Google Map"
            className="absolute inset-0"
          ></iframe>
        </div>
        <div className="p-3 text-center">
          <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="inline-block bg-stone-100 text-stone-700 px-6 py-2 rounded-full text-sm font-bold hover:bg-stone-200 transition-colors">
            นำทางไปร้าน
          </a>
        </div>
      </div>
    </div>
  );

  // --- 5. Logic การสั่งซื้อและ Upload Slip ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSlipImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const submitOrder = async () => {
    setIsLoading(true);

    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

    const orderData = {
      profile: {
        userId: profile.userId,
        displayName: profile.displayName
      },
      cart: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        subtotal: item.price * item.qty
      })),
      totalAmount,
      slipImage,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        setView('success');
        setCart([]);
        setSlipImage(null);
      } else {
        throw new Error('Failed to submit order');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 6. Main Render Logic ---

  // Loading State
  if (!profile) return (
    <div className="h-screen flex flex-col items-center justify-center bg-stone-50">
      <div className="relative">
        <div className="w-16 h-16 bg-orange-200 rounded-full animate-ping absolute"></div>
        <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-3xl relative shadow-xl text-white">🍜</div>
      </div>
      <p className="mt-8 text-gray-500 font-medium animate-pulse">กำลังโหลดร้านตั้มพานิช...</p>
    </div>
  );

  // Success View
  if (view === 'success') return (
    <div className="h-screen flex flex-col items-center justify-center bg-white p-8 text-center animate-fade-in">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-lg">
        <CheckCircle className="text-green-600 w-12 h-12" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">สั่งซื้อเรียบร้อย!</h1>
      <p className="text-gray-500 mb-8 text-sm leading-relaxed">
        ขอบคุณครับ! เราได้รับออเดอร์และสลิปแล้ว<br />
        พ่อครัวกำลังเริ่มปรุง รอรับใบเสร็จทาง LINE ได้เลยครับ
      </p>
      <button onClick={() => { setView('main'); setActiveTab('menu'); }} className="bg-stone-900 text-white w-full max-w-xs py-3 rounded-xl font-bold hover:bg-stone-800 transition-colors shadow-lg">
        กลับหน้าหลัก
      </button>
    </div>
  );

  // Cart & Payment View
  if (view === 'cart' || view === 'payment') return (
    <div className="min-h-screen bg-stone-50 flex flex-col animate-slide-in">
      <div className="bg-white p-4 shadow-sm flex items-center sticky top-0 z-20">
        <button onClick={() => setView(view === 'payment' ? 'cart' : 'main')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h2 className="font-bold text-lg ml-2 text-gray-800">{view === 'cart' ? 'ตะกร้าของฉัน' : 'ชำระเงิน'}</h2>
      </div>

      <div className="flex-1 p-4 overflow-y-auto pb-24">
        {view === 'cart' ? (
          <div className="space-y-4">
            {cart.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 w-10 h-10 flex items-center justify-center rounded-lg text-orange-700 font-bold text-sm shadow-inner">x{item.qty}</div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                    <p className="text-gray-400 text-xs">รวม ฿{item.price * item.qty}</p>
                  </div>
                </div>
                <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-gray-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={20} /></button>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center mt-20 text-gray-300 gap-4">
                <ShoppingCart size={48} />
                <p>ยังไม่มีสินค้าในตะกร้า</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
              <p className="text-gray-500 text-sm mb-1">ยอดชำระทั้งหมด</p>
              <p className="text-5xl font-bold text-orange-600 tracking-tight">฿{totalAmount}</p>
              <div className="mt-6 pt-6 border-t border-dashed border-gray-200 text-left space-y-3">
                <p className="text-sm font-bold flex items-center gap-2 text-gray-700"><CreditCard size={18} /> ข้อมูลโอนเงิน</p>
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">ธนาคาร</span>
                    <span className="text-sm font-medium">{BANK_INFO.name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">เลขบัญชี</span>
                    <span className="text-lg font-bold text-gray-800 tracking-wide">{BANK_INFO.account}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">ชื่อบัญชี</span>
                    <span className="text-sm font-medium">{BANK_INFO.owner}</span>
                  </div>
                  <button
                    className="w-full mt-3 bg-white border border-gray-300 text-gray-600 text-xs py-2 rounded-lg font-medium active:scale-95 transition-transform"
                    onClick={() => navigator.clipboard.writeText(BANK_INFO.account)}
                  >
                    คัดลอกเลขบัญชี
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <p className="font-bold mb-3 flex items-center gap-2 text-gray-800"><Upload size={18} /> แนบสลิปโอนเงิน</p>
              {!slipImage ? (
                <label className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer bg-stone-50 hover:bg-orange-50 hover:border-orange-300 transition-colors">
                  <Upload className="text-gray-400 mb-2" />
                  <span className="text-gray-500 text-sm font-medium">แตะเพื่ออัปโหลดรูปภาพ</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              ) : (
                <div className="relative group">
                  <img src={slipImage} className="w-full rounded-xl shadow-md" alt="Slip" />
                  <button onClick={() => setSlipImage(null)} className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors shadow-lg">
                    <X size={16} />
                  </button>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                    <CheckCircle size={12} /> พร้อมส่ง
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {view === 'cart' ? (
          <button
            onClick={() => setView('payment')}
            disabled={cart.length === 0}
            className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold disabled:bg-gray-300 text-lg shadow-lg active:scale-95 transition-all"
          >
            ไปชำระเงิน (฿{totalAmount})
          </button>
        ) : (
          <button
            onClick={submitOrder}
            disabled={!slipImage || isLoading}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex justify-center items-center gap-2 transition-all ${!slipImage || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 text-white active:scale-95 shadow-orange-600/30'
              }`}
          >
            {isLoading ? (
              <>กำลังตรวจสอบ...</>
            ) : (
              <>ยืนยันการสั่งซื้อ</>
            )}
          </button>
        )}
      </div>
    </div>
  );

  // --- 7. Main Tab Navigation View ---
  return (
    <div className="min-h-screen bg-stone-50 font-sans text-gray-900">

      {/* พื้นที่แสดงเนื้อหา (Menu, Story, Contact) */}
      <div className="max-w-md mx-auto bg-stone-50 min-h-screen shadow-2xl relative">
        {activeTab === 'menu' && <MenuScreen />}
        {activeTab === 'story' && <StoryScreen />}
        {activeTab === 'contact' && <ContactScreen />}

        {/* ปุ่มตะกร้าลอย (Floating Cart Button) */}
        {activeTab === 'menu' && cart.length > 0 && (
          <div className="fixed bottom-24 left-0 w-full px-4 z-30 flex justify-center">
            <button
              onClick={() => setView('cart')}
              className="w-full max-w-md bg-stone-900 text-white p-4 rounded-2xl shadow-xl shadow-stone-900/20 flex justify-between items-center transform hover:-translate-y-1 transition-all active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold animate-bounce">{totalItems}</div>
                <span className="font-medium text-sm text-gray-300">รายการในตะกร้า</span>
              </div>
              <span className="font-bold text-lg">฿{totalAmount} <span className="text-gray-500 ml-1">&gt;</span></span>
            </button>
          </div>
        )}

        {/* แถบเมนูด้านล่าง (Bottom Navigation) */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] safe-area-bottom">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'menu' ? 'text-orange-600 transform scale-110' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Utensils size={24} strokeWidth={activeTab === 'menu' ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-wide">เมนู</span>
          </button>

          <button
            onClick={() => setActiveTab('story')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'story' ? 'text-orange-600 transform scale-110' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <BookOpen size={24} strokeWidth={activeTab === 'story' ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-wide">เรื่องราว</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'contact' ? 'text-orange-600 transform scale-110' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Home size={24} strokeWidth={activeTab === 'contact' ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-wide">ร้าน</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TumPanichApp;