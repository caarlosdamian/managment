import { useState } from "react";
import { useLoaderData } from "react-router";
import type { Route } from "./+types/sales";
import { connectDB } from "~/db/connection.server";
import { Sale } from "~/db/models/sale.server";
import { POSSession } from "~/db/models/posSession.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sales History | Management" },
    { name: "description", content: "View sales history and POS sessions" },
  ];
}

// ─── Server Loader ────────────────────────────────────────
export async function loader() {
  await connectDB();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [sales, sessions, todayAgg] = await Promise.all([
    Sale.find().sort({ createdAt: -1 }).limit(100).lean(),
    POSSession.find().sort({ openedAt: -1 }).limit(50).lean(),
    Sale.aggregate([
      { $match: { createdAt: { $gte: today } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: "$total" },
          tax: { $sum: "$tax" },
          avgTicket: { $avg: "$total" },
        },
      },
    ]),
  ]);

  const todayStats = todayAgg[0] || { count: 0, revenue: 0, tax: 0, avgTicket: 0 };

  return {
    sales: sales.map((s) => ({
      _id: s._id.toString(),
      sessionId: s.sessionId.toString(),
      items: s.items.map((i: { name: string; emoji: string; price: number; quantity: number }) => ({
        name: i.name,
        emoji: i.emoji,
        price: i.price,
        quantity: i.quantity,
      })),
      subtotal: s.subtotal,
      tax: s.tax,
      total: s.total,
      paymentMethod: s.paymentMethod,
      createdAt: s.createdAt.toISOString(),
    })),
    sessions: sessions.map((s) => ({
      _id: s._id.toString(),
      openedAt: s.openedAt.toISOString(),
      closedAt: s.closedAt ? s.closedAt.toISOString() : null,
      openingCash: s.openingCash,
      closingCash: s.closingCash,
      status: s.status,
      salesCount: s.salesCount,
      totalRevenue: s.totalRevenue,
      notes: s.notes,
    })),
    todaySalesCount: todayStats.count,
    todayRevenue: todayStats.revenue,
    todayTax: todayStats.tax,
    todayAvgTicket: todayStats.avgTicket,
  };
}

