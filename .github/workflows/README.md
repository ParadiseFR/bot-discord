# Discord Bot Deployment Workflow

## Overview

This GitHub Actions workflow automatically builds, tests, and deploys your Discord bot whenever code is pushed to the `main` branch. The workflow creates a Docker image and publishes it to GitHub Container Registry (GHCR).

## Features

✅ **Automated Testing**: Runs linting and build verification  
✅ **Multi-platform Builds**: Supports both AMD64 and ARM64 architectures  
✅ **Docker Image Publishing**: Publishes to GitHub Container Registry  
✅ **Deployment Tracking**: Uses GitHub Deployments API  
✅ **Caching**: Optimizes build performance with dependency caching  
✅ **Security**: Uses minimal permissions and non-root Docker user  
✅ **Health Monitoring**: Includes health checks and monitoring

## Required Setup

### 1. Repository Configuration

**Enable GitHub Container Registry:**

- Go to repository Settings → Actions → General
- Ensure "Read and write permissions" is selected for Workflow permissions
- Enable "Allow GitHub Actions to create and approve pull requests" if needed

### 2. Required Secrets

Add these secrets in your repository settings (Settings → Secrets and variables → Actions):

| Secret Name     | Description                  | Example                       |
| --------------- | ---------------------------- | ----------------------------- |
| `DISCORD_TOKEN` | Your Discord bot token       | `MTOxNDIy...`                 |
| `GUILD_ID`      | Discord server ID            | `123456789012345678`          |
| `CLIENT_ID`     | Discord application ID       | `123456789012345678`          |
| `SLACK_WEBHOOK` | Optional Slack notifications | `https://hooks.slack.com/...` |

### 3. Environment Variables

For production deployment, set these environment variables in your deployment target:

```bash
# Database
DATABASE_URL=postgresql://bot_user:bot_password@postgres:5432/discord_bot
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=discord_bot
DATABASE_USER=bot_user
DATABASE_PASSWORD=bot_password

# Discord
DISCORD_TOKEN=your_discord_bot_token
GUILD_ID=your_guild_id
CLIENT_ID=your_client_id

# Application
NODE_ENV=production
```

## Usage

### Automatic Deployment

The workflow runs automatically when:

- Code is pushed to the `main` branch
- A pull request is merged to `main`
- Manually triggered from GitHub Actions tab

### Manual Deployment

1. Go to the Actions tab in your repository
2. Select "Deploy Discord Bot" workflow
3. Click "Run workflow"
4. Choose branch and click "Run workflow"

### Deployment Process

1. **Build Phase**: Compiles TypeScript using SWC
2. **Test Phase**: Runs linting and validation
3. **Docker Build**: Creates multi-platform Docker image
4. **Registry Push**: Publishes to GitHub Container Registry
5. **Deployment**: Updates deployment status

## Docker Image Usage

### Pull the Image

```bash
# Using the latest image
docker pull ghcr.io/yourusername/bot-discord:latest

# Using specific commit SHA
docker pull ghcr.io/yourusername/bot-discord:latest-<commit-sha>
```

### Run with Docker Compose

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Development with hot reload
docker-compose up -d
```

### Run Standalone

```bash
docker run -d \
  --name discord-bot \
  -e DISCORD_TOKEN=your_token \
  -e GUILD_ID=your_guild_id \
  -e CLIENT_ID=your_client_id \
  ghcr.io/yourusername/bot-discord:latest
```

## Image Tags

The workflow creates multiple image tags:

- `latest`: Latest version from main branch
- `main-<commit-sha>`: Specific commit on main branch
- `pr-<number>`: Pull request builds
- `branch-<branch-name>`: Feature branch builds

## Monitoring

### Health Checks

The Docker image includes built-in health checks:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Logs

```bash
# View container logs
docker logs discord_bot_prod

# Follow logs in real-time
docker logs -f discord_bot_prod
```

### Database Monitoring

```bash
# Connect to PostgreSQL
docker exec -it discord_bot_db_prod psql -U bot_user -d discord_bot
```

## Troubleshooting

### Common Issues

**1. Build Failures**

- Check that all dependencies are in `package.json`
- Verify TypeScript compilation with `bun run build`
- Ensure Prisma schema is valid

**2. Docker Build Issues**

- Check `.dockerignore` file for proper exclusions
- Verify all required files are included
- Test Docker build locally: `docker build -t test-build .`

**3. Runtime Issues**

- Verify all environment variables are set
- Check database connectivity
- Review logs: `docker logs discord_bot_prod`

**4. Permission Issues**

- Ensure GITHUB_TOKEN has package write permissions
- Check that repository is not archived
- Verify Docker registry access

### Debug Commands

```bash
# Test build locally
bun run build

# Test Docker build
docker build -t test-discord-bot .

# Run health check
docker run --rm test-discord-bot node --version

# Test with environment variables
docker run --rm \
  -e DISCORD_TOKEN=test \
  -e GUILD_ID=test \
  -e CLIENT_ID=test \
  test-discord-bot
```

## Security Best Practices

1. **Never commit secrets** - Use GitHub Secrets
2. **Use non-root users** - Already implemented in Dockerfile
3. **Regular updates** - Keep base images updated
4. **Scan vulnerabilities** - Enable GitHub security advisories
5. **Limit permissions** - Use minimal required permissions

## Support

For issues or questions:

1. Check the Actions tab for workflow run logs
2. Review this documentation
3. Check GitHub Issues in the repository
4. Contact the development team

---

_This deployment workflow is designed for the Discord bot project. For questions about specific features, refer to the project documentation._
