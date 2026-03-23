# API Documentation

This document is the current frontend-facing API contract for the backend.

## Base URLs

Gateway base URL:

- API Gateway: `http://localhost:3000`

## Common Response Shapes

Success example:

```json
{
  "status": "ok",
  "service": "auth-service"
}
```

Error example:

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Event not found",
  "path": "/public/events/slug/book-fair-2026-delhi-2026-03-20",
  "timestamp": "2026-03-20T10:30:00.000Z"
}
```

Common status codes:

- `200` success
- `202` accepted for async processing
- `400` bad request / validation issue
- `401` unauthorized
- `403` forbidden
- `404` not found
- `409` conflict

## Health Endpoints

Gateway health endpoints:

- `GET http://localhost:3000/health`
- `GET http://localhost:3000/auth-service/health`
- `GET http://localhost:3000/visitor-service/health`
- `GET http://localhost:3000/ticket-service/health`
- `GET http://localhost:3000/volunteer-service/health`
- `GET http://localhost:3000/admin-service/health`
- `GET http://localhost:3000/notification-service/health`

## Authentication And Roles

JWT roles used by the system:

- `admin`
- `volunteer`
- `visitor`

Bearer token format:

```http
Authorization: Bearer <token>
```

## Public Event API

### `GET /public/events/slug/:slug`

Purpose:

- fetch event details by slug without authentication
- used by frontend route `/register/:slug`

Gateway URL:

- `GET http://localhost:3000/public/events/slug/:slug`

Path params:

- `slug` required

Success response `200`:

```json
{
  "id": "6fd4c4f2-2e6f-4b80-9f9f-9e31f8f1d111",
  "eventName": "Book Fair 2026",
  "location": "Delhi",
  "venue": "Hall A",
  "description": "Nine-day public book fair with author sessions and family activities.",
  "agenda": "Day 1 opening, daily talks, weekend workshops, closing ceremony.",
  "bannerUrl": "https://cdn.example.com/events/book-fair-2026-banner.jpg",
  "slug": "book-fair-2026-delhi-2026-03-20",
  "baseUrl": "https://bookfair.nbtindia.gov.in",
  "registerUrl": "https://bookfair.nbtindia.gov.in/register/book-fair-2026-delhi-2026-03-20",
  "startDate": "2026-03-20T00:00:00.000Z",
  "endDate": "2026-03-29T00:00:00.000Z",
  "status": "active",
  "createdAt": "2026-03-19T12:30:00.000Z"
}
```

Error responses:

- `400 Missing slug`
- `404 Event not found`

## Auth Service

### `POST /auth/admin/login`

Gateway URL:

- `POST http://localhost:3000/auth/admin/login`

Request body:

```json
{
  "email": "admin@nbt.local",
  "password": "Admin@123"
}
```

Success response `200`:

```json
{
  "accessToken": "<admin-jwt>"
}
```

Error responses:

- `401 Invalid credentials`

### `POST /auth/volunteer/login`

Gateway URL:

- `POST http://localhost:3000/auth/volunteer/login`

Request body:

```json
{
  "email": "volunteer@nbt.local",
  "password": "Volunteer@123"
}
```

Success response `200`:

```json
{
  "accessToken": "<volunteer-jwt>"
}
```

Error responses:

- `401 Invalid credentials`

### `POST /auth/otp/request`

Purpose:

- request OTP for a visitor using event slug

Gateway URL:

- `POST http://localhost:3000/auth/otp/request`

Required headers:

- `event_slug`

Optional headers:

- `event_id`
- `x-actor-user-id`
- `x-actor-role`

Request body:

```json
{
  "mobileNumber": "9876543210",
  "purpose": "visitor_registration"
}
```

Success response `200`:

```json
{
  "success": true,
  "ttlSeconds": 300
}
```

Error responses:

- `400 Missing event_slug or event_id header`
- `400 Invalid event_id header`
- `404 Event is not listed or invalid`
- `409 Event is inactive`
- `429 Too many OTP requests for this mobile number`
- `429 Too many OTP requests from this IP`

