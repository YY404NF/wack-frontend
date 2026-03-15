# wack-frontend

## GitHub Secrets

在仓库 `Settings -> Secrets and variables -> Actions -> Repository secrets` 中添加以下字段。

### 必需字段

| Secret | 示例值 |
| --- | --- |
| `DEPLOY_HOST` | `8.159.159.150` |
| `DEPLOY_PORT` | `22` |
| `DEPLOY_USER` | `root` |
| `DEPLOY_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY----- ...` |
| `FRONTEND_DEPLOY_PATH` | `/srv/www/wack-frontend` |
| `VITE_API_BASE` | `http://8.159.159.150:8080/api` |
