export interface SetupScriptOptions {
  projectName: string;
  nodeVersion?: string;
}

export function generateSetupScript(options: SetupScriptOptions): string {
  const { projectName, nodeVersion = '20' } = options;

  return `#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# ${projectName} — Automated Setup Script
# Installs dependencies, sets up PostgreSQL, builds, and starts with PM2.
# Usage: chmod +x setup.sh && sudo ./setup.sh
# =============================================================================

APP_NAME="${projectName}"
NODE_MAJOR=${nodeVersion}
DB_NAME="${projectName.replace(/-/g, '_')}"
DB_USER="postgres"
DB_PASS="postgres"

echo "============================================"
echo "  Setting up $APP_NAME"
echo "============================================"

# ---------------------------------------------------------------------------
# 1. Node.js
# ---------------------------------------------------------------------------
if command -v node &>/dev/null; then
  echo "[✓] Node.js $(node -v) already installed"
else
  echo "[*] Installing Node.js $NODE_MAJOR..."
  curl -fsSL https://deb.nodesource.com/setup_\${NODE_MAJOR}.x | bash -
  apt-get install -y nodejs
  echo "[✓] Node.js $(node -v) installed"
fi

# ---------------------------------------------------------------------------
# 2. Docker (for PostgreSQL)
# ---------------------------------------------------------------------------
if command -v docker &>/dev/null; then
  echo "[✓] Docker already installed"
else
  echo "[*] Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "[✓] Docker installed"
fi

# ---------------------------------------------------------------------------
# 3. PostgreSQL via Docker
# ---------------------------------------------------------------------------
if docker ps -a --format '{{.Names}}' | grep -q "^\${APP_NAME}-postgres$"; then
  echo "[✓] PostgreSQL container already exists"
  docker start "\${APP_NAME}-postgres" 2>/dev/null || true
else
  echo "[*] Starting PostgreSQL 16 container..."
  docker run -d \\
    --name "\${APP_NAME}-postgres" \\
    -e POSTGRES_USER=$DB_USER \\
    -e POSTGRES_PASSWORD=$DB_PASS \\
    -e POSTGRES_DB=$DB_NAME \\
    -p 5432:5432 \\
    --restart unless-stopped \\
    postgres:16-alpine
fi

echo "[*] Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if docker exec "\${APP_NAME}-postgres" pg_isready -U $DB_USER -d $DB_NAME &>/dev/null; then
    echo "[✓] PostgreSQL is ready"
    break
  fi
  sleep 1
done

# ---------------------------------------------------------------------------
# 4. Install dependencies & build
# ---------------------------------------------------------------------------
echo "[*] Installing Node.js dependencies..."
npm ci --omit=dev

echo "[*] Building the application..."
npm run build

# ---------------------------------------------------------------------------
# 5. PM2
# ---------------------------------------------------------------------------
if command -v pm2 &>/dev/null; then
  echo "[✓] PM2 already installed"
else
  echo "[*] Installing PM2..."
  npm install -g pm2
fi

pm2 delete "$APP_NAME" 2>/dev/null || true
pm2 start npm --name "$APP_NAME" -- start
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo ""
echo "============================================"
echo "  ✓ $APP_NAME is running!"
echo "  → http://$(hostname -I | awk '{print $1}'):3000"
echo "============================================"
`;
}