### `POST /auth/otp/verify`

Purpose:

- verify OTP and return visitor JWT for web registration flow

Gateway URL:

- `POST http://localhost:3000/auth/otp/verify`

Required headers:

- `event_slug`

Optional headers:

- `event_id`

Request body:

```json
{
  "mobileNumber": "9876543210",
  "otp": "123456"
}
```

Case 1 success response `200` when visitor is already registered:

```json
{
  "accessToken": "<visitor-jwt>",
  "case": "already_registered",
  "visitor": {
    "id": "a4f8f7a9-f598-4f7d-a7f8-9d6d74ef1001",
    "name": "Amit Sharma",
    "mobileNumber": "9876543210",
    "gender": "M",
    "age": "20-30",
    "city": "Delhi",
    "email": "amit@example.com"
  },
  "registration": {
    "id": "4b2fc0be-4eea-4cd2-8db0-d1a71d28f297",
    "eventId": "6fd4c4f2-2e6f-4b80-9f9f-9e31f8f1d111",
    "registrationSource": "web",
    "otpVerified": true
  },
  "tickets": [
    {
      "ticketId": "3a0f4d2f-9d08-4f4c-977a-4d612eb9a111",
      "ticketNumber": "NBT-2026-000001",
      "ticketType": "parent",
      "childId": null,
      "qrToken": "signed-ticket-token",
      "status": "active"
    }
  ]
}
```

Case 2 success response `200` when visitor exists but is not registered for this event:

```json
{
  "accessToken": "<visitor-jwt>",
  "case": "existing_visitor_new_event",
  "visitor": {
    "id": "a4f8f7a9-f598-4f7d-a7f8-9d6d74ef1001",
    "name": "Amit Sharma",
    "mobileNumber": "9876543210",
    "gender": "M",
    "age": "20-30",
    "city": "Delhi",
    "email": "amit@example.com"
  },
  "registration": null,
  "tickets": []
}
```

Case 3 success response `200` when visitor is new:

```json
{
  "accessToken": "<visitor-jwt>",
  "case": "new_visitor",
  "visitor": null,
  "registration": null,
  "tickets": []
}
```

Error responses:

- `400 Missing event_slug or event_id header`
- `400 Invalid event_id header`
- `404 Event is not listed or invalid`
- `409 Event is inactive`
- `401 Invalid OTP`

## Visitor Service

### `POST /visitors/register`

Purpose:

- complete visitor self-registration from web portal
- stores `registrationSource = web`
- ticket generation stays asynchronous

Gateway URL:

- `POST http://localhost:3000/visitors/register`

Auth:

- visitor JWT from `POST /auth/otp/verify`

Required headers:

- `Authorization: Bearer <visitor-jwt>`

Optional headers:

- `x-idempotency-key`

Request body:

```json
{
  "name": "Amit Sharma",
  "mobileNumber": "9876543210",
  "gender": "M",
  "age": "20-30",
  "city": "Delhi",
  "email": "amit@example.com",
  "otpVerified": true
}
```

Success response `202`:

```json
{
  "visitorId": "a4f8f7a9-f598-4f7d-a7f8-9d6d74ef1001",
  "registrationId": "4b2fc0be-4eea-4cd2-8db0-d1a71d28f297",
  "status": "accepted",
  "passStatus": "processing"
}
```

Duplicate response `202`:

```json
{
  "visitorId": "a4f8f7a9-f598-4f7d-a7f8-9d6d74ef1001",
  "registrationId": "4b2fc0be-4eea-4cd2-8db0-d1a71d28f297",
  "status": "already_registered",
  "passStatus": "generated",
  "tickets": [
    {
      "ticketId": "3a0f4d2f-9d08-4f4c-977a-4d612eb9a111",
      "ticketNumber": "NBT-2026-000001",
      "ticketType": "parent",
      "childId": null,
      "qrToken": "signed-ticket-token",
      "status": "active"
    }
  ]
}
```

