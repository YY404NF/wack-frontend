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

## Workflow 行为

前端仓库的 GitHub Actions 在 `push main` 后会执行以下步骤：

1. 运行 `npm ci`
2. 使用 `VITE_API_BASE` 构建前端静态文件
3. 将构建产物上传到服务器
4. 清空 `FRONTEND_DEPLOY_PATH` 目录中的旧文件
5. 将新的 `dist` 内容发布到 Nginx 静态站点目录
