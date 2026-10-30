"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Cloud,
  CloudOff,
  FolderPlus,
  ImageIcon,
  Layers2,
  LoaderCircle,
  LogOut,
  MousePointer2,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserRound,
  Workflow,
  MessageSquare,
  X,
} from "lucide-react";
import type { Edge } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ApiError,
  apiUrl,
  authApi,
  authMutation,
  authRequest,
} from "@/lib/auth-api";
import {
  avatars,
  imageTypes,
  MAX_PHOTOS,
  profileSchema,
  snapshotSchema,
  validatePhoto,
  type FolderItem,
  type Photo,
  type Snapshot,
} from "@/lib/onboarding";
import { defaultFolder, defaultPhotos } from "@/lib/default-photos";
import { WorkspaceCanvas } from "./workspace-canvas";
import { CommentComposer } from "./comment-composer";
import type { CanvasComment } from "@/lib/onboarding";
import { PhotoGallery } from "./photo-gallery";

const steps = [
  { title: "Welcome", hint: "Meet your new space", icon: Sparkles },
  {
    title: "Make it yours",
    hint: "A name, a little personality",
    icon: UserRound,
  },
  {
    title: "Add your photos",
    hint: "Collect what inspires you",
    icon: ImageIcon,
  },
  { title: "Connect the dots", hint: "Explore your canvas", icon: Workflow },
];
const firstFolder = defaultFolder;
const initialEdges: Edge[] = [
  { id: "profile-folder", source: "profile", target: firstFolder.id },
  { id: "folder-collection", source: firstFolder.id, target: "collection" },
];

