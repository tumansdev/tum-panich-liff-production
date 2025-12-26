import React, { useState } from 'react';
import { CartProvider } from './context/CartContext';
import { UserProvider, useUser } from './context/UserContext';
import { BottomNav } from './components/layout';
import { Loading, ErrorBoundary } from './components/common';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  MenuPage,
  CartPage,
  PaymentPage,
  SuccessPage,
  StoryPage,
  ContactPage,
  OrderHistoryPage,
  TrackingPage,
  ProfilePage,
} from './pages';

// Main App with Providers
function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <CartProvider>
          <OfflineIndicator />
          <AppContent />
        </CartProvider>
      </UserProvider>
    </ErrorBoundary>
  );
}

// App Content with navigation
function AppContent() {
  const { isLoading, error } = useUser();
  const [currentPage, setCurrentPage] = useState('menu');
  const [activeTab, setActiveTab] = useState('menu');
  const [orderData, setOrderData] = useState(null);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState(null);

  // Handle loading state
  if (isLoading) {
    return <Loading message="กำลังเข้าสู่ระบบ..." />;
  }

  // Handle error (but allow dev mode)
  if (error && !import.meta.env.DEV) {
    return (
      <div className="min-h-screen bg-background-light flex flex-col items-center justify-center p-6">
        <span className="material-symbols-outlined text-6xl text-red-400 mb-4">error</span>
        <p className="text-gray-600 font-medium">เกิดข้อผิดพลาด</p>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  // Navigation handlers
  const goToPage = (page) => setCurrentPage(page);
  const goToTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'menu') setCurrentPage('menu');
    else if (tab === 'orders') setCurrentPage('orders');
    else if (tab === 'story') setCurrentPage('story');
    else if (tab === 'contact') setCurrentPage('contact');
    else if (tab === 'profile') setCurrentPage('profile');
  };

  const handleOrderSuccess = (data) => {
    setOrderData(data);
    setCurrentPage('success');
  };

  const handleTrackOrder = (orderNumber) => {
    setTrackingOrderNumber(orderNumber || orderData?.orderNumber);
    setCurrentPage('tracking');
  };

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'menu':
        return <MenuPage onGoToCart={() => goToPage('cart')} />;

      case 'cart':
        return (
          <CartPage
            onBack={() => goToPage('menu')}
            onCheckout={() => goToPage('payment')}
          />
        );

      case 'payment':
        return (
          <PaymentPage
            onBack={() => goToPage('cart')}
            onSuccess={handleOrderSuccess}
          />
        );

      case 'success':
        return (
          <SuccessPage
            orderData={orderData}
            onGoHome={() => {
              setActiveTab('menu');
              goToPage('menu');
            }}
            onTrackOrder={() => handleTrackOrder()}
          />
        );

      case 'tracking':
        return (
          <TrackingPage
            orderNumber={trackingOrderNumber}
            onBack={() => goToPage('orders')}
            onGoHome={() => {
              setActiveTab('menu');
              goToPage('menu');
            }}
          />
        );

      case 'orders':
        return (
          <OrderHistoryPage
            onViewOrder={(order) => {
              setTrackingOrderNumber(order.order_number);
              goToPage('tracking');
            }}
          />
        );

      case 'story':
        return <StoryPage />;

      case 'contact':
        return <ContactPage />;

      case 'profile':
        return <ProfilePage onNavigate={goToTab} />;

      default:
        return <MenuPage onGoToCart={() => goToPage('cart')} />;
    }
  };

  // Pages with bottom nav
  const showBottomNav = ['menu', 'orders', 'story', 'contact', 'profile'].includes(currentPage);

  return (
    <>
      {renderPage()}
      {showBottomNav && <BottomNav activeTab={activeTab} onTabChange={goToTab} />}
    </>
  );
}

export default App;