import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import type { Route } from "./+types/inventory";
import { connectDB } from "~/db/connection.server";
import { InventoryItem } from "~/db/models/inventory.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Inventory | Management" },
    { name: "description", content: "Track and manage your inventory" },
  ];
}

// ─── Server Loader ────────────────────────────────────────
export async function loader() {
  await connectDB();
  const items = await InventoryItem.find().sort({ name: 1 }).lean();
  return {
    items: items.map((item) => ({
      _id: item._id.toString(),
      name: item.name,
      sku: item.sku,
      category: item.category,
      stock: item.stock,
      minStock: item.minStock,
      price: item.price,
      cost: item.cost,
      emoji: item.emoji,
      showInPOS: item.showInPOS,
    })),
  };
}

// ─── Server Action ────────────────────────────────────────
export async function action({ request }: Route.ActionArgs) {
  await connectDB();
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  switch (intent) {
    case "create": {
      await InventoryItem.create({
        name: formData.get("name"),
        sku: formData.get("sku"),
        category: formData.get("category"),
        stock: Number(formData.get("stock")),
        minStock: Number(formData.get("minStock")),
        price: Number(formData.get("price")),
        cost: Number(formData.get("cost")),
        emoji: formData.get("emoji"),
        showInPOS: formData.get("showInPOS") === "true",
      });
      break;
    }
    case "update": {
      const id = formData.get("id") as string;
      await InventoryItem.findByIdAndUpdate(id, {
        name: formData.get("name"),
        sku: formData.get("sku"),
        category: formData.get("category"),
        stock: Number(formData.get("stock")),
        minStock: Number(formData.get("minStock")),
        price: Number(formData.get("price")),
        cost: Number(formData.get("cost")),
        emoji: formData.get("emoji"),
        showInPOS: formData.get("showInPOS") === "true",
      });
      break;
    }
    case "delete": {
      const id = formData.get("id") as string;
      await InventoryItem.findByIdAndDelete(id);
      break;
    }
    case "togglePOS": {
      const id = formData.get("id") as string;
      const item = await InventoryItem.findById(id);
      if (item) {
        item.showInPOS = !item.showInPOS;
        await item.save();
      }
      break;
    }
  }

  return { ok: true };
}

// ─── Types ────────────────────────────────────────────────
interface InventoryItemData {
  _id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  cost: number;
  emoji: string;
  showInPOS: boolean;
}

type SortField = "name" | "stock" | "price" | "cost";
type SortDir = "asc" | "desc";

const inventoryCategories = ["Beverages", "Food", "Desserts", "Green Beans", "Supplies"];
const emojiOptions = ["☕", "🥛", "🍫", "🍵", "🥤", "🥐", "🥯", "🧁", "🥪", "🥗", "🍪", "🍰", "🍦", "💧", "🫘", "📦"];

function getStockStatus(item: InventoryItemData) {
  if (item.stock === 0) return { label: "Out of Stock", className: "inv-status--danger" };
  if (item.stock <= item.minStock) return { label: "Low Stock", className: "inv-status--warning" };
  return { label: "In Stock", className: "inv-status--success" };
}