// ─── Types ────────────────────────────────────────────────
interface SaleData {
  _id: string;
  sessionId: string;
  items: { name: string; emoji: string; price: number; quantity: number }[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  createdAt: string;
}

interface SessionData {
  _id: string;
  openedAt: string;
  closedAt: string | null;
  openingCash: number;
  closingCash: number | null;
  status: string;
  salesCount: number;
  totalRevenue: number;
  notes: string;
}

// ─── Component ────────────────────────────────────────────
export default function Sales() {
  const { sales, sessions, todaySalesCount, todayRevenue, todayTax, todayAvgTicket } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<"sales" | "sessions">("sales");
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  const saleList = sales as SaleData[];
  const sessionList = sessions as SessionData[];

  const paymentIcon: Record<string, string> = { cash: "💵", credit: "💳", debit: "🏦" };
  const paymentLabel: Record<string, string> = { cash: "Cash", credit: "Credit", debit: "Debit" };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const getDuration = (opened: string, closed: string | null) => {
    if (!closed) return "Active";
    const ms = new Date(closed).getTime() - new Date(opened).getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="page page--wide" id="sales-page">
      <div className="page-header">
        <h1 className="page-title">Sales</h1>
        <p className="page-subtitle">Transaction history and POS session records</p>
      </div>

      {/* Stats */}
      <div className="inv-stats" id="sales-stats">
        <div className="inv-stat-card">
          <div className="inv-stat-dot inv-stat-dot--blue" />
          <div className="inv-stat-content">
            <span className="inv-stat-value">{todaySalesCount as number}</span>
            <span className="inv-stat-label">Sales Today</span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-dot inv-stat-dot--green" />
          <div className="inv-stat-content">
            <span className="inv-stat-value">${(todayRevenue as number).toFixed(2)}</span>
            <span className="inv-stat-label">Revenue Today</span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-dot inv-stat-dot--amber" />
          <div className="inv-stat-content">
            <span className="inv-stat-value">${(todayTax as number).toFixed(2)}</span>
            <span className="inv-stat-label">IVA Collected</span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-dot" style={{ background: "#6366f1" }} />
          <div className="inv-stat-content">
            <span className="inv-stat-value">${(todayAvgTicket as number).toFixed(2)}</span>
            <span className="inv-stat-label">Avg Ticket</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sales-tabs" id="sales-tabs">
        <button className={`sales-tab ${activeTab === "sales" ? "sales-tab--active" : ""}`} onClick={() => setActiveTab("sales")}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Sales History
        </button>
        <button className={`sales-tab ${activeTab === "sessions" ? "sales-tab--active" : ""}`} onClick={() => setActiveTab("sessions")}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          POS Sessions
        </button>
      </div>

      {/* ── Sales History Tab ─────────────────────── */}
      {activeTab === "sales" && (
        <div className="inv-table-wrapper" id="sales-table">
          {saleList.length === 0 ? (
            <div className="empty-state">
              <span style={{ fontSize: 48, marginBottom: 12 }}>🧾</span>
              <h2>No sales yet</h2>
              <p>Complete a checkout in the POS to see sales here.</p>
            </div>
          ) : (
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Items</th>
                  <th>Subtotal</th>
                  <th>IVA</th>
                  <th>Total</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {saleList.map((sale) => (
                  <>
                    <tr
                      key={sale._id}
                      className="sales-row"
                      onClick={() => setExpandedSaleId(expandedSaleId === sale._id ? null : sale._id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <div className="sales-date-cell">
                          <span className="sales-date">{formatDate(sale.createdAt)}</span>
                          <span className="sales-time">{formatTime(sale.createdAt)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="sales-items-preview">
                          {sale.items.slice(0, 3).map((item, i) => (
                            <span key={i} className="sales-item-chip">
                              {item.emoji} {item.name} ×{item.quantity}
                            </span>
                          ))}
                          {sale.items.length > 3 && (
                            <span className="sales-item-chip sales-item-chip--more">+{sale.items.length - 3} more</span>
                          )}
                        </div>
                      </td>
                      <td>${sale.subtotal.toFixed(2)}</td>
                      <td>${sale.tax.toFixed(2)}</td>
                      <td className="inv-value-cell">${sale.total.toFixed(2)}</td>
                      <td>
                        <span className={`sales-payment-badge sales-payment-badge--${sale.paymentMethod}`}>
                          {paymentIcon[sale.paymentMethod]} {paymentLabel[sale.paymentMethod]}
                        </span>
                      </td>
                    </tr>
                    {expandedSaleId === sale._id && (
                      <tr key={`${sale._id}-details`} className="sales-expanded-row">
                        <td colSpan={6}>
                          <div className="sales-expanded-content">
                            <div className="sales-expanded-items">
                              {sale.items.map((item, i) => (
                                <div key={i} className="sales-expanded-item">
                                  <span className="sales-expanded-emoji">{item.emoji}</span>
                                  <span className="sales-expanded-name">{item.name}</span>
                                  <span className="sales-expanded-qty">×{item.quantity}</span>
                                  <span className="sales-expanded-price">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── POS Sessions Tab ──────────────────────── */}
      {activeTab === "sessions" && (
        <div className="inv-table-wrapper" id="sessions-table">
          {sessionList.length === 0 ? (
            <div className="empty-state">
              <span style={{ fontSize: 48, marginBottom: 12 }}>🏪</span>
              <h2>No sessions yet</h2>
              <p>Open the register in the POS to start tracking sessions.</p>
            </div>
          ) : (
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Opened</th>
                  <th>Closed</th>
                  <th>Duration</th>
                  <th>Opening Cash</th>
                  <th>Closing Cash</th>
                  <th>Sales</th>
                  <th>Revenue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sessionList.map((sess) => (
                  <tr key={sess._id}>
                    <td>
                      <div className="sales-date-cell">
                        <span className="sales-date">{formatDate(sess.openedAt)}</span>
                        <span className="sales-time">{formatTime(sess.openedAt)}</span>
                      </div>
                    </td>
                    <td>
                      {sess.closedAt ? (
                        <div className="sales-date-cell">
                          <span className="sales-date">{formatDate(sess.closedAt)}</span>
                          <span className="sales-time">{formatTime(sess.closedAt)}</span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)" }}>—</span>
                      )}
                    </td>
                    <td>{getDuration(sess.openedAt, sess.closedAt)}</td>
                    <td>${sess.openingCash.toFixed(2)}</td>
                    <td>{sess.closingCash !== null ? `$${sess.closingCash.toFixed(2)}` : "—"}</td>
                    <td>{sess.salesCount}</td>
                    <td className="inv-value-cell">${sess.totalRevenue.toFixed(2)}</td>
                    <td>
                      <span className={`inv-status ${sess.status === "open" ? "inv-status--success" : "inv-status--default"}`}>
                        {sess.status === "open" ? "Active" : "Closed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
