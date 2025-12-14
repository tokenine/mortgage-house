# Docker Setup for Mortgage House Frontend

This guide explains how to build and run the frontend application in Docker.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

## Quick Start

### Build and Run with Docker Compose (Recommended)

```bash
# From the project root directory (not frontend!)
docker-compose -f frontend/docker-compose.yml up --build
```

The application will be available at `http://localhost:3000`

### Manual Docker Commands

**Build the image (from project root):**
```bash
docker build -t mortgage-house-frontend:latest -f frontend/Dockerfile .
```

**Run the container:**
```bash
docker run -p 3000:3000 --name mortgage-house-frontend mortgage-house-frontend:latest
```

## Configuration

### Environment Variables

Edit `docker-compose.yml` to set environment variables:

```yaml
environment:
  - NODE_ENV=production
  - NEXT_PUBLIC_API_URL=http://your-api-url
  # Add other variables as needed
```

## Development Mode

To run in development mode with hot-reload:

1. Uncomment the volumes section in `docker-compose.yml`:
```yaml
volumes:
  - .:/app
  - /app/node_modules
```

2. Update the package.json scripts to use dev:
```bash
# Modify docker-compose.yml command to:
CMD ["pnpm", "dev"]
```

3. Run:
```bash
docker-compose up
```

## Container Details

- **Base Image**: `node:20-alpine` (lightweight)
- **Port**: 3000 (standard Next.js port)
- **Build**: Multi-stage build to minimize image size
- **Health Check**: Enabled with 30-second intervals

## Useful Commands

```bash
# View running containers
docker ps

# View logs
docker logs mortgage-house-frontend

# Stop container
docker stop mortgage-house-frontend

# Remove container
docker rm mortgage-house-frontend

# Build and push to registry (replace with your registry)
docker build -t your-registry/mortgage-house-frontend:latest .
docker push your-registry/mortgage-house-frontend:latest
```

## Image Optimization

The Dockerfile uses a multi-stage build to:
- Keep build tools out of production image
- Install only production dependencies
- Minimize final image size (~200-300MB)

## Troubleshooting

**Port already in use:**
```bash
docker-compose down
# or use a different port
docker run -p 3001:3000 mortgage-house-frontend:latest
```

**Build fails due to missing pnpm-lock.yaml:**
Ensure `pnpm-lock.yaml` is present in the frontend directory. Regenerate with:
```bash
pnpm install
```

**Memory issues:**
Increase Docker's available memory in Docker Desktop settings (Preferences > Resources)
