"use client";
import { CatalogPagination } from "@/components/catalog-pagination";
import { studioPageSizes, studioPageSize } from "@/lib/pagination";
import { SelectMenu } from "@/components/selection-dialog";
import { useCallback, useEffect, useState } from "react";
import {
  FileAudio2,
  FileImage,
  FileText,
  FileVideo2,
  Folder,
  FolderPlus,
  Upload,
  X,
} from "lucide-react";

type FolderItem = { id: string; name: string; _count: { assets: number } };
type Asset = {
  id: string;
  folderId: string | null;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};
type Payload = {
  folders: FolderItem[];
  assets: Asset[];
  page?: number;
  pages?: number;
};
type Filter = "any" | "image" | "audio" | "video" | "document";
const documentTypes =
  "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,application/json,application/yaml,application/xml,application/toml,text/plain,text/markdown,text/csv,text/x-python,text/javascript,text/typescript,text/html,text/css,text/x-c,text/x-c-header,text/x-c++,text/x-c++-header,text/x-shellscript,.zip,.txt,.md,.csv,.json,.yaml,.yml,.xml,.py,.js,.ts,.html,.css,.c,.h,.cpp,.hpp,.ino,.sh,.toml,.svg";
const accepted: Record<Filter, string> = {
  any: `image/jpeg,image/png,image/webp,image/gif,image/avif,${documentTypes},audio/mpeg,audio/mp4,audio/wav,audio/ogg,video/mp4,video/webm`,
  image: "image/jpeg,image/png,image/webp,image/gif,image/avif",
  audio: "audio/mpeg,audio/mp4,audio/wav,audio/ogg",
  video: "video/mp4,video/webm",
  document: documentTypes,
};
function icon(mime: string) {
  return mime.startsWith("image/") ? (
    <FileImage size={18} />
  ) : mime.startsWith("audio/") ? (
    <FileAudio2 size={18} />
  ) : mime.startsWith("video/") ? (
    <FileVideo2 size={18} />
  ) : (
    <FileText size={18} />
  );
}
function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaLibraryModal({
  open,
  filter,
  onClose,
  onSelect,
  embedded = false,
  initialFolderId,
}: {
  embedded?: boolean;
  initialFolderId?: string;
  open: boolean;
  filter: Filter;
  onClose: () => void;
  onSelect: (url: string, asset: Asset) => void;
}) {
  const [payload, setPayload] = useState<Payload>({ folders: [], assets: [] });
  const [folderId, setFolderId] = useState(
    initialFolderId ?? (embedded ? "all" : ""),
  );
  const [folderName, setFolderName] = useState("");
  const [showFolder, setShowFolder] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(
    studioPageSizes[0] as (typeof studioPageSizes)[number],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(
    async (signal?: AbortSignal) => {
      const params = new URLSearchParams();
      if (folderId) params.set("folderId", folderId);
      if (embedded) {
        if (search.trim()) params.set("q", search.trim());
        params.set("per", String(size));
        params.set("page", String(page));
      }
      try {
        const response = await fetch(`/api/admin/media?${params}`, {
          cache: "no-store",
          signal,
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error || "Could not load media.");
        if (!signal?.aborted) setPayload(body);
      } catch (reason) {
        if (!signal?.aborted)
          setError(
            reason instanceof Error ? reason.message : "Could not load media.",
          );
      }
    },
    [folderId, embedded, search, page, size],
  );
  useEffect(() => {
    if (!open) return;
    const request = new AbortController();
    setError("");
    const timer = window.setTimeout(
      () => void load(request.signal),
      embedded ? 150 : 0,
    );
    return () => {
      window.clearTimeout(timer);
      request.abort();
    };
  }, [open, embedded, load]);
  useEffect(() => {
    if (!open || embedded) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open, onClose, embedded]);
  if (!open) return null;
  const upload = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      if (folderId && folderId !== "all") form.append("folderId", folderId);
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: form,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Upload failed.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };
  const createFolder = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/media/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: folderName }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error || "Could not create folder.");
      setPayload((value) => ({
        ...value,
        folders: [...value.folders, body.folder].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      }));
      setFolderId(body.folder.id);
      setPage(1);
      setFolderName("");
      setShowFolder(false);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not create folder.",
      );
    } finally {
      setBusy(false);
    }
  };
  const assets = payload.assets.filter(
    (asset) =>
      filter === "any" ||
      (filter === "image" && asset.mimeType.startsWith("image/")) ||
      (filter === "audio" && asset.mimeType.startsWith("audio/")) ||
      (filter === "video" && asset.mimeType.startsWith("video/")) ||
      (filter === "document" &&
        !asset.mimeType.startsWith("image/") &&
        !asset.mimeType.startsWith("audio/") &&
        !asset.mimeType.startsWith("video/")),
  );
  const panel = (
    <section
      className={embedded ? "media-modal studio-file-library" : "media-modal"}
      role={embedded ? undefined : "dialog"}
      aria-modal={embedded ? undefined : true}
      aria-labelledby="media-title"
    >
      <header>
        <div>
          <h2 id="media-title">Media library</h2>
          <p>
            {embedded
              ? "Browse folders, open files, and upload new assets."
              : "Choose existing media or upload a new asset."}
          </p>
        </div>
        {!embedded && (
          <button
            type="button"
            className="media-close"
            aria-label="Close media library"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        )}
      </header>
      <div className="media-toolbar">
        {embedded && (
          <input
            className="studio-file-search"
            type="search"
            aria-label="Search files in this folder"
            placeholder="Search files…"
            maxLength={180}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        )}
        <label className="media-folder-select">
          <Folder size={16} />
          <SelectMenu
            aria-label="Choose media folder"
            value={folderId}
            onChange={(event) => {
              setFolderId(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Unfiled</option>
            <option value="all">All media</option>
            {payload.folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name} ({folder._count.assets})
              </option>
            ))}
          </SelectMenu>
        </label>
        {embedded && (
          <label className="studio-page-size">
            <SelectMenu
              value={String(size)}
              onChange={(event) => {
                setSize(studioPageSize(event.target.value));
                setPage(1);
              }}
            >
              {studioPageSizes.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </SelectMenu>
          </label>
        )}
        <button
          type="button"
          className="button button-outline"
          onClick={() => setShowFolder((value) => !value)}
        >
          <FolderPlus size={15} />
          New folder
        </button>
        <label
          className={`button button-dark media-upload${busy ? " is-disabled" : ""}`}
        >
          <Upload size={15} />
          {busy ? "Uploading…" : "Upload files"}
          <input
            type="file"
            accept={accepted[filter]}
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      {folderId === "all" && (
        <p className="media-inline-note">
          Uploads go to Unfiled while viewing all media.
        </p>
      )}
      {showFolder && (
        <form className="media-folder-form" onSubmit={createFolder}>
          <input
            autoFocus
            aria-label="New folder name"
            maxLength={80}
            required
            placeholder="e.g. Course audio"
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
          />
          <button type="submit" className="button button-dark" disabled={busy}>
            Create folder
          </button>
        </form>
      )}
      <p className="media-public-warning">
        Files stay private in S3. Learners receive short-lived links only when
        the resource or purchase grants access.
      </p>
      {error && (
        <p className="admin-alert" role="alert">
          {error}
        </p>
      )}
      <div className="media-assets" aria-live="polite">
        {assets.length ? (
          assets.map((asset) => (
            <button
              className="media-asset"
              type="button"
              key={asset.id}
              onClick={() => onSelect(`/api/media/${asset.id}`, asset)}
            >
              <span className="media-file-icon">{icon(asset.mimeType)}</span>
              <span className="media-file-copy">
                <strong title={asset.originalName}>{asset.originalName}</strong>
                <small>
                  {formatSize(asset.sizeBytes)} ·{" "}
                  {asset.mimeType.split("/")[1]?.toUpperCase()}
                </small>
              </span>
              {asset.mimeType.startsWith("image/") && (
                <img
                  src={`/api/media/${asset.id}`}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              )}
              {asset.mimeType.startsWith("video/") && (
                <video muted preload="none" src={`/api/media/${asset.id}`} />
              )}
              <span className="media-use">{embedded ? "Open" : "Use"}</span>
            </button>
          ))
        ) : (
          <div className="media-empty">
            <Folder size={24} />
            <p>No matching files in this folder yet.</p>
            <small>
              Upload an image, document, archive, text/source, audio or video
              file to get started.
            </small>
          </div>
        )}
      </div>
      {embedded && (
        <CatalogPagination
          page={payload.page ?? 1}
          pages={payload.pages ?? 1}
          onPage={setPage}
          label="Media files pages"
        />
      )}
      <footer>
        <span>
          Images, documents, ZIP archives, text/source, audio and video · up to
          50 MB
        </span>
        {!embedded && (
          <button
            type="button"
            className="button button-outline"
            onClick={onClose}
          >
            Done
          </button>
        )}
      </footer>
    </section>
  );
  return embedded ? (
    panel
  ) : (
    <div
      className="media-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {panel}
    </div>
  );
}
