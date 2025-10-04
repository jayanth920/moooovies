import pkg from "mongoose";
const { Schema, model, models } = pkg;

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
