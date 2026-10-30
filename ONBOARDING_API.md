# Onboarding API integration

The /onboarding page verifies JSESSIONID or SESSION with the real Java /auth/me endpoint before rendering. Login redirects only after login and session verification succeed. The same-origin Next.js proxy must be used for SSR session verification.

NEXT_PUBLIC_API_URL is the frontend origin. SPRING_BOOT_API_URL is https://java-spring-security-auth.onrender.com. For a deployed frontend, replace localhost:3000 with its HTTPS origin before building.

The Java backend currently provides authentication but does not provide onboarding/photo storage. The UI detects missing endpoints, labels temporary previews, and disables cloud saving until storage is available. Photos stay in memory and object URLs; leaving the page discards unsaved previews.

## Required persistence endpoints

Next.js maps /api/auth/* to Java /auth/*.

- GET /api/auth/onboarding: return 204 for a new account, or 200 with the snapshot below.
- PUT /api/auth/onboarding: validate and save snapshot JSON; return 200 with the authoritative saved snapshot.
- POST /api/auth/photos: multipart fields file, folderId, clientId. Return 201 with {id,name,folderId}.
- GET /api/auth/photos/{id}/content: return authorized image bytes with correct Content-Type and Cache-Control: private, no-store.

Snapshot:

```json
{
  "displayName": "Sam",
  "avatarId": "violet",
  "currentStep": 2,
  "completed": false,
  "folders": [{ "id": "first-folder", "name": "My first collection" }],
  "photos": [
    { "id": "server-photo-id", "name": "photo.jpg", "folderId": "first-folder" }
  ],
  "positions": { "profile": { "x": 50, "y": 140 } },
  "connections": [
    { "id": "profile-folder", "source": "profile", "target": "first-folder" }
  ]
}
```

Supported avatar IDs: violet, rose, teal, amber. IDs must contain only letters, digits, underscores, or hyphens (1–80 characters). profile and collection are reserved node IDs. Names require 2–50 characters; folder names 1–40 characters. Limits: 12 folders, 24 photos, 100 connections. Validate node references, finite coordinates, and ownership on the server.

Photo previews accept JPEG/PNG/WebP, at most 5 MB and 24 megapixels. The backend must independently inspect bytes, decode and validate dimensions, reject malformed files, and enforce quotas. Store metadata in PostgreSQL and bytes in private durable storage, not Render ephemeral disk. Derive ownership from the authenticated principal. Do not trust client-supplied user IDs or storage paths.

Save order: PUT folders/progress, POST pending files one at a time with fresh CSRF tokens, then PUT the final snapshot. Successful uploads remain confirmed after partial failure. Implement idempotency per user and clientId so retries do not duplicate photos. Final PUT must return the saved snapshot and completed=true when requested; the UI never simulates completion. Current snapshot writes are last-writer-wins; add server versions for concurrent editing.

All writes require session cookies and CSRF. Use 401 for expired sessions, 403 for denied requests, 413/415 for upload errors and 429 for throttling. Return 404/405/501 for unavailable persistence features. Protect photo reads with ownership checks. Use HttpOnly/Secure session cookies in production.

## Source and checks

React Flow and Motion are installed. The requested React Bits Folder-JS-CSS registry source is retained in components/Folder.jsx and Folder.css, with Folder.d.ts and onboarding/photo-folder.tsx providing a TypeScript adapter. An empty items array is preserved as empty. The adapter preserves the original folder open/close, photo focus, drag-out and drop-back behavior, including the upstream reduced-motion handling. Up to six photos float in each folder; its caption opens the full gallery. Loose-photo positions are temporary interaction state, not saved canvas nodes.

Run npm test, npx tsc --noEmit, and npm run build. Full persisted-upload integration requires the real endpoints above. No authentication or save responses are mocked by the application.

## Included default photos

Five user-provided compressed JPEG files are stored unchanged in private/default-photos and appear in the default My memories folder. They are project assets shared across authenticated accounts, not uploads saved in PostgreSQL. They are served only after a fresh Java session check through /api/default-photos/{id}, with private/no-store caching. They are excluded from account photo-save payloads and are not uploaded to Render by the frontend.

The files are outside public/. Next.js output tracing includes them for server deployment. Include these private files when deploying the app, and remove them if the deployment should not contain personal default photos.

## Image-to-image connectors

Use Pin photos to canvas on a folder to create individual draggable photo cards. Drag a right-side source handle to another card's left-side target handle to draw a directional connector. The original folder still opens floating photos. Use Fit all cards in view if newly pinned cards are outside the viewport.

Photo nodes use image-{photoId} IDs; positions and connections use the existing snapshot fields. Allow these IDs in server graph validation, including bundled default photo IDs. Photo-node references can be up to 100 characters. Pinning and connectors are unsaved draft state until the persistence API confirms a save.

## Canvas comments

Use the toolbar Comment button for a canvas note, or Comment on a pinned photo card. Notes are draggable, display their author, and can be removed by that author. They are unsaved draft state until the backend confirms them.

The onboarding snapshot now includes optional comments (defaults to an empty list for older responses). Each comment contains id, text (trimmed, 1–1,000 characters), author, createdAt (ISO datetime), and optional photoId. Limit 100 per workspace. Comment positions use comment-{id} node IDs in positions; these IDs may also appear in graph connections. The PUT response must echo confirmed comments; omitted comments never produce a false saved state.

Java must derive and validate author identity from the session, verify photo/workspace ownership, and authorize edits/deletions. Never trust the client author field as authorization. Comments are plain text, not HTML. Photo IDs are reconciled after real upload responses.
