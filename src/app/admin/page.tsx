"use client";
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "@/components/navbar";
import { fetchJSON } from "@/lib/fetcher";

type ApiResponse<T> = { results: T[] };
type Category = { id: number; name: string; slug: string; image_url?: string };
type Product = { id: number; name: string; price: number; image_url: string; category_id: number; description: string };
type Banner = { id: number; image_url: string; heading: string; button_text: string; sort_order: number; link_to?: string };
type OrderItem = { id: number; product_name: string; price: number; quantity: number };
type Order = { id: number; user_name: string; user_email: string; address: string; city: string; phone: string; total: number; status: string; created_at: string; items: OrderItem[] };
type CarouselItem = { id: number; image_url: string; link_type: string; link_value: string; sort_order: number };
type Toast = { id: number; type: "success" | "error" | "info"; message: string };
type ConfirmState = { open: boolean; message: string; onConfirm: () => void };
type EditProductState = {
  open: boolean; product: Product | null;
  name: string; price: string; description: string; category_id: string;
  newImages: File[]; newImagePreviews: string[]; saving: boolean;
};

const STATUS_META: Record<string, { color: string; bg: string; border: string }> = {
  pending:   { color: "#e8a838", bg: "rgba(232,168,56,0.12)",  border: "rgba(232,168,56,0.3)"  },
  confirmed: { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.3)"  },
  shipped:   { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)" },
  delivered: { color: "#7c9e87", bg: "rgba(124,158,135,0.15)", border: "rgba(124,158,135,0.35)"},
  cancelled: { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
};

const TABS = ["categories", "products", "banners", "orders", "carousel", "settings"] as const;
type Tab = typeof TABS[number];

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>("categories");

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const toast = useCallback((type: Toast["type"], message: string) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, message: "", onConfirm: () => {} });
  const askConfirm = (message: string, onConfirm: () => void) => setConfirm({ open: true, message, onConfirm });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState("");

  /* ── Categories ── */
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState("");
  const [categoryUploading, setCategoryUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  /* ── Products ── */
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productImages, setProductImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [editModal, setEditModal] = useState<EditProductState>({
    open: false, product: null, name: "", price: "", description: "",
    category_id: "", newImages: [], newImagePreviews: [], saving: false,
  });

  /* ── Banners ── */
  const [bannerHeading, setBannerHeading] = useState("");
  const [bannerButtonText, setBannerButtonText] = useState("");
  const [bannerSortOrder, setBannerSortOrder] = useState("0");
  const [bannerLinkTo, setBannerLinkTo] = useState("");
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerUploading, setBannerUploading] = useState(false);

  /* ── Orders ── */
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [orderFilter, setOrderFilter] = useState("all");

  /* ── Carousel ── */
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [carouselImage, setCarouselImage] = useState<File | null>(null);
  const [carouselPreview, setCarouselPreview] = useState("");
  const [carouselLinkType, setCarouselLinkType] = useState<"product" | "category">("product");
  const [carouselLinkValue, setCarouselLinkValue] = useState("");
  const [carouselSortOrder, setCarouselSortOrder] = useState("0");
  const [carouselUploading, setCarouselUploading] = useState(false);

  /* ── Settings ── */
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappSaving, setWhatsappSaving] = useState(false);

  /* ── Fetchers ── */
  const fetchCategories = useCallback(async () => {
    const data = await fetchJSON<ApiResponse<Category>>("/api/categories");
    setCategories(data.results || []);
  }, []);

  const fetchProducts = useCallback(async () => {
    const url = selectedCategory === "all" ? "/api/products" : `/api/products?category_id=${selectedCategory}`;
    const data = await fetchJSON<ApiResponse<Product>>(url);
    setProducts(data.results || []);
  }, [selectedCategory]);

  const fetchBanners = useCallback(async () => {
    const data = await fetchJSON<ApiResponse<Banner>>("/api/banners");
    setBanners(data.results || []);
  }, []);

  const fetchOrders = useCallback(async () => {
    const data = await fetchJSON<ApiResponse<Order>>("/api/orders?admin=true", { credentials: "include" });
    setOrders(data.results || []);
  }, []);

  const fetchCarousel = useCallback(async () => {
    const data = await fetchJSON<{ results: CarouselItem[] }>("/api/carousel");
    setCarouselItems(data.results || []);
  }, []);

  const fetchSettings = useCallback(async () => {
    const data = await fetchJSON<{ settings: Record<string, string> }>("/api/settings");
    if (data.settings?.whatsapp) setWhatsappNumber(data.settings.whatsapp);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchBanners(); }, [fetchBanners]);
  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { fetchCarousel(); }, [fetchCarousel]);
  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  /* ── Upload with XHR ── */
  const uploadImageWithProgress = (file: File, onProgress: (pct: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", file);
      xhr.upload.addEventListener("progress", e => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.addEventListener("load", () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.success) resolve(data.url);
          else reject(new Error(data.error || "Upload failed"));
        } catch { reject(new Error("Invalid response")); }
      });
      xhr.addEventListener("error", () => reject(new Error("Network error")));
      xhr.open("POST", "/api/upload/bannerUpload");
      xhr.send(formData);
    });
  };

  /* ── Category Actions ── */
  const addCategory = async () => {
    if (!categoryName.trim() || !categorySlug.trim()) {
      toast("error", "Please fill both Name and Slug fields."); return;
    }
    setCategoryUploading(true);
    try {
      let image_url: string | undefined;
      if (categoryImage) {
        setUploadStep("Uploading category image…");
        setUploadProgress(0);
        image_url = await uploadImageWithProgress(categoryImage, pct => setUploadProgress(pct));
        setUploadProgress(100);
      }
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName.trim(), slug: categorySlug.trim(), image_url }),
      });
      if (res.ok) {
        setCategoryName(""); setCategorySlug("");
        setCategoryImage(null); setCategoryImagePreview("");
        fetchCategories();
        toast("success", `Category "${categoryName.trim()}" added.`);
      } else { toast("error", "Failed to add category."); }
    } catch { toast("error", "Upload failed."); }
    finally { setCategoryUploading(false); setUploadProgress(0); setUploadStep(""); }
  };

  const deleteCategory = (id: number, name: string) => {
    askConfirm(`Delete category "${name}"? This cannot be undone.`, async () => {
      const res = await fetch("/api/categories", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) { fetchCategories(); toast("success", `Category "${name}" deleted.`); }
      else toast("error", "Failed to delete category.");
    });
  };

  /* ── Product Actions ── */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setProductImages(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };
  const removeImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const openEditModal = (product: Product) => {
    setEditModal({
      open: true, product,
      name: product.name, price: String(product.price),
      description: product.description || "",
      category_id: String(product.category_id),
      newImages: [], newImagePreviews: [], saving: false,
    });
  };
  const closeEditModal = () => setEditModal(prev => ({ ...prev, open: false, newImages: [], newImagePreviews: [] }));

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEditModal(prev => ({
      ...prev,
      newImages: [...prev.newImages, ...files],
      newImagePreviews: [...prev.newImagePreviews, ...files.map(f => URL.createObjectURL(f))],
    }));
  };

  const saveProductEdit = async () => {
    if (!editModal.product) return;
    if (!editModal.name.trim() || !editModal.price || !editModal.category_id) {
      toast("error", "Please fill all required fields."); return;
    }
    setEditModal(prev => ({ ...prev, saving: true }));
    try {
      let image_url = editModal.product.image_url;
      if (editModal.newImages.length > 0) {
        setUploadStep("Uploading new image…"); setUploadProgress(0);
        image_url = await uploadImageWithProgress(editModal.newImages[0], pct => setUploadProgress(pct));
        setUploadProgress(100);
      }
      const res = await fetch("/api/products", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editModal.product.id, name: editModal.name.trim(),
          price: parseFloat(editModal.price), description: editModal.description.trim(),
          category_id: parseInt(editModal.category_id), image_url,
        }),
      });
      if (res.ok) {
        fetchProducts();
        toast("success", `"${editModal.name.trim()}" updated.`);
        closeEditModal();
      } else { toast("error", "Failed to update product."); }
    } catch { toast("error", "Update failed."); }
    finally { setEditModal(prev => ({ ...prev, saving: false })); setUploadProgress(0); setUploadStep(""); }
  };

  const addProduct = async () => {
    if (!productName.trim() || !productPrice || !productCategory) {
      toast("error", "Please fill all required fields."); return;
    }
    setUploading(true); setUploadProgress(0);
    try {
      const image_urls: string[] = [];
      const total = productImages.length;
      for (let i = 0; i < total; i++) {
        setUploadStep(total > 1 ? `Uploading image ${i + 1} of ${total}…` : "Uploading image…");
        const url = await uploadImageWithProgress(productImages[i], pct => {
          setUploadProgress(Math.round(((i * 100) + pct) / Math.max(total, 1)));
        });
        image_urls.push(url);
      }
      setUploadStep("Saving product…"); setUploadProgress(100);
      const res = await fetch("/api/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName.trim(), price: parseFloat(productPrice),
          description: productDescription.trim(),
          category_id: parseInt(productCategory), image_urls,
        }),
      });
      if (res.ok) {
        setProductName(""); setProductPrice(""); setProductDescription("");
        setProductCategory(""); setProductImages([]); setImagePreviews([]);
        fetchProducts();
        toast("success", `"${productName.trim()}" added.`);
      } else { toast("error", "Failed to save product."); }
    } catch { toast("error", "Upload failed."); }
    finally { setUploading(false); setUploadProgress(0); setUploadStep(""); }
  };

  const deleteProduct = (id: number, name: string) => {
    askConfirm(`Delete "${name}"? This cannot be undone.`, async () => {
      const res = await fetch("/api/products", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) { fetchProducts(); toast("success", "Product deleted."); }
      else toast("error", "Failed to delete product.");
    });
  };

  const copyProductLink = (id: number, name: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/products/${id}`)
      .then(() => toast("success", `Link for "${name}" copied.`))
      .catch(() => toast("error", "Failed to copy link."));
  };

  /* ── Banner Actions ── */
  const addBanner = async () => {
    if (!bannerHeading.trim() || !bannerButtonText.trim() || !bannerImage) {
      toast("error", "Please fill all fields and select an image."); return;
    }
    setBannerUploading(true); setUploadProgress(0); setUploadStep("Uploading banner image…");
    try {
      const image_url = await uploadImageWithProgress(bannerImage, pct => setUploadProgress(pct));
      setUploadStep("Saving banner…"); setUploadProgress(100);
      const res = await fetch("/api/banners", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url, heading: bannerHeading.trim(), button_text: bannerButtonText.trim(),
          sort_order: parseInt(bannerSortOrder) || 0,
          link_to: bannerLinkTo.trim() || null,
        }),
      });
      if (res.ok) {
        setBannerHeading(""); setBannerButtonText(""); setBannerSortOrder("0");
        setBannerLinkTo(""); setBannerImage(null); setBannerPreview("");
        fetchBanners(); toast("success", "Banner added.");
      } else { toast("error", "Failed to save banner."); }
    } catch { toast("error", "Banner upload failed."); }
    finally { setBannerUploading(false); setUploadProgress(0); setUploadStep(""); }
  };

  const deleteBanner = (id: number, heading: string) => {
    askConfirm(`Delete banner "${heading}"?`, async () => {
      const res = await fetch("/api/banners", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) { fetchBanners(); toast("success", "Banner deleted."); }
      else toast("error", "Failed to delete banner.");
    });
  };

  /* ── Order Actions ── */
  const updateOrderStatus = async (orderId: number, status: string) => {
    const res = await fetch("/api/orders", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ id: orderId, status }),
    });
    if (res.ok) { fetchOrders(); toast("success", `Order #${String(orderId).padStart(6, "0")} marked as ${status}.`); }
    else toast("error", "Failed to update order status.");
  };

  const deleteOrder = (id: number) => {
    askConfirm(`Delete order #${String(id).padStart(6, "0")}? This cannot be undone.`, async () => {
      const res = await fetch("/api/orders", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ id }),
      });
      if (res.ok) { fetchOrders(); toast("success", `Order #${String(id).padStart(6, "0")} deleted.`); }
      else toast("error", "Failed to delete order.");
    });
  };

  /* ── Carousel Actions ── */
  const addCarouselItem = async () => {
    if (!carouselImage || !carouselLinkValue.trim()) {
      toast("error", "Please select an image and set a link value."); return;
    }
    setCarouselUploading(true); setUploadStep("Uploading carousel image…"); setUploadProgress(0);
    try {
      const image_url = await uploadImageWithProgress(carouselImage, pct => setUploadProgress(pct));
      setUploadProgress(100); setUploadStep("Saving…");
      const res = await fetch("/api/carousel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url, link_type: carouselLinkType,
          link_value: carouselLinkValue.trim(),
          sort_order: parseInt(carouselSortOrder) || 0,
        }),
      });
      if (res.ok) {
        setCarouselImage(null); setCarouselPreview("");
        setCarouselLinkValue(""); setCarouselSortOrder("0");
        fetchCarousel(); toast("success", "Carousel item added.");
      } else { toast("error", "Failed to add carousel item."); }
    } catch { toast("error", "Upload failed."); }
    finally { setCarouselUploading(false); setUploadProgress(0); setUploadStep(""); }
  };

  const deleteCarouselItem = (id: number) => {
    askConfirm("Delete this carousel image?", async () => {
      const res = await fetch("/api/carousel", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) { fetchCarousel(); toast("success", "Carousel item deleted."); }
      else toast("error", "Failed to delete.");
    });
  };

  /* ── Settings Actions ── */
  const saveWhatsapp = async () => {
    if (!whatsappNumber.trim()) { toast("error", "Enter a phone number."); return; }
    setWhatsappSaving(true);
    const res = await fetch("/api/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "whatsapp", value: whatsappNumber.trim() }),
    });
    setWhatsappSaving(false);
    if (res.ok) toast("success", "WhatsApp number saved.");
    else toast("error", "Failed to save.");
  };

  const isUploading = uploading || bannerUploading || editModal.saving || categoryUploading || carouselUploading;

  return (
    <>
      <Navbar />
      <style>{css}</style>

      {/* ── Toasts ── */}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span className="toast__icon">
              {t.type === "success" && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
              {t.type === "error"   && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
              {t.type === "info"    && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
            </span>
            <span className="toast__msg">{t.message}</span>
            <button className="toast__close" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        ))}
      </div>

      {/* ── Confirm Dialog ── */}
      {confirm.open && (
        <div className="confirm-overlay" onClick={() => setConfirm(c => ({ ...c, open: false }))}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <p className="confirm-msg">{confirm.message}</p>
            <div className="confirm-btns">
              <button className="adm-btn adm-btn--ghost" onClick={() => setConfirm(c => ({ ...c, open: false }))}>Cancel</button>
              <button className="adm-btn adm-btn--danger" onClick={() => { confirm.onConfirm(); setConfirm(c => ({ ...c, open: false })); }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Product Modal ── */}
      {editModal.open && (
        <div className="edit-overlay" onClick={closeEditModal}>
          <div className="edit-modal" onClick={e => e.stopPropagation()}>
            <div className="edit-modal__header">
              <div className="edit-modal__header-left">
                <div className="edit-modal__icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <div>
                  <h2 className="edit-modal__title">Edit Product</h2>
                  <p className="edit-modal__subtitle">ID #{editModal.product?.id}</p>
                </div>
              </div>
              <button className="edit-modal__close" onClick={closeEditModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="edit-modal__body">
              <div className="edit-modal__img-section">
                <div className="edit-modal__current-img-wrap">
                  {editModal.newImagePreviews.length > 0 ? (
                    <img src={editModal.newImagePreviews[0]} className="edit-modal__current-img" alt=""/>
                  ) : editModal.product?.image_url ? (
                    <img src={editModal.product.image_url} className="edit-modal__current-img" alt=""/>
                  ) : (
                    <div className="edit-modal__no-img">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                  )}
                  {editModal.newImagePreviews.length > 0 && (
                    <button className="edit-modal__img-clear"
                      onClick={() => setEditModal(prev => ({ ...prev, newImages: [], newImagePreviews: [] }))}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
                <div className="edit-modal__img-actions">
                  <p className="edit-modal__img-label">{editModal.newImagePreviews.length > 0 ? "New image selected" : "Current image"}</p>
                  <label className="adm-file-label" style={{ fontSize: "0.75rem", padding: "7px 14px" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Replace Image
                    <input type="file" accept="image/*" onChange={handleEditImageSelect} style={{ display: "none" }}/>
                  </label>
                  <p className="edit-modal__img-hint">Replaces the cover image</p>
                </div>
              </div>
              <div className="adm-stack">
                <div className="adm-row">
                  <div className="adm-field">
                    <label className="adm-label">Product Name</label>
                    <input className="adm-input" placeholder="Product name" value={editModal.name}
                      onChange={e => setEditModal(prev => ({ ...prev, name: e.target.value }))}/>
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">Price (RS)</label>
                    <input className="adm-input" type="number" placeholder="0.00" value={editModal.price}
                      onChange={e => setEditModal(prev => ({ ...prev, price: e.target.value }))}/>
                  </div>
                </div>
                <div className="adm-field">
                  <label className="adm-label">Description</label>
                  <textarea className="adm-input adm-textarea" placeholder="Product description…" value={editModal.description}
                    onChange={e => setEditModal(prev => ({ ...prev, description: e.target.value }))}/>
                </div>
                <div className="adm-field">
                  <label className="adm-label">Category</label>
                  <select className="adm-input adm-select" value={editModal.category_id}
                    onChange={e => setEditModal(prev => ({ ...prev, category_id: e.target.value }))}>
                    <option value="">Select category</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                {editModal.saving && uploadStep && (
                  <div className="adm-progress-wrap">
                    <div className="adm-progress-header">
                      <span className="adm-progress-step">{uploadStep}</span>
                      <span className="adm-progress-pct">{uploadProgress}%</span>
                    </div>
                    <div className="adm-progress-track">
                      <div className="adm-progress-fill" style={{ width: `${uploadProgress}%` }}/>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="edit-modal__footer">
              <button className="adm-btn adm-btn--ghost" onClick={closeEditModal} disabled={editModal.saving}>Cancel</button>
              <button className="adm-btn adm-btn--primary" onClick={saveProductEdit} disabled={editModal.saving}>
                {editModal.saving
                  ? <><span className="adm-spinner"/>{uploadStep || "Saving…"}</>
                  : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Global Upload Bar ── */}
      {isUploading && !editModal.open && (
        <div className="upload-bar-wrap">
          <div className="upload-bar-inner">
            <div className="upload-bar-header">
              <span className="upload-bar-step">{uploadStep}</span>
              <span className="upload-bar-pct">{uploadProgress}%</span>
            </div>
            <div className="upload-bar-track">
              <div className="upload-bar-fill" style={{ width: `${uploadProgress}%` }}/>
            </div>
          </div>
        </div>
      )}

      <div className="adm-page">
        {/* ── Header ── */}
        <div className="adm-header">
          <div>
            <span className="adm-chip">Admin Panel</span>
            <h1 className="adm-title">Dashboard</h1>
          </div>
          <div className="adm-stats">
            <div className="adm-stat"><span className="adm-stat__num">{categories.length}</span><span className="adm-stat__label">Categories</span></div>
            <div className="adm-stat"><span className="adm-stat__num">{products.length}</span><span className="adm-stat__label">Products</span></div>
            <div className="adm-stat"><span className="adm-stat__num">{orders.length}</span><span className="adm-stat__label">Orders</span></div>
            <div className="adm-stat"><span className="adm-stat__num">{carouselItems.length}</span><span className="adm-stat__label">Carousel</span></div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="adm-tabs">
          {TABS.map(tab => (
            <button key={tab} className={`adm-tab ${activeTab === tab ? "adm-tab--active" : ""}`} onClick={() => setActiveTab(tab)}>
              {tab === "categories" && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>}
              {tab === "products"   && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>}
              {tab === "banners"    && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>}
              {tab === "orders"     && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
              {tab === "carousel"   && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M17 2l5 5-5 5"/><path d="M7 2L2 7l5 5"/></svg>}
              {tab === "settings"   && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ══════════════ CATEGORIES TAB ══════════════ */}
        {activeTab === "categories" && (
          <div className="adm-section">
            <div className="adm-card">
              <h2 className="adm-card__title">Add Category</h2>
              <div className="adm-stack">
                <div className="adm-row">
                  <div className="adm-field">
                    <label className="adm-label">Name</label>
                    <input className="adm-input" placeholder="e.g. Electronics" value={categoryName}
                      onChange={e => setCategoryName(e.target.value)} onKeyDown={e => e.key === "Enter" && addCategory()}/>
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">Slug</label>
                    <input className="adm-input" placeholder="e.g. electronics" value={categorySlug}
                      onChange={e => setCategorySlug(e.target.value)} onKeyDown={e => e.key === "Enter" && addCategory()}/>
                  </div>
                </div>
                <div className="adm-field">
                  <label className="adm-label">Category Image <span className="adm-label__hint"> — shown in homepage circles</span></label>
                  <label className="adm-file-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Choose Image
                    <input type="file" accept="image/*" style={{ display: "none" }}
                      onChange={e => { const f = e.target.files?.[0] || null; setCategoryImage(f); setCategoryImagePreview(f ? URL.createObjectURL(f) : ""); }}/>
                  </label>
                  {categoryImagePreview && (
                    <div style={{ position: "relative", display: "inline-block", marginTop: 10 }}>
                      <img src={categoryImagePreview} style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)", display: "block" }} alt=""/>
                      <button onClick={() => { setCategoryImage(null); setCategoryImagePreview(""); }}
                        style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, background: "var(--danger)", color: "#fff", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>×</button>
                    </div>
                  )}
                </div>
                {categoryUploading && (
                  <div className="adm-progress-wrap">
                    <div className="adm-progress-header">
                      <span className="adm-progress-step">{uploadStep}</span>
                      <span className="adm-progress-pct">{uploadProgress}%</span>
                    </div>
                    <div className="adm-progress-track"><div className="adm-progress-fill" style={{ width: `${uploadProgress}%` }}/></div>
                  </div>
                )}
                <button className="adm-btn adm-btn--primary" onClick={addCategory} disabled={categoryUploading} style={{ alignSelf: "flex-start" }}>
                  {categoryUploading ? <><span className="adm-spinner"/>{uploadStep || "Uploading…"}</> : "Add Category"}
                </button>
              </div>
            </div>

            <div className="adm-card">
              <h2 className="adm-card__title">All Categories <span className="adm-card__count">{categories.length}</span></h2>
              {categories.length === 0 ? <p className="adm-empty">No categories yet.</p> : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead><tr><th>Image</th><th>ID</th><th>Name</th><th>Slug</th><th></th></tr></thead>
                    <tbody>
                      {categories.map(cat => (
                        <tr key={cat.id}>
                          <td>
                            {cat.image_url
                              ? <img src={cat.image_url} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} alt=""/>
                              : <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface2)", border: "1px dashed var(--border-hi)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", fontSize: 10 }}>—</div>}
                          </td>
                          <td><span className="adm-id">#{cat.id}</span></td>
                          <td>{cat.name}</td>
                          <td><code className="adm-slug">{cat.slug}</code></td>
                          <td><button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => deleteCategory(cat.id, cat.name)}>Delete</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ PRODUCTS TAB ══════════════ */}
        {activeTab === "products" && (
          <div className="adm-section">
            <div className="adm-card">
              <h2 className="adm-card__title">Add Product</h2>
              <div className="adm-stack">
                <div className="adm-row">
                  <div className="adm-field">
                    <label className="adm-label">Product Name</label>
                    <input className="adm-input" placeholder="Product name" value={productName} onChange={e => setProductName(e.target.value)}/>
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">Price (RS)</label>
                    <input className="adm-input" type="number" placeholder="0.00" value={productPrice} onChange={e => setProductPrice(e.target.value)}/>
                  </div>
                </div>
                <div className="adm-field">
                  <label className="adm-label">Description</label>
                  <textarea className="adm-input adm-textarea" placeholder="Product description..." value={productDescription} onChange={e => setProductDescription(e.target.value)}/>
                </div>
                <div className="adm-field">
                  <label className="adm-label">Category</label>
                  <select className="adm-input adm-select" value={productCategory} onChange={e => setProductCategory(e.target.value)}>
                    <option value="">Select category</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div className="adm-field">
                  <label className="adm-label">Images</label>
                  <label className="adm-file-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Choose Images
                    <input type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display: "none" }}/>
                  </label>
                  {imagePreviews.length > 0 && (
                    <div className="adm-previews">
                      {imagePreviews.map((src, i) => (
                        <div key={i} className="adm-preview">
                          <img src={src} alt=""/>
                          {i === 0 && <span className="adm-preview__badge">Cover</span>}
                          <button className="adm-preview__remove" onClick={() => removeImage(i)}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {uploading && (
                  <div className="adm-progress-wrap">
                    <div className="adm-progress-header">
                      <span className="adm-progress-step">{uploadStep}</span>
                      <span className="adm-progress-pct">{uploadProgress}%</span>
                    </div>
                    <div className="adm-progress-track"><div className="adm-progress-fill" style={{ width: `${uploadProgress}%` }}/></div>
                  </div>
                )}
                <button className="adm-btn adm-btn--primary" onClick={addProduct} disabled={uploading} style={{ alignSelf: "flex-start" }}>
                  {uploading ? <><span className="adm-spinner"/>{uploadStep || "Uploading…"}</> : "Add Product"}
                </button>
              </div>
            </div>

            <div className="adm-card">
              <div className="adm-card__titlerow">
                <h2 className="adm-card__title">Products <span className="adm-card__count">{products.length}</span></h2>
                <select className="adm-input adm-select" style={{ width: "auto" }} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                  <option value="all">All Categories</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              {products.length === 0 ? <p className="adm-empty">No products found.</p> : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead><tr><th>Image</th><th>Name</th><th>Price</th><th>Category</th><th>Link</th><th></th></tr></thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id}>
                          <td>{p.image_url ? <img src={p.image_url} className="adm-thumb" alt=""/> : <span className="adm-no-img">—</span>}</td>
                          <td>{p.name}</td>
                          <td className="adm-price">RS {p.price}</td>
                          <td><span className="adm-cat-badge">{categories.find(c => c.id === p.category_id)?.name || "—"}</span></td>
                          <td>
                            <div className="adm-link-cell">
                              <code className="adm-product-link">/products/{p.id}</code>
                              <button className="adm-link-copy-btn" onClick={() => copyProductLink(p.id, p.name)} title="Copy link">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                              </button>
                              <a className="adm-link-open-btn" href={`/products/${p.id}`} target="_blank" rel="noopener noreferrer" title="Open">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                              </a>
                            </div>
                          </td>
                          <td>
                            <div className="adm-action-btns">
                              <button className="adm-btn adm-btn--edit adm-btn--sm" onClick={() => openEditModal(p)}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                Edit
                              </button>
                              <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => deleteProduct(p.id, p.name)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ BANNERS TAB ══════════════ */}
        {activeTab === "banners" && (
          <div className="adm-section">
            <div className="adm-card">
              <h2 className="adm-card__title">Add Banner</h2>
              <p className="adm-hint">Max 4 banners. Sort Order (0–3) controls carousel position.</p>
              <div className="adm-stack">
                <div className="adm-row">
                  <div className="adm-field">
                    <label className="adm-label">Heading</label>
                    <input className="adm-input" placeholder="Banner headline" value={bannerHeading} onChange={e => setBannerHeading(e.target.value)}/>
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">Button Text</label>
                    <input className="adm-input" placeholder="e.g. Shop Now" value={bannerButtonText} onChange={e => setBannerButtonText(e.target.value)}/>
                  </div>
                </div>
                <div className="adm-row">
                  <div className="adm-field">
                    <label className="adm-label">Sort Order</label>
                    <input className="adm-input" type="number" placeholder="0 = first" value={bannerSortOrder} onChange={e => setBannerSortOrder(e.target.value)}/>
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">Link To Category <span className="adm-label__hint"> — button scrolls to section</span></label>
                    <select className="adm-input adm-select" value={bannerLinkTo} onChange={e => setBannerLinkTo(e.target.value)}>
                      <option value="">No link (decorative)</option>
                      {categories.map(cat => <option key={cat.id} value={cat.slug}>{cat.name} ({cat.slug})</option>)}
                    </select>
                  </div>
                </div>
                <div className="adm-field">
                  <label className="adm-label">Banner Image</label>
                  <label className="adm-file-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Choose Image
                    <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0] || null; setBannerImage(f); setBannerPreview(f ? URL.createObjectURL(f) : ""); }} style={{ display: "none" }}/>
                  </label>
                  {bannerPreview && <img src={bannerPreview} className="adm-banner-preview" alt=""/>}
                </div>
                {bannerUploading && (
                  <div className="adm-progress-wrap">
                    <div className="adm-progress-header">
                      <span className="adm-progress-step">{uploadStep}</span>
                      <span className="adm-progress-pct">{uploadProgress}%</span>
                    </div>
                    <div className="adm-progress-track"><div className="adm-progress-fill" style={{ width: `${uploadProgress}%` }}/></div>
                  </div>
                )}
                <button className="adm-btn adm-btn--primary" onClick={addBanner} disabled={bannerUploading} style={{ alignSelf: "flex-start" }}>
                  {bannerUploading ? <><span className="adm-spinner"/>{uploadStep || "Uploading…"}</> : "Add Banner"}
                </button>
              </div>
            </div>

            <div className="adm-card">
              <h2 className="adm-card__title">Existing Banners <span className="adm-card__count">{banners.length}/4</span></h2>
              {banners.length === 0 ? <p className="adm-empty">No banners yet.</p> : (
                <div className="adm-banner-list">
                  {banners.map(b => (
                    <div key={b.id} className="adm-banner-row">
                      <img src={b.image_url} className="adm-banner-thumb" alt=""/>
                      <div className="adm-banner-info">
                        <span className="adm-banner-heading">{b.heading}</span>
                        <div className="adm-banner-meta">
                          <span>Button: <b>{b.button_text}</b></span>
                          <span>Order: <b>{b.sort_order}</b></span>
                          {b.link_to ? <span className="adm-link-badge">→ <code>{b.link_to}</code></span> : <span className="adm-link-badge adm-link-badge--none">No link</span>}
                        </div>
                      </div>
                      <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => deleteBanner(b.id, b.heading)}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ ORDERS TAB ══════════════ */}
        {activeTab === "orders" && (
          <div className="adm-section">
            <div className="adm-card">
              <div className="adm-card__titlerow">
                <h2 className="adm-card__title">All Orders <span className="adm-card__count">{orders.length}</span></h2>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map(f => {
                    const sm = STATUS_META[f] || { color: "var(--text-2)", bg: "transparent", border: "var(--border-hi)" };
                    const isActive = orderFilter === f;
                    return (
                      <button key={f} onClick={() => setOrderFilter(f)} style={{
                        padding: "5px 14px", borderRadius: 100,
                        border: `1px solid ${isActive ? sm.border : "var(--border)"}`,
                        background: isActive ? sm.bg : "transparent",
                        color: isActive ? (f === "all" ? "var(--text)" : sm.color) : "var(--text-3)",
                        fontFamily: "'Jost', sans-serif", fontSize: "0.72rem", fontWeight: 600,
                        cursor: "pointer", letterSpacing: "0.08em", textTransform: "capitalize", transition: "all 0.15s",
                      }}>
                        {f === "all" ? "All" : f}
                        {f !== "all" && <span style={{ marginLeft: 5, opacity: 0.7 }}>{orders.filter(o => o.status === f).length}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              {(() => {
                const filtered = orderFilter === "all" ? orders : orders.filter(o => o.status === orderFilter);
                return filtered.length === 0 ? <p className="adm-empty">No {orderFilter === "all" ? "" : orderFilter} orders.</p> : (
                  <div className="adm-orders">
                    {filtered.map(order => {
                      const sm = STATUS_META[order.status] || STATUS_META.pending;
                      const open = expandedOrder === order.id;
                      return (
                        <div key={order.id} className={`adm-order ${open ? "adm-order--open" : ""}`}>
                          <button className="adm-order__head" onClick={() => setExpandedOrder(open ? null : order.id)}>
                            <div className="adm-order__id">
                              <span className="adm-order__num">#{String(order.id).padStart(6, "0")}</span>
                              <span className="adm-order__date">{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                            </div>
                            <span className="adm-order__user">{order.user_name} · {order.user_email}</span>
                            <div className="adm-order__right">
                              <span className="adm-status-pill" style={{ color: sm.color, background: sm.bg, border: `1px solid ${sm.border}` }}>{order.status}</span>
                              <span className="adm-order__total">RS {order.total.toFixed(2)}</span>
                              <span className={`adm-chevron ${open ? "adm-chevron--open" : ""}`}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                              </span>
                            </div>
                          </button>
                          <div className={`adm-order__body ${open ? "adm-order__body--open" : ""}`}>
                            <div className="adm-order__body-inner">
                              <div className="adm-order__cols">
                                <div>
                                  <div className="adm-section-label">Items</div>
                                  {order.items.map(item => (
                                    <div key={item.id} className="adm-order__item">
                                      <div className="adm-item-dot"/>
                                      <span className="adm-order__item-name">{item.product_name}</span>
                                      <span className="adm-order__item-qty">×{item.quantity}</span>
                                      <span className="adm-order__item-price">RS {(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <div className="adm-section-label">Delivery</div>
                                  <div className="adm-delivery-row">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    {order.address}, {order.city}
                                  </div>
                                  <div className="adm-delivery-row">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.64a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z"/></svg>
                                    {order.phone}
                                  </div>
                                  <div className="adm-section-label" style={{ marginTop: 20 }}>Update Status</div>
                                  <select className="adm-status-select" value={order.status}
                                    onChange={e => updateOrderStatus(order.id, e.target.value)}
                                    style={{ borderColor: sm.border, color: sm.color }}>
                                    <option value="pending">⏳ Pending</option>
                                    <option value="confirmed">✅ Confirmed</option>
                                    <option value="shipped">🚚 Shipped</option>
                                    <option value="delivered">📦 Delivered</option>
                                    <option value="cancelled">❌ Cancelled</option>
                                  </select>
                                  <div style={{ marginTop: 14 }}>
                                    <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => deleteOrder(order.id)}>
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                                      Delete Order
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ══════════════ CAROUSEL TAB ══════════════ */}
        {activeTab === "carousel" && (
          <div className="adm-section">
            <div className="adm-card">
              <h2 className="adm-card__title">Add Carousel Image</h2>
              <p className="adm-hint">Images scroll infinitely on the homepage. Each one links to a product or category page on click.</p>
              <div className="adm-stack">
                <div className="adm-field">
                  <label className="adm-label">Image</label>
                  <label className="adm-file-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Choose Image
                    <input type="file" accept="image/*" style={{ display: "none" }}
                      onChange={e => { const f = e.target.files?.[0] || null; setCarouselImage(f); setCarouselPreview(f ? URL.createObjectURL(f) : ""); }}/>
                  </label>
                  {carouselPreview && (
                    <img src={carouselPreview} style={{ marginTop: 10, width: 220, height: 140, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)" }} alt=""/>
                  )}
                </div>
                <div className="adm-row">
                  <div className="adm-field">
                    <label className="adm-label">Link Type</label>
                    <select className="adm-input adm-select" value={carouselLinkType}
                      onChange={e => setCarouselLinkType(e.target.value as "product" | "category")}>
                      <option value="product">Product (by ID)</option>
                      <option value="category">Category (by slug)</option>
                    </select>
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">{carouselLinkType === "product" ? "Product ID" : "Category Slug"}</label>
                    {carouselLinkType === "product" ? (
                      <select className="adm-input adm-select" value={carouselLinkValue} onChange={e => setCarouselLinkValue(e.target.value)}>
                        <option value="">Select product</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (#{p.id})</option>)}
                      </select>
                    ) : (
                      <select className="adm-input adm-select" value={carouselLinkValue} onChange={e => setCarouselLinkValue(e.target.value)}>
                        <option value="">Select category</option>
                        {categories.map(cat => <option key={cat.id} value={cat.slug}>{cat.name} ({cat.slug})</option>)}
                      </select>
                    )}
                  </div>
                </div>
                <div className="adm-field" style={{ maxWidth: 200 }}>
                  <label className="adm-label">Sort Order</label>
                  <input className="adm-input" type="number" value={carouselSortOrder} onChange={e => setCarouselSortOrder(e.target.value)} placeholder="0"/>
                </div>
                {carouselUploading && (
                  <div className="adm-progress-wrap">
                    <div className="adm-progress-header">
                      <span className="adm-progress-step">{uploadStep}</span>
                      <span className="adm-progress-pct">{uploadProgress}%</span>
                    </div>
                    <div className="adm-progress-track"><div className="adm-progress-fill" style={{ width: `${uploadProgress}%` }}/></div>
                  </div>
                )}
                <button className="adm-btn adm-btn--primary" onClick={addCarouselItem} disabled={carouselUploading} style={{ alignSelf: "flex-start" }}>
                  {carouselUploading ? <><span className="adm-spinner"/>{uploadStep || "Uploading…"}</> : "Add to Carousel"}
                </button>
              </div>
            </div>

            <div className="adm-card">
              <h2 className="adm-card__title">Carousel Images <span className="adm-card__count">{carouselItems.length}</span></h2>
              {carouselItems.length === 0 ? <p className="adm-empty">No carousel images yet.</p> : (
                <div className="adm-banner-list">
                  {carouselItems.map(item => (
                    <div key={item.id} className="adm-banner-row">
                      <img src={item.image_url} style={{ width: 140, height: 88, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }} alt=""/>
                      <div className="adm-banner-info">
                        <span className="adm-banner-heading" style={{ fontSize: "0.82rem" }}>
                          {item.link_type === "product" ? "→ Product" : "→ Category"}
                        </span>
                        <div className="adm-banner-meta">
                          <span>Links to: <code style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 6px", fontSize: "0.75rem", color: "var(--accent)" }}>{item.link_value}</code></span>
                          <span>Order: <b>{item.sort_order}</b></span>
                        </div>
                      </div>
                      <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => deleteCarouselItem(item.id)}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ SETTINGS TAB ══════════════ */}
        {activeTab === "settings" && (
          <div className="adm-section">
            <div className="adm-card">
              <h2 className="adm-card__title">WhatsApp Contact</h2>
              <p className="adm-hint">Enter your WhatsApp number with country code (e.g. 923001234567). This shows as a floating button on the bottom-left of the site.</p>
              <div className="adm-stack">
                <div className="adm-field" style={{ maxWidth: 340 }}>
                  <label className="adm-label">WhatsApp Number</label>
                  <input className="adm-input" placeholder="e.g. 923001234567"
                    value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && saveWhatsapp()}/>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button className="adm-btn adm-btn--primary" onClick={saveWhatsapp} disabled={whatsappSaving} style={{ alignSelf: "flex-start" }}>
                    {whatsappSaving ? <><span className="adm-spinner"/>Saving…</> : "Save Number"}
                  </button>
                  {whatsappNumber && (
                    <a href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: "0.78rem", color: "var(--accent)", textDecoration: "none" }}>
                      Test link ↗
                    </a>
                  )}
                </div>
                {whatsappNumber && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: 12 }}>
                    <div style={{ width: 42, height: 42, background: "#25D366", borderRadius: "50%", border: "2px solid #111", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", fontFamily: "'Jost', sans-serif" }}>+{whatsappNumber.replace(/[^0-9]/g, "")}</p>
                      <p style={{ fontSize: "0.72rem", color: "var(--text-3)", fontFamily: "'Jost', sans-serif" }}>Floating button active on site</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap');
  :root {
    --bg: #0f1117; --surface: #181c26; --surface2: #1e2333; --surface3: #232840;
    --border: rgba(255,255,255,0.07); --border-hi: rgba(255,255,255,0.13);
    --accent: #7c9e87; --accent-dim: rgba(124,158,135,0.15); --accent-glow: rgba(124,158,135,0.25);
    --text: #e8eaf0; --text-2: #8b9099; --text-3: #545a66;
    --danger: #f87171; --danger-dim: rgba(248,113,113,0.12);
    --edit: #60a5fa; --edit-dim: rgba(96,165,250,0.12);
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .adm-page { min-height: 100vh; background: radial-gradient(ellipse 60% 40% at 15% 0%, rgba(124,158,135,0.07) 0%, transparent 70%), radial-gradient(ellipse 40% 50% at 85% 100%, rgba(100,120,200,0.05) 0%, transparent 70%), var(--bg); padding: 88px 24px 100px; font-family: 'Jost', sans-serif; color: var(--text); }
  .toast-stack { position: fixed; bottom: 28px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; align-items: flex-end; pointer-events: none; }
  .toast { display: flex; align-items: center; gap: 10px; padding: 13px 16px; border-radius: 14px; font-family: 'Jost', sans-serif; font-size: 0.83rem; color: var(--text); backdrop-filter: blur(16px); min-width: 260px; max-width: 380px; pointer-events: all; animation: toastIn 0.3s cubic-bezier(.22,1,.36,1) both; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
  @keyframes toastIn { from { opacity: 0; transform: translateY(12px) scale(0.95); } to { opacity: 1; transform: none; } }
  .toast--success { background: rgba(124,158,135,0.18); border: 1px solid rgba(124,158,135,0.35); }
  .toast--success .toast__icon { color: var(--accent); }
  .toast--error { background: rgba(248,113,113,0.15); border: 1px solid rgba(248,113,113,0.3); }
  .toast--error .toast__icon { color: var(--danger); }
  .toast--info { background: rgba(96,165,250,0.12); border: 1px solid rgba(96,165,250,0.25); }
  .toast--info .toast__icon { color: #60a5fa; }
  .toast__icon { flex-shrink: 0; display: flex; }
  .toast__msg  { flex: 1; }
  .toast__close { flex-shrink: 0; background: none; border: none; color: var(--text-3); cursor: pointer; display: flex; align-items: center; padding: 2px; border-radius: 4px; transition: color 0.15s; }
  .toast__close:hover { color: var(--text); }
  .confirm-overlay { position: fixed; inset: 0; background: rgba(10,12,18,0.75); backdrop-filter: blur(6px); z-index: 9998; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease both; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .confirm-box { background: var(--surface); border: 1px solid var(--border-hi); border-radius: 20px; padding: 32px 28px; max-width: 380px; width: 100%; text-align: center; animation: popIn 0.25s cubic-bezier(.22,1,.36,1) both; }
  @keyframes popIn { from { opacity: 0; transform: scale(0.93); } to { opacity: 1; transform: scale(1); } }
  .confirm-icon { width: 52px; height: 52px; border-radius: 50%; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25); display: flex; align-items: center; justify-content: center; color: var(--danger); margin: 0 auto 18px; }
  .confirm-msg { font-size: 0.9rem; color: var(--text-2); line-height: 1.65; margin-bottom: 24px; font-family: 'Jost', sans-serif; }
  .confirm-btns { display: flex; gap: 10px; justify-content: center; }
  .edit-overlay { position: fixed; inset: 0; background: rgba(8,10,16,0.82); backdrop-filter: blur(8px); z-index: 9990; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease both; }
  .edit-modal { background: var(--surface); border: 1px solid var(--border-hi); border-radius: 22px; width: 100%; max-width: 560px; max-height: 90vh; display: flex; flex-direction: column; animation: popIn 0.28s cubic-bezier(.22,1,.36,1) both; box-shadow: 0 32px 80px rgba(0,0,0,0.6); overflow: hidden; }
  .edit-modal__header { display: flex; align-items: center; justify-content: space-between; padding: 22px 26px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .edit-modal__header-left { display: flex; align-items: center; gap: 14px; }
  .edit-modal__icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(96,165,250,0.12); border: 1px solid rgba(96,165,250,0.25); display: flex; align-items: center; justify-content: center; color: var(--edit); flex-shrink: 0; }
  .edit-modal__title { font-size: 1rem; font-weight: 600; color: var(--text); }
  .edit-modal__subtitle { font-size: 0.72rem; color: var(--text-3); margin-top: 2px; }
  .edit-modal__close { width: 32px; height: 32px; border-radius: 8px; background: transparent; border: 1px solid var(--border); color: var(--text-3); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .edit-modal__close:hover { color: var(--text); border-color: var(--border-hi); background: var(--surface2); }
  .edit-modal__body { overflow-y: auto; padding: 24px 26px; flex: 1; display: flex; flex-direction: column; gap: 20px; }
  .edit-modal__footer { display: flex; justify-content: flex-end; gap: 10px; padding: 18px 26px; border-top: 1px solid var(--border); flex-shrink: 0; background: var(--surface); }
  .edit-modal__img-section { display: flex; align-items: flex-start; gap: 16px; padding: 16px; background: var(--surface2); border: 1px solid var(--border); border-radius: 14px; }
  .edit-modal__current-img-wrap { position: relative; flex-shrink: 0; }
  .edit-modal__current-img { width: 100px; height: 72px; object-fit: cover; border-radius: 10px; border: 1px solid var(--border); display: block; }
  .edit-modal__no-img { width: 100px; height: 72px; border-radius: 10px; border: 1px dashed var(--border-hi); display: flex; align-items: center; justify-content: center; color: var(--text-3); }
  .edit-modal__img-clear { position: absolute; top: -8px; right: -8px; width: 20px; height: 20px; background: var(--danger); color: #fff; border: none; border-radius: 50%; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .edit-modal__img-actions { display: flex; flex-direction: column; gap: 8px; }
  .edit-modal__img-label { font-size: 0.78rem; font-weight: 500; color: var(--text-2); }
  .edit-modal__img-hint { font-size: 0.68rem; color: var(--text-3); }
  .upload-bar-wrap { position: fixed; top: 62px; left: 0; right: 0; z-index: 200; background: rgba(15,17,23,0.92); border-bottom: 1px solid var(--border); padding: 10px 24px; backdrop-filter: blur(10px); }
  .upload-bar-inner { max-width: 1000px; margin: 0 auto; }
  .upload-bar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
  .upload-bar-step { font-size: 0.75rem; color: var(--text-2); font-family: 'Jost', sans-serif; }
  .upload-bar-pct  { font-size: 0.75rem; font-weight: 600; color: var(--accent); font-family: 'Jost', sans-serif; }
  .upload-bar-track { height: 4px; background: var(--surface2); border-radius: 100px; overflow: hidden; }
  .upload-bar-fill { height: 100%; background: linear-gradient(90deg, var(--accent), #9ec4aa); border-radius: 100px; transition: width 0.25s ease; }
  .adm-progress-wrap { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }
  .adm-progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 9px; }
  .adm-progress-step { font-size: 0.75rem; color: var(--text-2); }
  .adm-progress-pct  { font-size: 0.8rem; font-weight: 700; color: var(--accent); }
  .adm-progress-track { height: 6px; background: var(--surface); border-radius: 100px; overflow: hidden; }
  .adm-progress-fill { height: 100%; border-radius: 100px; background: linear-gradient(90deg, var(--accent) 0%, #a8d4b4 100%); transition: width 0.2s ease; position: relative; overflow: hidden; }
  .adm-progress-fill::after { content: ''; position: absolute; top: 0; left: -100%; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent); animation: shimmer 1.2s ease infinite; }
  @keyframes shimmer { 0% { left: -100%; } 100% { left: 100%; } }
  .adm-header { max-width: 1000px; margin: 0 auto 32px; display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
  .adm-chip { display: inline-flex; align-items: center; padding: 4px 12px; background: var(--accent-dim); border: 1px solid rgba(124,158,135,0.3); border-radius: 100px; font-size: 0.68rem; font-weight: 500; letter-spacing: 0.12em; color: var(--accent); text-transform: uppercase; margin-bottom: 10px; }
  .adm-title { font-size: clamp(2rem, 4vw, 3rem); font-weight: 300; letter-spacing: -0.04em; color: var(--text); line-height: 1; }
  .adm-stats { display: flex; gap: 16px; flex-wrap: wrap; }
  .adm-stat { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 14px 20px; display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 80px; }
  .adm-stat__num   { font-size: 1.4rem; font-weight: 600; color: var(--text); }
  .adm-stat__label { font-size: 0.67rem; color: var(--text-3); letter-spacing: 0.1em; text-transform: uppercase; }
  .adm-tabs { max-width: 1000px; margin: 0 auto 24px; display: flex; gap: 6px; flex-wrap: wrap; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 6px; }
  .adm-tab { display: flex; align-items: center; gap: 7px; padding: 9px 18px; background: transparent; border: none; border-radius: 10px; font-family: 'Jost', sans-serif; font-size: 0.82rem; font-weight: 500; color: var(--text-3); cursor: pointer; transition: color 0.18s, background 0.18s; text-transform: capitalize; }
  .adm-tab:hover { color: var(--text-2); background: rgba(255,255,255,0.04); }
  .adm-tab--active { background: var(--surface2); color: var(--text); border: 1px solid var(--border-hi); }
  .adm-section { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
  .adm-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 28px; position: relative; overflow: hidden; }
  .adm-card::before { content: ''; position: absolute; inset: 0; border-radius: 18px; background: linear-gradient(135deg, rgba(255,255,255,0.025) 0%, transparent 50%); pointer-events: none; }
  .adm-card__title { font-size: 1rem; font-weight: 600; color: var(--text); margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
  .adm-card__titlerow { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
  .adm-card__titlerow .adm-card__title { margin-bottom: 0; }
  .adm-card__count { font-size: 0.75rem; font-weight: 400; color: var(--text-3); background: var(--surface2); border: 1px solid var(--border); border-radius: 100px; padding: 2px 10px; }
  .adm-stack { display: flex; flex-direction: column; gap: 18px; }
  .adm-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
  .adm-field { display: flex; flex-direction: column; gap: 7px; }
  .adm-label { font-size: 0.68rem; font-weight: 500; letter-spacing: 0.14em; color: var(--text-3); text-transform: uppercase; }
  .adm-label__hint { font-weight: 400; color: var(--accent); text-transform: none; letter-spacing: 0; font-size: 0.7rem; }
  .adm-input { width: 100%; padding: 11px 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; font-family: 'Jost', sans-serif; font-size: 0.88rem; font-weight: 300; color: var(--text); transition: border-color 0.2s, box-shadow 0.2s; }
  .adm-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
  .adm-input::placeholder { color: var(--text-3); }
  .adm-textarea { min-height: 90px; resize: vertical; }
  .adm-select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23545a66' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; }
  .adm-file-label { display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px; background: var(--surface2); border: 1px dashed var(--border-hi); border-radius: 10px; font-size: 0.8rem; font-weight: 500; color: var(--text-2); cursor: pointer; transition: border-color 0.2s, color 0.2s; }
  .adm-file-label:hover { border-color: var(--accent); color: var(--accent); }
  .adm-previews { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
  .adm-preview  { position: relative; border-radius: 8px; }
  .adm-preview img { width: 80px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border); display: block; }
  .adm-preview__badge { position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); font-size: 0.6rem; background: var(--accent); color: #0f1117; padding: 2px 6px; border-radius: 100px; font-weight: 600; white-space: nowrap; }
  .adm-preview__remove { position: absolute; top: -7px; right: -7px; width: 20px; height: 20px; background: var(--danger); color: #fff; border: none; border-radius: 50%; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .adm-link-cell { display: flex; align-items: center; gap: 6px; }
  .adm-product-link { background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; padding: 3px 8px; font-size: 0.72rem; color: var(--text-3); white-space: nowrap; }
  .adm-link-copy-btn, .adm-link-open-btn { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 7px; border: 1px solid var(--border); background: var(--surface2); color: var(--text-3); cursor: pointer; transition: all 0.15s; text-decoration: none; }
  .adm-link-copy-btn:hover { color: var(--accent); border-color: rgba(124,158,135,0.4); background: var(--accent-dim); }
  .adm-link-open-btn:hover { color: var(--edit); border-color: rgba(96,165,250,0.4); background: var(--edit-dim); }
  .adm-action-btns { display: flex; gap: 6px; align-items: center; }
  .adm-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px; border: none; border-radius: 100px; font-family: 'Jost', sans-serif; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.06em; cursor: pointer; transition: opacity 0.18s, transform 0.18s, box-shadow 0.18s; white-space: nowrap; }
  .adm-btn:hover:not(:disabled) { opacity: 0.82; transform: translateY(-1px); }
  .adm-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .adm-btn--primary { background: var(--accent); color: #0f1117; }
  .adm-btn--primary:hover:not(:disabled) { box-shadow: 0 6px 20px var(--accent-glow); }
  .adm-btn--danger  { background: var(--danger-dim); color: var(--danger); border: 1px solid rgba(248,113,113,0.2); }
  .adm-btn--edit    { background: var(--edit-dim); color: var(--edit); border: 1px solid rgba(96,165,250,0.2); }
  .adm-btn--ghost   { background: transparent; color: var(--text-2); border: 1px solid var(--border-hi); }
  .adm-btn--ghost:hover:not(:disabled) { color: var(--text); border-color: var(--text-2); }
  .adm-btn--sm { padding: 6px 14px; font-size: 0.72rem; }
  .adm-spinner { display: inline-block; width: 12px; height: 12px; border: 1.5px solid rgba(15,17,23,0.25); border-top-color: #0f1117; border-radius: 50%; animation: admSpin 0.65s linear infinite; flex-shrink: 0; }
  @keyframes admSpin { to { transform: rotate(360deg); } }
  .adm-hint { font-size: 0.78rem; color: var(--text-3); line-height: 1.6; margin-bottom: 20px; }
  .adm-table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid var(--border); }
  .adm-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  .adm-table thead tr { background: var(--surface2); }
  .adm-table th { padding: 11px 14px; text-align: left; font-size: 0.67rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-3); border-bottom: 1px solid var(--border); white-space: nowrap; }
  .adm-table td { padding: 11px 14px; border-bottom: 1px solid var(--border); color: var(--text-2); vertical-align: middle; }
  .adm-table tbody tr:last-child td { border-bottom: none; }
  .adm-table tbody tr:hover td { background: rgba(255,255,255,0.02); }
  .adm-id    { font-size: 0.75rem; color: var(--text-3); font-weight: 500; }
  .adm-price { font-weight: 600; color: var(--text); }
  .adm-slug  { background: var(--surface2); border: 1px solid var(--border); border-radius: 5px; padding: 2px 7px; font-size: 0.78rem; color: var(--accent); }
  .adm-no-img { color: var(--text-3); }
  .adm-thumb { width: 56px; height: 40px; object-fit: cover; border-radius: 7px; border: 1px solid var(--border); display: block; }
  .adm-cat-badge { display: inline-flex; padding: 3px 10px; background: var(--surface2); border: 1px solid var(--border); border-radius: 100px; font-size: 0.72rem; color: var(--text-2); }
  .adm-banner-list { display: flex; flex-direction: column; gap: 12px; }
  .adm-banner-row  { display: flex; align-items: center; gap: 16px; padding: 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; flex-wrap: wrap; }
  .adm-banner-thumb   { width: 110px; height: 68px; object-fit: cover; border-radius: 8px; flex-shrink: 0; border: 1px solid var(--border); }
  .adm-banner-preview { margin-top: 12px; width: 200px; height: 120px; object-fit: cover; border-radius: 10px; border: 1px solid var(--border); display: block; }
  .adm-banner-info    { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 160px; }
  .adm-banner-heading { font-weight: 600; font-size: 0.9rem; color: var(--text); }
  .adm-banner-meta    { display: flex; gap: 16px; flex-wrap: wrap; font-size: 0.75rem; color: var(--text-3); }
  .adm-banner-meta b  { color: var(--text-2); font-weight: 500; }
  .adm-link-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: var(--accent-dim); border: 1px solid rgba(124,158,135,0.25); border-radius: 100px; color: var(--accent); font-size: 0.72rem; }
  .adm-link-badge--none { background: var(--surface); border-color: var(--border); color: var(--text-3); }
  .adm-link-badge code { background: none; border: none; padding: 0; color: inherit; font-size: inherit; }
  .adm-orders { display: flex; flex-direction: column; gap: 10px; }
  .adm-order { background: var(--surface2); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; transition: border-color 0.2s; }
  .adm-order:hover { border-color: var(--border-hi); }
  .adm-order--open { border-color: var(--border-hi); }
  .adm-order__head { width: 100%; display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: transparent; border: none; cursor: pointer; text-align: left; flex-wrap: wrap; }
  .adm-order__id   { display: flex; flex-direction: column; gap: 2px; min-width: 100px; }
  .adm-order__num  { font-weight: 600; font-size: 0.9rem; color: var(--text); }
  .adm-order__date { font-size: 0.7rem; color: var(--text-3); }
  .adm-order__user { flex: 1; font-size: 0.78rem; color: var(--text-3); }
  .adm-order__right { display: flex; align-items: center; gap: 12px; margin-left: auto; }
  .adm-status-pill { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 100px; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
  .adm-order__total { font-weight: 600; font-size: 0.95rem; color: var(--text); }
  .adm-chevron { color: var(--text-3); transition: transform 0.25s; display: flex; }
  .adm-chevron--open { transform: rotate(180deg); }
  .adm-order__body { max-height: 0; overflow: hidden; transition: max-height 0.35s cubic-bezier(.22,1,.36,1); }
  .adm-order__body--open { max-height: 600px; }
  .adm-order__body-inner { padding: 20px; border-top: 1px solid var(--border); }
  .adm-order__cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .adm-section-label { font-size: 0.65rem; font-weight: 600; letter-spacing: 0.16em; color: var(--text-3); text-transform: uppercase; margin-bottom: 12px; }
  .adm-order__item { display: flex; align-items: center; gap: 9px; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 0.83rem; }
  .adm-order__item:last-child { border-bottom: none; }
  .adm-item-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); opacity: 0.6; flex-shrink: 0; }
  .adm-order__item-name  { flex: 1; color: var(--text); }
  .adm-order__item-qty   { color: var(--text-3); font-size: 0.75rem; }
  .adm-order__item-price { font-weight: 600; color: var(--text); }
  .adm-delivery-row { display: flex; align-items: flex-start; gap: 8px; font-size: 0.8rem; color: var(--text-2); padding: 7px 0; border-bottom: 1px solid var(--border); line-height: 1.5; }
  .adm-delivery-row svg { flex-shrink: 0; color: var(--text-3); margin-top: 2px; }
  .adm-status-select { padding: 9px 36px 9px 14px; background: var(--surface); border-radius: 10px; font-family: 'Jost', sans-serif; font-size: 0.82rem; font-weight: 600; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23545a66' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; transition: border-color 0.2s; }
  .adm-status-select:focus { outline: none; box-shadow: 0 0 0 3px var(--accent-glow); }
  .adm-empty { font-size: 0.85rem; color: var(--text-3); padding: 20px 0; }
  @media (max-width: 600px) {
    .adm-row { grid-template-columns: 1fr; }
    .adm-header { flex-direction: column; align-items: flex-start; }
    .adm-stats { width: 100%; }
    .adm-stat { flex: 1; }
    .adm-order__cols { grid-template-columns: 1fr; }
    .toast-stack { right: 14px; left: 14px; align-items: stretch; }
    .toast { min-width: unset; max-width: 100%; }
    .edit-modal { max-height: 95vh; border-radius: 18px; }
    .edit-modal__img-section { flex-direction: column; }
  }
`;