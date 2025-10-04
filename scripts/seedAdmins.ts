import { dbConnect } from "../app/lib/dbConnect.js";
import { User } from "../app/models/User.js";
import * as bcrypt from "bcryptjs";
import * as dotenv from 'dotenv';
dotenv.config();

async function seedAdmins() {
  await dbConnect();

  for (let i = 1; i <= 6; i++) {
    const email = `AdminBoss${i}@gmail.com`;
    const passwordHash = await bcrypt.hash(`AdminBossPassword${i}`, 10);

    const existing = await User.findOne({ email });
    if (!existing) {
      await User.create({
        name: `Admin Boss ${i}`,
        email,
        passwordHash,
        role: "admin",
        active: true
      });
      console.log(`Created ${email}`);
    } else {
      console.log(`${email} already exists`);
    }
  }

  process.exit();
}

seedAdmins();
