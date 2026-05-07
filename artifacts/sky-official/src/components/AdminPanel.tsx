import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^\/[^/]+/, "") + "/api";

interface Package {
  id: number;
  diamonds: number;
  price: string;
  label: string | null;
  is_popular: boolean;
  sort_order: number;
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

type Tab = "packages" | "orders" | "wallet";

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem("admin_token"));
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<Tab>("packages");
  const [packages, setPackages] = useState<Package[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [newPkg, setNewPkg] = useState({ diamonds: "", price: "", label: "", is_popular: false });
  const [loading, setLoading] = useState(false);
  const [showAddPkg, setShowAddPkg] = useState(false);
  const [newOrder, setNewOrder] = useState({ diamonds: "", price: "", mlbb_id: "", status: "completed", note: "" });
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [walletRequests, setWalletRequests] = useState<WalletRequest[]>([]);
  const [walletLoading, setWalletLoading] = useState<number | null>(null);

  const token = sessionStorage.getItem("admin_token") || "";

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

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

  useEffect(() => {
    if (!authed) return;
    fetchPackages();
    fetchOrders();
    fetchWalletRequests();
  }, [authed]);

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
    await fetch(`${API}/admin/packages/${pkg.id}`, {
      method: "PUT", headers,
      body: JSON.stringify(pkg),
    });
    await fetchPackages();
    setEditingPkg(null);
    setLoading(false);
  };

  const deletePkg = async (id: number) => {
    if (!confirm("Delete this package?")) return;
    await fetch(`${API}/admin/packages/${id}`, { method: "DELETE", headers });
    await fetchPackages();
  };

  const addPkg = async () => {
    if (!newPkg.diamonds || !newPkg.price) return;
    setLoading(true);
    await fetch(`${API}/admin/packages`, {
      method: "POST", headers,
      body: JSON.stringify({ ...newPkg, sort_order: packages.length + 1 }),
    });
    setNewPkg({ diamonds: "", price: "", label: "", is_popular: false });
    setShowAddPkg(false);
    await fetchPackages();
    setLoading(false);
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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl"
        style={{ background: "#111", border: "1px solid rgba(245,158,11,0.3)", boxShadow: "0 0 60px rgba(245,158,11,0.15)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2">
            <span style={{ color: "#f59e0b", fontSize: 18 }}>🔑</span>
            <span className="font-bold text-white text-base">Admin Panel</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>Sky Official</span>
          </div>
          <div className="flex items-center gap-3">
            {authed && (
              <button onClick={logout} className="text-xs text-gray-400 hover:text-red-400 transition-colors">Sign out</button>
            )}
            <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-lg leading-none">×</button>
          </div>
        </div>

        {!authed ? (
          /* Login */
          <div className="flex flex-col items-center justify-center gap-5 p-10">
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
            <div className="flex gap-1 px-4 pt-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {(["packages", "orders", "wallet"] as Tab[]).map((t) => {
                const pendingCount = t === "wallet" ? walletRequests.filter(r => r.status === "pending").length : 0;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="px-5 py-2 text-sm font-semibold capitalize rounded-t-lg transition-colors flex items-center gap-1.5"
                    style={tab === t
                      ? { color: "#f59e0b", borderBottom: "2px solid #f59e0b", background: "rgba(245,158,11,0.07)" }
                      : { color: "#9ca3af" }
                    }
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
                        <input placeholder="Diamonds" type="number" value={newPkg.diamonds} onChange={(e) => setNewPkg(p => ({ ...p, diamonds: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                        <input placeholder="Price (₹)" type="number" value={newPkg.price} onChange={(e) => setNewPkg(p => ({ ...p, price: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                        <input placeholder='Label (e.g. "Popular")' value={newPkg.label} onChange={(e) => setNewPkg(p => ({ ...p, label: e.target.value }))} className="px-3 py-2 rounded-lg text-white text-sm outline-none col-span-2" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)" }} />
                      </div>
                      <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                        <input type="checkbox" checked={newPkg.is_popular} onChange={(e) => setNewPkg(p => ({ ...p, is_popular: e.target.checked }))} />
                        Mark as popular
                      </label>
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
                            <div>
                              <div className="text-xs text-gray-400 mb-1">Diamonds</div>
                              <input type="number" value={editingPkg.diamonds} onChange={(e) => setEditingPkg(p => p ? { ...p, diamonds: +e.target.value } : p)} className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#111", border: "1px solid rgba(245,158,11,0.3)" }} />
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
                              <div className="text-white font-bold text-sm">{pkg.diamonds.toLocaleString()} Diamonds</div>
                              <div className="text-amber-400 text-xs font-semibold">₹{parseFloat(pkg.price).toFixed(0)} {pkg.label ? <span className="text-gray-400 font-normal">· {pkg.label}</span> : null}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {pkg.is_popular && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b" }}>Popular</span>}
                            <button onClick={() => setEditingPkg(pkg)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 transition-colors text-sm">✏️</button>
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
                        <div className="text-gray-600 text-xs mt-0.5">{new Date(order.created_at).toLocaleDateString()}</div>
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
