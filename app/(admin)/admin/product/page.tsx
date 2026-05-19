"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { fmtPrice } from "@/lib/format";
import type { Category, Product, PaginatedMeta, Vendor, ProductVendorEntry } from "@/lib/types";
import { cls } from "@/lib/theme";
import AdminTable from "@/components/admin/AdminTable";
import Pagination from "@/components/admin/Pagination";

interface FormState {
  name: string;
  description: string;
  categoryId: string;
  discount: string;
}

interface PendingVendor {
  vendorId: string;
  price: string;
  stock: string;
  sku: string;
}

const EMPTY: FormState = { name: "", description: "", categoryId: "", discount: "0" };
type View = "list" | "create" | "edit" | "view";
const LIST_COLUMNS = ["Product", "Category", "Price", "Stock", "Actions"];

function extractError(err: unknown): string {
  if (err instanceof Error && "response" in err) {
    const r = (err as { response?: { data?: { error?: string } } }).response;
    if (r?.data?.error) return r.data.error;
  }
  return "";
}

function XIcon() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function ImageUploadIcon() {
  return (
    <svg className="h-7 w-7 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}
function VideoUploadIcon() {
  return (
    <svg className="h-7 w-7 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}
function VideoFileIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function UrlList({
  label, urls, onChange, isImage = false,
}: {
  label: string; urls: string[]; onChange: (u: string[]) => void; isImage?: boolean;
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const t = draft.trim();
    if (!t) return;
    onChange([...urls, t]);
    setDraft("");
  }
  return (
    <div className="mb-4">
      <p className="mb-2 text-xs text-zinc-400">{label}</p>
      {urls.length > 0 && (
        <div className={isImage ? "mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4" : "mb-3 space-y-1.5"}>
          {urls.map((url, i) =>
            isImage ? (
              <div key={i} className="group relative overflow-hidden border border-zinc-200 bg-zinc-50">
                <img src={url} alt="" className="h-24 w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/200x200/f4f4f5/a1a1aa?text=Bad+URL"; }} />
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-black/50 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <input type="url" value={url}
                    onChange={(e) => { const n = [...urls]; n[i] = e.target.value; onChange(n); }}
                    className="min-w-0 flex-1 bg-transparent text-[10px] text-white outline-none" />
                  <button type="button" onClick={() => onChange(urls.filter((_, idx) => idx !== i))}
                    className="shrink-0 text-white/70 hover:text-red-400"><XIcon /></button>
                </div>
              </div>
            ) : (
              <div key={i} className="flex items-center gap-2">
                <input type="url" value={url}
                  onChange={(e) => { const n = [...urls]; n[i] = e.target.value; onChange(n); }}
                  className={`${cls.input} flex-1 py-1.5 text-xs`} />
                <button type="button" onClick={() => onChange(urls.filter((_, idx) => idx !== i))}
                  className="flex h-6 w-6 shrink-0 items-center justify-center text-zinc-400 hover:text-red-500">
                  <XIcon />
                </button>
              </div>
            )
          )}
        </div>
      )}
      <div className="flex gap-2">
        <input type="url" value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="https://..."
          className={`${cls.input} flex-1 py-1.5 text-xs`} />
        <button type="button" onClick={add}
          className="shrink-0 border border-zinc-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 transition-colors">
          Add
        </button>
      </div>
    </div>
  );
}

interface UploadZoneProps {
  label: string; accept: string; files: File[]; previews: string[];
  onChange: (f: File[]) => void; onRemove: (i: number) => void; hint?: string;
}
function UploadZone({ label, accept, files, previews, onChange, onRemove, hint }: UploadZoneProps) {
  const id = `zone-${label.replace(/\W+/g, "-").toLowerCase()}`;
  const isImage = accept.startsWith("image");
  return (
    <div>
      <p className={cls.label}>{label}</p>
      {files.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-xs text-orange-500">
            {files.length} {isImage ? "image" : "video"}{files.length > 1 ? "s" : ""} selected
          </p>
          <div className="flex flex-wrap gap-2">
            {isImage
              ? previews.map((src, i) => (
                  <div key={i} className="relative h-20 w-20 overflow-hidden border border-orange-200">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => onRemove(i)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-black/60 text-white hover:bg-red-500">
                      <XIcon />
                    </button>
                  </div>
                ))
              : files.map((f, i) => (
                  <div key={i} className="flex h-10 items-center gap-2 border border-orange-200 bg-orange-50 pl-3 pr-2">
                    <VideoFileIcon />
                    <span className="max-w-[140px] truncate text-xs font-medium text-orange-700">{f.name}</span>
                    <button type="button" onClick={() => onRemove(i)}
                      className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center bg-orange-200 text-orange-700 hover:bg-red-500 hover:text-white">
                      <XIcon />
                    </button>
                  </div>
                ))}
          </div>
        </div>
      )}
      <label htmlFor={id}
        className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center transition-colors hover:border-orange-400 hover:bg-orange-50">
        {isImage ? <ImageUploadIcon /> : <VideoUploadIcon />}
        <span className="text-sm font-medium text-zinc-600">
          {files.length > 0 ? "Add more" : "Click to add"} {isImage ? "images" : "videos"}
        </span>
        {hint && <span className="text-xs text-zinc-400">{hint}</span>}
      </label>
      <input id={id} type="file" accept={accept} multiple className="sr-only"
        onChange={(e) => { onChange(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
      {files.length > 0 && (
        <button type="button" onClick={() => onChange([])}
          className="mt-1.5 text-xs font-semibold text-red-400 hover:text-red-700">Clear</button>
      )}
    </div>
  );
}

function InlineVendorRow({
  available, busy, onAdd,
}: {
  available: Vendor[];
  busy: boolean;
  onAdd: (v: PendingVendor) => void;
}) {
  const [row, setRow] = useState<PendingVendor>({ vendorId: "", price: "", stock: "", sku: "" });
  const [rowErr, setRowErr] = useState("");

  function submit() {
    if (!row.vendorId) { setRowErr("Select a vendor"); return; }
    if (!row.price || Number(row.price) <= 0) { setRowErr("Enter a valid price"); return; }
    if (row.stock === "" || Number(row.stock) < 0) { setRowErr("Enter valid stock"); return; }
    setRowErr("");
    onAdd({ ...row });
    setRow({ vendorId: "", price: "", stock: "", sku: "" });
  }

  return (
    <div className="px-6 py-4">
      {rowErr && <p className="mb-2 text-xs font-medium text-red-500">{rowErr}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-xs text-zinc-400">Vendor *</label>
          <select value={row.vendorId}
            onChange={(e) => { setRowErr(""); setRow({ ...row, vendorId: e.target.value }); }}
            className={cls.input}>
            <option value="">Select…</option>
            {available.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Price (₹) *</label>
          <input type="number" min="0.01" step="0.01" placeholder="0.00"
            value={row.price}
            onChange={(e) => { setRowErr(""); setRow({ ...row, price: e.target.value }); }}
            className={cls.input} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Stock *</label>
          <input type="number" min="0" step="1" placeholder="0"
            value={row.stock}
            onChange={(e) => { setRowErr(""); setRow({ ...row, stock: e.target.value }); }}
            className={cls.input} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-400">SKU</label>
          <input placeholder="Optional"
            value={row.sku}
            onChange={(e) => setRow({ ...row, sku: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
            className={cls.input} />
        </div>
      </div>
      <button type="button" onClick={submit} disabled={busy}
        className="mt-3 text-xs font-semibold text-orange-500 hover:text-orange-700 disabled:opacity-40 transition-colors">
        {busy ? "Adding…" : "+ Add to vendor list"}
      </button>
    </div>
  );
}

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({ total: 0, page: 1, limit: 20, pages: 1 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<View>("list");
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);

  const [allVendors, setAllVendors] = useState<Vendor[]>([]);
  const [pendingVendors, setPendingVendors] = useState<PendingVendor[]>([]);
  const [activeVendorId, setActiveVendorId] = useState<string>("");
  const [vendorLinks, setVendorLinks] = useState<ProductVendorEntry[]>([]);
  const [vendorBusy, setVendorBusy] = useState(false);
  const [vendorError, setVendorError] = useState("");

  const [addRow, setAddRow] = useState<PendingVendor>({ vendorId: "", price: "", stock: "", sku: "" });
  const [addRowError, setAddRowError] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const urls = imageFiles.map((f) => URL.createObjectURL(f));
    setImagePreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [imageFiles]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<{ data: Product[]; meta: PaginatedMeta }>(`/product?page=${page}&limit=20`);
      setProducts(data.data);
      setMeta(data.meta);
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    api.get<{ data: Category[] }>("/category").then(({ data }) => setCategories(data.data)).catch(() => {});
    api.get<{ data: Vendor[] }>("/vendor").then(({ data }) => setAllVendors(data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (view === "list") return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setView("list"); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [view]);

  const [viewTarget, setViewTarget] = useState<Product | null>(null);

  function openView(p: Product) {
    setViewTarget(p);
    setVendorLinks([]);
    setVendorError("");
    setView("view");
    fetchVendorLinks(p.id);
  }

  const fetchVendorLinks = useCallback(async (productId: string) => {
    try {
      const { data } = await api.get<{ data: ProductVendorEntry[] }>(`/vendor/product/${productId}`);
      setVendorLinks(data.data);
    } catch { /* silent */ }
  }, []);

  function activeProductId() {
    return (view === "view" ? viewTarget?.id : editTarget?.id) ?? null;
  }

  async function activateVendor(vendorId: string) {
    const pid = activeProductId();
    if (!pid) return;
    setVendorBusy(true);
    try {
      await api.patch(`/vendor/product/${pid}/${vendorId}/activate`);
      await fetchVendorLinks(pid);
      fetchProducts();
    } catch { setVendorError("Failed to activate vendor"); }
    finally { setVendorBusy(false); }
  }

  async function removeVendorLink(vendorId: string) {
    const pid = activeProductId();
    if (!pid || !confirm("Remove this vendor from the product?")) return;
    setVendorBusy(true);
    try {
      await api.delete(`/vendor/product/${pid}/${vendorId}`);
      await fetchVendorLinks(pid);
      fetchProducts();
    } catch { setVendorError("Failed to remove vendor"); }
    finally { setVendorBusy(false); }
  }

  async function addVendorLink(v: PendingVendor) {
    const pid = activeProductId();
    if (!pid) return;
    setVendorBusy(true);
    setVendorError("");
    try {
      await api.post(`/vendor/product/${pid}`, {
        vendorId: v.vendorId, price: Number(v.price), stock: Number(v.stock),
        ...(v.sku && { sku: v.sku }),
      });
      await fetchVendorLinks(pid);
      fetchProducts();
    } catch (err) { setVendorError(extractError(err) || "Failed to add vendor"); }
    finally { setVendorBusy(false); }
  }

  function handleAddPendingVendor() {
    if (!addRow.vendorId) { setAddRowError("Select a vendor"); return; }
    if (!addRow.price || Number(addRow.price) <= 0) { setAddRowError("Enter a valid price"); return; }
    if (addRow.stock === "" || Number(addRow.stock) < 0) { setAddRowError("Enter valid stock"); return; }
    setAddRowError("");
    setPendingVendors((p) => {
      const next = [...p, { ...addRow }];
      if (next.length === 1) setActiveVendorId(addRow.vendorId);
      return next;
    });
    setAddRow({ vendorId: "", price: "", stock: "", sku: "" });
  }

  function resetMedia() {
    setImageFiles([]); setVideoFiles([]); setImagePreviews([]);
    setImageUrls([]); setVideoUrls([]);
  }

  function openCreate() {
    if (allVendors.length === 0) {
      setError("Add at least one vendor before creating a product.");
      return;
    }
    setForm(EMPTY);
    setEditTarget(null);
    setError("");
    setPendingVendors([]);
    setActiveVendorId("");
    setVendorError("");
    setAddRow({ vendorId: "", price: "", stock: "", sku: "" });
    setAddRowError("");
    resetMedia();
    setView("create");
  }

  function openEdit(p: Product) {
    setForm({ name: p.name, description: p.description ?? "", categoryId: p.categoryId, discount: String(p.discount ?? 0) });
    setEditTarget(p);
    setError("");
    setImageFiles([]); setVideoFiles([]); setImagePreviews([]);
    setImageUrls(p.images); setVideoUrls(p.videos);
    setVendorLinks([]); setVendorError("");
    setView("edit");
    fetchVendorLinks(p.id);
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (view === "create" && pendingVendors.length === 0) {
      setVendorError("Add at least one vendor before saving.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      if (form.description) fd.append("description", form.description);
      fd.append("discount", form.discount || "0");
      fd.append("stock", "0");
      fd.append("categoryId", form.categoryId);
      imageFiles.forEach((f) => fd.append("files", f));
      videoFiles.forEach((f) => fd.append("files", f));
      imageUrls.forEach((u) => fd.append("images", u));
      videoUrls.forEach((u) => fd.append("videos", u));

      if (view === "create") {
        const activeV = pendingVendors.find((v) => v.vendorId === activeVendorId) ?? pendingVendors[0];
        fd.append("price", activeV?.price || "0");
        const { data } = await api.post<{ data: { id: string } }>("/product", fd);
        const productId = data.data.id;
        const ordered = activeVendorId
          ? [...pendingVendors].sort((a, b) => (a.vendorId === activeVendorId ? -1 : b.vendorId === activeVendorId ? 1 : 0))
          : pendingVendors;
        for (const v of ordered) {
          await api.post(`/vendor/product/${productId}`, {
            vendorId: v.vendorId, price: Number(v.price), stock: Number(v.stock),
            ...(v.sku && { sku: v.sku }),
          });
        }
      } else if (editTarget) {
        const activeLink = vendorLinks.find((v) => v.isActive);
        fd.append("price", String(activeLink?.price ?? editTarget.price));
        await api.put(`/product/${editTarget.id}`, fd);
      }

      setView("list");
      fetchProducts();
    } catch (err) {
      setError(extractError(err) || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await api.delete(`/product/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setMeta((m) => ({ ...m, total: Math.max(0, m.total - 1) }));
    } catch {
      setError("Failed to delete product");
    } finally {
      setDeleting(null);
    }
  }

  const availableForAdd = allVendors.filter((v) => !pendingVendors.map((p) => p.vendorId).includes(v.id));
  const editAvailable = allVendors.filter((v) => !vendorLinks.map((l) => l.vendorId).includes(v.id));

  // ── View Drawer ─────────────────────────────────────────────────────────────
  const viewDrawer = view === "view" && viewTarget ? (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch">
      <div className="hidden flex-1 bg-black/40 sm:block" onClick={() => setView("list")} />
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-zinc-50 shadow-2xl sm:h-full sm:max-h-none sm:max-w-xl sm:rounded-none sm:border-y-0 sm:border-r-0 sm:border-l">

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-100 bg-white px-4 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Product Detail</p>
            <h2 className="mt-0.5 text-base font-extrabold tracking-tight text-zinc-900 truncate max-w-xs">{viewTarget.name}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => openEdit(viewTarget)}
              className="text-xs font-semibold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">
              Edit
            </button>
            <button type="button" onClick={() => setView("list")}
              className="text-zinc-400 hover:text-zinc-900 transition-colors" aria-label="Close">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-zinc-100">

          {/* Product info */}
          <div className="bg-white px-6 py-5 space-y-4">
            {/* Images */}
            {viewTarget.images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {viewTarget.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="h-28 w-28 shrink-0 object-cover border border-zinc-100" />
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">Category</p>
                <span className="bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">{viewTarget.category.name}</span>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">Stock</p>
                <span className={viewTarget.stock === 0 ? "font-semibold text-red-600" : viewTarget.stock < 10 ? "font-semibold text-amber-600" : "font-semibold text-zinc-900"}>
                  {viewTarget.stock === 0 ? "Out of stock" : viewTarget.stock}
                </span>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">Price (active vendor)</p>
                <span className="font-bold text-zinc-900">₹{Number(viewTarget.price).toLocaleString("en-IN")}</span>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">Discount</p>
                <span className={viewTarget.discount > 0 ? "font-semibold text-green-600" : "text-zinc-400"}>
                  {viewTarget.discount > 0 ? `${viewTarget.discount}% off` : "—"}
                </span>
              </div>
              {viewTarget.description && (
                <div className="col-span-2">
                  <p className="text-xs text-zinc-400 mb-0.5">Description</p>
                  <p className="text-zinc-700 leading-relaxed">{viewTarget.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vendor management */}
          <div className="bg-white">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Vendors</p>
              <p className="text-xs text-zinc-400">Set active vendor to update price &amp; stock</p>
            </div>

            {vendorError && (
              <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-xs text-red-600">{vendorError}</div>
            )}

            {vendorLinks.length > 0 ? (
              <div className="overflow-x-auto border-b border-zinc-100">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">
                      <th className="px-6 py-3">Vendor</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Stock</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {vendorLinks.map((v) => (
                      <tr key={v.vendorId} className={`border-b border-zinc-50 last:border-0 transition-colors ${v.isActive ? "bg-green-50/60" : "hover:bg-zinc-50/50"}`}>
                        <td className="px-6 py-3 font-semibold text-zinc-900">{v.vendor.name}</td>
                        <td className="px-4 py-3 font-medium text-zinc-700">₹{Number(v.price).toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-zinc-600">{v.stock}</td>
                        <td className="px-4 py-3">
                          {v.isActive
                            ? <span className="inline-flex items-center gap-1 bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />ACTIVE
                              </span>
                            : <button type="button" onClick={() => activateVendor(v.vendorId)} disabled={vendorBusy}
                                className="bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500 hover:bg-orange-500 hover:text-white disabled:opacity-40 transition-colors">
                                Set Active
                              </button>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!v.isActive && (
                            <button type="button" onClick={() => removeVendorLink(v.vendorId)} disabled={vendorBusy}
                              className="text-xs font-semibold text-red-400 hover:text-red-700 disabled:opacity-40 transition-colors">
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-6 py-4 text-xs text-zinc-400">No vendors linked yet.</p>
            )}

            {/* Add vendor */}
            {allVendors.filter((v) => !vendorLinks.map((l) => l.vendorId).includes(v.id)).length > 0 && (
              <InlineVendorRow
                available={allVendors.filter((v) => !vendorLinks.map((l) => l.vendorId).includes(v.id))}
                busy={vendorBusy}
                onAdd={addVendorLink}
              />
            )}
          </div>

        </div>
      </div>
    </div>
  ) : null;

  // ── Edit/Create Drawer ──────────────────────────────────────────────────────
  const isOpen = view === "create" || view === "edit";
  const drawer = isOpen ? (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch">
      <div className="hidden flex-1 bg-black/40 sm:block" onClick={() => setView("list")} />
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-zinc-50 shadow-2xl sm:h-full sm:max-h-none sm:max-w-xl sm:rounded-none sm:border-y-0 sm:border-r-0 sm:border-l">

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-zinc-100 bg-white px-4 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
              {view === "create" ? "New Product" : "Edit Product"}
            </p>
            <h2 className="mt-0.5 text-base font-extrabold tracking-tight text-zinc-900">
              {view === "create" ? "Create Product" : "Update Product"}
            </h2>
          </div>
          <button type="button" onClick={() => setView("list")}
            className="text-zinc-400 hover:text-zinc-900 transition-colors" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-zinc-100">

            {/* ── Section 1: Vendor Details ── */}
            <div className="bg-white">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Vendor Details</p>
                  <p className="mt-0.5 text-xs text-zinc-400">Active vendor sets the customer price &amp; stock.</p>
                </div>
                <span className="bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-orange-500">Required</span>
              </div>

              {vendorError && (
                <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-xs text-red-600">{vendorError}</div>
              )}

              {/* Vendor table */}
              {(view === "create" ? pendingVendors : vendorLinks).length > 0 && (
                <div className="overflow-x-auto border-b border-zinc-100">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        <th className="px-6 py-3">Vendor</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {view === "create" && pendingVendors.map((v) => {
                        const vendor = allVendors.find((av) => av.id === v.vendorId);
                        const isActive = activeVendorId ? v.vendorId === activeVendorId : v.vendorId === pendingVendors[0]?.vendorId;
                        return (
                          <tr key={v.vendorId} className={`border-b border-zinc-50 last:border-0 transition-colors ${isActive ? "bg-green-50/60" : "hover:bg-zinc-50/50"}`}>
                            <td className="px-6 py-3 font-semibold text-zinc-900">{vendor?.name ?? "—"}</td>
                            <td className="px-4 py-3 font-medium text-zinc-700">₹{Number(v.price).toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 text-zinc-600">{v.stock}</td>
                            <td className="px-4 py-3">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1.5 bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />ACTIVE
                                </span>
                              ) : (
                                <button type="button" onClick={() => setActiveVendorId(v.vendorId)}
                                  className="bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500 hover:bg-orange-500 hover:text-white transition-colors">
                                  Set Active
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button type="button"
                                onClick={() => {
                                  if (isActive) setActiveVendorId("");
                                  setPendingVendors((p) => p.filter((pv) => pv.vendorId !== v.vendorId));
                                }}
                                className="text-xs font-semibold text-red-400 hover:text-red-700 transition-colors">
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {view === "edit" && vendorLinks.map((v) => (
                        <tr key={v.vendorId} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50">
                          <td className="px-6 py-3 font-semibold text-zinc-900">{v.vendor.name}</td>
                          <td className="px-4 py-3 font-medium text-zinc-700">₹{Number(v.price).toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3 text-zinc-600">{v.stock}</td>
                          <td className="px-4 py-3">
                            {v.isActive
                              ? <span className="inline-flex items-center gap-1 bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />ACTIVE
                                </span>
                              : <button type="button" onClick={() => activateVendor(v.vendorId)} disabled={vendorBusy}
                                  className="bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500 hover:bg-orange-500 hover:text-white disabled:opacity-40 transition-colors">
                                  Set Active
                                </button>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!v.isActive && (
                              <button type="button" onClick={() => removeVendorLink(v.vendorId)} disabled={vendorBusy}
                                className="text-xs font-semibold text-red-400 hover:text-red-700 disabled:opacity-40 transition-colors">
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Inline add-vendor form (create mode) */}
              {view === "create" && availableForAdd.length > 0 && (
                <div className="px-6 py-4">
                  {addRowError && <p className="mb-2 text-xs font-medium text-red-500">{addRowError}</p>}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="mb-1 block text-xs text-zinc-400">Vendor *</label>
                      <select value={addRow.vendorId}
                        onChange={(e) => { setAddRowError(""); setAddRow({ ...addRow, vendorId: e.target.value }); }}
                        className={cls.input}>
                        <option value="">Select…</option>
                        {availableForAdd.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-400">Price (₹) *</label>
                      <input type="number" min="0.01" step="0.01" placeholder="0.00"
                        value={addRow.price}
                        onChange={(e) => { setAddRowError(""); setAddRow({ ...addRow, price: e.target.value }); }}
                        className={cls.input} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-400">Stock *</label>
                      <input type="number" min="0" step="1" placeholder="0"
                        value={addRow.stock}
                        onChange={(e) => { setAddRowError(""); setAddRow({ ...addRow, stock: e.target.value }); }}
                        className={cls.input} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-400">SKU</label>
                      <input placeholder="Optional"
                        value={addRow.sku}
                        onChange={(e) => setAddRow({ ...addRow, sku: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddPendingVendor())}
                        className={cls.input} />
                    </div>
                  </div>
                  <button type="button" onClick={handleAddPendingVendor}
                    className="mt-3 text-xs font-semibold text-orange-500 hover:text-orange-700 transition-colors">
                    + Add to vendor list
                  </button>
                </div>
              )}

              {/* Edit mode: add vendor */}
              {view === "edit" && editAvailable.length > 0 && (
                <InlineVendorRow
                  available={editAvailable}
                  busy={vendorBusy}
                  onAdd={addVendorLink}
                />
              )}

              {view === "create" && availableForAdd.length === 0 && pendingVendors.length > 0 && (
                <p className="px-6 py-3 text-xs text-zinc-400">All available vendors have been added.</p>
              )}
            </div>

            {/* ── Section 2: Product Details ── */}
            <div className="bg-white px-6 py-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">Product Details</p>
              <div className="space-y-4">
                <div>
                  <label className={cls.label}>Name *</label>
                  <input required value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={cls.input} placeholder="Product name" />
                </div>
                <div>
                  <label className={cls.label}>Description</label>
                  <textarea value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3} className={`${cls.input} resize-none`}
                    placeholder="Optional product description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={cls.label}>Category *</label>
                    <select required value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                      className={cls.input}>
                      <option value="">Select category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={cls.label}>Discount %</label>
                    <input type="number" min="0" max="100" step="0.01"
                      value={form.discount}
                      onChange={(e) => setForm({ ...form, discount: e.target.value })}
                      className={cls.input} placeholder="0" />
                    <p className="mt-1 text-xs text-zinc-400">
                      {Number(form.discount) > 0 ? `${form.discount}% off vendor price` : "No discount"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 3: Images ── */}
            <div className="bg-white px-6 py-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">Images</p>
              <UrlList label="Image URLs" urls={imageUrls} onChange={setImageUrls} isImage />
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-100" />
                <span className="text-xs text-zinc-400">or upload files</span>
                <div className="h-px flex-1 bg-zinc-100" />
              </div>
              <UploadZone label="Product Photos" accept="image/*" files={imageFiles} previews={imagePreviews}
                onChange={(f) => setImageFiles((p) => [...p, ...f])}
                onRemove={(i) => setImageFiles((p) => p.filter((_, idx) => idx !== i))}
                hint="JPG, PNG, WebP · max 50 MB each" />
            </div>

            {/* ── Section 4: Videos ── */}
            <div className="bg-white px-6 py-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">Videos</p>
              <UrlList label="Video URLs" urls={videoUrls} onChange={setVideoUrls} />
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-100" />
                <span className="text-xs text-zinc-400">or upload files</span>
                <div className="h-px flex-1 bg-zinc-100" />
              </div>
              <UploadZone label="Product Videos" accept="video/*" files={videoFiles} previews={[]}
                onChange={(f) => setVideoFiles((p) => [...p, ...f])}
                onRemove={(i) => setVideoFiles((p) => p.filter((_, idx) => idx !== i))}
                hint="MP4, MOV, WebM · max 50 MB each" />
            </div>

          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-zinc-100 bg-white px-6 py-4">
            {error && <p className={`${cls.errorBox} mb-4`}>{error}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={submitting} className={cls.btnOrange + " px-8 py-3"}>
                {submitting ? "Saving…" : view === "create" ? "Create Product" : "Save Changes"}
              </button>
              <button type="button" onClick={() => setView("list")}
                className="px-8 py-3 text-sm font-semibold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors">
                Cancel
              </button>
              {view === "create" && pendingVendors.length === 0 && (
                <p className="text-xs text-amber-600">↑ Add at least one vendor before saving</p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">Management</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-900">Products</h1>
          </div>
          <button onClick={openCreate} className={cls.btnOrange + " w-full px-5 py-2.5 sm:w-auto"}>
            + New Product
          </button>
        </div>

        {error && (
          <p className="mb-4 border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}{" "}
            {allVendors.length === 0 && (
              <a href="/admin/vendor" className="font-semibold underline hover:text-red-800">Go to Vendors →</a>
            )}
          </p>
        )}

        <AdminTable columns={LIST_COLUMNS} loading={loading} isEmpty={products.length === 0}
          empty="No products yet — create your first one">
          {products.map((p) => {
            const discPct = p.discount ?? 0;
            const finalPrice = discPct > 0 ? p.price * (1 - discPct / 100) : p.price;
            return (
              <tr key={p.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {p.images[0]
                      ? <img src={p.images[0]} alt={p.name} className="h-10 w-10 shrink-0 object-cover" />
                      : <div className="h-10 w-10 shrink-0 bg-zinc-100" />}
                    <span className="text-sm font-semibold text-zinc-900">{p.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">{p.category.name}</span>
                </td>
                <td className="px-5 py-4 text-sm font-bold text-zinc-900">
                  {discPct > 0 ? (
                    <div className="space-y-0.5">
                      <div>{fmtPrice(finalPrice)}</div>
                      <div className="text-xs font-medium text-zinc-400 line-through">{fmtPrice(p.price)}</div>
                      <div className="text-xs font-semibold text-green-600">{discPct}% off</div>
                    </div>
                  ) : (
                    fmtPrice(p.price)
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className={
                    p.stock === 0 ? "bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600"
                      : p.stock < 10 ? "bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600"
                      : "text-sm font-medium text-zinc-900"
                  }>
                    {p.stock === 0 ? "Out of stock" : p.stock < 10 ? `Low (${p.stock})` : p.stock}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-3">
                    <button onClick={() => openView(p)}
                      className="text-xs font-semibold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">
                      View
                    </button>
                    <button onClick={() => openEdit(p)}
                      className="text-xs font-semibold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                      className="text-xs font-semibold uppercase tracking-widest text-red-400 hover:text-red-700 disabled:opacity-40 transition-colors">
                      {deleting === p.id ? "…" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </AdminTable>

        <Pagination meta={meta} page={page} onPage={setPage} />
      </div>

      {viewDrawer}
      {drawer}
    </>
  );
}