// ─── Component ────────────────────────────────────────────
export default function Inventory() {
  const { items } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemData | null>(null);
  const [formData, setFormData] = useState({
    name: "", sku: "", category: "Beverages", stock: 0, minStock: 0, price: 0, cost: 0, emoji: "📦", showInPOS: true,
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const categories = ["All", ...Array.from(new Set(items.map((i: InventoryItemData) => i.category)))];

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = (items as InventoryItemData[])
    .filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = filterCategory === "All" || item.category === filterCategory;
      const status = getStockStatus(item);
      const matchStatus =
        filterStatus === "All" ||
        (filterStatus === "Low" && status.label === "Low Stock") ||
        (filterStatus === "Out" && status.label === "Out of Stock") ||
        (filterStatus === "In" && status.label === "In Stock");
      return matchSearch && matchCat && matchStatus;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "name") return dir * a.name.localeCompare(b.name);
      return dir * (a[sortField] - b[sortField]);
    });

  const totalItems = items.reduce((s: number, i: InventoryItemData) => s + i.stock, 0);
  const lowStockCount = items.filter((i: InventoryItemData) => i.stock > 0 && i.stock <= i.minStock).length;
  const outOfStockCount = items.filter((i: InventoryItemData) => i.stock === 0).length;
  const totalValue = items.reduce((s: number, i: InventoryItemData) => s + i.stock * i.cost, 0);
  const posItemCount = items.filter((i: InventoryItemData) => i.showInPOS).length;

  // ── Modal handlers ─────────────────────────────────
  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: "", sku: "", category: "Beverages", stock: 0, minStock: 0, price: 0, cost: 0, emoji: "📦", showInPOS: true });
    setModalOpen(true);
  };

  const openEditModal = (item: InventoryItemData) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku,
      category: item.category,
      stock: item.stock,
      minStock: item.minStock,
      price: item.price,
      cost: item.cost,
      emoji: item.emoji,
      showInPOS: item.showInPOS,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.sku.trim()) return;

    const fd = new FormData();
    fd.set("intent", editingItem ? "update" : "create");
    if (editingItem) fd.set("id", editingItem._id);
    fd.set("name", formData.name);
    fd.set("sku", formData.sku);
    fd.set("category", formData.category);
    fd.set("stock", String(formData.stock));
    fd.set("minStock", String(formData.minStock));
    fd.set("price", String(formData.price));
    fd.set("cost", String(formData.cost));
    fd.set("emoji", formData.emoji);
    fd.set("showInPOS", String(formData.showInPOS));

    fetcher.submit(fd, { method: "post" });
    closeModal();
  };

  const handleDelete = (id: string) => {
    const fd = new FormData();
    fd.set("intent", "delete");
    fd.set("id", id);
    fetcher.submit(fd, { method: "post" });
    setDeleteConfirm(null);
  };

  const togglePOS = (id: string) => {
    const fd = new FormData();
    fd.set("intent", "togglePOS");
    fd.set("id", id);
    fetcher.submit(fd, { method: "post" });
  };

  const updateField = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className={`inv-sort-icon ${sortField === field ? "inv-sort-icon--active" : ""}`}>
      {sortField === field && sortDir === "desc" ? "↓" : "↑"}
    </span>
  );

  return (
    <div className="page page--wide" id="inventory-page">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Track stock levels and manage your products</p>
        </div>
        <button className="btn btn--primary" onClick={openAddModal} id="btn-add-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="inv-stats" id="inventory-stats">
        <div className="inv-stat-card">
          <div className="inv-stat-dot inv-stat-dot--blue" />
          <div className="inv-stat-content">
            <span className="inv-stat-value">{totalItems}</span>
            <span className="inv-stat-label">Total Items</span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-dot inv-stat-dot--amber" />
          <div className="inv-stat-content">
            <span className="inv-stat-value">{lowStockCount}</span>
            <span className="inv-stat-label">Low Stock</span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-dot inv-stat-dot--red" />
          <div className="inv-stat-content">
            <span className="inv-stat-value">{outOfStockCount}</span>
            <span className="inv-stat-label">Out of Stock</span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-dot inv-stat-dot--green" />
          <div className="inv-stat-content">
            <span className="inv-stat-value">${totalValue.toFixed(0)}</span>
            <span className="inv-stat-label">Inventory Value</span>
          </div>
        </div>
        <div className="inv-stat-card">
          <div className="inv-stat-dot" style={{ background: "#6366f1" }} />
          <div className="inv-stat-content">
            <span className="inv-stat-value">{posItemCount}</span>
            <span className="inv-stat-label">In POS</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="inv-toolbar" id="inventory-toolbar">
        <div className="inv-search">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inv-search-icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="inv-search-input"
          />
        </div>
        <div className="inv-filters">
          <select className="inv-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} id="inv-filter-category">
            {categories.map((c: string) => (
              <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
            ))}
          </select>
          <select className="inv-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} id="inv-filter-status">
            <option value="All">All Status</option>
            <option value="In">In Stock</option>
            <option value="Low">Low Stock</option>
            <option value="Out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="inv-table-wrapper" id="inventory-table">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th className="inv-th-sortable" onClick={() => toggleSort("stock")}>
                Stock <SortIcon field="stock" />
              </th>
              <th>Status</th>
              <th className="inv-th-sortable" onClick={() => toggleSort("price")}>
                Price <SortIcon field="price" />
              </th>
              <th className="inv-th-sortable" onClick={() => toggleSort("cost")}>
                Cost <SortIcon field="cost" />
              </th>
              <th>Value</th>
              <th>POS</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const status = getStockStatus(item);
              return (
                <tr key={item._id} id={`inv-row-${item._id}`}>
                  <td>
                    <div className="inv-product-cell">
                      <span className="inv-product-emoji">{item.emoji}</span>
                      <span className="inv-product-name">{item.name}</span>
                    </div>
                  </td>
                  <td><span className="inv-sku">{item.sku}</span></td>
                  <td>{item.category}</td>
                  <td>
                    <div className="inv-stock-cell">
                      <span>{item.stock}</span>
                      <div className="inv-stock-bar">
                        <div
                          className={`inv-stock-fill ${
                            item.stock === 0 ? "inv-stock-fill--danger"
                              : item.stock <= item.minStock ? "inv-stock-fill--warning"
                              : "inv-stock-fill--ok"
                          }`}
                          style={{ width: `${Math.min(100, (item.stock / (item.minStock * 3)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td><span className={`inv-status ${status.className}`}>{status.label}</span></td>
                  <td>{item.price > 0 ? `$${item.price.toFixed(2)}` : "—"}</td>
                  <td>${item.cost.toFixed(2)}</td>
                  <td className="inv-value-cell">${(item.stock * item.cost).toFixed(2)}</td>
                  <td>
                    <button
                      className={`inv-pos-toggle ${item.showInPOS ? "inv-pos-toggle--on" : ""}`}
                      onClick={() => togglePOS(item._id)}
                      title={item.showInPOS ? "Visible in POS" : "Hidden from POS"}
                      aria-label="Toggle POS visibility"
                    >
                      <span className="inv-pos-toggle-track">
                        <span className="inv-pos-toggle-thumb" />
                      </span>
                    </button>
                  </td>
                  <td>
                    <div className="inv-actions">
                      <button className="inv-action-btn inv-action-btn--edit" onClick={() => openEditModal(item)} title="Edit" aria-label="Edit item">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      {deleteConfirm === item._id ? (
                        <div className="inv-delete-confirm">
                          <button className="inv-action-btn inv-action-btn--danger" onClick={() => handleDelete(item._id)} title="Confirm delete">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                          <button className="inv-action-btn" onClick={() => setDeleteConfirm(null)} title="Cancel">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button className="inv-action-btn inv-action-btn--delete" onClick={() => setDeleteConfirm(item._id)} title="Delete" aria-label="Delete item">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="inv-no-results">No items match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Add/Edit Modal ──────────────────────────────── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal} id="inventory-modal">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingItem ? "Edit Item" : "Add New Item"}</h2>
              <button className="modal-close" onClick={closeModal} aria-label="Close modal">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group form-group--wide">
                  <label className="form-label">Product Name</label>
                  <input className="form-input" type="text" value={formData.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. Espresso Beans" />
                </div>
                <div className="form-group">
                  <label className="form-label">Icon</label>
                  <div className="form-emoji-grid">
                    {emojiOptions.map((e) => (
                      <button key={e} type="button" className={`form-emoji-btn ${formData.emoji === e ? "form-emoji-btn--active" : ""}`} onClick={() => updateField("emoji", e)}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input className="form-input" type="text" value={formData.sku} onChange={(e) => updateField("sku", e.target.value)} placeholder="e.g. BEV-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={formData.category} onChange={(e) => updateField("category", e.target.value)}>
                    {inventoryCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Stock Quantity</label>
                  <input className="form-input" type="number" min="0" value={formData.stock} onChange={(e) => updateField("stock", Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Stock Level</label>
                  <input className="form-input" type="number" min="0" value={formData.minStock} onChange={(e) => updateField("minStock", Number(e.target.value))} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Price ($)</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={formData.price} onChange={(e) => updateField("price", Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost ($)</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={formData.cost} onChange={(e) => updateField("cost", Number(e.target.value))} />
                </div>
              </div>

              {/* Show in POS toggle */}
              <div className="form-toggle-row">
                <div className="form-toggle-info">
                  <span className="form-toggle-title">Show in Point of Sale</span>
                  <span className="form-toggle-desc">
                    {formData.showInPOS ? "This item will appear in the POS product grid" : "This item is inventory-only (e.g. raw materials)"}
                  </span>
                </div>
                <button
                  type="button"
                  className={`inv-pos-toggle ${formData.showInPOS ? "inv-pos-toggle--on" : ""}`}
                  onClick={() => updateField("showInPOS", !formData.showInPOS)}
                  aria-label="Toggle POS visibility"
                >
                  <span className="inv-pos-toggle-track">
                    <span className="inv-pos-toggle-thumb" />
                  </span>
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn--primary" onClick={handleSave} disabled={!formData.name.trim() || !formData.sku.trim()} id="btn-save-item">
                {editingItem ? "Save Changes" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
