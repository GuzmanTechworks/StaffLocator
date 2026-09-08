# Staff Locator API

NestJS + Prisma API for the Ionic Staff Locator dashboard.

## 1. Prepare MariaDB/MySQL

On `172.16.50.59`, create a database and a user that can connect from the machine running this API:

```sql
CREATE DATABASE staff_locator CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'staff_locator'@'%' IDENTIFIED BY 'change-me';
GRANT ALL PRIVILEGES ON staff_locator.* TO 'staff_locator'@'%';
FLUSH PRIVILEGES;
```

Also allow TCP port `3306` through the database server firewall. Restrict the user host instead of `%` when the API machine's IP is known.

## 2. Configure and migrate

Copy `.env.example` to `.env` and set the real database password. Then run:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

Set `JWT_SECRET` in `.env` to a long random value before starting the API. Users sign in through the Ionic login screen with their username and password. The seed creates `isd.admin` as an administrator and `0000004457` as a regular user; change these passwords before production use.

The seed also creates four sample locations.

## 3. Run the API

```bash
npm run start:dev
```

The API listens on all interfaces at `http://172.16.50.59:3000` when run on that server. The Ionic app is configured to call that URL in `src/environments/environment.ts` and `environment.prod.ts`.

## API endpoints

- `GET /health`
- `POST /auth/login` with `{ "username", "password" }`
- `GET /dashboard` is public so the live roster can be viewed without signing in
- `POST /users` with a bearer token and administrator role
- `POST /locations` with a bearer token and administrator role
- `POST /visits/timeout` with a bearer token and `{ "userId", "locationId" }`
- `PATCH /visits/:id/timein` with a bearer token

The dashboard refreshes every 10 seconds. For true push-based updates, add Socket.IO or Server-Sent Events after authentication is in place.

## Production notes

User and location administration is protected by the NestJS administrator guard. Keep the API behind your trusted network and use HTTPS when it is exposed beyond the LAN.

## Docker deployment

From the repository root on the VPS, make sure `server/.env` contains the production `DATABASE_URL`, a strong `JWT_SECRET`, and `PORT=3000`. Then run:

```bash
docker compose up -d --build
docker compose ps
curl http://localhost:8080/api/health
```

The Angular app is served at `http://<vps-address>:8080`. Nginx serves the SPA and forwards `/api/*` to the NestJS container. The API container is not published directly to the host. Database schema migrations are not run automatically; apply the Prisma migration procedure above before starting the containers when migrations are available.
