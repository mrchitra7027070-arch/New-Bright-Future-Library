# Library Seat Management System

## Run Locally in VS Code

Prerequisite: Node.js

```bat
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Do not open `0.0.0.0:3000` in the browser. Use `localhost:3000`.

## Environment Setup

Create a local `.env` file from `.env.example`:

```bat
copy .env.example .env
```

For local-only use, leave `MONGODB_URI` empty or remove it. The app will save data in `db.json`.

For MongoDB Atlas/Railway production, set these variables in Railway:

```text
NODE_ENV=production
JWT_SECRET=your-long-random-secret
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/library-seat-management?retryWrites=true&w=majority
MONGODB_DB_NAME=library-seat-management
ADMIN_DEFAULT_PASSWORD=change-admin-password
```

Never commit `.env`. It is ignored by `.gitignore`.

## Data Storage

The app supports two modes:

- Local development without MongoDB: data is saved in `db.json`.
- Production with MongoDB Atlas: data is saved in MongoDB when `MONGODB_URI` is configured.

The server automatically falls back to `db.json` if MongoDB is not configured or cannot connect.

## MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster.
2. Create a database user with a strong password.
3. Copy the SRV connection string.
4. Replace username, password, and cluster in `MONGODB_URI`.
5. In Atlas Network Access, add `0.0.0.0/0` for Railway access, or use a stricter private networking setup if available.
6. Add `MONGODB_URI` only in Railway Variables, not in GitHub.

## Railway Deployment

1. Push this project to GitHub.
2. Create a new Railway project from the GitHub repository.
3. Add the environment variables listed above in Railway Variables.
4. Railway will run:

```bash
npm install && npm run build
npm start
```

The app binds to Railway's `PORT` and uses `0.0.0.0` in production.

## GitHub Commands

If this folder is not already a Git repository:

```bash
git init
git add .
git commit -m "Prepare app for MongoDB Atlas and Railway"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Windows Double-Click Option

Double-click:

```bat
start-dev.bat
```

Or run:

```bat
npm run dev:win
```

If port `3000` is busy:

```powershell
$env:PORT=3001; npm run dev
```

## Build Check

```bash
npm run lint
npm run build
```
