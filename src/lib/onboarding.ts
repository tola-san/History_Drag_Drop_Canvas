import { z } from "zod";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_PHOTOS = 24;
export const imageTypes = ["image/jpeg", "image/png", "image/webp"];
export function validatePhoto(
  file: Pick<File, "size" | "type">,
): string | null {
  if (!imageTypes.includes(file.type))
    return "Choose a JPEG, PNG, or WebP image.";
  if (file.size === 0 || file.size > MAX_PHOTO_BYTES)
    return "Each image must be between 1 byte and 5 MB.";
  return null;
}
export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters.")
    .max(50, "Use no more than 50 characters."),
  avatarId: z.enum(["violet", "rose", "teal", "amber"]),
});
const id = z.string().regex(/^[A-Za-z0-9_-]{1,80}$/);
export const commentSchema = z.object({
  id,
  text: z
    .string()
    .trim()
    .min(1, "Write a comment first.")
    .max(1000, "Use no more than 1,000 characters."),
  author: z.string().min(1).max(254),
  createdAt: z.iso.datetime(),
  photoId: id.optional(),
});
export type CanvasComment = z.infer<typeof commentSchema>;
export const snapshotSchema = z.object({
  ...profileSchema.shape,
  currentStep: z.number().int().min(0).max(3),
  completed: z.boolean(),
  comments: z.array(commentSchema).max(100).default([]),
  folders: z
    .array(z.object({ id, name: z.string().trim().min(1).max(40) }))
    .max(12),
  photos: z
    .array(z.object({ id, name: z.string().max(255), folderId: id }))
    .max(MAX_PHOTOS),
  positions: z.record(
    z.string(),
    z.object({ x: z.number().finite(), y: z.number().finite() }),
  ),
  connections: z
    .array(
      z.object({
        id,
        source: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),
        target: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),
      }),
    )
    .max(100),
});
export type Snapshot = z.infer<typeof snapshotSchema>;
export type Photo = {
  id: string;
  name: string;
  folderId: string;
  url: string;
  file?: File;
  saved: boolean;
  bundled?: boolean;
};
export type FolderItem = Snapshot["folders"][number];
export const avatars = {
  violet: "bg-violet-100 text-violet-700",
  rose: "bg-rose-100 text-rose-700",
  teal: "bg-teal-100 text-teal-700",
  amber: "bg-amber-100 text-amber-800",
};
