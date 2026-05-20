#!/bin/bash
# Authentic Internet — deployment helper
# Backend: Render (auto-deploy on push to main via render.yaml)
# Frontend: Netlify (root netlify.toml + GitHub Actions or Netlify CLI)

set -e

API_URL="${RENDER_API_URL:-https://authentic-internet.onrender.com}"
FRONTEND_URL="${NETLIFY_SITE_URL:-https://flourishing-starburst-8cf88b.netlify.app}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Authentic Internet — deployment${NC}"
echo ""
echo "  API (Render):     $API_URL"
echo "  Frontend:         $FRONTEND_URL"
echo ""
echo "  Backend deploys automatically when you push to main."
echo "  See docs/DEPLOYMENT.md and docs/RENDER_SETUP.md for details."
echo ""

check_api() {
  echo -e "${YELLOW}Checking API health...${NC}"
  if curl -sf --max-time 30 "$API_URL/api/health" >/dev/null; then
    echo -e "${GREEN}API is healthy at $API_URL/api/health${NC}"
  else
    echo -e "${RED}API health check failed (cold start or service down).${NC}"
    echo "  Check Render dashboard: https://dashboard.render.com"
    exit 1
  fi
}

deploy_netlify() {
  if ! command -v netlify >/dev/null 2>&1; then
    echo -e "${RED}Netlify CLI not installed. Install: npm install -g netlify-cli${NC}"
    exit 1
  fi
  echo -e "${YELLOW}Building client...${NC}"
  (cd client && npm run build)
  echo -e "${YELLOW}Deploying to Netlify (production)...${NC}"
  netlify deploy --prod --dir=client/dist
  echo -e "${GREEN}Frontend deploy finished.${NC}"
}

echo "1) Check API health (Render)"
echo "2) Build & deploy frontend (Netlify CLI)"
echo "3) Both"
echo "4) Exit"
read -p "Choice [1-4]: " choice

case "$choice" in
  1) check_api ;;
  2) deploy_netlify ;;
  3) check_api; deploy_netlify ;;
  4) exit 0 ;;
  *) echo "Invalid choice"; exit 1 ;;
esac
