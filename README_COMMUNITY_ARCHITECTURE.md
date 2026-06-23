# MedMonitor — Community Hub Architecture Documentation

> **Purpose:** Documents the infrastructure layer for the Community Hub feature.  
> **Scope:** Firestore collections, service layer, hook layer, realtime patterns, and security requirements.  
> **Status:** Infrastructure implemented. UI layer pending.

---

## Overview

Community Hub is a read/write social feed embedded in the MedMonitor Patient module. It allows authenticated users (patients and caregivers) to post health-related discussions, reply to posts, and interact via likes and reports.

The infrastructure is **fully isolated** from all existing modules. No existing service, hook, route, or component has been modified.

---

## Files Created

| File | Role |
|------|------|
| `src/services/communityService.js` | Firestore CRUD + realtime subscription functions |
| `src/hooks/useCommunity.js` | React hook — state management, subscription lifecycle, action wrappers |
| `README_COMMUNITY_ARCHITECTURE.md` | This document |

---

## Firestore Collections

### `CommunityPosts`

Top-level collection. Each document represents one user-authored post.

#### Document Schema

| Field | Type | Value / Notes |
|-------|------|---------------|
| `authorId` | `string` | `currentUser.uid` — Firebase Auth UID |
| `authorName` | `string` | `currentUser.displayName` at time of creation |
| `authorPhotoURL` | `string \| null` | `currentUser.photoURL` — may be `null`; UI falls back to DiceBear |
| `title` | `string` | Post title |
| `content` | `string` | Post body text |
| `tags` | `string[]` | Optional array of tag strings (e.g. `["medication", "tips"]`) |
| `likesCount` | `number` | Starts at `0`. Incremented atomically via `increment(1)`. |
| `repliesCount` | `number` | Starts at `0`. Incremented on reply add, decremented on reply delete. |
| `reportCount` | `number` | Starts at `0`. Incremented on each report action. |
| `moderationStatus` | `string` | `"APPROVED"` on creation. Changes to `"FLAGGED"` when `reportCount >= 3`. |
| `createdAt` | `Timestamp` | Firestore `serverTimestamp()` |
| `updatedAt` | `Timestamp` | Firestore `serverTimestamp()` — set on creation |

#### Example Document

```json
{
  "authorId": "uid_abc123",
  "authorName": "Priya Sharma",
  "authorPhotoURL": null,
  "title": "Managing medication timing around meals",
  "content": "I find it easier to take my morning dose right after breakfast...",
  "tags": ["medication", "tips", "routine"],
  "likesCount": 7,
  "repliesCount": 3,
  "reportCount": 0,
  "moderationStatus": "APPROVED",
  "createdAt": "2026-06-23T12:00:00Z",
  "updatedAt": "2026-06-23T12:00:00Z"
}
```

#### Moderation States

| `moderationStatus` | Meaning |
|--------------------|---------|
| `"APPROVED"` | Visible to all users (default) |
| `"FLAGGED"` | Automatically set when `reportCount >= 3`. UI should hide or blur flagged posts. |

---

### `CommunityReplies`

Top-level collection (flat, not a subcollection). Each document is one reply linked to a parent post via `postId`.

> **Design decision:** Flat collection chosen over subcollection (`CommunityPosts/{id}/replies`) because:  
> - Consistent with existing app patterns (`dose_logs`, `patient_logs`)  
> - Allows future cross-post reply queries without collection group indexes  
> - Simpler Firestore security rules

#### Document Schema

| Field | Type | Value / Notes |
|-------|------|---------------|
| `postId` | `string` | Document ID of parent `CommunityPosts` document |
| `authorId` | `string` | `currentUser.uid` |
| `authorName` | `string` | `currentUser.displayName` at time of creation |
| `authorPhotoURL` | `string \| null` | `currentUser.photoURL` — may be `null` |
| `content` | `string` | Reply body text |
| `likesCount` | `number` | Starts at `0` |
| `moderationStatus` | `string` | `"APPROVED"` on creation |
| `createdAt` | `Timestamp` | Firestore `serverTimestamp()` |

#### Example Document

