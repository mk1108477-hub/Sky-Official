import { useState, useEffect, useCallback, useRef } from "react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^\/[^/]+/, "") + "/api";

interface OfferBanner { id: string; title: string; subtitle?: string; emoji?: string; bgGradient?: string; ctaText?: string; ctaLink?: string; }

interface Package {
  id: number;
  name: string | null;
  diamonds: number;
  bonus_diamonds: number;
  price: string;
  label: string | null;
  is_popular: boolean;
  sort_order: number;
  category: string | null;
  status?: string;
}

interface Order {
  id: number;
  package_id: number | null;
  diamonds: number;
  price: string;
  mlbb_id: string | null;
  status: string;
  note: string | null;
  created_at: string;
}

interface Stats {
  total_orders: string;
  total_revenue: string;
  total_diamonds: string;
}

interface WalletRequest {
  id: number;
  clerk_user_id: string;
  amount: string;
  type: string;
  status: string;
  upi_ref: string | null;
  description: string | null;
  created_at: string;
}

type Tab = "packages" | "orders" | "wallet" | "featured" | "events" | "staff" | "settings";
type NotifState = "unknown" | "loading" | "subscribed" | "denied" | "unsupported";

async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js");
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function AdminPanel({ onClose, fullPage = false }: { onClose: () => void; fullPage?: boolean }) {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem("admin_token"));
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<Tab>("packages");
  const [packages, setPackages] = useState<Package[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [newPkg, setNewPkg] = useState({ name: "", diamonds: "", bonus_diamonds: "", price: "", label: "", is_popular: false, category: "small", status: "available" });
  const [loading, setLoading] = useState(false);
  const [showAddPkg, setShowAddPkg] = useState(false);
  const [newOrder, setNewOrder] = useState({ diamonds: "", price: "", mlbb_id: "", status: "completed", note: "" });
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [walletRequests, setWalletRequests] = useState<WalletRequest[]>([]);
  const [walletLoading, setWalletLoading] = useState<number | null>(null);
  const [categoryPopular, setCategoryPopular] = useState<Record<string, boolean>>({});
  const [featuredSaving, setFeaturedSaving] = useState(false);
  const [qrCurrent, setQrCurrent] = useState<string | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrSaving, setQrSaving] = useState(false);
  const [qrSaved, setQrSaved] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [trustpilotUrl, setTrustpilotUrl] = useState("");
  const [trustpilotEnabled, setTrustpilotEnabled] = useState(false);
  const [trustpilotSaving, setTrustpilotSaving] = useState(false);
  const [trustpilotSaved, setTrustpilotSaved] = useState(false);
  const [banners, setBanners] = useState<OfferBanner[]>([]);
  const [bannersSaving, setBannersSaving] = useState(false);
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [newBanner, setNewBanner] = useState({ emoji: "", title: "", subtitle: "", bgGradient: "linear-gradient(135deg,#1a0a2e,#2d1b69)", ctaText: "", ctaLink: "" });

  interface PromoEventAdmin { id: string; title: string; description: string; badge: string; bgImage: string; bgGradient: string; packIds: number[]; active: boolean; sortOrder: number; }
  const [promoEvents, setPromoEvents] = useState<PromoEventAdmin[]>([]);
  const [promoSaving, setPromoSaving] = useState(false);
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoEventAdmin | null>(null);
  const [newPromo, setNewPromo] = useState({ title: "", description: "", badge: "", bgImage: "", bgGradient: "linear-gradient(135deg,#1a0a2e,#2d1b4e)", packIds: [] as number[], active: true });
  const promoImgRef = useRef<HTMLInputElement>(null);

  interface RechargeStaff { id: number; name: string; email: string | null; qr_image: string | null; whatsapp: string | null; status: string; shift_hours: string | null; sort_order: number; created_at: string; }
  const [staffList, setStaffList] = useState<RechargeStaff[]>([]);
  const [staffSaving, setStaffSaving] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", whatsapp: "", shift_hours: "", status: "offline" });
  const [staffQrPreview, setStaffQrPreview] = useState<string | null>(null);
  const staffQrRef = useRef<HTMLInputElement>(null);
  const [staffQrFile, setStaffQrFile] = useState<File | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderSearchStatus, setOrderSearchStatus] = useState("");
  const [searchResults, setSearchResults] = useState<Order[] | null>(null);
  const [searching, setSearching] = useState(false);

  const DEFAULT_PACK_IMAGES_ADMIN = [
    { maxDiamonds: 20,     url: "/pack1.png", label: "1–20 Diamonds"     },
    { maxDiamonds: 50,     url: "/pack2.png", label: "21–50 Diamonds"    },
    { maxDiamonds: 100,    url: "/pack3.png", label: "51–100 Diamonds"   },
    { maxDiamonds: 500,    url: "/pack4.png", label: "101–500 Diamonds"  },
    { maxDiamonds: 1000,   url: "/pack5.png", label: "501–1000 Diamonds" },
    { maxDiamonds: 2000,   url: "/pack6.png", label: "1001–2000 Diamonds"},
    { maxDiamonds: 999999, url: "/pack7.png", label: "2001+ Diamonds"    },
  ];
  const DEFAULT_PASS_IMAGES_ADMIN: Record<string, string> = {
    "Weekly Pass":         "/pass1.png",
    "Twilight Pass":       "/pass2.png",
    "Weekly Elite Bundle": "/pass3.png",
    "Monthly Epic Bundle": "/pass4.png",
  };

  const [packImages, setPackImages] = useState(DEFAULT_PACK_IMAGES_ADMIN);
  const [passImages, setPassImages] = useState(DEFAULT_PASS_IMAGES_ADMIN);
  const [imagesSaving, setImagesSaving] = useState(false);
  const [imagesSaved, setImagesSaved] = useState(false);
  const [categoryAvailability, setCategoryAvailability] = useState<Record<string, string>>({});
  const [catAvailSaving, setCatAvailSaving] = useState(false);
  const [catAvailSaved, setCatAvailSaved] = useState(false);
  const [newPassName, setNewPassName] = useState("");
  const [newPassUrl, setNewPassUrl] = useState("");
  const [starlightImages, setStarlightImages] = useState<Record<string, string>>({});
  const [newStarlightName, setNewStarlightName] = useState("");
  const [newStarlightUrl, setNewStarlightUrl] = useState("");
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [newPkgImage, setNewPkgImage] = useState("");
  const [editingPkgImage, setEditingPkgImage] = useState("");

  const uploadImage = async (file: File, onDone: (url: string) => void) => {
    const form = new FormData();
    form.append("image", file);
    try {
      const res = await fetch(`${API}/admin/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (res.ok) {
        const { url } = await res.json();
        onDone(url);
      } else {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        alert(`Upload failed: ${err.error || res.statusText}`);
      }
    } catch (e) {
      alert("Upload failed: network error. Please try again.");
    }
  };

  const CATEGORY_META = [
    { id: "small",     title: "Small Pack",       color: "#38bdf8" },
    { id: "normal",    title: "Normal Pack",       color: "#f59e0b" },
    { id: "double",    title: "Double Diamond",    color: "#00e5ff" },
    { id: "passes",    title: "Passes & Bundles",  color: "#a855f7" },
    { id: "starlight", title: "Starlight Cards",   color: "#f5c842" },
    { id: "rank",      title: "Rank Boosting",     color: "#ec4899" },
  ];

  // Push notifications
  const [notifState, setNotifState] = useState<NotifState>("unknown");
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);

  const token = sessionStorage.getItem("admin_token") || "";
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // Check current notification status on mount
  useEffect(() => {
    if (!authed) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setNotifState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setNotifState("denied");
      return;
    }
    // Check if already subscribed
    navigator.serviceWorker.ready.then(async (reg) => {
      swRegRef.current = reg;
      const existing = await reg.pushManager.getSubscription();
      setNotifState(existing ? "subscribed" : "unknown");
    });
  }, [authed]);

  const enableNotifications = async () => {
    setNotifState("loading");
    try {
      const reg = await registerSW();
      if (!reg) { setNotifState("unsupported"); return; }
      swRegRef.current = reg;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setNotifState("denied"); return; }

      const keyRes = await fetch(`${API}/push/vapid-public-key`);
      const { publicKey } = await keyRes.json();
      if (!publicKey) { setNotifState("unknown"); return; }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch(`${API}/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(sub.toJSON()),
      });

      setNotifState("subscribed");
    } catch {
      setNotifState("unknown");
    }
  };

  const disableNotifications = async () => {
    const reg = swRegRef.current || await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch(`${API}/push/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    setNotifState("unknown");
  };

  const fetchPackages = useCallback(async () => {
    const res = await fetch(`${API}/admin/packages`, { headers });
    if (res.ok) setPackages(await res.json());
  }, [token]);

  const fetchOrders = useCallback(async () => {
    const res = await fetch(`${API}/admin/orders`, { headers });
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
      setStats(data.stats);
    }
  }, [token]);

  const fetchWalletRequests = useCallback(async () => {
    const res = await fetch(`${API}/admin/wallet-requests`, { headers });
    if (res.ok) setWalletRequests(await res.json());
  }, [token]);

  const fetchCategoryPopular = useCallback(async () => {
    const res = await fetch(`${API}/admin/settings/category_popular`, { headers });
    if (res.ok) setCategoryPopular(await res.json());
  }, [token]);

  const saveCategoryPopular = async (updated: Record<string, boolean>) => {
    setFeaturedSaving(true);
    await fetch(`${API}/admin/settings/category_popular`, {
      method: "PUT", headers,
      body: JSON.stringify(updated),
    });
    setCategoryPopular(updated);
    setFeaturedSaving(false);
  };

  const fetchQr = useCallback(async () => {
    const res = await fetch(`${API}/admin/settings/qr`, { headers });
    if (res.ok) {
      const data = await res.json();
      setQrCurrent(data.qr || null);
    }
  }, [token]);

  const fetchTrustpilot = useCallback(async () => {
    const res = await fetch(`${API}/admin/settings/trustpilot`, { headers });
    if (res.ok) {
      const data = await res.json();
      setTrustpilotUrl(data.url || "");
      setTrustpilotEnabled(data.enabled || false);
    }
  }, [token]);

  const fetchBanners = useCallback(async () => {
    const res = await fetch(`${API}/admin/settings/offer_banners`, { headers });
    if (res.ok) setBanners(await res.json());
  }, [token]);

  const fetchPackImages = useCallback(async () => {
    const res = await fetch(`${API}/admin/settings/pack_images`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) setPackImages(data);
    }
  }, [token]);

  const fetchPassImages = useCallback(async () => {
    const res = await fetch(`${API}/admin/settings/pass_images`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object" && !Array.isArray(data)) setPassImages(data);
    }
  }, [token]);

  const fetchStarlightImages = useCallback(async () => {
    const res = await fetch(`${API}/admin/settings/starlight_images`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object" && !Array.isArray(data)) setStarlightImages(data);
    }
  }, [token]);

  const fetchCategoryAvailability = useCallback(async () => {
    const res = await fetch(`${API}/admin/settings/category_availability`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object") setCategoryAvailability(data);
    }
  }, [token]);

  const saveCategoryAvailability = async (updated: Record<string, string>) => {
    setCatAvailSaving(true);
    await fetch(`${API}/admin/settings/category_availability`, { method: "PUT", headers, body: JSON.stringify(updated) });
    setCatAvailSaved(true);
    setTimeout(() => setCatAvailSaved(false), 2500);
    setCatAvailSaving(false);
  };

  const saveStarlightImages = async (images: Record<string, string>) => {
    await fetch(`${API}/admin/settings/starlight_images`, { method: "PUT", headers, body: JSON.stringify(images) });
  };

  const savePackImages = async () => {
    setImagesSaving(true);
    await fetch(`${API}/admin/settings/pack_images`, { method: "PUT", headers, body: JSON.stringify(packImages) });
    await fetch(`${API}/admin/settings/pass_images`, { method: "PUT", headers, body: JSON.stringify(passImages) });
    await saveStarlightImages(starlightImages);
    setImagesSaved(true);
    setTimeout(() => setImagesSaved(false), 3000);
    setImagesSaving(false);
  };

  const saveBanners = async (updated: OfferBanner[]) => {
    setBannersSaving(true);
    await fetch(`${API}/admin/settings/offer_banners`, { method: "PUT", headers, body: JSON.stringify(updated) });
    setBanners(updated);
    setBannersSaving(false);
  };

  const addBanner = () => {
    if (!newBanner.title.trim()) return;
    const banner: OfferBanner = {
      id: Date.now().toString(),
      title: newBanner.title,
      ...(newBanner.subtitle && { subtitle: newBanner.subtitle }),
      ...(newBanner.emoji && { emoji: newBanner.emoji }),
      ...(newBanner.bgGradient && { bgGradient: newBanner.bgGradient }),
      ...(newBanner.ctaText && { ctaText: newBanner.ctaText }),
      ...(newBanner.ctaLink && { ctaLink: newBanner.ctaLink }),
    };
    saveBanners([...banners, banner]);
    setNewBanner({ emoji: "", title: "", subtitle: "", bgGradient: "linear-gradient(135deg,#1a0a2e,#2d1b69)", ctaText: "", ctaLink: "" });
    setShowAddBanner(false);
  };

  const deleteBanner = (id: string) => saveBanners(banners.filter(b => b.id !== id));

  const saveTrustpilot = async () => {
    setTrustpilotSaving(true);
    await fetch(`${API}/admin/settings/trustpilot`, {
      method: "PUT", headers,
      body: JSON.stringify({ url: trustpilotUrl, enabled: trustpilotEnabled }),
    });
    setTrustpilotSaved(true);
    setTimeout(() => setTrustpilotSaved(false), 3000);
    setTrustpilotSaving(false);
  };

  const saveQr = async () => {
    if (!qrPreview) return;
    setQrSaving(true);
    await fetch(`${API}/admin/settings/qr`, {
      method: "PUT", headers,
      body: JSON.stringify({ qr: qrPreview }),
    });
    setQrCurrent(qrPreview);
    setQrPreview(null);
    setQrSaved(true);
    setTimeout(() => setQrSaved(false), 3000);
    setQrSaving(false);
  };

  function handleQrFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setQrPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (!authed) return;
    fetchPackages();
    fetchOrders();
    fetchWalletRequests();
    fetchCategoryPopular();
    fetchStarlightImages();
  }, [authed]);

  useEffect(() => {
    if (authed && tab === "settings") { fetchQr(); fetchTrustpilot(); fetchBanners(); fetchPackImages(); fetchPassImages(); fetchStarlightImages(); fetchCategoryAvailability(); }
    if (authed && tab === "events") fetchPromoEvents();
    if (authed && tab === "staff") fetchStaff();
  }, [authed, tab]);

  const fetchPromoEvents = async () => {
    try {
      const res = await fetch(`${API}/admin/promo-events`, { headers });
      if (res.ok) setPromoEvents(await res.json());
    } catch {}
  };

  const savePromoEvents = async (list: any[]) => {
    setPromoSaving(true);
    try {
      await fetch(`${API}/admin/promo-events`, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(list) });
      await fetchPromoEvents();
    } catch {} finally { setPromoSaving(false); }
  };

  const uploadPromoImage = async (file: File): Promise<string | null> => {
    const fd = new FormData(); fd.append("image", file);
    const res = await fetch(`${API}/admin/upload-image`, { method: "POST", headers, body: fd });
    if (!res.ok) return null;
    return (await res.json()).url;
  };

  const addPromoEvent = async () => {
    if (!newPromo.title.trim()) { alert("Title is required."); return; }
    let bgImage = newPromo.bgImage;
    if (promoImgRef.current?.files?.[0]) {
      const url = await uploadPromoImage(promoImgRef.current.files[0]);
      if (url) bgImage = url;
    }
    const ev = { ...newPromo, bgImage, id: Date.now().toString(), sortOrder: promoEvents.length };
    await savePromoEvents([...promoEvents, ev]);
    setNewPromo({ title: "", description: "", badge: "", bgImage: "", bgGradient: "linear-gradient(135deg,#1a0a2e,#2d1b4e)", packIds: [], active: true });
    setShowAddPromo(false);
    if (promoImgRef.current) promoImgRef.current.value = "";
  };

  const deletePromoEvent = async (id: string) => {
    await savePromoEvents(promoEvents.filter(e => e.id !== id));
  };

  const togglePromoActive = async (id: string) => {
    await savePromoEvents(promoEvents.map(e => e.id === id ? { ...e, active: !e.active } : e));
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${API}/admin/staff`, { headers });
      if (res.ok) setStaffList(await res.json());
    } catch {}
  };

  const addStaff = async () => {
    if (!newStaff.name.trim()) { alert("Name is required."); return; }
    setStaffSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", newStaff.name);
      if (newStaff.email) fd.append("email", newStaff.email);
      if (newStaff.whatsapp) fd.append("whatsapp", newStaff.whatsapp);
      if (newStaff.shift_hours) fd.append("shift_hours", newStaff.shift_hours);
      fd.append("status", newStaff.status);
      if (staffQrFile) fd.append("qr_image", staffQrFile);
      await fetch(`${API}/admin/staff`, { method: "POST", headers, body: fd });
      await fetchStaff();
      setNewStaff({ name: "", email: "", whatsapp: "", shift_hours: "", status: "offline" });
      setStaffQrFile(null); setStaffQrPreview(null);
      setShowAddStaff(false);
    } catch {} finally { setStaffSaving(false); }
  };

  const toggleStaffStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "available" ? "offline" : "available";
    try {
      await fetch(`${API}/admin/staff/${id}/status`, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      await fetchStaff();
    } catch {}
  };

  const deleteStaff = async (id: number) => {
    if (!confirm("Delete this staff member?")) return;
    await fetch(`${API}/admin/staff/${id}`, { method: "DELETE", headers });
    await fetchStaff();
  };

  const searchOrders = async () => {
    if (!orderSearch.trim() && !orderSearchStatus) return;
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (orderSearch.trim()) params.set("q", orderSearch.trim());
      if (orderSearchStatus) params.set("status", orderSearchStatus);
      const res = await fetch(`${API}/admin/orders/search?${params}`, { headers });
      if (res.ok) setSearchResults(await res.json());
    } catch {} finally { setSearching(false); }
  };

  const approveWallet = async (id: number) => {
    setWalletLoading(id);
    await fetch(`${API}/admin/wallet-requests/${id}/approve`, { method: "POST", headers });
    await fetchWalletRequests();
    setWalletLoading(null);
  };

  const rejectWallet = async (id: number) => {
    setWalletLoading(id);
    await fetch(`${API}/admin/wallet-requests/${id}/reject`, { method: "POST", headers });
    await fetchWalletRequests();
    setWalletLoading(null);
  };

  const login = async () => {
    setLoginError("");
    const res = await fetch(`${API}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      sessionStorage.setItem("admin_token", password);
      setAuthed(true);
    } else {
      setLoginError("Wrong password. Try again.");
    }
  };

  const savePkg = async (pkg: Package) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/packages/${pkg.id}`, {
        method: "PUT", headers,
        body: JSON.stringify(pkg),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        alert(`Failed to save package: ${err.error || res.statusText}`);
        return;
      }
      if (pkg.category === "starlight" && pkg.name?.trim() && editingPkgImage.trim()) {
        const updated = { ...starlightImages, [pkg.name.trim()]: editingPkgImage.trim() };
        setStarlightImages(updated);
        await saveStarlightImages(updated);
      }
      await fetchPackages();
      setEditingPkg(null);
      setEditingPkgImage("");
    } finally {
      setLoading(false);
    }
  };

  const deletePkg = async (id: number) => {
    if (!confirm("Delete this package?")) return;
    await fetch(`${API}/admin/packages/${id}`, { method: "DELETE", headers });
    await fetchPackages();
  };

  const addPkg = async () => {
    if (!newPkg.diamonds || !newPkg.price) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/packages`, {
        method: "POST", headers,
        body: JSON.stringify({ ...newPkg, sort_order: packages.length + 1 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        alert(`Failed to save package: ${err.error || res.statusText}`);
        return;
      }
      if (newPkg.category === "starlight" && newPkg.name.trim() && newPkgImage.trim()) {
        const updated = { ...starlightImages, [newPkg.name.trim()]: newPkgImage.trim() };
        setStarlightImages(updated);
        await saveStarlightImages(updated);
      }
      setNewPkg({ name: "", diamonds: "", bonus_diamonds: "", price: "", label: "", is_popular: false, category: "small", status: "available" });
      setNewPkgImage("");
      setShowAddPkg(false);
      await fetchPackages();
    } finally {
      setLoading(false);
    }
  };

  const addOrder = async () => {
    if (!newOrder.diamonds || !newOrder.price) return;
    setLoading(true);
    await fetch(`${API}/admin/orders`, {
      method: "POST", headers,
      body: JSON.stringify(newOrder),
    });
    setNewOrder({ diamonds: "", price: "", mlbb_id: "", status: "completed", note: "" });
    setShowAddOrder(false);
    await fetchOrders();
    setLoading(false);
  };

  const updateOrderStatus = async (id: number, status: string, note: string | null) => {
    await fetch(`${API}/admin/orders/${id}`, {
      method: "PUT", headers,
      body: JSON.stringify({ status, note }),
    });
    await fetchOrders();
  };

  const deleteOrder = async (id: number) => {
    if (!confirm("Delete this order?")) return;
    await fetch(`${API}/admin/orders/${id}`, { method: "DELETE", headers });
    await fetchOrders();
  };

  const logout = () => {
    sessionStorage.removeItem("admin_token");
    setAuthed(false);
    onClose();
  };

  const notifButton = () => {
    if (notifState === "unsupported") return null;
    if (notifState === "denied") return (
      <span className="text-xs text-red-400 font-semibold">Notifications blocked in browser</span>
    );
    if (notifState === "loading") return (
      <span className="text-xs text-amber-400 animate-pulse">Enabling…</span>
    );
    if (notifState === "subscribed") return (
      <button
        onClick={disableNotifications}
        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
        style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}
      >
        <span>🔔</span> Notifs ON
      </button>
    );
    return (
      <button
        onClick={enableNotifications}
        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
        style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
      >
        <span>🔕</span> Enable Notifs
      </button>
    );
  };

  return (
    <div
      className={fullPage
        ? "fixed inset-0 z-[100] flex flex-col"
        : "fixed inset-0 z-[100] flex items-center justify-center p-4"}
      style={fullPage
        ? { background: "#0a0a0a" }
        : { background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={!fullPage ? (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); } : undefined}
    >
      <div
        className={fullPage
          ? "flex flex-col flex-1 overflow-hidden"
          : "w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl"}
        style={fullPage
          ? {}
          : { background: "#111", border: "1px solid rgba(245,158,11,0.3)", boxShadow: "0 0 60px rgba(245,158,11,0.15)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ background: "#111", borderBottom: "1px solid rgba(255,255,255,0.07)", minHeight: 52 }}>
          {/* Left: back / title */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {fullPage ? (
              <button onClick={onClose} className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm font-semibold">
                <span style={{ fontSize: 18, lineHeight: 1 }}>←</span> Back
              </button>
            ) : (
              <>
                <span style={{ color: "#f59e0b", fontSize: 17 }}>🔑</span>
                <span className="font-bold text-white text-sm">Admin Panel</span>
              </>
            )}
          </div>

          {/* Right: compact actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {authed && notifButton()}
            {authed && (
              <button
                onClick={logout}
                className="flex items-center justify-center text-xs font-semibold transition-colors"
                style={{ color: "#6b7280", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "5px 10px", whiteSpace: "nowrap" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
              >
                Sign out
              </button>
            )}
            {!fullPage && (
              <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-lg leading-none">×</button>
            )}
          </div>
        </div>

        {!authed ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-5 p-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>🔐</div>
            <div className="text-center">
              <div className="text-white font-bold text-lg">Admin Access</div>
              <div className="text-gray-400 text-sm mt-1">Enter your password to continue</div>
            </div>
            <div className="w-full max-w-xs flex flex-col gap-3">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && login()}
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}
                autoFocus
              />
              {loginError && <p className="text-red-400 text-xs text-center">{loginError}</p>}
              <button
                onClick={login}
                className="w-full py-3 rounded-xl font-bold text-sm text-black"
                style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}
              >
                Enter
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div
              className="flex gap-1 px-4 pt-3 flex-shrink-0"
              style={{
                background: "#111",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                touchAction: "pan-x",
                overscrollBehavior: "contain",
              }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {(["packages", "orders", "wallet", "events", "staff", "featured", "settings"] as Tab[]).map((t) => {
                const pendingCount = t === "wallet" ? walletRequests.filter(r => r.status === "pending").length : 0;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="px-5 py-2.5 text-sm font-semibold capitalize rounded-t-lg transition-colors flex items-center gap-1.5"
                    style={{
                      flexShrink: 0,
                      ...(tab === t
                        ? { color: "#f59e0b", borderBottom: "2px solid #f59e0b", background: "rgba(245,158,11,0.07)" }
                        : { color: "#9ca3af" }),
                    }}
                  >
                    {t}
                    {pendingCount > 0 && (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#ef4444", color: "#fff", fontSize: 10 }}>{pendingCount}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              {/* ── PACKAGES TAB ── */}
              {tab === "packages" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-sm">{packages.length} Packages</span>
                    <button
                      onClick={() => setShowAddPkg(!showAddPkg)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-black"
                      style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}
                    >
                      + Add Package
                    </button>
                  </div>

                  {showAddPkg && (
                    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "#1a1a1a", border: "1px solid rgba(245,158,11,0.2)" }}>
                      <div className="text-amber-400 text-sm font-bold">New Package</div>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={newPkg.category} onChange={(e) => setNewPkg(p => ({ ...p, category: e.target.value }))} className="col-span-2 px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(245,158,11,0.35)" }}>
                          <option value="small">Small Pack</option>
                          <option value="normal">Normal Pack</option>
                          <option value="double">Double Diamond</option>
                          <option value="passes">Passes &amp; Bundles</option>
                          <option value="starlight">Starlight Cards</option>
                          <option value="rank">Rank Boosting</option>
                        </select>
                        <input placeholder='Name (e.g. "Starter Pack")' value={newPkg.name} onChange={(e) => setNewPkg(p => ({ ...p, name: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none col-span-2" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                        <input placeholder="Diamonds" type="number" value={newPkg.diamonds} onChange={(e) => setNewPkg(p => ({ ...p, diamonds: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                        <input placeholder="Bonus Diamonds" type="number" value={newPkg.bonus_diamonds} onChange={(e) => setNewPkg(p => ({ ...p, bonus_diamonds: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                        <input placeholder="Price (₹)" type="number" value={newPkg.price} onChange={(e) => setNewPkg(p => ({ ...p, price: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                        <input placeholder='Label (e.g. "Best Value")' value={newPkg.label} onChange={(e) => setNewPkg(p => ({ ...p, label: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                      </div>
                      <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                        <input type="checkbox" checked={newPkg.is_popular} onChange={(e) => setNewPkg(p => ({ ...p, is_popular: e.target.checked }))} />
                        Mark as popular
                      </label>
                      <select value={newPkg.status} onChange={(e) => setNewPkg(p => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <option value="available">Available</option>
                        <option value="out_of_stock">Out of Stock</option>
                        <option value="coming_soon">Coming Soon</option>
                      </select>
                      {newPkg.category === "starlight" && (
                        <div>
                          <div className="text-xs mb-1" style={{ color: "#f5c842" }}>★ Card Image</div>
                          <div className="flex gap-2 items-center">
                            <input
                              value={newPkgImage}
                              onChange={e => setNewPkgImage(e.target.value)}
                              placeholder="/uploads/image.png or https://..."
                              className="flex-1 px-3 py-2 rounded-lg text-white text-xs outline-none font-mono"
                              style={{ background: "#111", border: "1px solid rgba(245,200,66,0.3)" }}
                            />
                            <label style={{ flexShrink: 0, cursor: "pointer" }} title="Upload image">
                              <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
                                const file = e.target.files?.[0]; if (!file) return;
                                setUploadingKey("__newpkg__");
                                await uploadImage(file, u => setNewPkgImage(u));
                                setUploadingKey(null);
                                e.target.value = "";
                              }} />
                              <div style={{ width: 36, height: 32, borderRadius: 6, background: uploadingKey === "__newpkg__" ? "rgba(245,200,66,0.3)" : "rgba(245,200,66,0.1)", border: "1px solid rgba(245,200,66,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {uploadingKey === "__newpkg__"
                                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#f5c842" strokeWidth="2" strokeDasharray="56" strokeDashoffset="14"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></circle></svg>
                                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#f5c842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke="#f5c842" strokeWidth="2"/></svg>
                                }
                              </div>
                            </label>
                            {newPkgImage && <img src={newPkgImage} alt="" style={{ width: 40, height: 32, objectFit: "contain", borderRadius: 6, background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={addPkg} disabled={loading} className="flex-1 py-2 rounded-lg text-xs font-bold text-black" style={{ background: "#f59e0b" }}>Save</button>
                        <button onClick={() => setShowAddPkg(false)} className="flex-1 py-2 rounded-lg text-xs font-bold text-gray-400" style={{ background: "#222" }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {packages.map((pkg) => (
                    <div key={pkg.id} className="rounded-xl p-4" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)" }}>
                      {editingPkg?.id === pkg.id ? (
                        <div className="flex flex-col gap-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                              <div className="text-xs text-gray-400 mb-1">Category</div>
                              <select value={editingPkg.category || "small"} onChange={(e) => setEditingPkg(p => p ? { ...p, category: e.target.value } : p)} className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(245,158,11,0.35)" }}>
                                <option value="small">Small Pack</option>
                                <option value="normal">Normal Pack</option>
                                <option value="double">Double Diamond</option>
                                <option value="passes">Passes &amp; Bundles</option>
                                <option value="starlight">Starlight Cards</option>
                                <option value="rank">Rank Boosting</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <div className="text-xs text-gray-400 mb-1">Name</div>
                              <input placeholder='e.g. "Starter Pack"' value={editingPkg.name || ""} onChange={(e) => setEditingPkg(p => p ? { ...p, name: e.target.value } : p)} className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(245,158,11,0.3)" }} />
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 mb-1">Diamonds</div>
                              <input type="number" value={editingPkg.diamonds} onChange={(e) => setEditingPkg(p => p ? { ...p, diamonds: +e.target.value } : p)} className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(245,158,11,0.3)" }} />
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 mb-1">Bonus Diamonds</div>
                              <input type="number" value={editingPkg.bonus_diamonds} onChange={(e) => setEditingPkg(p => p ? { ...p, bonus_diamonds: +e.target.value } : p)} className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(245,158,11,0.3)" }} />
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 mb-1">Price (₹)</div>
                              <input type="number" value={editingPkg.price} onChange={(e) => setEditingPkg(p => p ? { ...p, price: e.target.value } : p)} className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(245,158,11,0.3)" }} />
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 mb-1">Label</div>
                              <input value={editingPkg.label || ""} onChange={(e) => setEditingPkg(p => p ? { ...p, label: e.target.value } : p)} className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(245,158,11,0.3)" }} />
                            </div>
                            <div>
                              <div className="text-xs text-gray-400 mb-1">Sort Order</div>
                              <input type="number" value={editingPkg.sort_order} onChange={(e) => setEditingPkg(p => p ? { ...p, sort_order: +e.target.value } : p)} className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(245,158,11,0.3)" }} />
                            </div>
                          </div>
                          <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                            <input type="checkbox" checked={editingPkg.is_popular} onChange={(e) => setEditingPkg(p => p ? { ...p, is_popular: e.target.checked } : p)} />
                            Mark as popular
                          </label>
                          <div className="col-span-2">
                            <div className="text-xs text-gray-400 mb-1">Status</div>
                            <select value={editingPkg.status || "available"} onChange={(e) => setEditingPkg(p => p ? { ...p, status: e.target.value } : p)} className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(245,158,11,0.3)" }}>
                              <option value="available">Available</option>
                              <option value="out_of_stock">Out of Stock</option>
                              <option value="coming_soon">Coming Soon</option>
                            </select>
                          </div>
                          {editingPkg.category === "starlight" && (
                            <div className="col-span-2">
                              <div className="text-xs mb-1" style={{ color: "#f5c842" }}>★ Card Image</div>
                              <div className="flex gap-2 items-center">
                                <input
                                  value={editingPkgImage}
                                  onChange={e => setEditingPkgImage(e.target.value)}
                                  placeholder="/uploads/image.png or https://..."
                                  className="flex-1 px-3 py-2 rounded-lg text-white text-xs outline-none font-mono"
                                  style={{ background: "#111", border: "1px solid rgba(245,200,66,0.3)" }}
                                />
                                <label style={{ flexShrink: 0, cursor: "pointer" }} title="Upload image">
                                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
                                    const file = e.target.files?.[0]; if (!file) return;
                                    setUploadingKey("__editpkg__");
                                    await uploadImage(file, u => setEditingPkgImage(u));
                                    setUploadingKey(null);
                                    e.target.value = "";
                                  }} />
                                  <div style={{ width: 36, height: 32, borderRadius: 6, background: uploadingKey === "__editpkg__" ? "rgba(245,200,66,0.3)" : "rgba(245,200,66,0.1)", border: "1px solid rgba(245,200,66,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {uploadingKey === "__editpkg__"
                                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#f5c842" strokeWidth="2" strokeDasharray="56" strokeDashoffset="14"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></circle></svg>
                                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#f5c842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke="#f5c842" strokeWidth="2"/></svg>
                                    }
                                  </div>
                                </label>
                                {editingPkgImage && <img src={editingPkgImage} alt="" style={{ width: 40, height: 32, objectFit: "contain", borderRadius: 6, background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button onClick={() => savePkg(editingPkg)} disabled={loading} className="flex-1 py-2 rounded-lg text-xs font-bold text-black" style={{ background: "#f59e0b" }}>Save</button>
                            <button onClick={() => setEditingPkg(null)} className="flex-1 py-2 rounded-lg text-xs font-bold text-gray-400" style={{ background: "#222" }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>♦</div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white font-bold text-sm">{pkg.name || `${pkg.diamonds.toLocaleString()} Diamonds`}</span>
                                {pkg.category && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(255,255,255,0.08)", color: "#9ca3af" }}>{pkg.category}</span>}
                              </div>
                              <div className="text-amber-400 text-xs font-semibold mt-0.5">
                                ♦ {pkg.diamonds.toLocaleString()}{pkg.bonus_diamonds > 0 ? <span className="text-green-400"> +{pkg.bonus_diamonds.toLocaleString()} bonus</span> : null}
                                <span className="text-gray-500 mx-1">·</span>₹{parseFloat(pkg.price).toFixed(0)}
                                {pkg.label ? <span className="text-gray-400 font-normal"> · {pkg.label}</span> : null}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            {pkg.is_popular && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b" }}>Popular</span>}
                            {pkg.status === "out_of_stock" && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>Out of Stock</span>}
                            {pkg.status === "coming_soon" && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>Coming Soon</span>}
                            <button onClick={() => { setEditingPkg(pkg); setEditingPkgImage(starlightImages[pkg.name || ""] || ""); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 transition-colors text-sm">✏️</button>
                            <button onClick={() => deletePkg(pkg.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors text-sm">🗑️</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── ORDERS TAB ── */}
              {tab === "orders" && (
                <div className="flex flex-col gap-4">
                  {stats && (
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Total Orders", value: stats.total_orders, icon: "📦" },
                        { label: "Revenue", value: `₹${parseFloat(stats.total_revenue).toFixed(0)}`, icon: "💰" },
                        { label: "Diamonds Sold", value: parseInt(stats.total_diamonds).toLocaleString(), icon: "♦" },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <div className="text-xl mb-1">{s.icon}</div>
                          <div className="text-white font-bold text-lg leading-tight">{s.value}</div>
                          <div className="text-gray-400 text-xs mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-sm">Recent Orders</span>
                    <button onClick={() => setShowAddOrder(!showAddOrder)} className="px-4 py-2 rounded-xl text-xs font-bold text-black" style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>+ Add Order</button>
                  </div>

                  {showAddOrder && (
                    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "#1a1a1a", border: "1px solid rgba(245,158,11,0.2)" }}>
                      <div className="text-amber-400 text-sm font-bold">New Order</div>
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="Diamonds" type="number" value={newOrder.diamonds} onChange={(e) => setNewOrder(o => ({ ...o, diamonds: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                        <input placeholder="Price (₹)" type="number" value={newOrder.price} onChange={(e) => setNewOrder(o => ({ ...o, price: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                        <input placeholder="MLBB ID" value={newOrder.mlbb_id} onChange={(e) => setNewOrder(o => ({ ...o, mlbb_id: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none col-span-2" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                        <input placeholder="Note" value={newOrder.note} onChange={(e) => setNewOrder(o => ({ ...o, note: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none col-span-2" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                        <select value={newOrder.status} onChange={(e) => setNewOrder(o => ({ ...o, status: e.target.value }))} className="col-span-2 px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={addOrder} disabled={loading} className="flex-1 py-2 rounded-lg text-xs font-bold text-black" style={{ background: "#f59e0b" }}>Save</button>
                        <button onClick={() => setShowAddOrder(false)} className="flex-1 py-2 rounded-lg text-xs font-bold text-gray-400" style={{ background: "#222" }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {orders.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-8">No orders yet.</div>
                  )}

                  {orders.map((order) => (
                    <div key={order.id} className="rounded-xl p-4 flex items-center justify-between gap-3" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-bold text-sm">{order.diamonds.toLocaleString()} ♦</span>
                          <span className="text-amber-400 text-xs font-semibold">₹{parseFloat(order.price).toFixed(0)}</span>
                          {order.mlbb_id && <span className="text-gray-400 text-xs">ID: {order.mlbb_id}</span>}
                        </div>
                        {order.note && <div className="text-gray-500 text-xs mt-0.5 truncate">{order.note}</div>}
                        <div className="text-gray-600 text-xs mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-gray-500">#{`SKY-${String(order.id).padStart(5,"0")}`}</span>
                          <span>·</span>
                          <span>{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value, order.note)}
                          className="text-xs px-2 py-1 rounded-lg outline-none font-bold"
                          style={{
                            background: order.status === "completed" ? "rgba(34,197,94,0.15)" : order.status === "failed" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                            color: order.status === "completed" ? "#22c55e" : order.status === "failed" ? "#ef4444" : "#f59e0b",
                            border: "none",
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                        </select>
                        <button onClick={() => deleteOrder(order.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors text-xs">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── FEATURED TAB ── */}
              {tab === "featured" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-white font-bold text-sm mb-1">Popular Now — Panel Badges</div>
                    <div className="text-gray-400 text-xs">Toggle which category panels show a "Popular Now" badge on the store front. Changes save instantly.</div>
                  </div>

                  {[
                    { id: "small",     label: "Small Pack",       icon: "♦",  color: "#38bdf8" },
                    { id: "normal",    label: "Normal Pack",       icon: "♦♦", color: "#f59e0b" },
                    { id: "double",    label: "Double Diamond",    icon: "×2", color: "#00e5ff" },
                    { id: "passes",    label: "Passes & Bundles",  icon: "🎫", color: "#a855f7" },
                    { id: "starlight", label: "Starlight Cards",   icon: "★",  color: "#f5c842" },
                    { id: "rank",      label: "Rank Boosting",     icon: "🛡", color: "#ec4899" },
                  ].map(cat => {
                    const isOn = !!categoryPopular[cat.id];
                    return (
                      <div key={cat.id} className="rounded-xl p-4 flex items-center justify-between gap-4"
                        style={{ background: "#1a1a1a", border: `1px solid ${isOn ? cat.color + "40" : "rgba(255,255,255,0.07)"}` }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                            style={{ background: cat.color + "18", color: cat.color, border: `1px solid ${cat.color}30` }}>
                            {cat.icon}
                          </div>
                          <div>
                            <div className="text-white font-semibold text-sm">{cat.label}</div>
                            {isOn && (
                              <div className="text-xs font-bold mt-0.5" style={{ color: cat.color }}>Popular Now badge showing</div>
                            )}
                          </div>
                        </div>
                        <button
                          disabled={featuredSaving}
                          onClick={() => saveCategoryPopular({ ...categoryPopular, [cat.id]: !isOn })}
                          className="relative flex-shrink-0 transition-all"
                          style={{ width: 44, height: 24, borderRadius: 999,
                            background: isOn ? cat.color : "rgba(255,255,255,0.1)",
                            border: `1px solid ${isOn ? cat.color : "rgba(255,255,255,0.15)"}`,
                            cursor: featuredSaving ? "not-allowed" : "pointer",
                            opacity: featuredSaving ? 0.6 : 1,
                          }}
                        >
                          <span style={{
                            position: "absolute", top: 2, left: isOn ? 22 : 2,
                            width: 18, height: 18, borderRadius: "50%",
                            background: "#fff",
                            transition: "left 0.18s ease",
                            display: "block",
                          }} />
                        </button>
                      </div>
                    );
                  })}

                  {featuredSaving && (
                    <div className="text-center text-xs text-amber-400 py-1">Saving…</div>
                  )}
                </div>
              )}

              {/* ── SETTINGS TAB ── */}
              {tab === "settings" && (
                <div className="flex flex-col gap-5">

                  {/* Category Panel Availability */}
                  <div>
                    <div className="text-white font-bold text-sm mb-1">Category Panel Availability</div>
                    <div className="text-gray-400 text-xs">Switch each storefront panel between Available and Coming Soon. Changes apply instantly to all visitors.</div>
                  </div>
                  <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {CATEGORY_META.map(cat => {
                      const status = categoryAvailability[cat.id] ?? "available";
                      const isAvail = status === "available";
                      return (
                        <div key={cat.id} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                            <span className="text-white text-sm font-medium">{cat.title}</span>
                          </div>
                          <button
                            disabled={catAvailSaving}
                            onClick={async () => {
                              const updated = { ...categoryAvailability, [cat.id]: isAvail ? "out_of_stock" : "available" };
                              setCategoryAvailability(updated);
                              await saveCategoryAvailability(updated);
                            }}
                            style={{
                              background: isAvail ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.12)",
                              border: `1px solid ${isAvail ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.35)"}`,
                              color: isAvail ? "#4ade80" : "#f87171",
                              padding: "4px 16px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                              cursor: catAvailSaving ? "default" : "pointer", whiteSpace: "nowrap",
                            }}
                          >
                            {isAvail ? "✓ Available" : "Out of Stock"}
                          </button>
                        </div>
                      );
                    })}
                    {catAvailSaved && <div className="text-center text-green-400 text-xs font-bold pt-1">✓ Saved!</div>}
                  </div>

                  <div>
                    <div className="text-white font-bold text-sm mb-1">QR Code Management</div>
                    <div className="text-gray-400 text-xs">Upload a new UPI QR code. It will replace the one shown on the payment page instantly.</div>
                  </div>

                  {/* Current QR */}
                  <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="text-amber-400 text-xs font-bold uppercase tracking-wider">Current QR Code</div>
                    <div className="flex justify-center">
                      <div style={{ background: "#fff", borderRadius: 12, padding: 12, display: "inline-flex" }}>
                        <img
                          src={qrCurrent || "/upi-qr.jpg"}
                          alt="Current QR"
                          style={{ width: 160, height: 160, objectFit: "contain", borderRadius: 6, display: "block" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Upload new QR */}
                  <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "#1a1a1a", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <div className="text-amber-400 text-xs font-bold uppercase tracking-wider">Upload New QR</div>
                    <input
                      ref={qrInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleQrFile}
                      style={{ display: "none" }}
                    />
                    <button
                      onClick={() => qrInputRef.current?.click()}
                      className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                      style={{ background: "rgba(245,158,11,0.1)", border: "2px dashed rgba(245,158,11,0.35)", color: "#f59e0b" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {qrPreview ? "Change Image" : "Choose QR Image"}
                    </button>

                    {qrPreview && (
                      <>
                        <div className="text-gray-400 text-xs text-center">Preview of new QR</div>
                        <div className="flex justify-center">
                          <div style={{ background: "#fff", borderRadius: 12, padding: 12, display: "inline-flex" }}>
                            <img src={qrPreview} alt="New QR Preview" style={{ width: 160, height: 160, objectFit: "contain", borderRadius: 6, display: "block" }} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveQr}
                            disabled={qrSaving}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black"
                            style={{ background: qrSaving ? "rgba(245,158,11,0.4)" : "linear-gradient(135deg,#fbbf24,#f59e0b)" }}
                          >
                            {qrSaving ? "Saving…" : "Save New QR"}
                          </button>
                          <button
                            onClick={() => { setQrPreview(null); if (qrInputRef.current) qrInputRef.current.value = ""; }}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-400"
                            style={{ background: "#222" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}

                    {qrSaved && (
                      <div className="text-center text-green-400 text-sm font-bold py-1">✓ QR updated successfully!</div>
                    )}
                  </div>

                  {/* Trustpilot Settings */}
                  <div>
                    <div className="text-white font-bold text-sm mb-1">Trustpilot Button</div>
                    <div className="text-gray-400 text-xs">Show or hide a "Review us on Trustpilot" button in the footer, and set the link.</div>
                  </div>
                  <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300 font-semibold">Show Trustpilot Button</span>
                      <button
                        onClick={() => setTrustpilotEnabled(e => !e)}
                        className="relative flex-shrink-0 transition-all"
                        style={{ width: 44, height: 24, borderRadius: 999, background: trustpilotEnabled ? "#00b67a" : "rgba(255,255,255,0.1)", border: `1px solid ${trustpilotEnabled ? "#00b67a" : "rgba(255,255,255,0.15)"}`, cursor: "pointer" }}
                      >
                        <span style={{ position: "absolute", top: 2, left: trustpilotEnabled ? 22 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.18s ease", display: "block" }} />
                      </button>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Trustpilot URL</div>
                      <input
                        value={trustpilotUrl}
                        onChange={(e) => setTrustpilotUrl(e.target.value)}
                        placeholder="https://www.trustpilot.com/review/..."
                        className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
                      />
                    </div>
                    <button
                      onClick={saveTrustpilot}
                      disabled={trustpilotSaving}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-black"
                      style={{ background: trustpilotSaving ? "rgba(245,158,11,0.4)" : "linear-gradient(135deg,#fbbf24,#f59e0b)" }}
                    >
                      {trustpilotSaving ? "Saving…" : trustpilotSaved ? "✓ Saved!" : "Save Trustpilot Settings"}
                    </button>
                  </div>

                  {/* Offer Banners */}
                  <div>
                    <div className="text-white font-bold text-sm mb-1">Offer Banners</div>
                    <div className="text-gray-400 text-xs">Promotional banners shown on the store homepage. Add up to 5 banners — they auto-rotate every 6 seconds.</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {banners.length === 0 && !showAddBanner && (
                      <div className="text-center text-gray-500 text-sm py-3">No banners yet.</div>
                    )}
                    {banners.map((banner) => (
                      <div key={banner.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: banner.bgGradient || "linear-gradient(135deg,#1a0a2e,#2d1b69)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        {banner.emoji && <span style={{ fontSize: 22, lineHeight: 1 }}>{banner.emoji}</span>}
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-bold text-sm truncate">{banner.title}</div>
                          {banner.subtitle && <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }} className="truncate">{banner.subtitle}</div>}
                        </div>
                        <button onClick={() => deleteBanner(banner.id)} disabled={bannersSaving} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/15 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>🗑️</button>
                      </div>
                    ))}
                    <button
                      onClick={() => setShowAddBanner(v => !v)}
                      className="w-full py-2 rounded-xl text-xs font-bold text-black"
                      style={{ background: showAddBanner ? "#555" : "linear-gradient(135deg,#fbbf24,#f59e0b)", color: showAddBanner ? "#fff" : "#000" }}
                    >
                      {showAddBanner ? "Cancel" : "+ Add Banner"}
                    </button>
                    {showAddBanner && (
                      <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: "#1a1a1a", border: "1px solid rgba(245,158,11,0.18)" }}>
                        <div className="text-amber-400 text-xs font-bold mb-1">New Banner</div>
                        <input placeholder="Emoji (e.g. 🎮)" value={newBanner.emoji} onChange={e => setNewBanner(b => ({ ...b, emoji: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                        <input placeholder="Title *" value={newBanner.title} onChange={e => setNewBanner(b => ({ ...b, title: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                        <input placeholder="Subtitle (optional)" value={newBanner.subtitle} onChange={e => setNewBanner(b => ({ ...b, subtitle: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                        <input placeholder="Background CSS e.g. linear-gradient(135deg,#1a0a2e,#c23)" value={newBanner.bgGradient} onChange={e => setNewBanner(b => ({ ...b, bgGradient: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                        <input placeholder="CTA Button Text (optional)" value={newBanner.ctaText} onChange={e => setNewBanner(b => ({ ...b, ctaText: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                        <input placeholder="CTA Link (optional, e.g. /packages)" value={newBanner.ctaLink} onChange={e => setNewBanner(b => ({ ...b, ctaLink: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                        <button onClick={addBanner} disabled={bannersSaving} className="w-full py-2.5 rounded-xl text-sm font-bold text-black mt-1" style={{ background: bannersSaving ? "rgba(245,158,11,0.4)" : "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>
                          {bannersSaving ? "Saving…" : "Save Banner"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pack Images */}
                  <div>
                    <div className="text-white font-bold text-sm mb-1">Pack Images</div>
                    <div className="text-gray-400 text-xs">Set the image URL shown on each diamond pack card. Paste any public URL or a path like /pack1.png for built-in images.</div>
                  </div>
                  <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "#1a1a1a", border: "1px solid rgba(56,189,248,0.2)" }}>
                    <div className="text-sky-400 text-xs font-bold uppercase tracking-wider">Diamond Pack Images</div>
                    {packImages.map((tier, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <div className="text-gray-400 text-xs">{tier.label}</div>
                        <div className="flex gap-2 items-center">
                          <input
                            value={tier.url}
                            onChange={e => {
                              const updated = [...packImages];
                              updated[i] = { ...updated[i], url: e.target.value };
                              setPackImages(updated);
                            }}
                            placeholder="/pack1.png or https://..."
                            className="flex-1 px-3 py-2 rounded-lg text-white text-xs outline-none font-mono"
                            style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
                          />
                          {tier.url && (
                            <img src={tier.url} alt="" style={{ width: 40, height: 32, objectFit: "contain", borderRadius: 6, background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mt-2">Pass &amp; Bundle Images</div>
                    {Object.entries(passImages).map(([name, url]) => (
                      <div key={name} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <div className="text-gray-400 text-xs">{name}</div>
                          <button
                            onClick={() => setPassImages(p => { const n = { ...p }; delete n[name]; return n; })}
                            style={{ color: "rgba(239,68,68,0.7)", fontSize: 11, background: "none", border: "none", cursor: "pointer", padding: "0 2px" }}
                            title="Remove this entry"
                          >✕</button>
                        </div>
                        <div className="flex gap-2 items-center">
                          <input
                            value={url}
                            onChange={e => setPassImages(p => ({ ...p, [name]: e.target.value }))}
                            placeholder="/pass1.png or https://..."
                            className="flex-1 px-3 py-2 rounded-lg text-white text-xs outline-none font-mono"
                            style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
                          />
                          {/* Gallery upload button */}
                          <label style={{ flexShrink: 0, cursor: "pointer" }} title="Upload from gallery">
                            <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
                              const file = e.target.files?.[0]; if (!file) return;
                              setUploadingKey(name);
                              await uploadImage(file, u => setPassImages(p => ({ ...p, [name]: u })));
                              setUploadingKey(null);
                              e.target.value = "";
                            }} />
                            <div style={{ width: 36, height: 32, borderRadius: 6, background: uploadingKey === name ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {uploadingKey === name
                                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#f59e0b" strokeWidth="2" strokeDasharray="56" strokeDashoffset="14"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></circle></svg>
                                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke="#f59e0b" strokeWidth="2"/></svg>
                              }
                            </div>
                          </label>
                          {url && (
                            <img src={url} alt="" style={{ width: 40, height: 32, objectFit: "contain", borderRadius: 6, background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add new image entry */}
                    <div className="flex flex-col gap-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">Add New Entry</div>
                      <input
                        value={newPassName}
                        onChange={e => setNewPassName(e.target.value)}
                        placeholder='Pack name (e.g. "Starlight Membership")'
                        className="w-full px-3 py-2 rounded-lg text-white text-xs outline-none"
                        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
                      />
                      <div className="flex gap-2 items-center">
                        <input
                          value={newPassUrl}
                          onChange={e => setNewPassUrl(e.target.value)}
                          placeholder="/myimage.png or https://..."
                          className="flex-1 px-3 py-2 rounded-lg text-white text-xs outline-none font-mono"
                          style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
                        />
                        {/* Gallery upload for new entry */}
                        <label style={{ flexShrink: 0, cursor: "pointer" }} title="Upload from gallery">
                          <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
                            const file = e.target.files?.[0]; if (!file) return;
                            setUploadingKey("__new__");
                            await uploadImage(file, u => setNewPassUrl(u));
                            setUploadingKey(null);
                            e.target.value = "";
                          }} />
                          <div style={{ width: 36, height: 32, borderRadius: 6, background: uploadingKey === "__new__" ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {uploadingKey === "__new__"
                              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#f59e0b" strokeWidth="2" strokeDasharray="56" strokeDashoffset="14"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></circle></svg>
                              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke="#f59e0b" strokeWidth="2"/></svg>
                            }
                          </div>
                        </label>
                        {newPassUrl && (
                          <img src={newPassUrl} alt="" style={{ width: 40, height: 32, objectFit: "contain", borderRadius: 6, background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const name = newPassName.trim();
                          const url = newPassUrl.trim();
                          if (!name || !url) return;
                          setPassImages(p => ({ ...p, [name]: url }));
                          setNewPassName("");
                          setNewPassUrl("");
                        }}
                        disabled={!newPassName.trim() || !newPassUrl.trim()}
                        className="w-full py-2 rounded-xl text-xs font-bold"
                        style={{
                          background: newPassName.trim() && newPassUrl.trim() ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)",
                          border: `1px dashed ${newPassName.trim() && newPassUrl.trim() ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.1)"}`,
                          color: newPassName.trim() && newPassUrl.trim() ? "#f59e0b" : "rgba(255,255,255,0.3)",
                          cursor: newPassName.trim() && newPassUrl.trim() ? "pointer" : "default",
                        }}
                      >
                        + Add Entry
                      </button>
                    </div>

                    <div className="text-yellow-300 text-xs font-bold uppercase tracking-wider mt-2" style={{ color: "#f5c842" }}>★ Starlight Card Images</div>
                    {Object.entries(starlightImages).map(([name, url]) => (
                      <div key={name} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <div className="text-gray-400 text-xs">{name}</div>
                          <button
                            onClick={() => setStarlightImages(p => { const n = { ...p }; delete n[name]; return n; })}
                            style={{ color: "rgba(239,68,68,0.7)", fontSize: 11, background: "none", border: "none", cursor: "pointer", padding: "0 2px" }}
                            title="Remove this entry"
                          >✕</button>
                        </div>
                        <div className="flex gap-2 items-center">
                          <input
                            value={url}
                            onChange={e => setStarlightImages(p => ({ ...p, [name]: e.target.value }))}
                            placeholder="/starlight.png or https://..."
                            className="flex-1 px-3 py-2 rounded-lg text-white text-xs outline-none font-mono"
                            style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
                          />
                          <label style={{ flexShrink: 0, cursor: "pointer" }} title="Upload from gallery">
                            <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
                              const file = e.target.files?.[0]; if (!file) return;
                              setUploadingKey("sl_" + name);
                              await uploadImage(file, u => setStarlightImages(p => ({ ...p, [name]: u })));
                              setUploadingKey(null);
                              e.target.value = "";
                            }} />
                            <div style={{ width: 36, height: 32, borderRadius: 6, background: uploadingKey === "sl_" + name ? "rgba(245,200,66,0.3)" : "rgba(245,200,66,0.1)", border: "1px solid rgba(245,200,66,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {uploadingKey === "sl_" + name
                                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#f5c842" strokeWidth="2" strokeDasharray="56" strokeDashoffset="14"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></circle></svg>
                                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#f5c842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke="#f5c842" strokeWidth="2"/></svg>
                              }
                            </div>
                          </label>
                          {url && (
                            <img src={url} alt="" style={{ width: 40, height: 32, objectFit: "contain", borderRadius: 6, background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add new Starlight entry */}
                    <div className="flex flex-col gap-2 pt-2" style={{ borderTop: "1px solid rgba(245,200,66,0.1)" }}>
                      <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">Add Starlight Card</div>
                      <input
                        value={newStarlightName}
                        onChange={e => setNewStarlightName(e.target.value)}
                        placeholder='Card name (e.g. "Starlight Membership")'
                        className="w-full px-3 py-2 rounded-lg text-white text-xs outline-none"
                        style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
                      />
                      <div className="flex gap-2 items-center">
                        <input
                          value={newStarlightUrl}
                          onChange={e => setNewStarlightUrl(e.target.value)}
                          placeholder="/starlight.png or https://..."
                          className="flex-1 px-3 py-2 rounded-lg text-white text-xs outline-none font-mono"
                          style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}
                        />
                        <label style={{ flexShrink: 0, cursor: "pointer" }} title="Upload from gallery">
                          <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
                            const file = e.target.files?.[0]; if (!file) return;
                            setUploadingKey("__sl_new__");
                            await uploadImage(file, u => setNewStarlightUrl(u));
                            setUploadingKey(null);
                            e.target.value = "";
                          }} />
                          <div style={{ width: 36, height: 32, borderRadius: 6, background: uploadingKey === "__sl_new__" ? "rgba(245,200,66,0.3)" : "rgba(245,200,66,0.1)", border: "1px solid rgba(245,200,66,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {uploadingKey === "__sl_new__"
                              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#f5c842" strokeWidth="2" strokeDasharray="56" strokeDashoffset="14"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></circle></svg>
                              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#f5c842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="13" r="4" stroke="#f5c842" strokeWidth="2"/></svg>
                            }
                          </div>
                        </label>
                        {newStarlightUrl && (
                          <img src={newStarlightUrl} alt="" style={{ width: 40, height: 32, objectFit: "contain", borderRadius: 6, background: "#0d0d14", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const name = newStarlightName.trim();
                          const url = newStarlightUrl.trim();
                          if (!name || !url) return;
                          setStarlightImages(p => ({ ...p, [name]: url }));
                          setNewStarlightName("");
                          setNewStarlightUrl("");
                        }}
                        disabled={!newStarlightName.trim() || !newStarlightUrl.trim()}
                        className="w-full py-2 rounded-xl text-xs font-bold"
                        style={{
                          background: newStarlightName.trim() && newStarlightUrl.trim() ? "rgba(245,200,66,0.15)" : "rgba(255,255,255,0.04)",
                          border: `1px dashed ${newStarlightName.trim() && newStarlightUrl.trim() ? "rgba(245,200,66,0.45)" : "rgba(255,255,255,0.1)"}`,
                          color: newStarlightName.trim() && newStarlightUrl.trim() ? "#f5c842" : "rgba(255,255,255,0.3)",
                          cursor: newStarlightName.trim() && newStarlightUrl.trim() ? "pointer" : "default",
                        }}
                      >
                        + Add Starlight Card
                      </button>
                    </div>

                    <button
                      onClick={savePackImages}
                      disabled={imagesSaving}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-black mt-1"
                      style={{ background: imagesSaving ? "rgba(245,158,11,0.4)" : "linear-gradient(135deg,#fbbf24,#f59e0b)" }}
                    >
                      {imagesSaving ? "Saving…" : imagesSaved ? "✓ Saved!" : "Save Image Settings"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── EVENTS TAB ── */}
              {tab === "events" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-sm">Promo Event Panels</span>
                    <button onClick={() => setShowAddPromo(v => !v)} className="px-4 py-2 rounded-xl text-xs font-bold text-black" style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>+ New Event</button>
                  </div>
                  <div className="text-gray-400 text-xs">These slides appear below the hero section. Click on a slide to add linked packs to cart.</div>

                  {showAddPromo && (
                    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "#1a1a1a", border: "1px solid rgba(245,158,11,0.2)" }}>
                      <div className="text-amber-400 text-sm font-bold">New Promo Panel</div>
                      <input placeholder="Title *" value={newPromo.title} onChange={e => setNewPromo(p => ({ ...p, title: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                      <input placeholder="Description (optional)" value={newPromo.description} onChange={e => setNewPromo(p => ({ ...p, description: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                      <input placeholder="Badge text (e.g. HOT, NEW)" value={newPromo.badge} onChange={e => setNewPromo(p => ({ ...p, badge: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                      <div>
                        <div className="text-gray-400 text-xs mb-1.5">Background Image (optional)</div>
                        <input ref={promoImgRef} type="file" accept="image/*" className="text-gray-300 text-xs" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px", width: "100%" }} />
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs mb-1.5">Link packages (hold Ctrl/Cmd to select multiple)</div>
                        <select multiple value={newPromo.packIds.map(String)} onChange={e => setNewPromo(p => ({ ...p, packIds: Array.from(e.target.selectedOptions).map(o => parseInt(o.value)) }))} className="px-3 py-2 rounded-lg text-white text-xs outline-none w-full" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", height: 90 }}>
                          {packages.map(pkg => <option key={pkg.id} value={pkg.id}>{pkg.name || `♦${pkg.diamonds}`} — ₹{parseFloat(pkg.price).toFixed(0)}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={addPromoEvent} disabled={promoSaving} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-black" style={{ background: promoSaving ? "rgba(245,158,11,0.5)" : "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>{promoSaving ? "Saving…" : "Add Event"}</button>
                        <button onClick={() => setShowAddPromo(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-300" style={{ background: "#222", border: "1px solid rgba(255,255,255,0.1)" }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {promoEvents.length === 0 && !showAddPromo && (
                    <div className="text-center text-gray-500 text-sm py-8">No promo events yet. Add your first one!</div>
                  )}

                  {promoEvents.map((ev) => (
                    <div key={ev.id} className="rounded-xl p-4 flex flex-col gap-2" style={{ background: "#1a1a1a", border: `1px solid ${ev.active ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.07)"}` }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-bold text-sm">{ev.title}</span>
                            {ev.badge && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>{ev.badge}</span>}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${ev.active ? "text-green-400" : "text-gray-500"}`} style={{ background: ev.active ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)" }}>{ev.active ? "Active" : "Hidden"}</span>
                          </div>
                          {ev.description && <div className="text-gray-400 text-xs mt-1 truncate">{ev.description}</div>}
                          {ev.bgImage && <div className="text-gray-600 text-xs mt-0.5 truncate">🖼 {ev.bgImage}</div>}
                          {ev.packIds?.length > 0 && <div className="text-gray-500 text-xs mt-0.5">🔗 {ev.packIds.length} pack(s) linked</div>}
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={() => togglePromoActive(ev.id)} className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: ev.active ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)", color: ev.active ? "#ef4444" : "#22c55e", border: `1px solid ${ev.active ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}` }}>{ev.active ? "Hide" : "Show"}</button>
                          <button onClick={() => deletePromoEvent(ev.id)} className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>Del</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── STAFF TAB ── */}
              {tab === "staff" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-sm">Recharge Staff</span>
                    <button onClick={() => setShowAddStaff(v => !v)} className="px-4 py-2 rounded-xl text-xs font-bold text-black" style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>+ Add Staff</button>
                  </div>
                  <div className="text-gray-400 text-xs">Set staff as "Available" to make orders auto-assign to them using round-robin. Their QR will be shown to customers on the payment page.</div>

                  {/* Order Search */}
                  <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="text-amber-400 text-xs font-bold">Order Search</div>
                    <div className="flex gap-2">
                      <input placeholder="Search by Order ID, MLBB ID, IGN…" value={orderSearch} onChange={e => setOrderSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && searchOrders()} className="flex-1 px-3 py-2 rounded-lg text-white text-xs outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                      <select value={orderSearchStatus} onChange={e => setOrderSearchStatus(e.target.value)} className="px-2 py-2 rounded-lg text-white text-xs outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <option value="">All</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button onClick={searchOrders} disabled={searching} className="px-3 py-2 rounded-lg text-xs font-bold text-black" style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", flexShrink: 0 }}>{searching ? "…" : "Search"}</button>
                    </div>
                    {searchResults && (
                      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                        {searchResults.length === 0 ? (
                          <div className="text-gray-500 text-xs text-center py-3">No results found.</div>
                        ) : searchResults.map(o => (
                          <div key={o.id} className="rounded-lg p-3" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-amber-400 font-bold text-xs font-mono">{(o as any).display_id || `#${o.id}`}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: o.status === "completed" ? "rgba(34,197,94,0.12)" : o.status === "pending" ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.06)", color: o.status === "completed" ? "#22c55e" : o.status === "pending" ? "#f59e0b" : "#9ca3af" }}>{o.status}</span>
                            </div>
                            <div className="text-gray-300 text-xs mt-1">♦{Number(o.diamonds).toLocaleString()} · ₹{parseFloat(o.price).toFixed(0)}</div>
                            {o.mlbb_id && <div className="text-gray-500 text-xs mt-0.5">MLBB: {o.mlbb_id}</div>}
                            {(o as any).staff_name && <div className="text-gray-500 text-xs mt-0.5">Staff: {(o as any).staff_name}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {showAddStaff && (
                    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "#1a1a1a", border: "1px solid rgba(245,158,11,0.2)" }}>
                      <div className="text-amber-400 text-sm font-bold">New Staff Member</div>
                      <input placeholder="Name *" value={newStaff.name} onChange={e => setNewStaff(s => ({ ...s, name: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                      <input placeholder="Email (for order notifications)" value={newStaff.email} onChange={e => setNewStaff(s => ({ ...s, email: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                      <input placeholder="WhatsApp number" value={newStaff.whatsapp} onChange={e => setNewStaff(s => ({ ...s, whatsapp: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                      <input placeholder="Shift hours (e.g. 9AM–6PM)" value={newStaff.shift_hours} onChange={e => setNewStaff(s => ({ ...s, shift_hours: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                      <select value={newStaff.status} onChange={e => setNewStaff(s => ({ ...s, status: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <option value="offline">Offline</option>
                        <option value="available">Available</option>
                      </select>
                      <div>
                        <div className="text-gray-400 text-xs mb-1.5">QR Code (customer pays to this QR)</div>
                        <input ref={staffQrRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setStaffQrFile(f); const r = new FileReader(); r.onload = ev2 => setStaffQrPreview(ev2.target?.result as string); r.readAsDataURL(f); } }} className="text-gray-300 text-xs" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px", width: "100%" }} />
                        {staffQrPreview && <img src={staffQrPreview} alt="QR preview" className="mt-2 rounded-lg" style={{ maxWidth: 120, maxHeight: 120, objectFit: "contain" }} />}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={addStaff} disabled={staffSaving} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-black" style={{ background: staffSaving ? "rgba(245,158,11,0.5)" : "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>{staffSaving ? "Saving…" : "Add Staff"}</button>
                        <button onClick={() => setShowAddStaff(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-300" style={{ background: "#222", border: "1px solid rgba(255,255,255,0.1)" }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {staffList.length === 0 && !showAddStaff && (
                    <div className="text-center text-gray-500 text-sm py-8">No staff yet. Add your coworkers!</div>
                  )}

                  {staffList.map((s) => (
                    <div key={s.id} className="rounded-xl p-4 flex flex-col gap-2" style={{ background: "#1a1a1a", border: `1px solid ${s.status === "available" ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.07)"}` }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-bold text-sm">{s.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold`} style={{ background: s.status === "available" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)", color: s.status === "available" ? "#22c55e" : "#9ca3af" }}>{s.status === "available" ? "● Available" : "○ Offline"}</span>
                          </div>
                          {s.email && <div className="text-gray-400 text-xs mt-1">✉ {s.email}</div>}
                          {s.whatsapp && <div className="text-gray-400 text-xs mt-0.5">📱 {s.whatsapp}</div>}
                          {s.shift_hours && <div className="text-gray-500 text-xs mt-0.5">⏰ {s.shift_hours}</div>}
                          {s.qr_image && <div className="text-gray-600 text-xs mt-0.5">QR: {s.qr_image}</div>}
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
                          <button onClick={() => toggleStaffStatus(s.id, s.status)} className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: s.status === "available" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)", color: s.status === "available" ? "#ef4444" : "#22c55e", border: `1px solid ${s.status === "available" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}` }}>{s.status === "available" ? "Set Offline" : "Set Available"}</button>
                          <button onClick={() => deleteStaff(s.id)} className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}>Remove</button>
                        </div>
                      </div>
                      {s.qr_image && (
                        <div className="mt-1">
                          <img src={s.qr_image} alt="QR" className="rounded-lg" style={{ maxWidth: 100, maxHeight: 100, objectFit: "contain" }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── WALLET TAB ── */}
              {tab === "wallet" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-sm">Top-up Requests</span>
                    <button onClick={fetchWalletRequests} className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}>Refresh</button>
                  </div>

                  {walletRequests.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-8">No wallet requests yet.</div>
                  )}

                  {walletRequests.map((req) => {
                    const isPending = req.status === "pending";
                    const isProcessing = walletLoading === req.id;
                    const statusColor = req.status === "approved" ? "#22c55e" : req.status === "rejected" ? "#ef4444" : "#f59e0b";
                    return (
                      <div key={req.id} className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "#1a1a1a", border: `1px solid ${isPending ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.07)"}` }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white font-bold text-sm">₹{parseFloat(req.amount).toFixed(2)}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: statusColor + "20", color: statusColor }}>{req.status}</span>
                            </div>
                            <div className="text-gray-400 text-xs mt-1 font-mono break-all">{req.clerk_user_id}</div>
                            {req.upi_ref && (
                              <div className="text-gray-300 text-xs mt-1">UPI Ref: <span className="font-semibold text-amber-300">{req.upi_ref}</span></div>
                            )}
                            <div className="text-gray-600 text-xs mt-1">{new Date(req.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                          </div>
                        </div>
                        {isPending && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveWallet(req.id)}
                              disabled={isProcessing}
                              className="flex-1 py-2 rounded-lg text-xs font-bold text-black"
                              style={{ background: isProcessing ? "rgba(34,197,94,0.4)" : "#22c55e" }}
                            >
                              {isProcessing ? "Processing…" : "Approve & Credit"}
                            </button>
                            <button
                              onClick={() => rejectWallet(req.id)}
                              disabled={isProcessing}
                              className="flex-1 py-2 rounded-lg text-xs font-bold"
                              style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
