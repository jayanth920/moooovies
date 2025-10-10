import * as dotenv from "dotenv";
dotenv.config();

import { dbConnect } from "@/app/lib/dbConnect";
import { Coupon } from "@/app/models/Coupon";
import { coupons } from "@/lib/coupons";

async function seedCoupons() {
  await dbConnect();

  await Coupon.deleteMany({});
  await Coupon.insertMany(coupons);

  console.log(`✅ Seeded ${coupons.length} coupons successfully`);
  process.exit(0);
}

seedCoupons().catch((err) => {
  console.error("❌ Error seeding coupons:", err);
  process.exit(1);
});
