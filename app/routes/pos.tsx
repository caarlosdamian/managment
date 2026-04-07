import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import type { Route } from "./+types/pos";
import { connectDB } from "~/db/connection.server";
import { InventoryItem } from "~/db/models/inventory.server";
import { POSSession } from "~/db/models/posSession.server";
import { Sale } from "~/db/models/sale.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Point of Sale | Management" },
    { name: "description", content: "Process sales and manage transactions" },
  ];
}

// ─── Server Loader ────────────────────────────────────────
export async function loader() {
  await connectDB();

  const [items, activeSession, todaySales] = await Promise.all([
    InventoryItem.find({ showInPOS: true, price: { $gt: 0 } })
      .sort({ category: 1, name: 1 })
      .lean(),
    POSSession.findOne({ status: "open" }).lean(),
    // Today's sales count + revenue
    Sale.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
    ]),
  ]);

  const todayStats = todaySales[0] || { count: 0, revenue: 0 };

  return {
    products: items.map((item) => ({
      _id: item._id.toString(),
      name: item.name,
      price: item.price,
      category: item.category,
      emoji: item.emoji,
    })),
    session: activeSession
      ? {
          _id: activeSession._id.toString(),
          openedAt: activeSession.openedAt.toISOString(),
          openingCash: activeSession.openingCash,
          salesCount: activeSession.salesCount,
          totalRevenue: activeSession.totalRevenue,
        }
      : null,
    todaySalesCount: todayStats.count,
    todayRevenue: todayStats.revenue,
  };
}

// ─── Server Action ────────────────────────────────────────
export async function action({ request }: Route.ActionArgs) {
  await connectDB();
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  switch (intent) {
    case "openSession": {
      // Close any stale open sessions first
      await POSSession.updateMany({ status: "open" }, { status: "closed", closedAt: new Date() });
      await POSSession.create({
        openingCash: Number(formData.get("openingCash")),
        openedAt: new Date(),
        status: "open",
      });
      break;
    }

    case "closeSession": {
      const sessionId = formData.get("sessionId") as string;
      const closingCash = Number(formData.get("closingCash"));
      const notes = (formData.get("notes") as string) || "";

      // Calculate totals for the session
      const sales = await Sale.find({ sessionId });
      const salesCount = sales.length;
      const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);

      await POSSession.findByIdAndUpdate(sessionId, {
        status: "closed",
        closedAt: new Date(),
        closingCash,
        notes,
        salesCount,
        totalRevenue,
      });
      break;
    }

    case "checkout": {
      const sessionId = formData.get("sessionId") as string;
      const itemsJson = formData.get("items") as string;
      const paymentMethod = formData.get("paymentMethod") as "cash" | "credit" | "debit";
      const items = JSON.parse(itemsJson);

      // Tax-inclusive: prices already include 16% IVA
      const total = items.reduce((sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity, 0);
      const subtotal = total / 1.16;
      const tax = total - subtotal;

      await Sale.create({
        sessionId,
        items: items.map((i: { _id: string; name: string; emoji: string; price: number; quantity: number }) => ({
          productId: i._id,
          name: i.name,
          emoji: i.emoji,
          price: i.price,
          quantity: i.quantity,
        })),
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
        paymentMethod,
      });

      // Update session running totals
      await POSSession.findByIdAndUpdate(sessionId, {
        $inc: { salesCount: 1, totalRevenue: Math.round(total * 100) / 100 },
      });

      break;
    }
  }

  return { ok: true };
}

// ─── Types ────────────────────────────────────────────────
interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  emoji: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface SessionData {
  _id: string;
  openedAt: string;
  openingCash: number;
  salesCount: number;
  totalRevenue: number;
}

