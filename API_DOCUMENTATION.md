# Backend API Implementation - New Features

## Overview
This document describes the newly implemented backend API endpoints for versioning, collaboration, and shared trips.

---

## Versioning Endpoints

### 1. Get Version History
**GET** `/api/trips/:id/versions`

Get all saved versions of a trip itinerary.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "versionNumber": 1,
      "createdAt": "2026-03-01T10:00:00Z",
      "createdBy": "user_id",
      "description": "Initial version",
      "isCurrent": false
    }
  ]
}
```

---

### 2. Save New Version
**POST** `/api/trips/:id/versions`

Save current itinerary as a new version.

**Authentication:** Required

**Request Body:**
```json
{
  "description": "Added museum visit"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Version saved successfully",
  "data": {
    "versionNumber": 2,
    "totalVersions": 2
  }
}
```

---

### 3. Restore Version
**POST** `/api/trips/:id/versions/:versionNumber/restore`

Restore a previous version of the itinerary.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Version 1 restored successfully",
  "data": {
    "currentVersion": 1,
    "itinerary": { /* itinerary data */ }
  }
}
```

---

### 4. Compare Versions
**GET** `/api/trips/:id/versions/compare?v1=1&v2=2`

Compare two versions of a trip.

**Authentication:** Required

**Query Parameters:**
- `v1`: First version number
- `v2`: Second version number

**Response:**
```json
{
  "success": true,
  "data": {
    "version1": { /* version 1 data */ },
    "version2": { /* version 2 data */ },
    "differences": [ /* array of differences */ ]
  }
}
```

---

## Collaboration Endpoints

### 5. Invite Collaborator
**POST** `/api/trips/:id/collaborators/invite`

Invite a user to collaborate on a trip.

**Authentication:** Required (Owner only)

**Request Body:**
```json
{
  "email": "friend@example.com",
  "role": "editor"
}
```

**Roles:**
- `owner`: Full control
- `editor`: Can edit itinerary
- `viewer`: Read-only access

**Response:**
```json
{
  "success": true,
  "message": "Invitation sent to friend@example.com",
  "data": {
    "email": "friend@example.com",
    "role": "editor"
  }
}
```

---

### 6. Get Collaborators
**GET** `/api/trips/:id/collaborators`

