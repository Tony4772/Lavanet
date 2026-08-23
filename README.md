# LAVANET

Sistema ERP/POS multitenant para lavanderías.

## Estructura

- `frontend/` — React (Create React App + CRACO), demo localStorage + cliente API opcional
- `backend/` — Express + MongoDB + JWT

## Frontend (Vercel)

```bash
cd frontend
cp .env.example .env
yarn install
yarn start
```

Variables:

- `REACT_APP_BACKEND_URL` — URL del API (si está vacío, usa demo local)
- `REACT_APP_SHOW_DEMOS=true` — muestra accesos demo en login

En Vercel: Root Directory = `frontend`, o usa el `vercel.json` de la raíz.

## Backend

```bash
cd backend
cp .env.example .env
# Edita MONGO_URL y JWT_SECRET
npm install
npm start
```

Registro inicial:

```http
POST /api/auth/register
{ "tenantName": "MiLavanderia", "name": "Admin", "username": "admin", "email": "admin@demo.com", "password": "admin1234" }
```

Login:

```http
POST /api/auth/login
{ "username": "admin", "password": "admin1234" }
```

## Seguridad

- No commits de `.env` ni `node_modules`
- Rota `JWT_SECRET` si alguna vez se filtró
- En producción: `REACT_APP_SHOW_DEMOS=false`
