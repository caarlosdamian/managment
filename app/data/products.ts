// Shared product/inventory data used by both Inventory and POS routes.
// When a backend is added, this file becomes the API layer.

export interface InventoryItem {
  id: number;
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

export const inventoryCategories = ["Beverages", "Food", "Desserts", "Green Beans", "Supplies"];

export const initialInventory: InventoryItem[] = [
  // ── Beverages ──
  { id: 1, name: "Espresso Beans", sku: "BEV-001", category: "Beverages", stock: 45, minStock: 20, price: 3.5, cost: 1.2, emoji: "☕", showInPOS: true },
  { id: 2, name: "Cappuccino Mix", sku: "BEV-002", category: "Beverages", stock: 32, minStock: 15, price: 4.5, cost: 1.8, emoji: "☕", showInPOS: true },
  { id: 3, name: "Latte Syrup", sku: "BEV-003", category: "Beverages", stock: 8, minStock: 10, price: 5.0, cost: 2.0, emoji: "🥛", showInPOS: true },
  { id: 4, name: "Mocha Powder", sku: "BEV-004", category: "Beverages", stock: 25, minStock: 10, price: 5.5, cost: 2.2, emoji: "🍫", showInPOS: true },
  { id: 5, name: "Green Tea Leaves", sku: "BEV-005", category: "Beverages", stock: 18, minStock: 10, price: 3.0, cost: 1.0, emoji: "🍵", showInPOS: true },
  { id: 6, name: "Smoothie Base", sku: "BEV-006", category: "Beverages", stock: 5, minStock: 12, price: 6.0, cost: 2.5, emoji: "🥤", showInPOS: true },
  { id: 7, name: "Bottled Water", sku: "BEV-007", category: "Beverages", stock: 100, minStock: 30, price: 1.5, cost: 0.3, emoji: "💧", showInPOS: true },

  // ── Food ──
  { id: 8, name: "Croissants", sku: "FOD-001", category: "Food", stock: 24, minStock: 10, price: 3.5, cost: 1.5, emoji: "🥐", showInPOS: true },
  { id: 9, name: "Bagels", sku: "FOD-002", category: "Food", stock: 30, minStock: 15, price: 4.0, cost: 1.8, emoji: "🥯", showInPOS: true },
  { id: 10, name: "Muffins", sku: "FOD-003", category: "Food", stock: 3, minStock: 8, price: 3.0, cost: 1.2, emoji: "🧁", showInPOS: true },
  { id: 11, name: "Sandwich Bread", sku: "FOD-004", category: "Food", stock: 40, minStock: 20, price: 7.5, cost: 3.0, emoji: "🥪", showInPOS: true },
  { id: 12, name: "Salad Mix", sku: "FOD-005", category: "Food", stock: 12, minStock: 8, price: 8.0, cost: 3.5, emoji: "🥗", showInPOS: true },
  { id: 13, name: "Cookies", sku: "FOD-006", category: "Food", stock: 50, minStock: 20, price: 2.5, cost: 0.8, emoji: "🍪", showInPOS: true },

  // ── Desserts ──
  { id: 14, name: "Cake Base", sku: "DES-001", category: "Desserts", stock: 15, minStock: 5, price: 5.0, cost: 2.0, emoji: "🍰", showInPOS: true },
  { id: 15, name: "Brownie Mix", sku: "DES-002", category: "Desserts", stock: 22, minStock: 10, price: 3.5, cost: 1.2, emoji: "🟫", showInPOS: true },
  { id: 16, name: "Ice Cream Tubs", sku: "DES-003", category: "Desserts", stock: 7, minStock: 10, price: 4.0, cost: 1.8, emoji: "🍦", showInPOS: true },

  // ── Green Beans (raw material, NOT in POS) ──
  { id: 17, name: "Ethiopian Yirgacheffe", sku: "GRN-001", category: "Green Beans", stock: 25, minStock: 10, price: 0, cost: 8.5, emoji: "🫘", showInPOS: false },
  { id: 18, name: "Colombian Supremo", sku: "GRN-002", category: "Green Beans", stock: 40, minStock: 15, price: 0, cost: 7.2, emoji: "🫘", showInPOS: false },
  { id: 19, name: "Sumatra Mandheling", sku: "GRN-003", category: "Green Beans", stock: 18, minStock: 10, price: 0, cost: 9.0, emoji: "🫘", showInPOS: false },
  { id: 20, name: "Guatemala Antigua", sku: "GRN-004", category: "Green Beans", stock: 12, minStock: 8, price: 0, cost: 8.0, emoji: "🫘", showInPOS: false },
  { id: 21, name: "Kenya AA", sku: "GRN-005", category: "Green Beans", stock: 8, minStock: 5, price: 0, cost: 11.0, emoji: "🫘", showInPOS: false },
  { id: 22, name: "Brazil Santos", sku: "GRN-006", category: "Green Beans", stock: 50, minStock: 20, price: 0, cost: 5.5, emoji: "🫘", showInPOS: false },
];
