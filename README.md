# Real-Time Chat Application (Web)

A production-quality real-time chat web app built for an internship assignment. The stack uses **React (Vite)** on the frontend, **Node.js + Express + Socket.io** on the backend, and **Supabase PostgreSQL** as the database only (no Supabase Realtime).

## Features

- Real-time messaging via **Socket.io** (no polling, no Firebase, no Supabase Realtime)
- Dummy username login with **localStorage** persistence
- WhatsApp-inspired UI with dark mode, gradients, and animations
- Own messages on the right, others on the left with timestamps
- Typing indicators, online users, connection status
- Auto-scroll, skeleton loaders, empty states, error handling
- Automatic socket reconnection

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, TypeScript, React Router, Axios, Socket.io Client, React Hook Form, Context API |
| Backend | Node.js, Express, TypeScript, Socket.io, Supabase JS SDK, dotenv, cors, helmet, compression, morgan, express-validator |
| Database | Supabase PostgreSQL |

## Project Structure

```
heena project/
├── backend/
│   ├── src/
│   │   ├── config/          # Supabase client initialization
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── middleware/      # Validation & error handling
│   │   ├── routes/          # REST API routes
│   │   ├── services/        # Business logic & Supabase queries
│   │   ├── socket/          # Socket.io event handlers
│   │   ├── types/           # TypeScript interfaces
│   │   ├── app.ts           # Express app setup
│   │   └── server.ts        # HTTP + Socket.io server
│   ├── render.yaml            # Render deployment config
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── constants/       # Config & socket event names
│   │   ├── contexts/        # Auth, Theme, Socket contexts
│   │   ├── hooks/           # useChat custom hook
│   │   ├── pages/           # Login & Chat pages
│   │   ├── services/        # API, Socket, Storage services
│   │   ├── types/           # TypeScript interfaces
│   │   └── utils/           # Helpers (time formatting)
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── supabase/
│   └── schema.sql             # Database schema
└── README.md
```

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- [Supabase](https://supabase.com) account

### 1. Supabase Configuration

1. Create a new project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Project Settings → API** and copy:
   - Project URL → `SUPABASE_URL`
   - `anon` public key → `SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Backend Installation

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Start the backend:

```bash
npm run dev
```

The server runs at `http://localhost:3000`. Health check: `GET /health`

### 3. Frontend Installation

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

Start the web app:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## Environment Variables

### Backend

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | `development` or `production` |
| `CORS_ORIGIN` | Allowed CORS origin (`*` for dev) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend REST API base URL |
| `VITE_SOCKET_URL` | Backend Socket.io server URL |

## API Documentation

### `GET /health`

Health check endpoint.

### `GET /api/messages`

Returns chat history ordered by `created_at` ascending.

### `POST /api/messages`

Save a message to Supabase and emit `receive-message` via Socket.io.

**Body:** `{ "username": "john", "message": "Hello!" }`

### `GET /api/users`

Returns currently online users.

## Socket.io Events

### Client → Server

| Event | Payload |
|-------|---------|
| `join` | `{ username: string }` |
| `send-message` | `{ username: string, message: string }` |
| `typing` | `{ username: string, isTyping: boolean }` |

### Server → Client

| Event | Payload |
|-------|---------|
| `receive-message` | Message object |
| `typing` | `{ username, isTyping }` |
| `online-users` | OnlineUser[] |
| `user-joined` | `{ username }` |
| `user-left` | `{ username }` |
| `error` | `{ message }` |

## Deployment

### Backend on Render

1. Push the repo to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set root directory to `backend`
4. Build: `npm install && npm run build`
5. Start: `npm start`
6. Add environment variables from `backend/.env.example`

### Frontend (Static Site)

Build the production bundle:

```bash
cd frontend
npm run build
```

Deploy the `frontend/dist` folder to **Vercel**, **Netlify**, or **Render Static Site**.

Set environment variables on your hosting platform:

```env
VITE_API_URL=https://your-backend.onrender.com
VITE_SOCKET_URL=https://your-backend.onrender.com
```

For **Render Static Site**, add a `_redirects` or configure SPA fallback to `index.html`.

## Scripts

### Backend
```bash
npm run dev      # Development with hot reload
npm run build    # Compile TypeScript
npm start        # Run production build
```

### Frontend
```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Production build
npm run preview  # Preview production build
```

## Design Decisions

1. **Socket.io for all real-time communication** — Supabase is used strictly as a PostgreSQL database. No Supabase Realtime.
2. **Vite + React for web** — Fast dev experience, optimized production builds, standard web APIs (localStorage).
3. **CSS variables for theming** — Light/dark mode without a heavy UI framework.
4. **Service role key on backend only** — Database credentials never reach the browser.

## Assumptions

- Single global chat room (no private rooms or DMs)
- Dummy username login (no password or OAuth)
- Usernames are unique; reconnecting updates the existing record
- No message pagination (suitable for demo/assignment scale)

## License

MIT
