# Frontend — EcoFarm 🎛️

## Overview
- Tech stack: React + Vite, Tailwind CSS, Leaflet (for maps), `axios` for HTTP.
- Entry: `frontend/src/main.jsx` → `App.jsx`
- Important components (in `frontend/src/components`):
  - `Landing.jsx` — marketing / intro page
  - `Home.jsx` — high level landing/dashboard
  - `GamePage.jsx` — main gameplay view, interacts with backend endpoints
  - `Report.jsx` — shows recommendations/analysis

## Scripts
- Install: `npm install` or `pnpm install`
- Dev: `npm run dev` (Vite dev server)
- Build: `npm run build`
- Preview production build: `npm run preview`

## How frontend talks to backend
- Uses axios to call FastAPI endpoints (port 8000 by default).
- CORS is enabled server-side for `*` origins.
- Map integration (Leaflet) is used to pick/init by location (`/init_by_location`).

## Component responsibilities & props (short)
- `GamePage`:
  - loads `/state` and `/meta`, renders a 4×4 grid of cells
  - actions: plant, irrigate, plough, harvest via `/action` and `/plant`
- `Report`:
  - fetches `/recommend` or `/recommend/cell/{r}/{c}` and displays top crops

**TODOs / Improvements**
- Add E2E tests (Cypress or Playwright) covering common flows (init → plant → tick → harvest).
- Add integration test that runs backend + frontend via docker-compose for CI.