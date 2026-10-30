"use client";
import { useEffect, useRef, useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function CommentComposer({
  photoName,
  onClose,
  onCreate,
}: {
  photoName?: string;
  onClose: () => void;
  onCreate: (text: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
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
      aria-labelledby="comment-title"
      className="m-auto w-[min(420px,92vw)] rounded-2xl border bg-white p-6 shadow-2xl backdrop:bg-slate-950/30"
    >
      <header className="mb-5 flex items-center justify-between">
        <h2
          id="comment-title"
          className="flex items-center gap-2 font-semibold"
        >
          <MessageSquare size={18} className="text-pink-600" />
          Add a comment
        </h2>
        <button
          type="button"
          aria-label="Close comment"
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-slate-100"
        >
          <X size={18} />
        </button>
      </header>
      <p className="mb-4 truncate text-xs text-slate-500">
        {photoName || "Your canvas"}
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!text.trim()) {
            setError("Write a comment first.");
            return;
          }
          onCreate(text.trim());
        }}
      >
        <Label htmlFor="comment-text">Your comment</Label>
        <textarea
          autoFocus
          id="comment-text"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setError("");
          }}
          maxLength={1000}
          rows={4}
          aria-invalid={!!error}
          aria-describedby="comment-hint"
          placeholder="Leave a thought, an idea, or a little feedback…"
          className="mt-2 w-full resize-y rounded-xl border p-3 text-sm focus-visible:outline-2 focus-visible:outline-pink-500"
        />
        <p id="comment-hint" className="mt-2 text-xs text-slate-400">
          {error ||
            `${text.length}/1,000 · Unsaved until your workspace is saved.`}
        </p>
        <Button type="submit" className="mt-5 w-full">
          Add comment pin
        </Button>
      </form>
    </dialog>
  );
}