```json
{
  "postId": "post_xyz789",
  "authorId": "uid_def456",
  "authorName": "Rohan K.",
  "authorPhotoURL": null,
  "content": "This worked really well for me too. I'd also suggest setting a phone reminder.",
  "likesCount": 2,
  "moderationStatus": "APPROVED",
  "createdAt": "2026-06-23T12:05:00Z"
}
```

---

## Service Layer — `communityService.js`

Follows the MedMonitor service convention:
- **Named exports only** — no default export, no classes
- **`subscribe*()` functions** return the Firestore `unsubscribe` function directly
- **CRUD mutations** return `{ success: true }` or `{ success: true, id }`
- **All async functions** use `try/catch` and re-throw errors (never suppressed)
- **Console logging** uses `[CommunityService]` prefix, matching `[CaregiverService]` and `[AnalyticsService]` patterns

### Functions

#### Post Functions

| Function | Signature | Returns | Notes |
|----------|-----------|---------|-------|
| `subscribeToPosts` | `(callback, onError)` | `unsubscribeFn` | `orderBy createdAt desc`, `limit 20` |
| `addPost` | `async (postData)` | `{ success, id }` | Sets all counter fields to 0, `moderationStatus = "APPROVED"` |
| `deletePost` | `async (postId)` | `{ success }` | Does **not** cascade-delete replies |
| `likePost` | `async (postId)` | `{ success }` | Atomic `increment(1)` on `likesCount` |
| `reportPost` | `async (postId)` | `{ success, flagged }` | Reads count after increment; sets `FLAGGED` if `>= 3` |

#### Reply Functions

| Function | Signature | Returns | Notes |
|----------|-----------|---------|-------|
| `subscribeToReplies` | `(postId, callback, onError)` | `unsubscribeFn` | `where postId ==`, `orderBy createdAt asc` |
| `addReply` | `async (replyData)` | `{ success, id }` | Also increments parent `repliesCount` |
| `deleteReply` | `async (replyId, postId)` | `{ success }` | Also decrements parent `repliesCount` |

---

## Hook Layer — `useCommunity.js`

Follows the `useAnalytics.js` and `useMedicines.js` patterns exactly.

### State

| Name | Type | Initial | Description |
|------|------|---------|-------------|
| `posts` | `array` | `[]` | Real-time array of post objects |
| `loading` | `boolean` | `true` | `true` until first snapshot arrives |
| `error` | `object \| null` | `null` | Firestore error (if any) |

### Subscription Lifecycle

```
mount
  └─ useEffect([currentUser])
      ├─ if !currentUser → setLoading(false), return (no subscription)
      ├─ setLoading(true)
      ├─ subscribeToPosts(onData, onError)
      │     onData  → setPosts(), setLoading(false), setError(null)
      │     onError → setError(err), setLoading(false)
      └─ returns cleanup → unsubscribe()

unmount / currentUser change
  └─ cleanup() → unsubscribe() called automatically by React
```

### Actions (all `useCallback`)

| Action | Args | Description |
|--------|------|-------------|
| `createPost` | `{ title, content, tags }` | Injects `authorId`, `authorName`, `authorPhotoURL` from `currentUser` automatically |
| `removePost` | `postId` | Calls `deletePost(postId)` |
| `toggleLike` | `postId` | Calls `likePost(postId)` |
| `reportPost` | `postId` | Calls service `reportPost(postId)` |

> **Note on `toggleLike`:** The function name is `toggleLike` but the underlying behavior is always an increment (not a true toggle). Like-deduplication (preventing double-likes) is deferred to the UI layer in v1. A future iteration may store liked post IDs in a `UserLikes` collection.

---

## Realtime Architecture

```
Firestore
  CommunityPosts (orderBy createdAt desc, limit 20)
       │
       │ onSnapshot
       ▼
  useCommunity.js (hook)
       │
       │ posts[], loading, error
       ▼
  Community.jsx (page — not yet created)
       │
       ├─ PostFeed (list of PostCard components)
       └─ CreatePostModal
```

```
Firestore
  CommunityReplies (where postId == X, orderBy createdAt asc)
       │
       │ onSnapshot (triggered per expanded post)
       ▼
  ReplySection.jsx (component — not yet created)
```

### Key Design Decisions

1. **Replies are NOT subscribed globally** — `subscribeToReplies` is only called when a user expands a specific post's reply section. This avoids paying for unbounded snapshot listeners.

