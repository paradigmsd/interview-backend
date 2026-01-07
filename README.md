# Feature Flag API - Mock Backend Specification

## Overview

This is a pre-built Fastify backend that serves as the API for the frontend technical interview. It runs locally and provides mock data with full CRUD operations persisted in memory (resets on restart).

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Fastify 5.x
- **Language:** TypeScript
- **Validation:** Zod (with fastify-type-provider-zod)
- **Documentation:** Scalar (OpenAPI UI)

## Running the Apps (Monorepo)

```bash
pnpm install
pnpm dev
```

- **Backend API**: `http://localhost:8080` (docs at `/docs`)
- **Frontend**: Vite dev server (prints its URL in the terminal, usually `http://localhost:5173`)

### Useful scripts

- `pnpm dev`: run backend + frontend together
- `pnpm dev:backend`: run only the backend
- `pnpm dev:frontend`: run only the frontend

### Notes

- The frontend uses a Vite dev proxy so it can call the backend via relative paths like `/flags`.
- The backend stores data **in memory** (it resets on restart).

---

## Data Model

### Feature Flag

```typescript
interface FeatureFlag {
  id: string; // UUID v4
  key: string; // Unique identifier, kebab-case (e.g., "dark-mode")
  name: string; // Human-readable name
  description: string | null;
  enabled: boolean;
  environment: Environment;
  metadata: FlagMetadata;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

type Environment = "development" | "staging" | "production";

interface FlagMetadata {
  owner: string; // Team or person responsible
  tags: string[]; // Categorization tags
  expiresAt: string | null; // Optional expiration date (ISO 8601)
}
```

---

## API Endpoints

### GET /flags

Returns all feature flags with optional filtering.

**Query Parameters:**

| Parameter     | Type    | Description                                       |
| ------------- | ------- | ------------------------------------------------- |
| `environment` | string  | Filter by environment                             |
| `enabled`     | boolean | Filter by enabled status                          |
| `search`      | string  | Search in key, name, or description               |
| `tag`         | string  | Filter by tag (can be repeated for multiple tags) |

**Response: 200 OK**

```typescript
interface GetFlagsResponse {
  data: FeatureFlag[];
  meta: {
    total: number;
    environments: Record<Environment, number>; // Count per environment
  };
}
```

**Example Response:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "key": "dark-mode",
      "name": "Dark Mode",
      "description": "Enable dark mode theme across the application",
      "enabled": true,
      "environment": "production",
      "metadata": {
        "owner": "frontend-team",
        "tags": ["ui", "theme"],
        "expiresAt": null
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-06-20T14:45:00.000Z"
    }
  ],
  "meta": {
    "total": 12,
    "environments": {
      "development": 5,
      "staging": 4,
      "production": 3
    }
  }
}
```

---

### GET /flags/:id

Returns a single feature flag by ID.

**Response: 200 OK**

```typescript
interface GetFlagResponse {
  data: FeatureFlag;
}
```

**Response: 404 Not Found**

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
```

---

### POST /flags

Creates a new feature flag.

**Request Body:**

```typescript
interface CreateFlagRequest {
  key: string; // Required, unique, kebab-case, 3-50 chars
  name: string; // Required, 1-100 chars
  description?: string | null; // Optional, max 500 chars
  enabled?: boolean; // Optional, defaults to false
  environment: Environment; // Required
  metadata?: {
    owner?: string; // Optional, defaults to "unassigned"
    tags?: string[]; // Optional, defaults to []
    expiresAt?: string | null; // Optional ISO 8601 date
  };
}
```

**Validation Rules:**

- `key` must be unique across ALL environments
- `key` must be kebab-case (lowercase letters, numbers, hyphens only)
- `key` cannot start or end with a hyphen
- `expiresAt` must be a future date if provided

**Response: 201 Created**

```typescript
interface CreateFlagResponse {
  data: FeatureFlag;
}
```

**Response: 400 Bad Request**

```typescript
interface ValidationErrorResponse {
  error: {
    code: "VALIDATION_ERROR";
    message: string;
    details: Array<{
      field: string;
      message: string;
    }>;
  };
}
```

