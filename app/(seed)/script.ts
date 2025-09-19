import { dbConnect } from "@/lib/dbConnect";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

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
        role: "admin"
      });
      console.log(`Created ${email}`);
    } else {
      console.log(`${email} already exists`);
    }
  }
  process.exit();
}

seedAdmins();
