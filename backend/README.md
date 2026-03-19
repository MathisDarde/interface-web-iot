# Backend (Auth)

Minimal backend Express + Prisma (Neon Postgres) avec:

- `POST /auth/register`
- `POST /auth/login`

## Setup

1. Installer les deps

```bash
cd backend
npm i
```

2. Créer `.env`

```bash
copy .env.example .env
```

Puis remplir `DATABASE_URL` (Neon) et `JWT_SECRET`.

3. Migrer + générer Prisma Client

```bash
npm run prisma:migrate
```

4. Démarrer le serveur

```bash
npm run dev
```

Le serveur écoute sur `http://localhost:3001`.

## Endpoints

### POST /auth/register

Body JSON:

```json
{ "email": "test@mail.com", "password": "motdepasse" }
```

### POST /auth/login

Body JSON:

```json
{ "email": "test@mail.com", "password": "motdepasse" }
```
