// scripts/rmcart.ts
import mongoose from "mongoose";
import { dbConnect } from "@/app/lib/dbConnect";
import { Cart } from "@/app/models/Cart";
import * as dotenv from 'dotenv';
dotenv.config();

(async () => {
  try {
    await dbConnect();

    const result = await Cart.deleteMany({});
    console.log(`🗑️  Removed ${result.deletedCount} carts from the database.`);

    mongoose.connection.close();
    console.log("✅ Database connection closed.");
  } catch (err) {
    console.error("❌ Error removing carts:", err);
    mongoose.connection.close();
  }
})();
