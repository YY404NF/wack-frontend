# Frontend Deploy

## Required GitHub Secrets

- `DEPLOY_HOST`
- `DEPLOY_PORT`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `FRONTEND_DEPLOY_PATH`
- `VITE_API_BASE`

## Recommended values

- `FRONTEND_DEPLOY_PATH=/srv/www/wack-frontend`
- `VITE_API_BASE=http://YOUR_SERVER_IP:8080/api`

## What the workflow does

1. Runs `npm ci`
2. Builds `dist`
3. Uploads the bundle to the server
4. Clears the target directory
5. Copies the new static files into the Nginx site directory
