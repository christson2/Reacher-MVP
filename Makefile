# Makefile for Reacher MVP

.PHONY: help install dev build test clean docker-up docker-down docker-logs

help:
	@echo "Reacher MVP — Available Commands"
	@echo ""
	@echo "  make install         - Install dependencies for all services"
	@echo "  make dev             - Start all services in development mode"
	@echo "  make build           - Build all services"
	@echo "  make test            - Run tests"
	@echo "  make clean           - Clean build artifacts"
	@echo "  make docker-up       - Start Docker containers (Postgres, Redis, services)"
	@echo "  make docker-down     - Stop all Docker containers"
	@echo "  make docker-logs     - View Docker logs"
	@echo ""

install:
	@echo "Installing dependencies..."
	cd gateway && npm install
	cd backend/auth-service && npm install
	cd backend/user-service && npm install
	cd backend/product-service && npm install
	cd backend/service-provider-service && npm install
	cd backend/trust-service && npm install
	cd backend/message-service && npm install
	cd backend/notification-service && npm install
	cd frontend && npm install

dev:
	@echo "Starting all services in development mode..."
	docker-compose up

docker-up:
	@echo "Starting Docker containers..."
	docker-compose up -d

docker-down:
	@echo "Stopping Docker containers..."
	docker-compose down

docker-logs:
	@echo "Viewing Docker logs..."
	docker-compose logs -f

build:
	@echo "Building all services..."
	docker-compose build

test:
	@echo "Running tests..."
	cd gateway && npm test
	cd backend/auth-service && npm test
	cd frontend && npm test

clean:
	@echo "Cleaning up..."
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
	docker-compose down -v
	@echo "Clean complete"