Error responses:

- `401 Missing bearer token`
- `401 Token expired`
- `401 Valid OTP verification token required`
- `409 Mobile number does not match OTP verification token`
- `409 Visitor is already registered for this event`
- `409 Event is inactive`

### `POST /visitors/:registrationId/children`

Purpose:

- add children to an existing registration
- each child ticket is generated asynchronously

Gateway URL:

- `POST http://localhost:3000/visitors/:registrationId/children`

Request body:

```json
{
  "children": [
    {
      "name": "Child One",
      "age": "10-20"
    }
  ]
}
```

Success response `201`:

```json
{
  "registrationId": "4b2fc0be-4eea-4cd2-8db0-d1a71d28f297",
  "children": [
    {
      "id": "b0f0f33a-fc2a-42bc-bd2d-9f6f8c2d8881",
      "registrationId": "4b2fc0be-4eea-4cd2-8db0-d1a71d28f297",
      "name": "Child One",
      "ageRange": "10-20",
      "createdAt": "2026-03-20T12:00:00.000Z"
    }
  ],
  "passStatus": "processing"
}
```

Error responses:

- `404 Registration not found`

### `GET /visitors/:registrationId/tickets`

Purpose:

- fetch generated tickets for a registration

Gateway URL:

- `GET http://localhost:3000/visitors/:registrationId/tickets`

Success response `200` when still processing:

```json
{
  "registrationId": "4b2fc0be-4eea-4cd2-8db0-d1a71d28f297",
  "status": "processing",
  "tickets": []
}
```

Success response `200` when generated:

```json
{
  "registrationId": "4b2fc0be-4eea-4cd2-8db0-d1a71d28f297",
  "status": "generated",
  "tickets": [
    {
      "ticketId": "3a0f4d2f-9d08-4f4c-977a-4d612eb9a111",
      "ticketNumber": "NBT-2026-000001",
      "ticketType": "parent",
      "childId": null,
      "qrToken": "signed-ticket-token",
      "status": "active"
    }
  ]
}
```

Error responses:

- `404 Registration not found`

## Volunteer Service

Auth:

- volunteer JWT required
- admin JWT also accepted

### `GET /volunteer/events`

Purpose:

- list only active events for volunteer devices

Gateway URL:

- `GET http://localhost:3000/volunteer/events`

Success response `200`:

```json
[
  {
    "id": "6fd4c4f2-2e6f-4b80-9f9f-9e31f8f1d111",
    "eventName": "Book Fair 2026",
    "location": "Delhi",
    "venue": "Hall A",
    "description": "Nine-day public book fair with author sessions and family activities.",
    "agenda": "Day 1 opening, daily talks, weekend workshops, closing ceremony.",
    "bannerUrl": "https://cdn.example.com/events/book-fair-2026-banner.jpg",
    "slug": "book-fair-2026-delhi-2026-03-20",
    "baseUrl": "https://bookfair.nbtindia.gov.in",
    "registerUrl": "https://bookfair.nbtindia.gov.in/register/book-fair-2026-delhi-2026-03-20",
    "startDate": "2026-03-20T00:00:00.000Z",
    "endDate": "2026-03-29T00:00:00.000Z",
    "status": "active",
    "createdAt": "2026-03-19T12:30:00.000Z"
  }
]
```

### `POST /volunteer/visitors/register`

Purpose:

- volunteer-assisted on-spot registration
- stores `registrationSource = volunteer`

Gateway URL:

- `POST http://localhost:3000/volunteer/visitors/register`

Auth:

- `Authorization: Bearer <volunteer-jwt>`

Required headers:

- `event_id`

Optional headers:

- `x-idempotency-key`

Request body:

```json
{
  "name": "Amit Sharma",
  "mobileNumber": "9876543210",
  "gender": "M",
  "age": "20-30",
  "city": "Delhi",
  "email": "amit@example.com",
  "otpVerified": false
}
```

Success response `202`:

