"use client";
import { useEffect, useRef } from "react";
import { X, ImageIcon, Trash2 } from "lucide-react";
import type { Photo } from "@/lib/onboarding";

export function PhotoGallery({
  name,
  photos,
  onClose,
  onRemove,
}: {
  name: string;
  photos: Photo[];
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="gallery-title"
      className="m-auto max-h-[85dvh] w-[min(900px,92vw)] overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-2xl backdrop:bg-slate-950/40"
    >
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-pink-600">
            Your collection
          </p>
          <h2 id="gallery-title" className="text-xl font-semibold">
            {name}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {photos.length} photos · Unsaved previews disappear when you leave.
          </p>
        </div>
        <button
          autoFocus
          type="button"
          aria-label="Close gallery"
          onClick={onClose}
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </header>
      {!photos.length ? (
        <div className="grid min-h-48 place-content-center gap-3 text-center text-slate-400">
          <ImageIcon className="mx-auto" />
          <p>No photos yet. Add your own in step 3.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <figure
              key={photo.id}
              className="overflow-hidden rounded-xl border bg-slate-50"
            >
              <img
                src={photo.url}
                alt={photo.name}
                className="aspect-square w-full object-cover"
              />
              <figcaption className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {photo.name}
                  </span>
                  {!photo.saved && (
                    <button
                      type="button"
                      aria-label={`Remove ${photo.name}`}
                      onClick={() => onRemove(photo.id)}
                      className="rounded p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <p
                  className={`mt-1 text-xs ${photo.saved ? "text-emerald-700" : "text-amber-700"}`}
                >
                  {photo.bundled
                    ? "Included in My memories"
                    : photo.saved
                      ? "Saved to your account"
                      : "Temporary preview · not uploaded"}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </dialog>
  );
}