**Response: 409 Conflict**

```typescript
interface ConflictErrorResponse {
  error: {
    code: "DUPLICATE_KEY";
    message: string;
  };
}
```

---

### PATCH /flags/:id

Updates an existing feature flag. Supports partial updates.

**Request Body:**

```typescript
interface UpdateFlagRequest {
  name?: string;
  description?: string | null;
  enabled?: boolean;
  environment?: Environment;
  metadata?: Partial<FlagMetadata>;
}
```

**Note:** The `key` field cannot be updated after creation.

**Response: 200 OK**

```typescript
interface UpdateFlagResponse {
  data: FeatureFlag;
}
```

**Response: 404 Not Found** (see error format above)

---

### DELETE /flags/:id

Deletes a feature flag.

**Response: 204 No Content**

**Response: 404 Not Found** (see error format above)

---

### POST /flags/:id/toggle

Convenience endpoint to toggle the enabled status.

**Response: 200 OK**

```typescript
interface ToggleFlagResponse {
  data: FeatureFlag;
  previousState: boolean;
}
```

---

## Mock Data (Seeded on Start)

The server starts with 12 pre-seeded flags across environments:

| Key                   | Name                | Environment | Enabled | Tags                 |
| --------------------- | ------------------- | ----------- | ------- | -------------------- |
| `dark-mode`           | Dark Mode           | production  | true    | ui, theme            |
| `dark-mode`           | Dark Mode (Staging) | staging     | true    | ui, theme            |
| `new-checkout-flow`   | New Checkout Flow   | staging     | true    | payments, experiment |
| `new-checkout-flow`   | New Checkout Flow   | development | true    | payments, experiment |
| `ai-recommendations`  | AI Recommendations  | development | true    | ml, experiment       |
| `beta-dashboard`      | Beta Dashboard      | staging     | false   | ui, beta             |
| `maintenance-mode`    | Maintenance Mode    | production  | false   | ops, critical        |
| `feature-analytics`   | Feature Analytics   | production  | true    | analytics            |
| `social-login`        | Social Login        | development | true    | auth                 |
| `export-csv`          | CSV Export          | production  | true    | data, utility        |
| `bulk-operations`     | Bulk Operations     | staging     | true    | admin, utility       |
| `notification-center` | Notification Center | development | false   | ui, notifications    |

---

## Error Codes Reference

| Code               | HTTP Status | Description                    |
| ------------------ | ----------- | ------------------------------ |
| `VALIDATION_ERROR` | 400         | Request body failed validation |
| `NOT_FOUND`        | 404         | Resource not found             |
| `DUPLICATE_KEY`    | 409         | Flag key already exists        |
| `INTERNAL_ERROR`   | 500         | Unexpected server error        |

---

## CORS Configuration

The server allows all origins in development mode:

```typescript
{
  origin: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type']
}
```

---

## Response Headers

All responses include:

```
Content-Type: application/json
X-Request-Id: <uuid>
```

---

## Candidate-Facing Information

**Provide this to the candidate at the start of their interview:**

---

### API Reference (Candidate Handout)

The backend is already running at `http://localhost:8080`.

**Interactive docs:** `http://localhost:8080/docs`

**Endpoints:**

| Method | Path                | Description                                                                 |
| ------ | ------------------- | --------------------------------------------------------------------------- |
| GET    | `/flags`            | List all flags (supports `?environment=`, `?enabled=`, `?search=`, `?tag=`) |
| GET    | `/flags/:id`        | Get a single flag                                                           |
| POST   | `/flags`            | Create a new flag                                                           |
| PATCH  | `/flags/:id`        | Update a flag                                                               |
| DELETE | `/flags/:id`        | Delete a flag                                                               |
| POST   | `/flags/:id/toggle` | Toggle enabled status                                                       |

**Flag Shape:**

```typescript
interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  environment: "development" | "staging" | "production";
  metadata: {
    owner: string;
    tags: string[];
    expiresAt: string | null;
  };
  createdAt: string;
  updatedAt: string;
}
```

**Creating a flag requires:**

- `key` (unique, kebab-case)
- `name`
- `environment`

---
