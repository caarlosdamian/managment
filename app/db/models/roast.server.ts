import mongoose, { Schema, type Document } from "mongoose";

export interface IRoastBatch extends Document {
  beanName: string;
  beanOrigin: string;
  greenWeight: number;
  roastedWeight: number;
  roastDate: Date;
  agtron: number;
  duration: number;
  temperature: number;
  notes: string;
}

const roastBatchSchema = new Schema<IRoastBatch>(
  {
    beanName: { type: String, required: true, trim: true },
    beanOrigin: { type: String, required: true, trim: true },
    greenWeight: { type: Number, required: true, min: 0 },
    roastedWeight: { type: Number, required: true, min: 0 },
    roastDate: { type: Date, required: true },
    agtron: { type: Number, required: true, min: 25, max: 95 },
    duration: { type: Number, required: true, min: 0 },
    temperature: { type: Number, required: true, min: 0 },
    notes: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

// Prevent model re-compilation in dev (HMR)
export const RoastBatch =
  mongoose.models.RoastBatch ||
  mongoose.model<IRoastBatch>("RoastBatch", roastBatchSchema);