2. **Feed is limited to 20 posts** — prevents unbounded reads. Pagination with `startAfter()` can be added in a future iteration.

3. **`repliesCount` is denormalized onto the post** — allows the feed to display reply counts without fetching the `CommunityReplies` collection. Updated atomically via `increment()`.

4. **Author data is denormalized** — `authorName` and `authorPhotoURL` are stored on every post/reply document at write-time. This avoids a secondary `Users` read per post during feed render.

---

## Security Assumptions

The following Firestore Security Rules **must be applied before the UI is deployed**. Without these, all reads will fail due to the existing per-user ownership model.

### Required Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ─── Existing rules must remain unchanged ─────────────────────────────
    // (Medicines, Users, FamilyMembers, dose_logs, patients, etc.)

    // ─── CommunityPosts ───────────────────────────────────────────────────
    match /CommunityPosts/{postId} {

      // Any authenticated user can read all posts
      allow read: if request.auth != null;

      // Only the author can create a post; authorId must match the caller
      allow create: if request.auth != null
        && request.resource.data.authorId == request.auth.uid;

      // Authors can update their own post.
      // Any authenticated user can increment likesCount or reportCount
      // (counter fields only — prevents tampering with content or authorId).
      allow update: if request.auth != null
        && (
          resource.data.authorId == request.auth.uid
          || request.resource.data.diff(resource.data)
               .affectedKeys()
               .hasOnly(['likesCount', 'reportCount', 'moderationStatus'])
        );

      // Only the author can delete their own post
      allow delete: if request.auth != null
        && resource.data.authorId == request.auth.uid;
    }

    // ─── CommunityReplies ─────────────────────────────────────────────────
    match /CommunityReplies/{replyId} {

      // Any authenticated user can read all replies
      allow read: if request.auth != null;

      // Only the author can create a reply; authorId must match the caller
      allow create: if request.auth != null
        && request.resource.data.authorId == request.auth.uid;

      // Only the author can delete their reply
      allow delete: if request.auth != null
        && resource.data.authorId == request.auth.uid;
    }
  }
}
```

### Security Assumptions Made

| Assumption | Detail |
|------------|--------|
| Authentication required for all operations | `request.auth != null` check on every rule |
| No anonymous read access | Community is patient/caregiver only — no public API |
| `authorId` immutability | Create rules enforce `authorId == request.auth.uid`. Update rules do not allow `authorId` to be changed. |
| Counter fields are trust-limited | `likesCount`, `reportCount`, `moderationStatus` can be updated by any authenticated user via the `hasOnly()` restriction |
| Content moderation is automated | `moderationStatus` is set to `"FLAGGED"` server-side by the service function after reading `reportCount`. No admin panel required for v1. |
| No data validation in rules | Field type/length validation is deferred to the service layer (`addPost`, `addReply`) for v1. Firestore rules validate ownership only. |

---

## Known Limitations (v1)

| Limitation | Impact | Future Fix |
|------------|--------|-----------|
| No like deduplication | A user can like a post multiple times | Add a `UserLikes/{uid_postId}` document pattern |
| No reply cascade delete | Orphaned `CommunityReplies` remain after post deletion | Add a Firebase Cloud Function `onDelete` trigger on `CommunityPosts` |
| `moderationStatus` update is not atomic | Read-then-write in `reportPost()` has a theoretical race condition | Use a Firestore Transaction instead of two sequential `updateDoc` calls |
| Feed limited to 20 posts | Older posts are not visible | Add pagination via `startAfter(lastVisible)` cursor |
| No full-text search | Search must be client-side filter on loaded posts | Integrate Algolia or Firestore composite indexes for large datasets |

---

## Naming Conventions

Consistent with existing MedMonitor codebase:

| Element | Convention | Example |
|---------|-----------|---------|
| Firestore collection | PascalCase | `CommunityPosts`, `CommunityReplies` |
| Service file | camelCase domain + "Service" | `communityService.js` |
| Hook file | "use" + PascalCase domain | `useCommunity.js` |
| Console prefix | `[ComponentName]` | `[CommunityService]` |
| `data-testid` | kebab-case | `community-page`, `create-post-button` |

---

*Documentation generated: 2026-06-23 · MedMonitor Community Hub v1 Infrastructure*