Get list of collaborators for a trip.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "active": ["user_id_1", "user_id_2"]
  }
}
```

---

### 7. Remove Collaborator
**DELETE** `/api/trips/:id/collaborators/:userId`

Remove a collaborator from a trip.

**Authentication:** Required (Owner only)

**Response:**
```json
{
  "success": true,
  "message": "Collaborator removed successfully"
}
```

---

### 8. Update Collaborator Role
**PATCH** `/api/trips/:id/collaborators/:userId`

Update a collaborator's role.

**Authentication:** Required (Owner only)

**Request Body:**
```json
{
  "role": "viewer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Collaborator role updated successfully",
  "data": {
    "userId": "user_id",
    "role": "viewer"
  }
}
```

---

## Shared Trip Endpoint

### 9. Get Shared Trip
**GET** `/api/trips/shared/:id`

Get public view of a shared trip (no authentication required).

**Authentication:** None

**Response:**
```json
{
  "success": true,
  "data": {
    "destination": "Paris",
    "startDate": "2026-06-01",
    "endDate": "2026-06-07",
    "duration": 7,
    "budget": 2000,
    "travelStyle": "moderate",
    "itinerary": { /* itinerary data */ },
    "createdBy": "John Doe"
  }
}
```

---

## Socket.IO Events (Real-Time Collaboration)

### Client → Server Events

#### join-trip
Join a trip's collaboration room.

**Payload:**
```javascript
{
  tripId: "trip_id",
  userId: "user_id",
  userName: "John Doe"
}
```

---

#### leave-trip
Leave a trip's collaboration room.

**Payload:**
```javascript
{
  tripId: "trip_id",
  userId: "user_id",
  userName: "John Doe"
}
```

---

#### trip-update
Broadcast changes to the trip.

**Payload:**
```javascript
{
  tripId: "trip_id",
  update: { /* change data */ },
  userId: "user_id"
}
```

---

#### cursor-move
Share cursor position with other collaborators.

**Payload:**
```javascript
{
  tripId: "trip_id",
  position: { x: 100, y: 200 },
  userId: "user_id",
  userName: "John Doe"
}
```

---

#### add-comment
Add a comment to a specific day in the itinerary.

**Payload:**
```javascript
{
  tripId: "trip_id",
  dayIndex: 0,
  comment: "Great restaurant!",
  userId: "user_id",
  userName: "John Doe"
}
```

---

#### vote-activity
Vote on an activity.

**Payload:**
```javascript
{
  tripId: "trip_id",
  activityId: "activity_id",
  vote: "up" | "down",
  userId: "user_id"
}
```

---

### Server → Client Events

#### collaborator-joined
Notifies when a user joins the trip.

**Payload:**
```javascript
{
  userId: "user_id",
  userName: "Jane Smith",
  timestamp: "2026-03-02T10:00:00Z"
}
```

---

#### collaborator-left
Notifies when a user leaves the trip.

**Payload:**
```javascript
{
  userId: "user_id",
  userName: "Jane Smith",
  timestamp: "2026-03-02T11:00:00Z"
}
```

---

#### trip-updated
Notifies of trip changes.

**Payload:**
```javascript
{
  update: { /* change data */ },
  userId: "user_id",
  timestamp: "2026-03-02T10:30:00Z"
}
```

---

#### cursor-moved
Shows other users' cursor positions.

**Payload:**
```javascript
{
  userId: "user_id",
  userName: "John Doe",
  position: { x: 100, y: 200 },
  timestamp: "2026-03-02T10:30:00Z"
}
```

---

#### comment-added
Notifies when a comment is added.

**Payload:**
```javascript
{
  dayIndex: 0,
  comment: "Great restaurant!",
  userId: "user_id",
  userName: "John Doe",
  timestamp: "2026-03-02T10:30:00Z"
}
```

---

#### activity-voted
Notifies of activity votes.

**Payload:**
```javascript
{
  activityId: "activity_id",
  vote: "up",
  userId: "user_id",
  timestamp: "2026-03-02T10:30:00Z"
}
```

---

#### collaborator-removed
Notifies when a collaborator is removed.

**Payload:**
```javascript
{
  userId: "user_id",
  timestamp: "2026-03-02T10:30:00Z"
}
```

---

#### collaborator-role-updated
Notifies of role changes.

**Payload:**
```javascript
{
  userId: "user_id",
  role: "viewer",
  timestamp: "2026-03-02T10:30:00Z"
}
```

---

#### current-collaborators
Sent when joining a trip, lists all active users.

**Payload:**
```javascript
["user_id_1", "user_id_2", "user_id_3"]
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**Exception:** The shared trip endpoint (`/api/trips/shared/:id`) does not require authentication.

---

## Testing the APIs

### Using curl

**Get version history:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/trips/TRIP_ID/versions
```

**Save version:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Added new restaurant"}' \
  http://localhost:5000/api/trips/TRIP_ID/versions
```

**Get shared trip (no auth):**
```bash
curl http://localhost:5000/api/trips/shared/TRIP_ID
```

---

## Database Schema Updates

### Trip Model Additions

```javascript
versions: [{
  versionNumber: Number,
  itinerary: Mixed,        // Full copy of itinerary
  createdAt: Date,
  createdBy: ObjectId,     // Reference to User
  description: String,
  isCurrent: Boolean
}],
currentVersion: {
  type: Number,
  default: 1
}
```

### Methods Added to Trip Model

- `saveVersion(userId, description)` - Save new version
- `restoreVersion(versionNumber)` - Restore previous version
- `getVersionHistory()` - Get all versions sorted
- `compareVersions(v1, v2)` - Compare two versions

---

## Future Enhancements

1. **Collaborators Field:** Add `collaborators` array to Trip model with roles
2. **Permissions:** Implement granular permission checking
3. **Notifications:** Email/push notifications for invitations
4. **Conflict Resolution:** Handle simultaneous edits
5. **Version Diffs:** More detailed change tracking
6. **Audit Log:** Track all changes with timestamps

---

## Files Created

**Backend Controllers:**
- `server/controllers/versionController.js`
- `server/controllers/collaborationController.js`

**Backend Routes:**
- `server/routes/versions.js`
- `server/routes/collaboration.js`

**Backend Integration:**
- Updated `server/server.js` with Socket.IO and new routes

**Client Services:**
- `client/src/services/collaboration.js`
- `client/src/services/costOptimization.js`

**Client API:**
- Updated `client/src/services/api.js` with `getSharedTrip` method

---

**Implementation Date:** March 2, 2026  
**Status:** ✅ Complete - Ready for testing
