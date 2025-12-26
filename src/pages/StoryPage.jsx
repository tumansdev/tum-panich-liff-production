import React from 'react';
import { Icon } from '../components/common';
import { BANK_INFO } from '../services/api';

const StoryPage = () => {
  return (
    <div className="min-h-screen bg-background-light pb-24">
      {/* Hero Section */}
      <div className="relative h-72 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1555126634-323283e090fa?q=80&w=2000"
          alt="ตั้มพานิช"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent"></div>
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex items-center gap-4 mb-3">
            <img
              src={BANK_INFO.logoUrl}
              alt="Logo"
              className="w-20 h-20 rounded-full border-4 border-white/30 shadow-2xl"
            />
            <div>
              <h1 className="text-3xl font-black">ตั้มพานิช</h1>
              <p className="text-sm opacity-90 font-medium">จากวิกฤต... สู่ตำนานหมูแดงแห่งอ่างทอง</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Headline Quote */}
        <div className="relative bg-gradient-to-br from-primary to-primary-hover rounded-2xl p-6 text-white shadow-lg overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <Icon name="format_quote" className="text-4xl text-white/30 mb-2" />
          <h2 className="text-xl font-bold leading-snug mb-3">
            รสชาติแห่งการเริ่มต้นใหม่<br />
            ที่ใส่หัวใจลงไปในหมูแดงทุกชิ้น
          </h2>
          <p className="text-white/80 text-sm">
            "เมื่อชีวิตพาทุกอย่างกลับมาที่ศูนย์... ผมจึงเริ่มต้นนับหนึ่งใหม่ด้วย 'ก๋วยเตี๋ยว' ที่ผมรัก"
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Icon name="person" className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">คุณตั้ม</p>
              <p className="text-xs text-white/70">เจ้าของร้านตั้มพานิช</p>
            </div>
          </div>
        </div>

        {/* Opening Quote */}
        <div className="text-center py-4">
          <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold">
            <Icon name="local_fire_department" className="text-lg mr-1 align-middle" />
            คนเราล้มได้... แต่ต้องลุกให้เป็น และต้องลุกให้ 'อร่อย' กว่าเดิม
          </div>
        </div>

        {/* Story Content */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <Icon name="auto_stories" className="text-primary" />
            เรื่องราวของผม
          </h3>

          <div className="text-gray-600 space-y-5 leading-relaxed">
            <p className="first-letter:text-4xl first-letter:font-bold first-letter:text-primary first-letter:float-left first-letter:mr-2">
              ผมชื่อ 'ตั้ม' ครับ... ชีวิตผมผ่านการทำธุรกิจมาหลายอย่าง
              และสารภาพตามตรงว่าครั้งล่าสุดมัน <span className="text-primary font-medium">"พังไม่เป็นท่า"</span> จนผมต้องถอยกลับมาตั้งหลักที่บ้านเกิดที่อ่างทอง
            </p>

            <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-primary">
              <p className="text-gray-700 italic">
                ในวันที่ท้อแท้ สิ่งที่เยียวยาผมได้กลับเป็นสิ่งที่เรียบง่ายที่สุด
                คือความทรงจำของ <span className="font-bold">"เด็กชายที่รักก๋วยเตี๋ยวป๊อกๆ"</span>
              </p>
            </div>

            <p>
              ผมเป็นคนชอบทานก๋วยเตี๋ยวมาก ชอบจนลองทำทานเอง
              ลองผิดลองถูกอยู่ในครัวเล็กๆ ที่บ้าน
            </p>

            <div className="flex items-start gap-3 bg-green-50 p-4 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <Icon name="lightbulb" className="text-white" />
              </div>
              <div>
                <p className="font-bold text-green-700 mb-1">จุดเปลี่ยนสำคัญ</p>
                <p className="text-green-800 text-sm">
                  เมื่อผมทำแจกเพื่อนบ้าน... เสียงตอบรับไม่ใช่แค่ "กินได้"
                  แต่ทุกคนบอกว่า <span className="font-bold">"ทำอีกนะ"</span> โดยเฉพาะ "หมูแดง" ที่ใครกินก็ติดใจ
                </p>
              </div>
            </div>

            <p>
              วินาทีนั้น ผมตระหนักได้ว่า บางทีความสุขและความสำเร็จอาจไม่ได้อยู่ที่ธุรกิจใหญ่โตไกลตัว
              แต่อยู่ที่ <span className="text-primary font-medium">การได้ทำของอร่อยๆ ให้คนทานแล้วมีความสุข</span>
            </p>
          </div>
        </div>

        {/* Birth of Tum Panich */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
              <Icon name="storefront" className="text-3xl text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">ร้าน "ตั้มพานิช" ถือกำเนิดขึ้น</h3>
              <p className="text-sm text-gray-600">ไม่ใช่แค่ร้านก๋วยเตี๋ยว...</p>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed">
            แต่คือ <span className="font-bold text-primary">"โอกาสครั้งที่สอง"</span> ของผม
            ที่พิถีพิถันกับหมูแดงทุกชิ้น เส้นทุกคำ
            เพื่อส่งต่อรสชาติแห่งความตั้งใจนี้... <span className="font-bold">ให้ถึงมือคุณ</span>
          </p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <div className="w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
              <Icon name="local_fire_department" className="text-2xl text-red-500" />
            </div>
            <h4 className="font-bold text-gray-900">ย่างถ่านแท้</h4>
            <p className="text-xs text-gray-500 mt-1">หอมควันไม้</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
              <Icon name="eco" className="text-2xl text-green-500" />
            </div>
            <h4 className="font-bold text-gray-900">วัตถุดิบสด</h4>
            <p className="text-xs text-gray-500 mt-1">คัดสรรทุกวัน</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
              <Icon name="handshake" className="text-2xl text-blue-500" />
            </div>
            <h4 className="font-bold text-gray-900">ใจรัก</h4>
            <p className="text-xs text-gray-500 mt-1">ไม่ใช่แค่ขาย</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="favorite" className="text-2xl text-primary" />
            </div>
            <h4 className="font-bold text-gray-900">โอกาสที่ 2</h4>
            <p className="text-xs text-gray-500 mt-1">ใส่ใจทุกจาน</p>
          </div>
        </div>

        {/* Closing Message */}
        <div className="bg-primary/5 rounded-2xl p-5 text-center border border-primary/20">
          <Icon name="restaurant" className="text-4xl text-primary mb-2" />
          <p className="text-gray-700 font-medium">
            "ขอบคุณที่เลือกทาน<span className="text-primary font-bold">ตั้มพานิช</span>"
          </p>
          <p className="text-sm text-gray-500 mt-1">
            ทุกออเดอร์คือความไว้ใจที่ผมจะไม่มีวันทำให้ผิดหวัง
          </p>
        </div>
      </main>
    </div>
  );
};

export default StoryPage;
