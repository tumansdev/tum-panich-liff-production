# 🧠 Key Decisions

## Architecture Decisions
| Date | Decision | Reason |
|------|----------|--------|
| 2025-12-26 | Use Toh Framework | AI-Orchestration Driven Development |
| 2025-12-26 | Keep React + Vite stack | Already in use, working well |
| 2025-12-26 | Keep Express + PostgreSQL | Already in use, proper schema exists |
| 2025-12-26 | Add WebSocket for real-time | Polling is inefficient and wastes resources |

## Design Decisions
| Date | Decision | Reason |
|------|----------|--------|
| 2025-12-26 | Security first | Legacy auth is critical vulnerability |
| 2025-12-26 | Phased approach | Too many changes at once is risky |

## Business Logic
| Date | Decision | Reason |
|------|----------|--------|
| 2025-12-26 | Keep delivery options | pickup, free_delivery (2km), easy_delivery |
| 2025-12-26 | Keep order status flow | pending → confirmed → cooking → ready → delivered |

## Rejected Ideas
| Date | Idea | Why Rejected |
|------|------|--------------|
| 2025-12-26 | Migrate to TypeScript | Too much work for current scope, can do later |
| 2025-12-26 | Switch to Next.js | Unnecessary - Vite is working fine for LIFF |
| 2025-12-26 | Use Firebase | Already using PostgreSQL, no need to change |

---
*Last updated: 2025-12-26*
