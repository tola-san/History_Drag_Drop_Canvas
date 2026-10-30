"use client";
import Folder from "@/components/Folder";
import type { Photo } from "@/lib/onboarding";

// Keep the original React Bits interaction: open, float, drag out, and drop back in.
// The separate caption below the folder opens the full gallery.
export function PhotoFolder({
  name,
  photos,
}: {
  name: string;
  photos: Photo[];
}) {
  return (
    <Folder
      label={name}
      color="#ec4899"
      size={0.65}
      theme="light"
      intro={false}
      draggable
      zoomOnClick
      items={photos.slice(0, 6).map((photo) => (
        <img
          key={photo.id}
          src={photo.url}
          alt={photo.name}
          draggable={false}
          className="h-full w-full object-cover"
        />
      ))}
    />
  );
}
