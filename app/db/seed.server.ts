/**
 * Database Seed Script
 * Run: npx tsx app/db/seed.server.ts
 *
 * Populates MongoDB with initial inventory and roasting data.
 * Idempotent — only seeds when collections are empty.
 */

import "dotenv/config";
import mongoose from "mongoose";
import { InventoryItem } from "./models/inventory.server.js";
import { RoastBatch } from "./models/roast.server.js";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in .env");
  process.exit(1);
}

const inventorySeed = [
  // ── Beverages ──
  { name: "Espresso Beans", sku: "BEV-001", category: "Beverages", stock: 45, minStock: 20, price: 3.5, cost: 1.2, emoji: "☕", showInPOS: true },
  { name: "Cappuccino Mix", sku: "BEV-002", category: "Beverages", stock: 32, minStock: 15, price: 4.5, cost: 1.8, emoji: "☕", showInPOS: true },
  { name: "Latte Syrup", sku: "BEV-003", category: "Beverages", stock: 8, minStock: 10, price: 5.0, cost: 2.0, emoji: "🥛", showInPOS: true },
  { name: "Mocha Powder", sku: "BEV-004", category: "Beverages", stock: 25, minStock: 10, price: 5.5, cost: 2.2, emoji: "🍫", showInPOS: true },
  { name: "Green Tea Leaves", sku: "BEV-005", category: "Beverages", stock: 18, minStock: 10, price: 3.0, cost: 1.0, emoji: "🍵", showInPOS: true },
  { name: "Smoothie Base", sku: "BEV-006", category: "Beverages", stock: 5, minStock: 12, price: 6.0, cost: 2.5, emoji: "🥤", showInPOS: true },
  { name: "Bottled Water", sku: "BEV-007", category: "Beverages", stock: 100, minStock: 30, price: 1.5, cost: 0.3, emoji: "💧", showInPOS: true },

  // ── Food ──
  { name: "Croissants", sku: "FOD-001", category: "Food", stock: 24, minStock: 10, price: 3.5, cost: 1.5, emoji: "🥐", showInPOS: true },
  { name: "Bagels", sku: "FOD-002", category: "Food", stock: 30, minStock: 15, price: 4.0, cost: 1.8, emoji: "🥯", showInPOS: true },
  { name: "Muffins", sku: "FOD-003", category: "Food", stock: 3, minStock: 8, price: 3.0, cost: 1.2, emoji: "🧁", showInPOS: true },
  { name: "Sandwich Bread", sku: "FOD-004", category: "Food", stock: 40, minStock: 20, price: 7.5, cost: 3.0, emoji: "🥪", showInPOS: true },
  { name: "Salad Mix", sku: "FOD-005", category: "Food", stock: 12, minStock: 8, price: 8.0, cost: 3.5, emoji: "🥗", showInPOS: true },
  { name: "Cookies", sku: "FOD-006", category: "Food", stock: 50, minStock: 20, price: 2.5, cost: 0.8, emoji: "🍪", showInPOS: true },

  // ── Desserts ──
  { name: "Cake Base", sku: "DES-001", category: "Desserts", stock: 15, minStock: 5, price: 5.0, cost: 2.0, emoji: "🍰", showInPOS: true },
  { name: "Brownie Mix", sku: "DES-002", category: "Desserts", stock: 22, minStock: 10, price: 3.5, cost: 1.2, emoji: "🟫", showInPOS: true },
  { name: "Ice Cream Tubs", sku: "DES-003", category: "Desserts", stock: 7, minStock: 10, price: 4.0, cost: 1.8, emoji: "🍦", showInPOS: true },

  // ── Green Beans (raw material, NOT in POS) ──
  { name: "Ethiopian Yirgacheffe", sku: "GRN-001", category: "Green Beans", stock: 25, minStock: 10, price: 0, cost: 8.5, emoji: "🫘", showInPOS: false },
  { name: "Colombian Supremo", sku: "GRN-002", category: "Green Beans", stock: 40, minStock: 15, price: 0, cost: 7.2, emoji: "🫘", showInPOS: false },
  { name: "Sumatra Mandheling", sku: "GRN-003", category: "Green Beans", stock: 18, minStock: 10, price: 0, cost: 9.0, emoji: "🫘", showInPOS: false },
  { name: "Guatemala Antigua", sku: "GRN-004", category: "Green Beans", stock: 12, minStock: 8, price: 0, cost: 8.0, emoji: "🫘", showInPOS: false },
  { name: "Kenya AA", sku: "GRN-005", category: "Green Beans", stock: 8, minStock: 5, price: 0, cost: 11.0, emoji: "🫘", showInPOS: false },
  { name: "Brazil Santos", sku: "GRN-006", category: "Green Beans", stock: 50, minStock: 20, price: 0, cost: 5.5, emoji: "🫘", showInPOS: false },
];

const roastSeed = [
  {
    beanName: "Ethiopian Yirgacheffe",
    beanOrigin: "Ethiopia",
    greenWeight: 5000,
    roastedWeight: 4250,
    roastDate: new Date("2026-04-07"),
    agtron: 80,
    duration: 11,
    temperature: 410,
    notes: "Bright acidity, floral aroma. First crack at 9 min.",
  },
  {
    beanName: "Colombian Supremo",
    beanOrigin: "Colombia",
    greenWeight: 8000,
    roastedWeight: 6720,
    roastDate: new Date("2026-04-06"),
    agtron: 58,
    duration: 13,
    temperature: 430,
    notes: "Balanced body, caramel sweetness. Good for espresso.",
  },
  {
    beanName: "Sumatra Mandheling",
    beanOrigin: "Indonesia",
    greenWeight: 6000,
    roastedWeight: 4920,
    roastDate: new Date("2026-04-05"),
    agtron: 35,
    duration: 16,
    temperature: 460,
    notes: "Full body, earthy with herbal notes. Second crack at 14 min.",
  },
  {
    beanName: "Guatemala Antigua",
    beanOrigin: "Guatemala",
    greenWeight: 4000,
    roastedWeight: 3440,
    roastDate: new Date("2026-04-04"),
    agtron: 48,
    duration: 14,
    temperature: 445,
    notes: "Chocolate and spice notes. Rich, smooth finish.",
  },
  {
    beanName: "Kenya AA",
    beanOrigin: "Kenya",
    greenWeight: 3000,
    roastedWeight: 2580,
    roastDate: new Date("2026-04-03"),
    agtron: 85,
    duration: 10,
    temperature: 405,
    notes: "Bright citrus acidity, blackcurrant. Complex cup.",
  },
];

async function seed() {
  console.log("🌱 Starting database seed...\n");

  await mongoose.connect(MONGODB_URI!);
  console.log("✅ Connected to MongoDB\n");

  // ── Inventory ──
  const invCount = await InventoryItem.countDocuments();
  if (invCount === 0) {
    await InventoryItem.insertMany(inventorySeed);
    console.log(`📦 Seeded ${inventorySeed.length} inventory items`);
  } else {
    console.log(`📦 Inventory already has ${invCount} items — skipping`);
  }

  // ── Roast Batches ──
  const roastCount = await RoastBatch.countDocuments();
  if (roastCount === 0) {
    await RoastBatch.insertMany(roastSeed);
    console.log(`☕ Seeded ${roastSeed.length} roast batches`);
  } else {
    console.log(`☕ Roasts already has ${roastCount} batches — skipping`);
  }

  console.log("\n✅ Seed complete!");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
