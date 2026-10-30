import type { Photo } from "./onboarding";

export const defaultFolder = { id: "first-folder", name: "My memories" };
export const defaultPhotos: Photo[] = [
  { id: "default-01", name: "Study session.jpg" },
  { id: "default-02", name: "Working together.jpg" },
  { id: "default-03", name: "KhmerCoders event.jpg" },
  { id: "default-04", name: "An evening with friends.jpg" },
  { id: "default-05", name: "A day out.jpg" },
].map((photo, index) => ({
  ...photo,
  folderId: defaultFolder.id,
  url: `/api/default-photos/photo-${String(index + 1).padStart(2, "0")}`,
  saved: true,
  bundled: true,
}));
