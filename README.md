# Express.js Demo App

A minimal Express.js demo application for quick setup and development.

## Features

-   Express.js server
-   Basic REST endpoints
-   JSON request parsing
-   Nodemon for development

## Prerequisites

-   Node.js 18+
-   npm

## Installation

``` bash
npm install
```

## Running the App

### Development

``` bash
npm run dev
```

### Production

``` bash
npm start
```

## Available Endpoints

-   GET `/health` --- Health check
-   GET `/api/hello` --- Demo endpoint
-   POST `/api/echo` --- Echo request body

## Project Structure

    src/
      app.js

## Notes

This project is intended as a lightweight starting point and can be
extended with routing, authentication, or TypeScript as needed.

## CI/CD Pipeline (Backend)

This project uses a CI/CD pipeline to automatically build and deploy the backend application to AWS EC2 whenever changes are pushed to the `main` branch.

### Overview

The pipeline performs the following steps:

1. Builds a Docker image for the backend
2. Pushes the image to Docker Hub
3. Connects to an EC2 instance via SSH
4. Stops and removes the existing backend container (if any)
5. Runs the latest container version on the server

Once set up, **no manual deployment or SSH access is required**.

---

### Trigger

The pipeline runs automatically on:

- Push to `main` branch

---

### Architecture

- **CI Tool**: GitHub Actions
- **Containerization**: Docker
- **Image Registry**: Docker Hub
- **Deployment Target**: AWS EC2 (Amazon Linux)
- **Runtime**: Docker container exposed on port 80

---

### Deployment Flow

1. Developer pushes code to `main`
2. GitHub Actions builds a Docker image
3. Image is pushed to Docker Hub
4. GitHub Actions SSHs into the EC2 instance
5. Existing container is replaced with the new version
6. Backend API becomes available immediately

---

### Environment & Secrets

The following secrets are configured in GitHub:

- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `EC2_PUBLIC_IP`
- `EC2_SSH_KEY`

Secrets are never committed to the repository.

---

### Backend URL

The backend is accessible at: http://3.15.211.240/
Check endpoints: http://3.15.211.240/health and http://3.15.211.240/api/hello

### Notes for Developers

- Do not manually run Docker commands on the EC2 instance
- All deployments should happen via GitHub Actions
- If deployment fails, check the Actions logs in GitHub
