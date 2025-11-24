# Route & Group Service

A RESTful microservice for route proposal and group formation management, featuring OpenAPI documentation, MySQL (Cloud SQL) integration, and all Sprint 2 requirements.

## Project: Columbia Point2Point Semester Shuttle

This service is part of the Columbia Point2Point shuttle system. It is responsible for managing route proposals, tracking user sign-ups for proposed routes, and handling the logic for when a route becomes "active".

## Demo

- **Production URL:** [http://34.123.236.40](http://34.123.236.40)
- **API Documentation:** [http://34.123.236.40/api-docs](http://34.123.236.40/api-docs)

## Features

- ✅ **Complete REST API:** Full CRUD functionality for managing routes and their members.
- ✅ **OpenAPI 3.0 Documentation:** Interactive API documentation available via Swagger UI.
- ✅ **MySQL Database Integration:** Connects to a dedicated Cloud SQL instance.
- ✅ **Query Parameters:** Filter and sort routes by status, location, semester, and more.
- ✅ **Pagination:** The `GET /api/routes` endpoint supports full pagination.
- ✅ **ETag Processing:** Implemented on `GET /api/routes/{id}` and `PUT /api/routes/{id}` for optimistic concurrency control.
- ✅ **Linked Data:** Responses include HATEOAS links to related resources.
- ✅ **HTTP 201 Created:** `POST /api/routes` returns a `201` status with a `Location` header.
- ✅ **HTTP 202 Accepted (Async):** `POST /api/routes/{id}/activate` initiates an asynchronous activation process and provides a polling link.
- ✅ **Google Compute Engine Deployment:** Deployed on a GCE VM as required.

## Quick Start

### Local Development

1. Install dependencies:

    ```bash
    npm install
    ```

2. Set up your local environment variables.

    ```bash
    cp .env.example .env
    # Edit .env with your local database credentials
    ```

3. Start the development server:

    ```bash
    npm run dev
    ```

4. Access the service:
    - **API Root:** <http://localhost:3002>
    - **API Docs:** <http://localhost:3002/api-docs>

## API Endpoints

- `GET /api/routes` - Get all routes with filtering, sorting, and pagination.
- `POST /api/routes` - Propose a new route.
- `GET /api/routes/{id}` - Get a specific route by its ID.
- `PUT /api/routes/{id}` - Update a route's details (requires `If-Match` ETag).
- `DELETE /api/routes/{id}` - Delete a route.
- `POST /api/routes/{id}/join` - Join a route as a member.
- `DELETE /api/routes/{id}/leave` - Leave a route.
- `GET /api/routes/{id}/members` - Get a list of all members for a specific route.
- `POST /api/routes/{id}/activate` - Start the asynchronous process to activate a route.
- `GET /api/route-activations/{taskId}` - Poll for the status of an activation task.

### Query Parameter Examples

- **Filter proposed routes from Columbia:**
  `GET /api/routes?status=proposed&from=Columbia`

- **Get confirmed members for a specific route:**
  `GET /api/routes/1/members?status=confirmed`

## Deployment

This service is deployed on a **Google Compute Engine VM** (`e2-small`) running Ubuntu 22.04 LTS. It connects to a dedicated **Cloud SQL for MySQL** instance ("Database B") using the Cloud SQL Auth Proxy for secure communication.

The application is containerized with Docker and deployed to the VM.

- **Production URL:** <http://34.123.236.40>

## Environment Variables

This service uses the following environment variables, defined in `.env` for local development or passed to the Docker container in production.

- `PORT`: The port the service runs on (default: 3002).
- `NODE_ENV`: The environment (`development` or `production`).
- `USER_SERVICE_URL`: The URL for the Auth & User Service for user verification.

#### Local Database Configuration

- `DB_HOST`: Database host (e.g., `127.0.0.1`).
- `DB_USER`: Database user.
- `DB_PASSWORD`: Database password.
- `DB_NAME`: Database name (`route_service_db`).
- `DB_PORT`: Database port (default: 3306).

#### Production Cloud SQL Configuration

- `INSTANCE_CONNECTION_NAME`: The unique connection name for the Cloud SQL instance (used with the proxy).

See `.env.example` for a template.
