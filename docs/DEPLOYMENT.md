# Deployment Guide

This guide covers deploying CookingAssistant to Fly.io.

---

## Prerequisites

1. Install the Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
2. Authenticate: `fly auth login`

---

## Initial Setup

### 1. Create the Fly App

```bash
# From the repository root
fly apps create cooking-assistant
```

If the name is taken, update `app` in `fly.toml` to match your chosen name.

### 2. Create Persistent Volume

SQLite requires a persistent volume to survive deploys:

```bash
# Create a 1GB volume in the primary region (iad = Ashburn, VA)
fly volumes create cooking_assistant_data --region iad --size 1
```

**Important**: The volume name must match `source` in the `[mounts]` section of `fly.toml`.

### 3. Set Secrets

Required secrets for production:

```bash
# Generate a secure secret key (required for JWT tokens)
fly secrets set SECRET_KEY=$(openssl rand -hex 32)

# Optional: Sentry for error tracking
fly secrets set SENTRY_DSN=https://your-sentry-dsn@sentry.io/project

# Optional: LLM configuration (for AI features)
fly secrets set LLM_MODEL=ollama/llama3.1:8b
fly secrets set OLLAMA_API_BASE=https://your-ollama-endpoint
```

| Secret | Required | Description |
|--------|----------|-------------|
| `SECRET_KEY` | Yes | JWT signing key (generate with `openssl rand -hex 32`) |
| `SENTRY_DSN` | No | Sentry error tracking DSN |
| `LLM_MODEL` | No | LLM model identifier (e.g., `ollama/llama3.1:8b`) |
| `OLLAMA_API_BASE` | No | Ollama API base URL for self-hosted LLM |

### 4. Configure CORS (Optional)

If your frontend is hosted separately, add allowed origins:

```bash
fly secrets set CORS_ORIGINS=https://your-frontend-domain.com,https://cooking-assistant.fly.dev
```

---

## CI/CD Pipeline

### Automated Deployment with GitHub Actions

The project includes a CD workflow that automatically deploys to Fly.io when a version tag is pushed. The workflow:

1. Runs backend CI (lint, type check, tests)
2. Runs frontend CI (lint, type check, build, tests)
3. Deploys to Fly.io only if both CI jobs pass

#### Setting up FLY_API_TOKEN

The GitHub Actions workflow requires a `FLY_API_TOKEN` secret to authenticate with Fly.io.

**Step 1: Generate a Fly.io API token**

```bash
# Generate a new deploy token
fly tokens create deploy -x 999999h
```

This creates a token scoped to deployments with a long expiry. Copy the generated token.

**Step 2: Add the secret to GitHub**

1. Go to your repository on GitHub
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `FLY_API_TOKEN`
5. Value: Paste the token from Step 1
6. Click **Add secret**

#### Triggering a Deployment

To trigger an automated deployment, push a version tag:

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

The workflow will:
- Run backend CI (lint, format, type check, tests)
- Run frontend CI (lint, format, type check, build, tests)
- Deploy to Fly.io if all checks pass
- Verify the deployment health check

You can monitor the deployment progress in the **Actions** tab of your GitHub repository.

---

## Manual Deploy

```bash
# Deploy the application
fly deploy
```

This will:
1. Build the Docker image (multi-stage: frontend + backend)
2. Push to Fly's registry
3. Start the app with database migrations

### Dry Run

Validate configuration without deploying:

```bash
fly deploy --dry-run
```

---

## Verify Deployment

### Health Check

```bash
curl https://cooking-assistant.fly.dev/api/v1/health
```

Expected response:
```json
{"status": "healthy", "service": "cooking-assistant-api", "version": "1.0.0"}
```

### Logs

```bash
fly logs
```

### SSH into Machine

```bash
fly ssh console
```

---

## Database Management

### Backup

```bash
# SSH and copy database
fly ssh console -C "cat /data/cooking_assistant.db" > backup.db
```

### Restore

```bash
# Create a backup first, then restore
cat backup.db | fly ssh console -C "cat > /data/cooking_assistant.db"
```

### Migrations

Migrations run automatically on deploy via `docker-entrypoint.sh`. For manual migration:

```bash
fly ssh console -C "cd /app/backend && alembic upgrade head"
```

---

## Scaling

### Horizontal Scaling

```bash
# Add more machines
fly scale count 2
```

**Note**: SQLite is single-writer. For multi-machine deployments, consider LiteFS or switch to PostgreSQL.

### Vertical Scaling

```bash
# Upgrade VM size
fly scale vm shared-cpu-2x --memory 512
```

---

## Monitoring

### Metrics

View machine metrics in the Fly dashboard:
https://fly.io/apps/cooking-assistant/monitoring

### Sentry Integration

If `SENTRY_DSN` is configured, errors are automatically reported to Sentry with:
- Release version tracking
- Performance traces
- User context

---

## Troubleshooting

### App Won't Start

1. Check logs: `fly logs`
2. Verify secrets are set: `fly secrets list`
3. Verify volume exists: `fly volumes list`

### Database Issues

1. SSH into the machine: `fly ssh console`
2. Check database file: `ls -la /data/`
3. Run migrations manually: `cd /app/backend && alembic upgrade head`

### Health Check Failing

1. Verify the app is running: `fly status`
2. Check if port 8000 is exposed: `fly ssh console -C "curl localhost:8000/api/v1/health"`

---

## Configuration Reference

### fly.toml Settings

| Setting | Value | Description |
|---------|-------|-------------|
| `primary_region` | `iad` | Primary deployment region |
| `vm.memory` | `256mb` | RAM allocation (free tier compatible) |
| `vm.cpu_kind` | `shared` | Shared CPU (free tier compatible) |
| `auto_stop_machines` | `stop` | Stop idle machines to save costs |
| `min_machines_running` | `0` | Allow all machines to stop when idle |

### Environment Variables (set in fly.toml)

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `sqlite+aiosqlite:////data/cooking_assistant.db` | SQLite path on volume (absolute) |
| `PYTHONPATH` | `/app/backend` | Python import path |
| `DEBUG` | `false` | Disable debug mode in production |
