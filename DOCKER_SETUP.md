# Docker Setup Guide

This guide provides instructions for running the Express Laundry application using Docker.

## Prerequisites

- Docker Desktop installed (or Docker CLI + Docker Daemon)
- Docker Compose version 1.29.0+
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd express_laundry
```

### 2. Set Up Environment Variables

Copy the Docker environment template:

```bash
cp .env.docker .env.docker.local
```

Edit `.env.docker.local` and update with your actual credentials:
- SMTP credentials (Gmail app password)
- Cloudflare R2 credentials
- Basic auth credentials

### 3. Build and Start Containers

```bash
# Build images and start services
docker-compose up -d

# Or build from scratch
docker-compose up -d --build
```

### 4. Verify Services

```bash
# Check all containers are running
docker-compose ps

# View application logs
docker-compose logs -f app

# View database logs
docker-compose logs -f db
```

### 5. Test the API

```bash
# The API should be accessible at http://localhost:4000
curl http://localhost:4000/
# Expected response: "Laundry App Backend API is running"
```

## Database Management

### Access MySQL Database

```bash
# Connect to MySQL container
docker-compose exec db mysql -u laundrynow -plaundrynow_pass express_laundry

# Or from host machine (if port is exposed)
mysql -h 127.0.0.1 -u laundrynow -plaundrynow_pass express_laundry
```

### Database Initialization

The database is automatically initialized when the container starts for the first time using `scripts/init_db.sql`.

### Backup Database

```bash
docker-compose exec db mysqldump -u laundrynow -plaundrynow_pass express_laundry > backup.sql
```

### Restore Database

```bash
docker exec -i laundry_db mysql -u laundrynow -plaundrynow_pass express_laundry < backup.sql
```

## Development Workflow

### Running in Development Mode

For development with hot-reload:

```bash
# Install nodemon locally
npm install --save-dev nodemon

# Run with development compose file
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### View Real-time Logs

```bash
# Follow app logs
docker-compose logs -f app

# Follow database logs
docker-compose logs -f db
```

### Execute Commands in Container

```bash
# Run npm commands
docker-compose exec app npm list

# Execute Node scripts
docker-compose exec app node scripts/setup_db.js
```

### Rebuild Application Image

```bash
docker-compose build --no-cache app
docker-compose up -d app
```

## Production Deployment

### Environment Variables for Production

Update your production environment with actual values:

```bash
DB_HOST=your-production-db-host
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
JWT_SECRET=your-secure-jwt-secret
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
NODE_ENV=production
```

### Using Docker in Production

```bash
# Set environment variables
export DB_HOST=prod-db-host
export DB_USER=prod-user
export DB_PASSWORD=secure_password
# ... other variables

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### Stopping Services

```bash
# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove all volumes (WARNING: loses data)
docker-compose down -v
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs app

# Verify all services are healthy
docker-compose ps
```

### Database Connection Error

```bash
# Verify database container is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Test connection from app container
docker-compose exec app nc -zv db 3306
```

### Port Already in Use

If port 4000 or 3306 is already in use:

```bash
# Modify docker-compose.yml ports section
# Change: "4000:4000" to "8080:4000"
# Then restart
docker-compose restart
```

### Rebuild Everything

```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Start fresh
docker-compose up -d
```

## Useful Commands

```bash
# View container stats
docker stats

# Execute command in running container
docker-compose exec app node -v

# View network information
docker network inspect laundry_network

# List all images
docker images

# Clean up unused images
docker image prune

# View detailed container info
docker-compose ps --no-trunc
```

## Health Checks

The application includes health checks:

```bash
# Check app health
curl http://localhost:4000/

# Database health is monitored by docker-compose
docker-compose ps
```

## Notes

- Database credentials in `docker-compose.yml` are for local development only. Update them for production!
- Sensitive credentials (SMTP, R2) should be managed via environment variables in production
- The `uploads` directory is mounted as a volume for persistence
- MySQL data is stored in a named volume `mysql_data` for persistence across container restarts

## Additional Resources

- [Docker Documentation](https://docs.docker.com)
- [Docker Compose Documentation](https://docs.docker.com/compose)
- [Express.js in Docker](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
