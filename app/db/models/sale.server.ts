import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ISaleItem {
  productId: Types.ObjectId;
  name: string;
  emoji: string;
  price: number;
  quantity: number;
}

export interface ISale extends Document {
  sessionId: Types.ObjectId;
  items: ISaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "credit" | "debit";
  createdAt: Date;
  updatedAt: Date;
}

const saleItemSchema = new Schema<ISaleItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    name: { type: String, required: true },
    emoji: { type: String, default: "📦" },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const saleSchema = new Schema<ISale>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "POSSession", required: true },
    items: { type: [saleItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["cash", "credit", "debit"],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model re-compilation in dev (HMR)
export const Sale =
  mongoose.models.Sale || mongoose.model<ISale>("Sale", saleSchema);
