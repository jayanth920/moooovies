import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-amber-50 text-black py-8 rounded-lg shadow-lg text-center">
      <div className="flex flex-col items-center space-y-4">
        {/* Brand */}
        <Link href="/" className="text-2xl font-semibold text-black hover:text-amber-600">
          LocalBoss
        </Link>

        {/* Links */}
        <div className="flex flex-col items-center space-y-3 text-md">
          <Link href="/" className="hover:text-amber-600">Home</Link>
          <Link href="/shop" className="hover:text-amber-600">Shop</Link>
          <Link href="/about" className="hover:text-amber-600">About Us</Link>
        </div>

        {/* Bottom note */}
        <span className="text-sm text-black">
          © {currentYear} LocalBoss - All Rights Reserved
        </span>
      </div>
    </div>
  );
}