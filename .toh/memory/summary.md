# 📋 Project Summary

## Project Overview
- **Name:** Tum Panich LIFF (ตั้มพานิช)
- **Type:** LINE LIFF Food Ordering Application
- **Tech Stack:** React 19 + Vite 7 + Tailwind CSS 4 (Frontend), Express.js + PostgreSQL (Backend)

## Architecture
- **Frontend LIFF:** Single-page React app with React Context for state
- **Admin Panel:** Separate entry point (admin.html) with auth
- **Backend:** REST API with Express.js, PostgreSQL database
- **Auth:** LINE LIFF (customers), JWT (admin)

## Completed Features
- ✅ Menu browsing with categories
- ✅ Cart with localStorage persistence
- ✅ Order placement with delivery options
- ✅ Payment slip upload
- ✅ Order tracking (polling-based)
- ✅ Admin order management
- ✅ Admin dashboard with stats
- ✅ Location-based delivery fee calculation

## Current State
Project is functional but has several issues:
- 🔴 Security: Legacy auth fallback is insecure
- 🔴 Security: No rate limiting
- 🟠 UX: Polling instead of real-time updates
- 🟠 Production: No logging, no proper error tracking

## Key Files
- `src/App.jsx` - Main LIFF app with routing
- `src/services/api.js` - API client with all endpoints
- `src/context/UserContext.jsx` - LINE auth & user state
- `src/context/CartContext.jsx` - Cart state with localStorage
- `server/server.js` - Express server entry
- `server/middleware/liffAuth.js` - LIFF auth middleware
- `database/schema.sql` - PostgreSQL schema

## Important Notes
- Using Toh Framework v1.7.0
- Memory System is active
- Project has 9 customer-facing pages
- Admin has 4 pages (Dashboard, Orders, Menu, Reports)

---
*Last updated: 2025-12-26*