```json
{
  "visitorId": "a4f8f7a9-f598-4f7d-a7f8-9d6d74ef1001",
  "registrationId": "4b2fc0be-4eea-4cd2-8db0-d1a71d28f297",
  "status": "accepted",
  "passStatus": "processing"
}
```

Duplicate response `202`:

```json
{
  "visitorId": "a4f8f7a9-f598-4f7d-a7f8-9d6d74ef1001",
  "registrationId": "4b2fc0be-4eea-4cd2-8db0-d1a71d28f297",
  "status": "already_registered",
  "passStatus": "generated",
  "tickets": [
    {
      "ticketId": "3a0f4d2f-9d08-4f4c-977a-4d612eb9a111",
      "ticketNumber": "NBT-2026-000001",
      "ticketType": "parent",
      "childId": null,
      "qrToken": "signed-ticket-token",
      "status": "active"
    }
  ]
}
```

Error responses:

- `401 Missing bearer token`
- `400 Invalid event_id header`
- `404 Event not found`
- `409 Event is inactive`

### `POST /volunteer/scan`

Purpose:

- validate QR ticket and record entry log

Gateway URL:

- `POST http://localhost:3000/volunteer/scan`

Auth:

- `Authorization: Bearer <volunteer-jwt>`

Request body:

```json
{
  "qrToken": "signed-ticket-token",
  "eventId": "6fd4c4f2-2e6f-4b80-9f9f-9e31f8f1d111",
  "deviceId": "adf0c1b4-fc1a-4cb3-9d5f-8fda66de9901",
  "scanDeviceId": "android-scanner-01",
  "gateNumber": 2
}
```

Success response `201`:

```json
{
  "valid": true,
  "passId": "3a0f4d2f-9d08-4f4c-977a-4d612eb9a111",
  "entryLogId": "7fd2f1d8-0050-449b-8580-71ce26777a11",
  "entryTime": "2026-03-20T12:35:00.000Z"
}
```

Error responses:

- `400 Invalid eventId`
- `401 Invalid or inactive ticket`
- `401 Ticket event mismatch`
- `409 Duplicate QR scan blocked`

## Admin Service

Auth:

- admin JWT required unless noted otherwise
- `GET /admin/events` and `GET /admin/events/:eventId` allow `admin`, `volunteer`, and `visitor`

### `POST /admin/volunteers`

Gateway URL:

- `POST http://localhost:3000/admin/volunteers`

Request body:

```json
{
  "name": "Volunteer One",
  "email": "volunteer@nbt.local",
  "password": "Volunteer@123",
  "mobileNumber": "9876543210"
}
```

Success response `201`:

```json
{
  "id": "e11462fd-6dcf-4dfc-95df-248c1c2b3211",
  "name": "Volunteer One",
  "email": "volunteer@nbt.local",
  "mobileNumber": "9876543210",
  "role": "volunteer",
  "status": "active",
  "createdAt": "2026-03-20T09:00:00.000Z"
}
```

### `GET /admin/volunteers`

Gateway URL:

- `GET http://localhost:3000/admin/volunteers`

Success response `200`:

```json
[
  {
    "id": "e11462fd-6dcf-4dfc-95df-248c1c2b3211",
    "name": "Volunteer One",
    "email": "volunteer@nbt.local",
    "mobileNumber": "9876543210",
    "role": "volunteer",
    "status": "active",
    "createdAt": "2026-03-20T09:00:00.000Z"
  }
]
```

### `POST /admin/events`

Purpose:

- create event
- slug is auto-generated
- `baseUrl` is read from `EVENT_BASE_URL`

Gateway URL:

- `POST http://localhost:3000/admin/events`

Request body:

```json
{
  "name": "Book Fair 2026",
  "location": "Delhi",
  "venue": "Hall A",
  "description": "Nine-day public book fair with author sessions and family activities.",
  "agenda": "Day 1 opening, daily talks, weekend workshops, closing ceremony.",
  "bannerUrl": "https://cdn.example.com/events/book-fair-2026-banner.jpg",
  "startDate": "2026-03-20",
  "endDate": "2026-03-29"
}
```

