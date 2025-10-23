// scripts/rmcart.ts
import mongoose from "mongoose";
import { dbConnect } from "@/app/lib/dbConnect";
import { Order } from "@/app/models/Order";
import * as dotenv from 'dotenv';
dotenv.config();

(async () => {
  try {
    await dbConnect();

    const result = await Order.deleteMany({});
    console.log(`🗑️  Removed ${result.deletedCount} orders from the database.`);

    mongoose.connection.close();
    console.log("✅ Database connection closed.");
  } catch (err) {
    console.error("❌ Error removing carts:", err);
    mongoose.connection.close();
  }
})();