export function OnboardingWorkspace({ email }: { email: string }) {
  const router = useRouter();
  const [setupOpen, setSetupOpen] = useState(false);
  const setupDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!setupOpen) return;
    const dialog = setupDialog.current;
    const previous = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [setupOpen]);
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [avatarId, setAvatarId] = useState<keyof typeof avatars>("rose");
  const [folders, setFolders] = useState<FolderItem[]>([firstFolder]);
  const [photos, setPhotos] = useState<Photo[]>(() => [...defaultPhotos]);
  const [positions, setPositions] = useState<Snapshot["positions"]>({});
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [comments, setComments] = useState<CanvasComment[]>([]);
  const [commentTarget, setCommentTarget] = useState<string | null | undefined>(
    undefined,
  );
  const requestComment = useCallback(
    (photoId?: string) => setCommentTarget(photoId || null),
    [],
  );
  const deleteComment = useCallback((id: string) => {
    setComments((previous) => previous.filter((comment) => comment.id !== id));
    setPositions((previous) => {
      const next = { ...previous };
      delete next[`comment-${id}`];
      return next;
    });
    setEdges((previous) =>
      previous.filter(
        (edge) =>
          edge.source !== `comment-${id}` && edge.target !== `comment-${id}`,
      ),
    );
    setDirty(true);
    setSaved(false);
    setCompleted(false);
  }, []);
  const [selectedFolder, setSelectedFolder] = useState(firstFolder.id);
  const [folderName, setFolderName] = useState("");
  const [gallery, setGallery] = useState<string | null>(null);
  const [storage, setStorage] = useState<
    "loading" | "ready" | "missing" | "error"
  >("loading");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [sessionIssue, setSessionIssue] = useState(false);
  const urls = useRef(new Set<string>());
  const input = useRef<HTMLInputElement>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(true);
  const changed = () => {
    setDirty(true);
    setSaved(false);
    setCompleted(false);
    setMessage("");
  };
  const openGallery = useCallback((id: string) => setGallery(id), []);

  const fail = useCallback(
    (cause: unknown) => {
      if (cause instanceof ApiError && cause.status === 401) {
        setSessionIssue(true);
        router.replace("/login");
        router.refresh();
        return;
      }
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong. Please try again.",
      );
    },
    [router],
  );

  const load = useCallback(
    async (hydrate: boolean) => {
      setStorage("loading");
      setError("");
      try {
        const response = await authRequest("/api/auth/onboarding");
        const snapshot =
          response.status === 204
            ? null
            : snapshotSchema.parse(await response.json());
        if (!mounted.current) return;
        if (snapshot && hydrate) {
          setDisplayName(snapshot.displayName);
          setAvatarId(snapshot.avatarId);
          setStep(snapshot.currentStep);
          setFolders(
            snapshot.folders.some((folder) => folder.id === firstFolder.id)
              ? snapshot.folders
              : [firstFolder, ...snapshot.folders],
          );
          setSelectedFolder(firstFolder.id);
          setPositions(snapshot.positions);
          setEdges(snapshot.connections);
          setComments(snapshot.comments);
          setPhotos([
            ...defaultPhotos,
            ...snapshot.photos
              .filter(
                (photo) => !defaultPhotos.some((item) => item.id === photo.id),
              )
              .map((photo) => ({
                ...photo,
                saved: true,
                url: apiUrl(`/api/auth/photos/${photo.id}/content`),
              })),
          ]);
          setCompleted(snapshot.completed);
          setSaved(true);
        }
        setStorage("ready");
      } catch (cause) {
        if (!mounted.current) return;
        if (cause instanceof ApiError && [404, 405, 501].includes(cause.status))
          setStorage("missing");
        else {
          setStorage("error");
          fail(cause);
        }
      }
    },
    [fail],
  );

  useEffect(() => {
    mounted.current = true;
    void load(true);
    const objectUrls = urls.current;
    return () => {
      mounted.current = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.clear();
    };
  }, [load]);

  useEffect(() => {
    async function verify() {
      try {
        const response = await authApi.me();
        const user = await response.json();
        if (user.email !== email) {
          setSessionIssue(true);
          router.refresh();
          return;
        }
        setSessionIssue(false);
      } catch (cause) {
        setSessionIssue(true);
        fail(cause);
      }
    }
    const check = () => {
      if (document.visibilityState === "visible") void verify();
    };
    window.addEventListener("focus", check);
    const timer = window.setInterval(check, 60000);
    return () => {
      window.removeEventListener("focus", check);
      window.clearInterval(timer);
    };
  }, [email, fail, router]);

  useEffect(() => {
    if (!dirty && !photos.some((photo) => !photo.saved)) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, photos]);

  function goTo(next: number) {
    if (busy || storage === "loading") return;
    if (step === 1 && next > 1) {
      const result = profileSchema.safeParse({ displayName, avatarId });
      if (!result.success) {
        setProfileError(result.error.issues[0].message);
        return;
      }
    }
    setStep(next);
    changed();
    setProfileError("");
    requestAnimationFrame(() => stepHeading.current?.focus());
  }

  function addFolder() {
    const name = folderName.trim();
    if (!name || name.length > 40) {
      setError("Give your folder a name of 1–40 characters.");
      return;
    }
    if (folders.length >= 12) {
      setError("You can add up to 12 folders.");
      return;
    }
    const folder = { id: crypto.randomUUID(), name };
    setFolders((previous) => [...previous, folder]);
    setSelectedFolder(folder.id);
    setFolderName("");
    setEdges((previous) => [
      ...previous,
      { id: crypto.randomUUID(), source: "profile", target: folder.id },
    ]);
    changed();
    setError("");
  }

  async function addPhotos(files: File[]) {
    if (busy || storage === "loading") return;
    if (!selectedFolder) {
      setError("Create a folder first.");
      return;
    }
    if (files.length + photos.length > MAX_PHOTOS) {
      setError(`Your workspace can hold up to ${MAX_PHOTOS} photos.`);
      return;
    }
    setBusy(true);
    setError("");
    const additions: Photo[] = [];
    try {
      for (const file of files) {
        const issue = validatePhoto(file);
        if (issue) throw new Error(`${file.name}: ${issue}`);
        let bitmap: ImageBitmap;
        try {
          bitmap = await createImageBitmap(file);
        } catch {
          throw new Error(`${file.name}: this image could not be read.`);
        }
        const tooLarge = bitmap.width * bitmap.height > 24_000_000;
        bitmap.close();
        if (tooLarge)
          throw new Error(
            `${file.name}: choose an image smaller than 24 megapixels.`,
          );
        const url = URL.createObjectURL(file);
        urls.current.add(url);
        additions.push({
          id: crypto.randomUUID(),
          name: file.name,
          folderId: selectedFolder,
          url,
          file,
          saved: false,
        });
      }
      if (!mounted.current) {
        additions.forEach((photo) => URL.revokeObjectURL(photo.url));
        return;
      }
      setPhotos((previous) => [...previous, ...additions]);
      changed();
      setMessage(
        `${additions.length} photo${additions.length === 1 ? "" : "s"} added as temporary previews. Save to upload them.`,
      );
    } catch (cause) {
      additions.forEach((photo) => {
        URL.revokeObjectURL(photo.url);
        urls.current.delete(photo.url);
      });
      fail(cause);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  function removePhoto(id: string) {
    const photo = photos.find((item) => item.id === id);
    if (!photo || photo.saved || busy) return;
    URL.revokeObjectURL(photo.url);
    urls.current.delete(photo.url);
    setPhotos((previous) => previous.filter((item) => item.id !== id));
    const nodeId = `image-${id}`;
    setEdges((previous) =>
      previous.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      ),
    );
    setPositions((previous) => {
      const next = { ...previous };
      delete next[nodeId];
      return next;
    });
    changed();
  }

  async function save(finish = false) {
    const profile = profileSchema.safeParse({ displayName, avatarId });
    if (!profile.success) {
      setStep(1);
      setProfileError(profile.error.issues[0].message);
      return;
    }
    if (storage !== "ready" || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    setSaved(false);
    let currentPhotos = [...photos];
    let currentComments = [...comments];
    const payload = (done: boolean) =>
      snapshotSchema.parse({
        ...profile.data,
        currentStep: step,
        completed: done,
        comments: currentComments,
        folders,
        positions,
        connections: edges.map(({ id, source, target }) => ({
          id,
          source,
          target,
        })),
        photos: currentPhotos
          .filter((photo) => photo.saved && !photo.bundled)
          .map(({ id, name, folderId }) => ({ id, name, folderId })),
      });
    try {
      // Save folder IDs before uploading their files; no local success is invented.
      await authMutation("/api/auth/onboarding", payload(false), "PUT");
      for (const photo of currentPhotos.filter((item) => !item.saved)) {
        if (!photo.file)
          throw new Error(
            "A photo is no longer available. Please select it again.",
          );
        const body = new FormData();
        body.append("file", photo.file);
        body.append("folderId", photo.folderId);
        body.append("clientId", photo.id);
        const response = await authMutation("/api/auth/photos", body);
        const uploaded = snapshotSchema.shape.photos.element.parse(
          await response.json(),
        );
        if (uploaded.folderId !== photo.folderId)
          throw new Error("The upload response did not match your folder.");
        currentPhotos = currentPhotos.map((item) =>
          item.id === photo.id
            ? {
                ...uploaded,
                saved: true,
                url: apiUrl(`/api/auth/photos/${uploaded.id}/content`),
              }
            : item,
        );
        currentComments = currentComments.map((comment) =>
          comment.photoId === photo.id
            ? { ...comment, photoId: uploaded.id }
            : comment,
        );
        setComments(currentComments);
        setPhotos([...currentPhotos]);
        URL.revokeObjectURL(photo.url);
        urls.current.delete(photo.url);
      }
      const response = await authMutation(
        "/api/auth/onboarding",
        payload(finish),
        "PUT",
      );
      const confirmed = snapshotSchema.parse(await response.json());
      if (
        currentComments.length !== confirmed.comments.length ||
        currentComments.some(
          (comment) =>
            !confirmed.comments.some(
              (savedComment) =>
                savedComment.id === comment.id &&
                savedComment.text === comment.text &&
                savedComment.photoId === comment.photoId,
            ),
        )
      )
        throw new Error(
          "The service did not confirm your comments. Your draft is still unsaved.",
        );
      if (finish && !confirmed.completed)
        throw new Error(
          "Your workspace was saved, but completion was not confirmed. Please retry.",
        );
      setSaved(true);
      setDirty(false);
      setCompleted(confirmed.completed);
      setMessage(
        finish
          ? "Your workspace is ready and saved to your account."
          : "Your workspace and photos are saved to your account.",
      );
    } catch (cause) {
      setDirty(true);
      fail(cause);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    try {
      await authApi.logout();
      window.location.assign("/login");
    } catch (cause) {
      fail(cause);
      setBusy(false);
    }
  }

  if (sessionIssue)
    return (
      <main className="mx-auto max-w-md px-6 py-32">
        <ShieldCheck className="mb-5 text-pink-500" size={32} />
        <h1 className="text-2xl font-semibold">Let’s check your session</h1>
        <p className="my-4 text-slate-500">
          Your workspace is hidden until your connection and session are
          verified.
        </p>
        <Button onClick={() => window.location.reload()}>Verify again</Button>
      </main>
    );
  const StepIcon = steps[step].icon;
  return (
    <MotionConfig reducedMotion="user">
      <div className="workspace-shell relative h-dvh overflow-hidden bg-[#faf9fc] text-slate-800">
        <div className="h-full w-full">
          <header className="absolute top-3 right-3 left-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur sm:top-5 sm:right-5 sm:left-5 sm:px-4">
            <div className="flex items-center gap-2 text-xs">
              <Layers2 size={17} className="text-pink-600" />
              <span className="hidden text-slate-400 sm:inline">
                My workspace
              </span>
              <ChevronRight size={13} className="text-slate-300" />
              <h1 className="font-medium">Your canvas</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => requestComment()}
                aria-label="Add canvas comment"
              >
                <MessageSquare size={15} />
                <span className="hidden md:inline">Comment</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setStep(1);
                  setSetupOpen(true);
                }}
              >
                <UserRound size={14} />
                <span className="sr-only sm:not-sr-only">Personalize</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setStep(2);
                  setSetupOpen(true);
                }}
              >
                <Plus size={14} />
                Photos
              </Button>
              <span
                className={`hidden items-center gap-1.5 text-[11px] sm:flex ${saved && !dirty ? "text-emerald-600" : "text-slate-400"}`}
              >
                {saved && !dirty ? <Cloud size={14} /> : <CloudOff size={14} />}
                {saved && !dirty
                  ? "Saved"
                  : storage === "missing"
                    ? "Preview only"
                    : "Unsaved draft"}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={busy || storage !== "ready"}
                onClick={() => {
                  setSetupOpen(true);
                  void save();
                }}
              >
                <Save size={13} />
                Save
              </Button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void logout()}
                aria-label="Log out"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              >
                <LogOut size={15} />
              </button>
            </div>
          </header>
          <main className="h-full w-full">
            <section
              aria-label="Your visual workspace"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (event.dataTransfer.files.length)
                  void addPhotos(Array.from(event.dataTransfer.files));
              }}
              className="relative h-full w-full"
            >
              <div className="h-full w-full">
                <WorkspaceCanvas
                  displayName={displayName}
                  avatarId={avatarId}
                  folders={folders}
                  photos={photos}
                  positions={positions}
                  edges={edges}
                  onPositions={(value) => {
                    setPositions(value);
                    changed();
                  }}
                  onEdges={(value) => {
                    setEdges(value);
                    changed();
                  }}
                  onOpen={openGallery}
                  comments={comments}
                  email={email}
                  onComment={requestComment}
                  onDeleteComment={deleteComment}
                />
              </div>
            </section>
            {setupOpen && (
              <dialog
                ref={setupDialog}
                onCancel={() => setSetupOpen(false)}
                aria-label="Customize your canvas"
                className="m-auto max-h-[85dvh] w-[min(420px,92vw)] overflow-auto rounded-2xl border bg-white p-0 shadow-2xl backdrop:bg-slate-950/30"
              >
                <div className="flex justify-end px-4 pt-3">
                  <button
                    autoFocus
                    type="button"
                    aria-label="Back to canvas"
                    onClick={() => setSetupOpen(false)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                  >
                    <X size={18} />
                  </button>
                </div>
                <section
                  aria-label="Onboarding setup"
                  className="flex flex-col"
                >
                  <div className="border-b px-6 py-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400">
                        Customize your space
                      </span>
                      <span className="text-[10px] font-medium text-pink-500">
                        0{step + 1} / 04
                      </span>
                    </div>
                    <div
                      className="flex gap-1.5"
                      aria-label={`Step ${step + 1} of 4`}
                    >
                      {steps.map((_, i) => (
                        <span
                          key={i}
                          className={`h-1 flex-1 rounded-full ${i <= step ? "bg-pink-500" : "bg-slate-100"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 p-6">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, x: reduced ? 0 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: reduced ? 0 : -10 }}
                        transition={{ duration: 0.18 }}
                      >
                        <div className="mb-5 grid size-11 place-content-center rounded-xl border border-pink-100 bg-pink-50 text-pink-500">
                          <StepIcon size={21} strokeWidth={1.7} />
                        </div>
                        <h2
                          ref={stepHeading}
                          tabIndex={-1}
                          className="text-xl font-semibold tracking-tight outline-none"
                        >
                          {step === 0
                            ? "Welcome to your workspace."
                            : steps[step].title}
                        </h2>
                        <p className="mt-2 mb-7 text-xs leading-6 text-slate-500">
                          {
                            [
                              "A home for your ideas, and the moments that inspire them. Let’s make it feel like you.",
                              "Start with the little details. You can change them whenever inspiration strikes.",
                              "Bring your favorite moments along. Create folders and add your own photos.",
                              "Everything has a place. Move things around and find the connections that feel right.",
                            ][step]
                          }
                        </p>
                        {step === 0 && (
                          <div className="space-y-5">
                            {[
                              {
                                icon: UserRound,
                                title: "Make it personal",
                                text: "A name and avatar that feel like you.",
                              },
                              {
                                icon: FolderPlus,
                                title: "Bring your inspiration",
                                text: "Your photos, neatly tucked into folders.",
                              },
                              {
                                icon: Workflow,
                                title: "See the bigger picture",
                                text: "A canvas that grows with your ideas.",
                              },
                            ].map((item, index) => (
                              <motion.div
                                key={item.title}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{
                                  delay: reduced ? 0 : index * 0.08,
                                }}
                                className="flex gap-3"
                              >
                                <div className="grid size-8 shrink-0 place-content-center rounded-lg border text-slate-400">
                                  <item.icon size={15} />
                                </div>
                                <div>
                                  <h3 className="text-xs font-medium">
                                    {item.title}
                                  </h3>
                                  <p className="mt-1 text-[11px] leading-5 text-slate-400">
                                    {item.text}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                            <p className="pt-4 text-[11px] text-slate-400">
                              About 2 minutes. Entirely your own.
                            </p>
                          </div>
                        )}
                        {step === 1 && (
                          <div className="space-y-6">
                            <div>
                              <Label htmlFor="display-name">
                                What should we call you?
                              </Label>
                              <Input
                                id="display-name"
                                placeholder="Your display name"
                                value={displayName}
                                maxLength={50}
                                disabled={busy}
                                onChange={(event) => {
                                  setDisplayName(event.target.value);
                                  changed();
                                  setProfileError("");
                                }}
                                className="mt-2 h-11"
                                aria-invalid={!!profileError}
                                aria-describedby={
                                  profileError ? "profile-error" : undefined
                                }
                              />
                              {profileError && (
                                <p
                                  id="profile-error"
                                  role="alert"
                                  className="mt-2 text-xs text-red-600"
                                >
                                  {profileError}
                                </p>
                              )}
                            </div>
                            <fieldset disabled={busy}>
                              <legend className="mb-3 text-xs font-medium">
                                Pick your avatar color
                              </legend>
                              <div className="flex gap-3">
                                {(
                                  Object.keys(
                                    avatars,
                                  ) as (keyof typeof avatars)[]
                                ).map((color) => (
                                  <button
                                    type="button"
                                    key={color}
                                    aria-label={`${color} avatar`}
                                    aria-pressed={avatarId === color}
                                    onClick={() => {
                                      setAvatarId(color);
                                      changed();
                                    }}
                                    className={`relative grid size-12 place-content-center rounded-2xl text-sm font-medium ${avatars[color]} ${avatarId === color ? "ring-2 ring-pink-500 ring-offset-2" : "hover:ring-2 hover:ring-slate-100"}`}
                                  >
                                    {(displayName || "You")
                                      .slice(0, 2)
                                      .toUpperCase()}
                                    {avatarId === color && (
                                      <span className="absolute -right-1 -bottom-1 rounded-full bg-pink-500 p-0.5 text-white">
                                        <Check size={10} />
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                              <p className="mt-4 text-[11px] text-slate-400">
                                Your initials, with a little personality.
                              </p>
                            </fieldset>
                          </div>
                        )}
                        {step === 2 && (
                          <div className="space-y-5">
                            <div>
                              <Label htmlFor="photo-folder">
                                Add photos to
                              </Label>
                              <select
                                id="photo-folder"
                                value={selectedFolder}
                                disabled={busy}
                                onChange={(event) =>
                                  setSelectedFolder(event.target.value)
                                }
                                className="mt-2 h-10 w-full rounded-lg border bg-white px-3 text-sm"
                              >
                                {folders.map((folder) => (
                                  <option key={folder.id} value={folder.id}>
                                    {folder.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                aria-label="New folder name"
                                placeholder="New folder name"
                                value={folderName}
                                maxLength={40}
                                disabled={busy}
                                onChange={(event) =>
                                  setFolderName(event.target.value)
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    addFolder();
                                  }
                                }}
                              />
                              <Button
                                aria-label="Create folder"
                                variant="outline"
                                disabled={busy || folders.length >= 12}
                                onClick={addFolder}
                              >
                                <Plus size={16} />
                              </Button>
                            </div>
                            <div
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) => {
                                event.preventDefault();
                                void addPhotos(
                                  Array.from(event.dataTransfer.files),
                                );
                              }}
                              className="rounded-xl border border-dashed border-pink-200 bg-pink-50/40 p-6 text-center"
                            >
                              <UploadCloud
                                size={26}
                                strokeWidth={1.5}
                                className="mx-auto mb-3 text-pink-500"
                              />
                              <p className="text-xs font-medium">
                                Drop a little inspiration here
                              </p>
                              <p className="mt-1 text-[11px] text-slate-400">
                                JPEG, PNG, or WebP · up to 5 MB each
                              </p>
                              <input
                                ref={input}
                                id="photo-upload"
                                type="file"
                                multiple
                                accept={imageTypes.join(",")}
                                className="sr-only"
                                disabled={busy}
                                onChange={(event) =>
                                  void addPhotos(
                                    Array.from(event.target.files || []),
                                  )
                                }
                                aria-label="Choose photos"
                              />
                              <Button
                                variant="outline"
                                className="mt-4 bg-white text-xs"
                                disabled={busy || !selectedFolder}
                                onClick={() => input.current?.click()}
                              >
                                {busy ? (
                                  <LoaderCircle
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Plus size={14} />
                                )}
                                Choose photos
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {folders.map((folder) => (
                                <button
                                  key={folder.id}
                                  type="button"
                                  onClick={() => openGallery(folder.id)}
                                  className="flex w-full items-center gap-2 rounded-lg border p-3 text-left text-xs hover:bg-slate-50"
                                >
                                  <FolderPlus
                                    size={15}
                                    className="text-pink-400"
                                  />
                                  <span className="truncate">
                                    {folder.name}
                                  </span>
                                  <span className="ml-auto shrink-0 text-slate-400">
                                    {
                                      photos.filter(
                                        (photo) => photo.folderId === folder.id,
                                      ).length
                                    }{" "}
                                    photos
                                  </span>
                                  <ChevronRight size={12} />
                                </button>
                              ))}
                            </div>
                            <p className="text-[11px] leading-5 text-amber-700">
                              New photos are temporary previews until saved.
                              Leaving this page discards unsaved photos.
                            </p>
                          </div>
                        )}
                        {step === 3 && (
                          <div className="space-y-5">
                            <div className="rounded-xl border bg-slate-50/60 p-4">
                              <p className="text-xs font-medium">
                                Your space, at a glance
                              </p>
                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-2xl font-semibold text-pink-600">
                                    {folders.length}
                                  </p>
                                  <p className="mt-1 text-[11px] text-slate-400">
                                    Collections
                                  </p>
                                </div>
                                <div>
                                  <p className="text-2xl font-semibold text-pink-600">
                                    {photos.length}
                                  </p>
                                  <p className="mt-1 text-[11px] text-slate-400">
                                    Your photos
                                  </p>
                                </div>
                              </div>
                            </div>
                            <ul className="space-y-3 text-xs leading-5 text-slate-500">
                              <li>Drag cards to give everything a home.</li>
                              <li>Connect a card’s handles to link ideas.</li>
                              <li>Open a folder to see your photo gallery.</li>
                              <li>
                                Use Tab to focus a card and arrow keys to move
                                it.
                              </li>
                            </ul>
                            <Button
                              variant="outline"
                              onClick={() => openGallery("all")}
                              className="w-full"
                            >
                              <ImageIcon size={15} />
                              View all photos
                            </Button>
                            {completed && (
                              <p
                                role="status"
                                className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700"
                              >
                                Your workspace is saved and ready to explore.
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                    {error && (
                      <p
                        role="alert"
                        className="mt-5 rounded-lg border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700"
                      >
                        {error}
                      </p>
                    )}
                    {message && (
                      <p
                        role="status"
                        className="mt-5 text-xs leading-5 text-slate-500"
                      >
                        {message}
                      </p>
                    )}
                    {storage !== "ready" && (
                      <div className="mt-6 rounded-lg border border-amber-100 bg-amber-50/70 p-3 text-[11px] leading-5 text-amber-800">
                        {storage === "loading" ? (
                          "Checking saved workspace…"
                        ) : (
                          <>
                            <p className="font-medium">
                              {storage === "missing"
                                ? "Cloud storage isn’t connected yet"
                                : "Cloud storage is unavailable"}
                            </p>
                            <p>
                              You can explore and preview photos. Your changes
                              aren’t saved to your account.
                            </p>
                            <button
                              type="button"
                              className="mt-2 inline-flex items-center gap-1 underline"
                              onClick={() => void load(false)}
                            >
                              <RefreshCw size={11} />
                              Check connection
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <footer className="border-t p-6">
                    <div className="flex gap-2">
                      {step > 0 && (
                        <Button
                          aria-label="Previous step"
                          variant="outline"
                          disabled={busy || storage === "loading"}
                          onClick={() => goTo(step - 1)}
                        >
                          <ArrowLeft size={15} />
                        </Button>
                      )}
                      {step < 3 ? (
                        <Button
                          className="h-10 flex-1 bg-pink-600 text-white hover:bg-pink-700"
                          disabled={busy || storage === "loading"}
                          onClick={() => goTo(step + 1)}
                        >
                          {step === 0 ? "Let’s make it yours" : "Continue"}
                          <ArrowRight size={15} />
                        </Button>
                      ) : (
                        <Button
                          className="h-10 flex-1 bg-pink-600 text-white hover:bg-pink-700"
                          disabled={busy || storage !== "ready"}
                          onClick={() => void save(true)}
                        >
                          {busy ? (
                            <LoaderCircle size={15} className="animate-spin" />
                          ) : (
                            <Check size={15} />
                          )}
                          Finish & save workspace
                        </Button>
                      )}
                    </div>
                    <p className="mt-3 text-center text-[10px] text-slate-400">
                      {step === 3
                        ? "Saved only after confirmation from your account."
                        : "Take your time. Great things start small."}
                    </p>
                  </footer>
                </section>
              </dialog>
            )}
          </main>
        </div>
        {commentTarget !== undefined && (
          <CommentComposer
            photoName={photos.find((photo) => photo.id === commentTarget)?.name}
            onClose={() => setCommentTarget(undefined)}
            onCreate={(text) => {
              if (comments.length >= 100) {
                setError("You can add up to 100 comments.");
                setCommentTarget(undefined);
                return;
              }
              const id = crypto.randomUUID();
              const anchor = commentTarget
                ? positions[`image-${commentTarget}`]
                : undefined;
              setComments((previous) => [
                ...previous,
                {
                  id,
                  text,
                  author: email,
                  createdAt: new Date().toISOString(),
                  ...(commentTarget ? { photoId: commentTarget } : {}),
                },
              ]);
              setPositions((previous) => ({
                ...previous,
                [`comment-${id}`]: anchor
                  ? { x: anchor.x + 270, y: anchor.y }
                  : {
                      x: 70 + comments.length * 30,
                      y: 470 + comments.length * 30,
                    },
              }));
              changed();
              setCommentTarget(undefined);
            }}
          />
        )}
        {gallery && (
          <PhotoGallery
            name={
              gallery === "all"
                ? "All your photos"
                : folders.find((folder) => folder.id === gallery)?.name ||
                  "Your photos"
            }
            photos={
              gallery === "all"
                ? photos
                : photos.filter((photo) => photo.folderId === gallery)
            }
            onClose={() => setGallery(null)}
            onRemove={removePhoto}
          />
        )}
      </div>
    </MotionConfig>
  );
}
