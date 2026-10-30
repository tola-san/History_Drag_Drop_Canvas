"use client";
import { useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Panel,
  useReactFlow,
  useViewport,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  useNodesState,
  addEdge,
  applyEdgeChanges,
  type Node,
  type NodeProps,
  type Edge,
  type Connection,
} from "@xyflow/react";
import {
  ImageIcon,
  Sparkles,
  Layers2,
  Hand,
  MousePointer2,
  Minus,
  Plus,
  Maximize2,
  Pin,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { PhotoFolder } from "./photo-folder";
import {
  avatars,
  type FolderItem,
  type Photo,
  type Snapshot,
  type CanvasComment,
} from "@/lib/onboarding";
import "@xyflow/react/dist/style.css";

type CardData = {
  kind: "profile" | "folder" | "collection" | "photo" | "comment";
  title: string;
  subtitle: string;
  avatarId: keyof typeof avatars;
  photos: Photo[];
  onOpen?: () => void;
  onPin?: () => void;
  onComment?: () => void;
  onDelete?: () => void;
};
type CardNode = Node<CardData, "workspace">;
function WorkspaceCard({ data, selected }: NodeProps<CardNode>) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`workspace-node w-[228px] rounded-2xl border bg-white shadow-[0_6px_28px_-14px_#f9a8d4] ${selected ? "border-pink-500 ring-2 ring-pink-100" : "border-slate-200"}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        aria-label={`Connect to ${data.title}`}
      />
      <div className="flex items-center gap-2 border-b px-4 py-3 text-[10px] font-semibold uppercase tracking-[.13em] text-slate-400">
        {data.kind === "profile" ? (
          <Sparkles size={12} />
        ) : data.kind === "folder" ? (
          <Layers2 size={12} />
        ) : (
          <ImageIcon size={12} />
        )}
        {data.kind === "profile"
          ? "The creator"
          : data.kind === "folder"
            ? "Photo folder"
            : data.kind === "comment"
              ? "Comment"
              : data.kind === "photo"
                ? "Photo"
                : "Collection"}
        <span className="ml-auto size-1.5 rounded-full bg-pink-300" />
      </div>
      {data.kind === "comment" ? (
        <div className="rounded-b-2xl bg-pink-50/60 p-4">
          <p className="max-h-56 overflow-auto whitespace-pre-wrap break-words text-sm leading-6">
            {data.subtitle}
          </p>
          <div className="mt-4 flex items-center justify-between gap-2">
            <span className="truncate text-[10px] text-pink-700">
              {data.title}
            </span>
            {data.onDelete && (
              <button
                type="button"
                onClick={data.onDelete}
                aria-label="Remove comment"
                className="nodrag nopan rounded p-1 text-pink-400 hover:bg-pink-100"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      ) : data.kind === "photo" ? (
        <figure className="p-3">
          <img
            src={data.photos[0].url}
            alt={data.title}
            draggable={false}
            className="aspect-[4/3] w-full rounded-lg object-cover"
          />
          <figcaption className="mt-3 truncate text-xs font-medium">
            {data.title}
          </figcaption>
          <p className="mt-1 text-[10px] text-slate-400">
            Drag a side handle to connect photos
          </p>
          <button
            type="button"
            onClick={data.onComment}
            className="nodrag nopan mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-pink-100 bg-pink-50 py-2 text-xs font-medium text-pink-700"
          >
            <MessageSquare size={12} />
            Comment
          </button>
        </figure>
      ) : data.kind === "profile" ? (
        <div className="p-5">
          <div
            className={`mb-4 grid size-14 place-content-center rounded-2xl text-xl font-semibold ${avatars[data.avatarId]}`}
          >
            {data.title.slice(0, 2).toUpperCase()}
          </div>
          <h3 className="truncate font-semibold text-slate-800">
            {data.title}
          </h3>
          <p className="mt-1 truncate text-xs text-slate-400">
            {data.subtitle}
          </p>
          <span className="mt-5 inline-flex rounded-md bg-pink-50 px-2 py-1 text-[10px] font-medium text-pink-600">
            A space of your own
          </span>
        </div>
      ) : data.kind === "folder" ? (
        <div className="px-5 pb-5">
          <div className="nodrag nopan flex h-[150px] items-center justify-center">
            <PhotoFolder name={data.title} photos={data.photos} />
          </div>
          <button
            type="button"
            onClick={data.onOpen}
            className="nodrag nopan w-full rounded-md text-left"
          >
            <span className="block truncate text-sm font-semibold">
              {data.title}
            </span>
            <span className="mt-1 block text-xs text-slate-400">
              {data.photos.length} photos <span aria-hidden>↗</span> Open
              gallery
            </span>
          </button>
          <button
            type="button"
            onClick={data.onPin}
            disabled={!data.photos.length}
            className="nodrag nopan mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-pink-100 bg-pink-50 px-2 py-2 text-xs font-medium text-pink-700 hover:bg-pink-100 disabled:opacity-40"
          >
            <Pin size={12} />
            Pin photos to canvas
          </button>
        </div>
      ) : (
        <div className="p-4">
          <button
            type="button"
            onClick={data.onOpen}
            className="nodrag nopan w-full rounded-lg text-left"
          >
            <div className="mb-4 grid grid-cols-3 gap-1.5">
              {[0, 1, 2].map((index) =>
                data.photos[index] ? (
                  <img
                    key={index}
                    src={data.photos[index].url}
                    alt={data.photos[index].name}
                    className="aspect-square rounded-lg object-cover"
                  />
                ) : (
                  <div
                    key={index}
                    className="grid aspect-square place-content-center rounded-lg border border-dashed border-pink-100 bg-pink-50/50 text-pink-200"
                  >
                    <ImageIcon size={19} />
                  </div>
                ),
              )}
            </div>
            <h3 className="text-sm font-semibold">{data.title}</h3>
            <p className="mt-1 text-xs text-slate-400">{data.subtitle}</p>
          </button>
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        aria-label={`Connect from ${data.title}`}
      />
    </motion.div>
  );
}
const nodeTypes = { workspace: WorkspaceCard };
function CanvasToolbar({
  panMode,
  onPanMode,
}: {
  panMode: boolean;
  onPanMode: (pan: boolean) => void;
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();
  const reduced = useReducedMotion();
  const options = { duration: reduced ? 0 : 180 };
  const tool =
    "grid size-9 place-content-center rounded-lg text-slate-500 hover:bg-slate-100";
  return (
    <Panel position="bottom-center" className="!mb-6">
      <div
        role="toolbar"
        aria-label="Canvas tools"
        className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/40"
      >
        <button
          aria-label="Select and move cards"
          aria-pressed={!panMode}
          onClick={() => onPanMode(false)}
          className={`${tool} ${!panMode ? "!bg-pink-600 !text-white" : ""}`}
        >
          <MousePointer2 size={17} />
        </button>
        <button
          aria-label="Pan canvas"
          aria-pressed={panMode}
          onClick={() => onPanMode(true)}
          className={`${tool} ${panMode ? "!bg-pink-600 !text-white" : ""}`}
        >
          <Hand size={17} />
        </button>
        <span className="mx-1 h-6 w-px bg-slate-100" />
        <button
          aria-label="Zoom out"
          onClick={() => void zoomOut(options)}
          className={tool}
        >
          <Minus size={17} />
        </button>
        <output
          aria-label="Zoom level"
          className="w-12 text-center text-xs tabular-nums text-slate-500"
        >
          {Math.round(zoom * 100)}%
        </output>
        <button
          aria-label="Zoom in"
          onClick={() => void zoomIn(options)}
          className={tool}
        >
          <Plus size={17} />
        </button>
        <button
          aria-label="Fit all cards in view"
          onClick={() =>
            void fitView({ ...options, padding: 0.22, maxZoom: 1 })
          }
          className={tool}
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </Panel>
  );
}
export function WorkspaceCanvas({
  displayName,
  avatarId,
  folders,
  photos,
  positions,
  edges,
  onPositions,
  onEdges,
  onOpen,
  comments,
  email,
  onComment,
  onDeleteComment,
}: {
  displayName: string;
  avatarId: keyof typeof avatars;
  folders: FolderItem[];
  photos: Photo[];
  positions: Snapshot["positions"];
  edges: Edge[];
  onPositions: (positions: Snapshot["positions"]) => void;
  onEdges: (edges: Edge[]) => void;
  onOpen: (id: string) => void;
  comments: CanvasComment[];
  email: string;
  onComment: (photoId?: string) => void;
  onDeleteComment: (id: string) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CardNode>([]);
  const [panMode, setPanMode] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    const cards: CardNode[] = [
      {
        id: "profile",
        type: "workspace",
        position: positions.profile || { x: 50, y: 140 },
        data: {
          kind: "profile",
          title: displayName || "Your name here",
          subtitle: "Your creative journey starts here",
          avatarId,
          photos: [],
        },
      },
      ...folders.map((folder, index): CardNode => ({
        id: folder.id,
        type: "workspace",
        position: positions[folder.id] || {
          x: 410 + Math.floor(index / 2) * 290,
          y: 20 + (index % 2) * 300,
        },
        data: {
          kind: "folder",
          title: folder.name,
          subtitle: "",
          avatarId,
          photos: photos.filter((photo) => photo.folderId === folder.id),
          onOpen: () => onOpen(folder.id),
          onPin: () => {
            const folderPosition = positions[folder.id] || { x: 410, y: 20 };
            const pinned = Object.fromEntries(
              photos
                .filter((photo) => photo.folderId === folder.id)
                .map((photo, index) => [
                  `image-${photo.id}`,
                  positions[`image-${photo.id}`] || {
                    x: folderPosition.x + 300 + (index % 3) * 280,
                    y: folderPosition.y + Math.floor(index / 3) * 290,
                  },
                ]),
            );
            onPositions({ ...positions, ...pinned });
          },
        },
      })),
      {
        id: "collection",
        type: "workspace",
        position: positions.collection || { x: 740, y: 170 },
        data: {
          kind: "collection",
          title: "Little moments, connected.",
          subtitle: photos.length
            ? `${photos.length} photos in your space`
            : "A home for the photos you add",
          avatarId,
          photos,
          onOpen: () => onOpen("all"),
        },
      },
      ...photos
        .filter((photo) => positions[`image-${photo.id}`])
        .map((photo): CardNode => ({
          id: `image-${photo.id}`,
          type: "workspace",
          position: positions[`image-${photo.id}`],
          data: {
            kind: "photo",
            title: photo.name,
            subtitle: "",
            avatarId,
            photos: [photo],
            onComment: () => onComment(photo.id),
          },
        })),
      ...comments.map((comment, index): CardNode => ({
        id: `comment-${comment.id}`,
        type: "workspace",
        position: positions[`comment-${comment.id}`] || {
          x: 60 + index * 35,
          y: 460 + index * 25,
        },
        data: {
          kind: "comment",
          title: comment.author,
          subtitle: comment.text,
          avatarId,
          photos: [],
          onDelete:
            comment.author === email
              ? () => onDeleteComment(comment.id)
              : undefined,
        },
      })),
    ];
    setNodes((previous) =>
      cards.map((card) => ({
        ...card,
        selected: previous.find((node) => node.id === card.id)?.selected,
      })),
    );
  }, [
    displayName,
    avatarId,
    folders,
    photos,
    positions,
    onOpen,
    setNodes,
    comments,
    email,
    onComment,
    onDeleteComment,
  ]);
  function connect(connection: Connection) {
    if (connection.source !== connection.target && edges.length < 100)
      onEdges(
        addEdge(
          { ...connection, id: crypto.randomUUID(), type: "smoothstep" },
          edges,
        ),
      );
  }
  return (
    <div
      className="workspace-flow h-full min-h-[420px] w-full"
      aria-label="Interactive workspace canvas"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={(changes) => {
          onNodesChange(changes);
          const moved = changes.flatMap((change) =>
            change.type === "position" && !change.dragging && change.position
              ? [[change.id, change.position] as const]
              : [],
          );
          if (moved.length)
            onPositions({
              ...positions,
              ...Object.fromEntries(moved),
            });
        }}
        onEdgesChange={(changes) => onEdges(applyEdgeChanges(changes, edges))}
        onConnect={connect}
        onNodeDragStop={(_, __, dragged) =>
          onPositions({
            ...positions,
            ...Object.fromEntries(
              dragged.map((node) => [node.id, node.position]),
            ),
          })
        }
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: !reduced,
          style: { stroke: "#f9a8d4", strokeWidth: 1.7 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#f472b6",
            width: 18,
            height: 18,
          },
        }}
        fitView
        fitViewOptions={{ padding: 0.22, maxZoom: 0.95 }}
        minZoom={0.1}
        maxZoom={4}
        panOnScroll
        zoomOnScroll={false}
        panOnDrag={panMode ? true : [1, 2]}
        selectionOnDrag={!panMode}
        panActivationKeyCode="Space"
        deleteKeyCode={null}
        nodesConnectable
        nodesDraggable={!panMode}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#d8d5e3"
          gap={22}
          size={1.2}
        />
        <CanvasToolbar panMode={panMode} onPanMode={setPanMode} />
        <MiniMap
          pannable
          zoomable
          nodeColor="#fbcfe8"
          maskColor="rgba(248,247,252,.65)"
          className="!hidden sm:!block"
        />
      </ReactFlow>
    </div>
  );
}
