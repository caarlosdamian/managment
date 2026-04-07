import mongoose, { Schema, type Document } from "mongoose";

export interface IInventoryItem extends Document {
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

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Beverages", "Food", "Desserts", "Green Beans", "Supplies"],
    },
    stock: { type: Number, required: true, default: 0, min: 0 },
    minStock: { type: Number, required: true, default: 0, min: 0 },
    price: { type: Number, required: true, default: 0, min: 0 },
    cost: { type: Number, required: true, default: 0, min: 0 },
    emoji: { type: String, default: "📦" },
    showInPOS: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Prevent model re-compilation in dev (HMR)
export const InventoryItem =
  mongoose.models.InventoryItem ||
  mongoose.model<IInventoryItem>("InventoryItem", inventoryItemSchema);
