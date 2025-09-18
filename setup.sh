#!/bin/bash

echo "======================================"
echo "Meeting Automation System Setup"
echo "======================================"

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18+ first."
    exit 1
fi

echo "✅ All prerequisites are installed"

# Create environment file
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your API keys"
    echo "Press any key to continue after editing .env file..."
    read -n 1 -s
fi

# Create necessary directories
echo "Creating directories..."
mkdir -p n8n-workflows
mkdir -p monitoring/prometheus
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Build Docker images
echo "Building Docker images..."
docker-compose build

# Start services
echo "Starting services..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Run database migrations
echo "Running database migrations..."
docker exec -i postgres psql -U meeting_automation meeting_automation_db < database/init.sql

# Check service status
echo ""
echo "======================================"
echo "Service Status:"
echo "======================================"

services=("n8n" "postgres" "redis" "web" "websocket" "prometheus" "grafana")
for service in "${services[@]}"; do
    if [ "$(docker ps -q -f name=$service)" ]; then
        echo "✅ $service is running"
    else
        echo "❌ $service is not running"
    fi
done

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Access URLs:"
echo "- Web Application: http://localhost:3000"
echo "- N8N Workflows: http://localhost:5678"
echo "- Grafana Dashboard: http://localhost:3002"
echo "- WebSocket Server: ws://localhost:3001"
echo ""
echo "Default Credentials:"
echo "- N8N: Check your .env file"
echo "- Grafana: admin / (check .env file)"
echo ""
echo "Next Steps:"
echo "1. Configure Google Calendar OAuth in N8N"
echo "2. Import workflow templates from n8n-workflows/"
echo "3. Set up API credentials in N8N"
echo "4. Test the system with a sample meeting"
echo ""
echo "To view logs:"
echo "docker-compose logs -f"
echo ""
echo "To stop services:"
echo "docker-compose down"