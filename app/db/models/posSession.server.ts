import mongoose, { Schema, type Document } from "mongoose";

export interface IPOSSession extends Document {
  openedAt: Date;
  closedAt: Date | null;
  openingCash: number;
  closingCash: number | null;
  status: "open" | "closed";
  salesCount: number;
  totalRevenue: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const posSessionSchema = new Schema<IPOSSession>(
  {
    openedAt: { type: Date, required: true, default: Date.now },
    closedAt: { type: Date, default: null },
    openingCash: { type: Number, required: true, min: 0 },
    closingCash: { type: Number, default: null },
    status: {
      type: String,
      required: true,
      enum: ["open", "closed"],
      default: "open",
    },
    salesCount: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

// Prevent model re-compilation in dev (HMR)
export const POSSession =
  mongoose.models.POSSession ||
  mongoose.model<IPOSSession>("POSSession", posSessionSchema);
