"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { fmtPrice } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

interface OrderLine {
  product: Pick<Product, "id" | "name" | "price" | "discount" | "stock" | "images">;
  quantity: number;
}

interface AddressForm {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

function extractError(err: unknown): string {
  if (err instanceof Error && "response" in err) {
    const r = (err as { response?: { data?: { error?: string } } }).response;
    if (r?.data?.error) return r.data.error;
  }
  return "Something went wrong";
}

const BLANK_ADDRESS: AddressForm = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  country: "India",
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none"
      />
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
      <span className="h-px flex-1 bg-zinc-100" />
      {children}
      <span className="h-px flex-1 bg-zinc-100" />
    </h3>
  );
}

export default function ManualOrderDrawer({ onClose, onCreated }: Props) {
  const [emailInput, setEmailInput] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "found" | "new">("idle");
  const [lookingUp, setLookingUp] = useState(false);
  const [foundUserId, setFoundUserId] = useState<string | null>(null);

  const [address, setAddress] = useState<AddressForm>(BLANK_ADDRESS);
  const [includeAddress, setIncludeAddress] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [loadingCategory, setLoadingCategory] = useState(false);

  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  const [items, setItems] = useState<OrderLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    api.get<{ data: Category[] }>("/category").then(({ data }) => {
      setCategories(Array.isArray(data.data) ? data.data : []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCategoryId) {
      setCategoryProducts([]);
      return;
    }
    setLoadingCategory(true);
    api.get<{ data: Product[] }>(`/product/category/${selectedCategoryId}?limit=50`)
      .then(({ data }) => setCategoryProducts(data.data ?? []))
      .catch(() => setCategoryProducts([]))
      .finally(() => setLoadingCategory(false));
  }, [selectedCategoryId]);

  async function lookupByEmail() {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    setLookingUp(true);
    setLookupStatus("idle");
    try {
      const { data } = await api.get<{ data: Array<{ id: string; name: string | null; phone: string | null; email?: string | null }> }>(
        `/auth/users?search=${encodeURIComponent(email)}&limit=1`
      );
      const match = data.data.find((u) => u.email === email);
      if (match) {
        setFoundUserId(match.id);
        setCustomerName(match.name ?? "");
        setCustomerPhone(match.phone ?? "");
        setAddress((prev) => ({ ...prev, name: match.name ?? prev.name }));
        setLookupStatus("found");
      } else {
        setFoundUserId(null);
        setLookupStatus("new");
      }
    } catch {
      setFoundUserId(null);
      setLookupStatus("new");
    } finally {
      setLookingUp(false);
    }
  }

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await api.get<{ data: Product[] }>(`/product?search=${encodeURIComponent(q)}&limit=8`);
      setSearchResults(data.data ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleProductSearch(value: string) {
    setProductSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchProducts(value), 300);
  }

  function addProduct(product: Product) {
    setItems((prev) => {
      const existing = prev.find((e) => e.product.id === product.id);
      if (existing) {
        return prev.map((e) => e.product.id === product.id ? {
          ...e,
          quantity: Math.min(e.quantity + 1, product.stock),
        } : e);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setProductSearch("");
    setSearchResults([]);
  }

  function setQty(productId: string, qty: number) {
    if (qty < 1) {
      setItems((prev) => prev.filter((e) => e.product.id !== productId));
      return;
    }
    setItems((prev) => prev.map((e) => e.product.id === productId ? {
      ...e,
      quantity: Math.min(qty, e.product.stock),
    } : e));
  }

  const subtotal = items.reduce((sum, entry) => sum + entry.product.price * entry.quantity, 0);
  const discountAmount = items.reduce((sum, entry) => {
    const unitDiscount = Math.min(Math.max(0, entry.product.discount), entry.product.price);
    return sum + unitDiscount * entry.quantity;
  }, 0);
  const total = Math.max(0, subtotal - discountAmount);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Add at least one product");
      return;
    }

    const email = emailInput.trim().toLowerCase();
    if (!email) {
      setError("Customer email is required");
      return;
    }

    if (includeAddress && (!address.name || !address.line1 || !address.city || !address.state || !address.zip)) {
      setError("Fill in all required address fields");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/order/manual", {
        ...(foundUserId ? { userId: foundUserId } : {}),
        customerEmail: email,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        ...(includeAddress ? {
          address: {
            name: address.name,
            phone: address.phone || undefined,
            line1: address.line1,
            line2: address.line2 || undefined,
            city: address.city,
            state: address.state,
            zip: address.zip,
            country: address.country || "India",
          },
        } : {}),
        items: items.map((entry) => ({ productId: entry.product.id, quantity: entry.quantity })),
      });
      onCreated();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch">
      <div className="hidden flex-1 bg-black/40 sm:block" onClick={onClose} />
      <div className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl sm:h-full sm:max-h-none sm:max-w-lg sm:rounded-none sm:border-y-0 sm:border-r-0 sm:border-l">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Admin</p>
            <h2 className="mt-0.5 text-base font-extrabold tracking-tight text-zinc-900">New Manual Order</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 transition-colors hover:text-zinc-900" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <div>
              <SectionHeading>Customer</SectionHeading>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => { setEmailInput(e.target.value); setLookupStatus("idle"); }}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), lookupByEmail())}
                      placeholder="customer@example.com"
                      className="min-w-0 flex-1 border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={lookupByEmail}
                      disabled={lookingUp || !emailInput.trim()}
                      className="shrink-0 border border-zinc-200 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900 disabled:opacity-40"
                    >
                      {lookingUp ? "..." : "Lookup"}
                    </button>
                  </div>
                  {lookupStatus === "found" && <p className="mt-1.5 text-xs font-medium text-emerald-600">Existing customer found</p>}
                  {lookupStatus === "new" && <p className="mt-1.5 text-xs font-medium text-orange-500">New customer will be created</p>}
                </div>
                <Field label="Full Name" value={customerName} onChange={setCustomerName} placeholder="Jane Doe" />
                <Field label="Phone" value={customerPhone} onChange={setCustomerPhone} placeholder="+91 98765 43210" type="tel" />
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <SectionHeading>Delivery Address</SectionHeading>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-zinc-500">
                  <input
                    type="checkbox"
                    checked={includeAddress}
                    onChange={(e) => setIncludeAddress(e.target.checked)}
                    className="h-3.5 w-3.5 accent-orange-500"
                  />
                  Include
                </label>
              </div>
              {includeAddress && (
                <div className="space-y-3">
                  <Field label="Recipient Name" required value={address.name} onChange={(v) => setAddress((a) => ({ ...a, name: v }))} />
                  <Field label="Phone" value={address.phone} onChange={(v) => setAddress((a) => ({ ...a, phone: v }))} type="tel" />
                  <Field label="Address Line 1" required value={address.line1} onChange={(v) => setAddress((a) => ({ ...a, line1: v }))} />
                  <Field label="Address Line 2" value={address.line2} onChange={(v) => setAddress((a) => ({ ...a, line2: v }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="City" required value={address.city} onChange={(v) => setAddress((a) => ({ ...a, city: v }))} />
                    <Field label="State" required value={address.state} onChange={(v) => setAddress((a) => ({ ...a, state: v }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="ZIP" required value={address.zip} onChange={(v) => setAddress((a) => ({ ...a, zip: v }))} />
                    <Field label="Country" value={address.country} onChange={(v) => setAddress((a) => ({ ...a, country: v }))} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <SectionHeading>Products</SectionHeading>
              <div className="mb-3">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-400">Filter by Category</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value);
                    setProductSearch("");
                    setSearchResults([]);
                  }}
                  className="w-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-zinc-900 focus:outline-none"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {selectedCategoryId && (
                <div className="mb-3 max-h-48 overflow-y-auto border border-zinc-100 bg-white shadow-sm">
                  {loadingCategory ? (
                    <div className="flex items-center justify-center py-5">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                    </div>
                  ) : categoryProducts.length === 0 ? (
                    <p className="py-4 text-center text-xs text-zinc-400">No products in this category</p>
                  ) : categoryProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProduct(p)}
                      disabled={p.stock === 0}
                      className="flex w-full items-center gap-3 border-b border-zinc-50 px-3 py-2.5 last:border-0 hover:bg-zinc-50 disabled:opacity-40"
                    >
                      {p.images[0] ? <img src={p.images[0]} alt={p.name} className="h-9 w-9 shrink-0 object-cover" /> : <div className="h-9 w-9 shrink-0 bg-zinc-100" />}
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-semibold text-zinc-900">{p.name}</p>
                        <p className="text-xs text-zinc-400">{fmtPrice(p.price)} · {p.stock} in stock · {p.category.name}</p>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-orange-500">+ Add</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="relative mb-3">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => handleProductSearch(e.target.value)}
                  placeholder="Search by name across all categories"
                  className="w-full border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm placeholder-zinc-400 focus:border-zinc-900 focus:outline-none"
                />
              </div>

              {(searching || searchResults.length > 0) && (
                <div className="mb-3 max-h-48 overflow-y-auto border border-zinc-100 bg-white shadow-sm">
                  {searching ? (
                    <div className="flex items-center justify-center py-4">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                    </div>
                  ) : searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProduct(p)}
                      disabled={p.stock === 0}
                      className="flex w-full items-center gap-3 border-b border-zinc-50 px-3 py-2.5 last:border-0 hover:bg-zinc-50 disabled:opacity-40"
                    >
                      {p.images[0] ? <img src={p.images[0]} alt={p.name} className="h-9 w-9 shrink-0 object-cover" /> : <div className="h-9 w-9 shrink-0 bg-zinc-100" />}
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-semibold text-zinc-900">{p.name}</p>
                        <p className="text-xs text-zinc-400">{fmtPrice(p.price)} · {p.stock} in stock · {p.category.name}</p>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-orange-500">+ Add</span>
                    </button>
                  ))}
                </div>
              )}

              {items.length === 0 ? (
                <p className="py-4 text-center text-xs text-zinc-400">No products added yet</p>
              ) : (
                <div className="space-y-2">
                  {items.map((entry) => {
                    const unitDiscount = Math.min(Math.max(0, entry.product.discount), entry.product.price);
                    const unitPrice = entry.product.price - unitDiscount;
                    return (
                      <div key={entry.product.id} className="flex items-center gap-3 border border-zinc-100 bg-zinc-50 px-3 py-2.5">
                        {entry.product.images[0] ? <img src={entry.product.images[0]} alt={entry.product.name} className="h-9 w-9 shrink-0 object-cover" /> : <div className="h-9 w-9 shrink-0 bg-zinc-200" />}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-zinc-900">{entry.product.name}</p>
                          <p className="text-xs text-zinc-400">{fmtPrice(unitPrice)} each</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setQty(entry.product.id, entry.quantity - 1)} className="flex h-6 w-6 items-center justify-center border border-zinc-200 text-sm text-zinc-600 hover:border-zinc-900">-</button>
                          <span className="w-7 text-center text-sm font-semibold">{entry.quantity}</span>
                          <button type="button" onClick={() => setQty(entry.product.id, entry.quantity + 1)} disabled={entry.quantity >= entry.product.stock} className="flex h-6 w-6 items-center justify-center border border-zinc-200 text-sm text-zinc-600 hover:border-zinc-900 disabled:opacity-30">+</button>
                        </div>
                        <span className="w-20 text-right text-sm font-bold text-zinc-900">{fmtPrice(unitPrice * entry.quantity)}</span>
                        <button type="button" onClick={() => setItems((prev) => prev.filter((e) => e.product.id !== entry.product.id))} className="shrink-0 text-zinc-300 hover:text-red-400" aria-label="Remove">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-zinc-100 bg-white px-6 py-4">
            {error && <p className="mb-3 border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
            <div className="mb-2 space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-semibold uppercase tracking-widest">Subtotal</span>
                <span>{fmtPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs font-medium text-emerald-600">
                  <span className="uppercase tracking-widest">Discount</span>
                  <span>-{fmtPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-zinc-100 pt-2">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total</span>
                <span className="text-lg font-extrabold text-zinc-900">{fmtPrice(total)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 border border-zinc-200 py-2.5 text-xs font-semibold uppercase tracking-widest text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900">Cancel</button>
              <button type="submit" disabled={submitting || items.length === 0} className="flex-1 bg-orange-500 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40">
                {submitting ? "Creating..." : "Create Order"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
