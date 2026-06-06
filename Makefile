.PHONY: up down build logs gateway frontend user task payment notification

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

gateway:
	docker compose up -d gateway

frontend:
	cd frontend && npm run dev

user:
	cd services/user-service && ./mvnw spring-boot:run

task:
	cd services/task-service && ./mvnw spring-boot:run

payment:
	cd services/payment-service && ./mvnw spring-boot:run

notification:
	cd services/notification-service && npm run dev