Success response `201`:

```json
{
  "id": "6fd4c4f2-2e6f-4b80-9f9f-9e31f8f1d111",
  "eventName": "Book Fair 2026",
  "location": "Delhi",
  "venue": "Hall A",
  "description": "Nine-day public book fair with author sessions and family activities.",
  "agenda": "Day 1 opening, daily talks, weekend workshops, closing ceremony.",
  "bannerUrl": "https://cdn.example.com/events/book-fair-2026-banner.jpg",
  "slug": "book-fair-2026-delhi-2026-03-20",
  "baseUrl": "https://bookfair.nbtindia.gov.in",
  "registerUrl": "https://bookfair.nbtindia.gov.in/register/book-fair-2026-delhi-2026-03-20",
  "startDate": "2026-03-20T00:00:00.000Z",
  "endDate": "2026-03-29T00:00:00.000Z",
  "status": "active",
  "createdAt": "2026-03-20T09:15:00.000Z"
}
```

Error responses:

- `500 EVENT_BASE_URL is not configured`
- `409 Unable to generate a unique event slug`

### `GET /admin/events`

Gateway URL:

- `GET http://localhost:3000/admin/events`

Success response `200`:

```json
[
  {
    "id": "6fd4c4f2-2e6f-4b80-9f9f-9e31f8f1d111",
    "eventName": "Book Fair 2026",
    "location": "Delhi",
    "venue": "Hall A",
    "description": "Nine-day public book fair with author sessions and family activities.",
    "agenda": "Day 1 opening, daily talks, weekend workshops, closing ceremony.",
    "bannerUrl": "https://cdn.example.com/events/book-fair-2026-banner.jpg",
    "slug": "book-fair-2026-delhi-2026-03-20",
    "baseUrl": "https://bookfair.nbtindia.gov.in",
    "registerUrl": "https://bookfair.nbtindia.gov.in/register/book-fair-2026-delhi-2026-03-20",
    "startDate": "2026-03-20T00:00:00.000Z",
    "endDate": "2026-03-29T00:00:00.000Z",
    "status": "active",
    "createdAt": "2026-03-20T09:15:00.000Z"
  }
]
```

### `GET /admin/events/:eventId`

Gateway URL:

- `GET http://localhost:3000/admin/events/:eventId`

Success response `200`:

```json
{
  "id": "6fd4c4f2-2e6f-4b80-9f9f-9e31f8f1d111",
  "eventName": "Book Fair 2026",
  "location": "Delhi",
  "venue": "Hall A",
  "description": "Nine-day public book fair with author sessions and family activities.",
  "agenda": "Day 1 opening, daily talks, weekend workshops, closing ceremony.",
  "bannerUrl": "https://cdn.example.com/events/book-fair-2026-banner.jpg",
  "slug": "book-fair-2026-delhi-2026-03-20",
  "baseUrl": "https://bookfair.nbtindia.gov.in",
  "registerUrl": "https://bookfair.nbtindia.gov.in/register/book-fair-2026-delhi-2026-03-20",
  "startDate": "2026-03-20T00:00:00.000Z",
  "endDate": "2026-03-29T00:00:00.000Z",
  "status": "active",
  "createdAt": "2026-03-20T09:15:00.000Z"
}
```

Error responses:

- `409 Invalid event_id`
- `404 Event not found`

### `POST /admin/events/:eventId/deactivate`

Gateway URL:

- `POST http://localhost:3000/admin/events/:eventId/deactivate`

Success response `201`:

