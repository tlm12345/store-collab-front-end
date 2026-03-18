# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 + Vite + TypeScript frontend application for a store collaboration platform. It uses Session-based authentication (not JWT) with a Java backend.

## Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production (type-check + build)
npm run build

# Preview production build
npm run preview

# Run unit tests (Vitest)
npm run test:unit

# Run a single test file
npx vitest run src/components/__tests__/HelloWorld.spec.ts

# Run tests in watch mode
npx vitest

# Lint and fix issues (runs oxlint + eslint)
npm run lint

# Format code with Prettier
npm run format

# Type check only
npm run type-check
```

## Project Architecture

### Authentication & Session Management

The backend uses **Session-based authentication** (not JWT). Key implications:

- HTTP requests must include `credentials: 'include'` to send cookies cross-origin (configured in `src/utils/http.ts`)
- No token storage in localStorage - the browser handles cookies automatically
- User info is stored in localStorage (`user_info` key) for UI state persistence only
- Logout requires calling the backend to invalidate the server-side session

### API Layer Structure

```
src/
├── api/           # API modules organized by feature
│   ├── auth.ts    # Login, register, logout
│   └── user.ts    # User CRUD operations (admin)
├── config/
│   └── api.ts     # API_BASE_URL, API_ENDPOINTS, getFullUrl()
├── types/
│   └── api.ts     # TypeScript interfaces for API requests/responses
└── utils/
    └── http.ts    # HTTP request wrapper with fetch
```

**API Response Format**: All backend responses follow this structure:
```typescript
interface ApiResponse<T> {
  code: number;        // 0 = success, non-zero = error
  data: T | null;      // Response payload
  message: string;     // Brief message
  description: string; // Detailed error description
}
```

**Making API Calls**: Use the HTTP utility methods:
```typescript
import { get, post, put, del } from '@/utils/http'

// GET request
const response = await get<UserVO>('/user/get?id=123')

// POST request
const response = await post<PageResponse<UserVO>>('/user/list/page/vo', queryData)
```

### State Management (Pinia)

The `useUserStore` in `src/stores/user.ts` manages authentication state:
- `user` - Current user info (null if not logged in)
- `isLoggedIn` - Computed boolean for auth status
- `login()`, `logout()`, `register()` - Async actions
- Auto-initializes from localStorage on app start

### Routing & Navigation Guards

Router configuration in `src/router/index.ts` includes guards for protected routes:

```typescript
// Protected route (requires login)
meta: { requiresAuth: true }

// Admin only route
meta: { requiresAuth: true, requiresAdmin: true }
```

The `beforeEach` guard checks `useUserStore().isLoggedIn` and redirects to `/login` if unauthenticated.

### Environment Configuration

Environment variables (in `.env.*` files):
- `VITE_API_BASE_URL` - Backend API base URL (e.g., `http://localhost:8080/api`)

Create `.env.local` from `.env.example` for local development.

## Code Style & Linting

- **ESLint**: Uses `@vue/eslint-config-typescript` with Vue essential rules
- **Oxlint**: Fast linter for correctness checks (configured in `.oxlintrc.json`)
- **Prettier**: Format on save recommended
- **Path alias**: `@/` maps to `src/`

## Key Files for Reference

| File | Purpose |
|------|---------|
| `src/utils/http.ts` | HTTP client with Session cookie support |
| `src/types/api.ts` | API type definitions and interfaces |
| `src/config/api.ts` | API endpoints and configuration |
| `src/stores/user.ts` | User authentication state management |
| `src/router/index.ts` | Route definitions and navigation guards |
| `src/views/user/UserGalleryView.vue` | User public gallery page |
| `src/views/user/ImageDetailView.vue` | Image detail page with download |

## Space Management System

### Overview

The platform supports **Space** functionality for organizing pictures. Each space is a container for pictures with capacity limits and member management.

### Space Types

| Type | Value | Description |
|------|-------|-------------|
| `PRIVATE` | 0 | Private personal space (每个用户只能创建1个) |
| `TEAM` | 1 | Team/collaborative space (每个用户只能创建1个) |

### Space Levels

| Level | Max Size | Max Count | Description |
|-------|----------|-----------|-------------|
| COMMON | 100 MB | 100 | Standard level |
| PROFESSIONAL | 500 MB | 500 | Professional level |
| FLAGSHIP | 1000 MB | 1000 | Flagship level |

### Space Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `admin` | Administrator | All permissions including member management |
| `editor` | Editor | View, upload, edit, delete pictures |
| `viewer` | Viewer | View only |

### Space API Endpoints

**Base Path:** `/space`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/space/create` | Create new space |
| POST | `/space/delete` | Delete space (owner only) |
| POST | `/space/edit` | Edit space name |
| GET | `/space/get` | Get space details |

**Space Member API** (`/space_user`):

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/space_user/add` | Add member to space |
| POST | `/space_user/delete` | Remove member |
| POST | `/space_user/update` | Update member role |
| GET | `/space_user/list/my` | List all members in space |

### Space Data Structure

```typescript
interface Space {
  id: string;
  spaceName: string;
  spaceLevel: number;      // 0=COMMON, 1=PROFESSIONAL, 2=FLAGSHIP
  spaceType: number;       // 0=PRIVATE, 1=TEAM
  spaceSizeUsed: number;   // bytes used
  spaceMaxSize: number;    // max bytes allowed
  spaceTotalCount: number; // current picture count
  spaceMaxCount: number;   // max pictures allowed
  userId: string;          // creator user ID
  createTime: string;
  updateTime: string;
}

interface SpaceUser {
  id: string;
  spaceId: string;
  userId: string;
  spaceRole: 'admin' | 'editor' | 'viewer';
  createTime: string;
}

interface SpaceVO extends Space {
  userVO?: UserVO;              // creator info
  permissionList?: string[];    // current user's permissions in this space
}
```