// ─── Component ────────────────────────────────────────────
export default function POS() {
  const { products, session, todaySalesCount, todayRevenue } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);

  // Modals
  const [openSessionModal, setOpenSessionModal] = useState(false);
  const [closeSessionModal, setCloseSessionModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [openingCash, setOpeningCash] = useState(0);
  const [closingCash, setClosingCash] = useState(0);
  const [closeNotes, setCloseNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit" | "debit">("cash");

  const activeSession = session as SessionData | null;
  const categories = ["All", ...Array.from(new Set((products as Product[]).map((p) => p.category)))];

  const filteredProducts = (products as Product[]).filter((p) => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item._id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
  };

  // Tax-inclusive: prices already include 16% IVA
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotal = total / 1.16;
  const tax = total - subtotal;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ── Session handlers ───────────────────────────────────
  const handleOpenSession = () => {
    const fd = new FormData();
    fd.set("intent", "openSession");
    fd.set("openingCash", String(openingCash));
    fetcher.submit(fd, { method: "post" });
    setOpenSessionModal(false);
    setOpeningCash(0);
  };

  const handleCloseSession = () => {
    if (!activeSession) return;
    const fd = new FormData();
    fd.set("intent", "closeSession");
    fd.set("sessionId", activeSession._id);
    fd.set("closingCash", String(closingCash));
    fd.set("notes", closeNotes);
    fetcher.submit(fd, { method: "post" });
    setCloseSessionModal(false);
    setClosingCash(0);
    setCloseNotes("");
  };

  const handleCheckout = () => {
    if (!activeSession || cart.length === 0) return;
    const fd = new FormData();
    fd.set("intent", "checkout");
    fd.set("sessionId", activeSession._id);
    fd.set("paymentMethod", paymentMethod);
    fd.set("items", JSON.stringify(cart));
    fetcher.submit(fd, { method: "post" });
    setPaymentModal(false);
    setShowCheckout(true);
    setTimeout(() => {
      setShowCheckout(false);
      setCart([]);
    }, 1500);
  };

  const sessionElapsed = activeSession
    ? Math.floor((Date.now() - new Date(activeSession.openedAt).getTime()) / 60000)
    : 0;
  const sessionHours = Math.floor(sessionElapsed / 60);
  const sessionMinutes = sessionElapsed % 60;

  // ── No Session: Open Register ──────────────────────────
  if (!activeSession) {
    return (
      <div className="page" id="pos-page">
        <div className="pos-no-session">
          <div className="pos-no-session-card">
            <div className="pos-no-session-icon">🏪</div>
            <h1 className="pos-no-session-title">Register Closed</h1>
            <p className="pos-no-session-desc">Open the register to start processing sales</p>

            <div className="pos-today-preview">
              <div className="pos-today-stat">
                <span className="pos-today-stat-value">{todaySalesCount as number}</span>
                <span className="pos-today-stat-label">Sales Today</span>
              </div>
              <div className="pos-today-stat">
                <span className="pos-today-stat-value">${(todayRevenue as number).toFixed(2)}</span>
                <span className="pos-today-stat-label">Revenue Today</span>
              </div>
            </div>

            <button className="btn btn--primary btn--lg" onClick={() => setOpenSessionModal(true)} id="btn-open-register">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2" />
                <path d="M6 12h.01M18 12h.01" />
              </svg>
              Open Register
            </button>
          </div>
        </div>

        {/* Open Session Modal */}
        {openSessionModal && (
          <div className="modal-overlay" onClick={() => setOpenSessionModal(false)} id="open-session-modal">
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Open Register</h2>
                <button className="modal-close" onClick={() => setOpenSessionModal(false)} aria-label="Close">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Starting Cash in Drawer ($)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={openingCash}
                    onChange={(e) => setOpeningCash(Number(e.target.value))}
                    autoFocus
                    placeholder="0.00"
                  />
                  <span className="form-hint">Count all bills and coins in the cash drawer</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn--ghost" onClick={() => setOpenSessionModal(false)}>Cancel</button>
                <button className="btn btn--primary" onClick={handleOpenSession} id="btn-confirm-open">
                  Open Register
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Active Session: POS Grid ───────────────────────────
  return (
    <div className="pos-layout" id="pos-page">
      {/* ── Product Panel ─────────────────────────── */}
      <div className="pos-products">
        {/* Session Info Bar */}
        <div className="pos-session-bar" id="pos-session-bar">
          <div className="pos-session-info">
            <div className="pos-session-status">
              <span className="pos-session-dot" />
              <span>Register Open</span>
            </div>
            <span className="pos-session-meta">
              {sessionHours > 0 ? `${sessionHours}h ${sessionMinutes}m` : `${sessionMinutes}m`} ·
              {" "}{activeSession.salesCount} sale{activeSession.salesCount !== 1 ? "s" : ""} ·
              {" "}${activeSession.totalRevenue.toFixed(2)}
            </span>
          </div>
          <button className="btn btn--ghost btn--sm pos-close-btn" onClick={() => setCloseSessionModal(true)} id="btn-close-register">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Close Register
          </button>
        </div>

        <div className="pos-products-header">
          <div>
            <h1 className="page-title">Point of Sale</h1>
            <p className="page-subtitle">Select items to add to the order</p>
          </div>
        </div>

        {/* Search */}
        <div className="pos-search-bar" id="pos-search">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pos-search-icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pos-search-input" />
        </div>

        {/* Product Grid */}
        {(products as Product[]).length === 0 ? (
          <div className="empty-state" style={{ padding: "64px 24px", marginTop: "32px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", flex: 1, margin: 24, alignSelf: "flex-start" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="empty-state-icon">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <h2>No items in POS</h2>
            <p>Add items to inventory and check "Include in POS" to see them here.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state" style={{ padding: "64px 24px", marginTop: "32px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "16px", flex: 1, margin: 24, alignSelf: "flex-start" }}>
            <h2>No products found</h2>
            <p>No products match your current category or search.</p>
          </div>
        ) : (
          <div className="pos-product-grid" id="pos-product-grid">
            {filteredProducts.map((product) => (
              <button key={product._id} className="pos-product-card" onClick={() => addToCart(product)} id={`product-${product._id}`}>
                <span className="pos-product-emoji">{product.emoji}</span>
                <span className="pos-product-name">{product.name}</span>
                <span className="pos-product-price">${product.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Cart Panel ────────────────────────────── */}
      <div className="pos-cart" id="pos-cart">
        <div className="pos-cart-header">
          <h2 className="pos-cart-title">Current Order</h2>
          <span className="pos-cart-badge">{totalItems}</span>
        </div>

        {cart.length === 0 ? (
          <div className="pos-cart-empty">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="pos-cart-empty-icon">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <p>No items in order</p>
            <span>Tap a product to add it</span>
          </div>
        ) : (
          <>
            <div className="pos-cart-items">
              {cart.map((item) => (
                <div key={item._id} className="pos-cart-item" id={`cart-item-${item._id}`}>
                  <div className="pos-cart-item-info">
                    <span className="pos-cart-item-emoji">{item.emoji}</span>
                    <div className="pos-cart-item-details">
                      <span className="pos-cart-item-name">{item.name}</span>
                      <span className="pos-cart-item-price">${item.price.toFixed(2)} each</span>
                    </div>
                  </div>
                  <div className="pos-cart-item-actions">
                    <div className="pos-qty-control">
                      <button className="pos-qty-btn" onClick={() => updateQuantity(item._id, -1)} aria-label="Decrease quantity">−</button>
                      <span className="pos-qty-value">{item.quantity}</span>
                      <button className="pos-qty-btn" onClick={() => updateQuantity(item._id, 1)} aria-label="Increase quantity">+</button>
                    </div>
                    <span className="pos-cart-item-total">${(item.price * item.quantity).toFixed(2)}</span>
                    <button className="pos-remove-btn" onClick={() => removeFromCart(item._id)} aria-label="Remove item">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pos-cart-footer">
              <div className="pos-cart-summary">
                <div className="pos-summary-row">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="pos-summary-row">
                  <span>IVA (16%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="pos-summary-row pos-summary-total">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                className={`pos-checkout-btn ${showCheckout ? "pos-checkout-btn--success" : ""}`}
                onClick={() => { if (!showCheckout) setPaymentModal(true); }}
                disabled={showCheckout}
                id="pos-checkout"
              >
                {showCheckout ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Payment Successful!
                  </>
                ) : (
                  <>Charge ${total.toFixed(2)}</>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Payment Method Modal ──────────────────── */}
      {paymentModal && (
        <div className="modal-overlay" onClick={() => setPaymentModal(false)} id="payment-modal">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Select Payment Method</h2>
              <button className="modal-close" onClick={() => setPaymentModal(false)} aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="pos-payment-total">
                <span className="pos-payment-total-label">Total Amount</span>
                <span className="pos-payment-total-value">${total.toFixed(2)}</span>
              </div>

              <div className="pos-payment-methods">
                <button
                  className={`pos-payment-option ${paymentMethod === "cash" ? "pos-payment-option--active" : ""}`}
                  onClick={() => setPaymentMethod("cash")}
                >
                  <span className="pos-payment-icon">💵</span>
                  <span className="pos-payment-label">Cash</span>
                </button>
                <button
                  className={`pos-payment-option ${paymentMethod === "credit" ? "pos-payment-option--active" : ""}`}
                  onClick={() => setPaymentMethod("credit")}
                >
                  <span className="pos-payment-icon">💳</span>
                  <span className="pos-payment-label">Credit</span>
                </button>
                <button
                  className={`pos-payment-option ${paymentMethod === "debit" ? "pos-payment-option--active" : ""}`}
                  onClick={() => setPaymentMethod("debit")}
                >
                  <span className="pos-payment-icon">🏦</span>
                  <span className="pos-payment-label">Debit</span>
                </button>
              </div>

              <div className="pos-payment-breakdown">
                <div className="pos-summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="pos-summary-row"><span>IVA (16%)</span><span>${tax.toFixed(2)}</span></div>
                <div className="pos-summary-row pos-summary-total"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn--ghost" onClick={() => setPaymentModal(false)}>Cancel</button>
              <button className="btn btn--primary btn--lg" onClick={handleCheckout} id="btn-confirm-payment">
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Close Session Modal ──────────────────── */}
      {closeSessionModal && (
        <div className="modal-overlay" onClick={() => setCloseSessionModal(false)} id="close-session-modal">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Close Register</h2>
              <button className="modal-close" onClick={() => setCloseSessionModal(false)} aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="pos-close-summary">
                <div className="pos-close-stat">
                  <span className="pos-close-stat-label">Session Sales</span>
                  <span className="pos-close-stat-value">{activeSession.salesCount}</span>
                </div>
                <div className="pos-close-stat">
                  <span className="pos-close-stat-label">Session Revenue</span>
                  <span className="pos-close-stat-value">${activeSession.totalRevenue.toFixed(2)}</span>
                </div>
                <div className="pos-close-stat">
                  <span className="pos-close-stat-label">Opening Cash</span>
                  <span className="pos-close-stat-value">${activeSession.openingCash.toFixed(2)}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Closing Cash in Drawer ($)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={closingCash}
                  onChange={(e) => setClosingCash(Number(e.target.value))}
                  autoFocus
                  placeholder="0.00"
                />
                <span className="form-hint">Count all bills and coins in the cash drawer</span>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea
                  className="form-input form-textarea"
                  rows={2}
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Any observations about the shift..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn--ghost" onClick={() => setCloseSessionModal(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={handleCloseSession} id="btn-confirm-close" style={{ background: "#dc2626" }}>
                Close Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