```json
{
  "id": "6fd4c4f2-2e6f-4b80-9f9f-9e31f8f1d111",
  "eventName": "Book Fair 2026",
  "location": "Delhi",
  "venue": "Hall A",
  "description": "Nine-day public book fair with author sessions and family activities.",
  "agenda": "Day 1 opening, daily talks, weekend workshops, closing ceremony.",
  "bannerUrl": "https://cdn.example.com/events/book-fair-2026-banner.jpg",
  "slug": "book-fair-2026-delhi-2026-03-20",
  "baseUrl": "https://bookfair.nbtindia.gov.in",
  "registerUrl": "https://bookfair.nbtindia.gov.in/register/book-fair-2026-delhi-2026-03-20",
  "startDate": "2026-03-20T00:00:00.000Z",
  "endDate": "2026-03-29T00:00:00.000Z",
  "status": "inactive",
  "createdAt": "2026-03-20T09:15:00.000Z"
}
```

### `DELETE /admin/events/:eventId`

Gateway URL:

- `DELETE http://localhost:3000/admin/events/:eventId`

Success response `200`:

```json
{
  "success": true
}
```

### `GET /admin/dashboard`

Gateway URL:

- `GET http://localhost:3000/admin/dashboard`

Success response `200`:

```json
{
  "totalVisitors": 1200,
  "totalRegistrations": 1400,
  "totalTickets": 1700,
  "totalEntries": 800,
  "childrenTickets": 300,
  "volunteerRegistrations": 250,
  "visitorsPerDay": [
    {
      "date": "2026-03-20",
      "totalVisitors": 320
    }
  ],
  "visitorsPerEvent": [
    {
      "eventId": "6fd4c4f2-2e6f-4b80-9f9f-9e31f8f1d111",
      "eventName": "Book Fair 2026",
      "eventSlug": "book-fair-2026-delhi-2026-03-20",
      "visitors": 1200
    }
  ],
  "eventAnalytics": [
    {
      "eventId": "6fd4c4f2-2e6f-4b80-9f9f-9e31f8f1d111",
      "eventName": "Book Fair 2026",
      "venue": "Hall A",
      "description": "Nine-day public book fair with author sessions and family activities.",
      "agenda": "Day 1 opening, daily talks, weekend workshops, closing ceremony.",
      "bannerUrl": "https://cdn.example.com/events/book-fair-2026-banner.jpg",
      "slug": "book-fair-2026-delhi-2026-03-20",
      "baseUrl": "https://bookfair.nbtindia.gov.in",
      "registerUrl": "https://bookfair.nbtindia.gov.in/register/book-fair-2026-delhi-2026-03-20",
      "visitors": 1200,
      "totalTickets": 1700,
      "totalEntries": 800,
      "childrenTickets": 300,
      "volunteerRegistrations": 250
    }
  ]
}
```

### `GET /admin/visitors`

Gateway URL:

- `GET http://localhost:3000/admin/visitors`

Success response `200`:

```json
[
  {
    "registrationId": "4b2fc0be-4eea-4cd2-8db0-d1a71d28f297",
    "eventId": "6fd4c4f2-2e6f-4b80-9f9f-9e31f8f1d111",
    "eventName": "Book Fair 2026",
    "eventSlug": "book-fair-2026-delhi-2026-03-20",
    "venue": "Hall A",
    "visitorId": "a4f8f7a9-f598-4f7d-a7f8-9d6d74ef1001",
    "name": "Amit Sharma",
    "mobileNumber": "9876543210",
    "gender": "M",
    "age": "20-30",
    "city": "Delhi",
    "email": "amit@example.com",
    "registrationSource": "web",
    "otpVerified": true,
    "childCount": 1,
    "children": [
      {
        "id": "b0f0f33a-fc2a-42bc-bd2d-9f6f8c2d8881",
        "name": "Child One",
        "age": "10-20"
      }
    ],
    "createdAt": "2026-03-20T12:00:00.000Z"
  }
]
```

### `GET /admin/entries`

Gateway URL:

- `GET http://localhost:3000/admin/entries`

Success response `200`:

