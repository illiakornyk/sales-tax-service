# Sales Tax Service

Sales Tax Service is a modern, full-stack web application designed for US sales tax lookup and tax-rate management. The project is built with a strong focus on clean architecture, scalable deployment, and best practices in both software engineering and DevOps.

This repository serves as a showcase of my skills across the entire stack—from creating responsive user interfaces to designing robust backend systems and automating infrastructure pipelines.

## 🚀 Tech Stack

### Frontend

- **Next.js**: React framework for server-side rendering and optimized performance.
- **Tailwind CSS**: Utility-first CSS framework for rapid and responsive styling.
- **HyperUI**: Collection of free, accessible Tailwind CSS components for clean UI design.

### Backend

- **NestJS**: Progressive Node.js framework for building efficient, reliable, and scalable server-side applications.
- **Prisma ORM**: Next-generation Node.js and TypeScript ORM for seamless database access and migrations.
- **PostgreSQL**: Robust, open-source relational database.

### DevOps & Infrastructure (Implementation In Progress)

- **Docker & Docker Compose**: Multi-stage containerized builds ensuring identical environments across development, testing, and production.
- **CI/CD (GitHub Actions)**: Automated grading and testing pipelines on every push.
- **Observability**: Structured JSON logging and container healthchecks (`pg_isready`) for resilient system monitoring.

## 🌟 Key Features

- **Geography Browsing & Tax Lookup**: Calculate accurate ZIP-based taxes and view current rates.
- **Admin Rate Configuration**: Secure endpoints for managing versioned tax rates.
- **Resilient Architecture**: App features a dedicated `/health` endpoint that accurately reports system degradation (503) if database connectivity drops.
- **Graceful Shutdown**: The Node.js server correctly handles `SIGTERM` signals to finish processing requests before exiting cleanly.

## ⚙️ How to Run Locally

The entire application stack (backend + database) is fully containerized for a smooth developer experience.

### 1. Start the Environment

Run the following command in the root directory to spin up the PostgreSQL database and the NestJS backend:

```bash
docker compose up -d --build
```

*The backend will be available on `http://localhost:8080`.*

### 2. Start the Frontend

In a separate terminal, navigate to the client folder to start the Next.js web application:

```bash
cd client
npm install
npm run dev
```

*The frontend will be available on `http://localhost:3000`.*

## 🧪 Testing and CI

This repository uses automated GitHub Actions workflows to validate code integrity on every commit.

You can run the same automated tests locally using the grading script:

```bash
./tests/lab1_test.sh
```

This script validates:

1. Container runtime status.
2. API Health Check (`200 OK`).
3. Standardized JSON Logging.
4. System Resilience and failure recovery (`503 Service Unavailable` handling).
