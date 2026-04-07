import { useState } from "react";
import type { Route } from "./+types/inventory";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Inventory | Management" },
    { name: "description", content: "Track and manage your inventory" },
  ];
}

interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  cost: number;
  emoji: string;
}

const inventoryData: InventoryItem[] = [
  { id: 1, name: "Espresso Beans", sku: "BEV-001", category: "Beverages", stock: 45, minStock: 20, price: 3.5, cost: 1.2, emoji: "☕" },
  { id: 2, name: "Cappuccino Mix", sku: "BEV-002", category: "Beverages", stock: 32, minStock: 15, price: 4.5, cost: 1.8, emoji: "☕" },
  { id: 3, name: "Latte Syrup", sku: "BEV-003", category: "Beverages", stock: 8, minStock: 10, price: 5.0, cost: 2.0, emoji: "🥛" },
  { id: 4, name: "Mocha Powder", sku: "BEV-004", category: "Beverages", stock: 25, minStock: 10, price: 5.5, cost: 2.2, emoji: "🍫" },
  { id: 5, name: "Green Tea Leaves", sku: "BEV-005", category: "Beverages", stock: 18, minStock: 10, price: 3.0, cost: 1.0, emoji: "🍵" },
  { id: 6, name: "Smoothie Base", sku: "BEV-006", category: "Beverages", stock: 5, minStock: 12, price: 6.0, cost: 2.5, emoji: "🥤" },
  { id: 7, name: "Croissants", sku: "FOD-001", category: "Food", stock: 24, minStock: 10, price: 3.5, cost: 1.5, emoji: "🥐" },
  { id: 8, name: "Bagels", sku: "FOD-002", category: "Food", stock: 30, minStock: 15, price: 4.0, cost: 1.8, emoji: "🥯" },
  { id: 9, name: "Muffins", sku: "FOD-003", category: "Food", stock: 3, minStock: 8, price: 3.0, cost: 1.2, emoji: "🧁" },
  { id: 10, name: "Sandwich Bread", sku: "FOD-004", category: "Food", stock: 40, minStock: 20, price: 7.5, cost: 3.0, emoji: "🥪" },
  { id: 11, name: "Salad Mix", sku: "FOD-005", category: "Food", stock: 12, minStock: 8, price: 8.0, cost: 3.5, emoji: "🥗" },
  { id: 12, name: "Cookies", sku: "FOD-006", category: "Food", stock: 50, minStock: 20, price: 2.5, cost: 0.8, emoji: "🍪" },
  { id: 13, name: "Cake Base", sku: "DES-001", category: "Desserts", stock: 15, minStock: 5, price: 5.0, cost: 2.0, emoji: "🍰" },
  { id: 14, name: "Brownie Mix", sku: "DES-002", category: "Desserts", stock: 22, minStock: 10, price: 3.5, cost: 1.2, emoji: "🟫" },
  { id: 15, name: "Ice Cream Tubs", sku: "DES-003", category: "Desserts", stock: 7, minStock: 10, price: 4.0, cost: 1.8, emoji: "🍦" },
  { id: 16, name: "Bottled Water", sku: "BEV-007", category: "Beverages", stock: 100, minStock: 30, price: 1.5, cost: 0.3, emoji: "💧" },
];

type SortField = "name" | "stock" | "price" | "cost";
type SortDir = "asc" | "desc";

function getStockStatus(item: InventoryItem) {
  if (item.stock === 0) return { label: "Out of Stock", className: "inv-status--danger" };
  if (item.stock <= item.minStock) return { label: "Low Stock", className: "inv-status--warning" };
  return { label: "In Stock", className: "inv-status--success" };
}

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const categories = ["All", ...Array.from(new Set(inventoryData.map((i) => i.category)))];

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = inventoryData
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

  const totalItems = inventoryData.reduce((s, i) => s + i.stock, 0);
  const lowStockCount = inventoryData.filter((i) => i.stock > 0 && i.stock <= i.minStock).length;
  const outOfStockCount = inventoryData.filter((i) => i.stock === 0).length;
  const totalValue = inventoryData.reduce((s, i) => s + i.stock * i.cost, 0);

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className={`inv-sort-icon ${sortField === field ? "inv-sort-icon--active" : ""}`}>
      {sortField === field && sortDir === "desc" ? "↓" : "↑"}
    </span>
  );

  return (
    <div className="page page--wide" id="inventory-page">
      <div className="page-header">
        <h1 className="page-title">Inventory</h1>
        <p className="page-subtitle">Track stock levels and manage your products</p>
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
          <select
            className="inv-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            id="inv-filter-category"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
            ))}
          </select>
          <select
            className="inv-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            id="inv-filter-status"
          >
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
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const status = getStockStatus(item);
              return (
                <tr key={item.id} id={`inv-row-${item.id}`}>
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
                            item.stock === 0
                              ? "inv-stock-fill--danger"
                              : item.stock <= item.minStock
                              ? "inv-stock-fill--warning"
                              : "inv-stock-fill--ok"
                          }`}
                          style={{ width: `${Math.min(100, (item.stock / (item.minStock * 3)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`inv-status ${status.className}`}>{status.label}</span>
                  </td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>${item.cost.toFixed(2)}</td>
                  <td className="inv-value-cell">${(item.stock * item.cost).toFixed(2)}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="inv-no-results">
                  No items match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