```json
[
  {
    "entryLogId": "7fd2f1d8-0050-449b-8580-71ce26777a11",
    "ticketId": "3a0f4d2f-9d08-4f4c-977a-4d612eb9a111",
    "eventId": "6fd4c4f2-2e6f-4b80-9f9f-9e31f8f1d111",
    "eventName": "Book Fair 2026",
    "eventSlug": "book-fair-2026-delhi-2026-03-20",
    "venue": "Hall A",
    "scanDeviceId": "android-scanner-01",
    "deviceId": "adf0c1b4-fc1a-4cb3-9d5f-8fda66de9901",
    "entryTime": "2026-03-20T12:35:00.000Z",
    "scanStatus": "success",
    "visitorName": "Amit Sharma",
    "ticketType": "parent"
  }
]
```

### `GET /admin/tickets`

Gateway URL:

- `GET http://localhost:3000/admin/tickets`

Success response `200`:

```json
[
  {
    "ticketId": "3a0f4d2f-9d08-4f4c-977a-4d612eb9a111",
    "ticketNumber": "NBT-2026-000001",
    "eventId": "6fd4c4f2-2e6f-4b80-9f9f-9e31f8f1d111",
    "eventName": "Book Fair 2026",
    "eventSlug": "book-fair-2026-delhi-2026-03-20",
    "venue": "Hall A",
    "visitorId": "a4f8f7a9-f598-4f7d-a7f8-9d6d74ef1001",
    "visitorName": "Amit Sharma",
    "ticketType": "parent",
    "status": "active",
    "issuedAt": "2026-03-20T12:02:00.000Z"
  }
]
```

### `GET /admin/analytics`

Gateway URL:

- `GET http://localhost:3000/admin/analytics`

Success response `200`:

```json
{
  "visitorsPerDay": [
    {
      "date": "2026-03-20",
      "totalVisitors": 320
    }
  ],
  "eventAnalytics": [
    {
      "eventId": "6fd4c4f2-2e6f-4b80-9f9f-9e31f8f1d111",
      "eventName": "Book Fair 2026",
      "venue": "Hall A",
      "description": "Nine-day public book fair with author sessions and family activities.",
      "agenda": "Day 1 opening, daily talks, weekend workshops, closing ceremony.",
      "bannerUrl": "https://cdn.example.com/events/book-fair-2026-banner.jpg",
      "slug": "book-fair-2026-delhi-2026-03-20",
      "baseUrl": "https://bookfair.nbtindia.gov.in",
      "registerUrl": "https://bookfair.nbtindia.gov.in/register/book-fair-2026-delhi-2026-03-20",
      "visitors": 1200,
      "totalTickets": 1700,
      "totalEntries": 800,
      "childrenTickets": 300,
      "volunteerRegistrations": 250
    }
  ],
  "volunteerRegistrations": 250
}
```

## WhatsApp Service

### `POST /api/whatsapp`

Purpose:

- Twilio webhook endpoint for WhatsApp registration flow
- stores `registrationSource = whatsapp`

Gateway URL:

- `POST http://localhost:3000/api/whatsapp`

Request body from Twilio:

```json
{
  "From": "whatsapp:+919876543210",
  "To": "whatsapp:+14155238886",
  "Body": "Hi",
  "MessageSid": "SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

Success response `200`:

- returns TwiML XML, not JSON

Example response:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Welcome to Book Fair 2026.
Let's get you registered. What is your name?</Message>
</Response>
```

Error responses:

- `400 Twilio webhook requires From and Body`
- `404 No active WhatsApp event configured`

## Frontend Flow Summary

Web registration flow:

1. Call `GET /public/events/slug/:slug`
2. Call `POST /auth/otp/request` with `event_slug`
3. Call `POST /auth/otp/verify` with `event_slug`
4. Use returned visitor JWT to call `POST /visitors/register`
5. Poll `GET /visitors/:registrationId/tickets`
6. Optionally call `POST /visitors/:registrationId/children`

Volunteer flow:

1. Call `POST /auth/volunteer/login`
2. Call `GET /volunteer/events`
3. Call `POST /volunteer/visitors/register`
4. Call `POST /volunteer/scan`

Admin flow:

1. Call `POST /auth/admin/login`
2. Manage volunteers and events
3. Read dashboard, visitors, entries, tickets, and analytics
