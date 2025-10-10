export const coupons = [
  {
    code: "WELCOME15",
    price: 15,
    isPercentage: true,
    minOrderCount: 0, // applies only if user has 0 previous orders
    description: "Welcome coupon — 15% off your first order!",
    active: true,
  },
  {
    code: "MOVIE10",
    price: 10,
    isPercentage: false,
    minSubtotal: 50,
    description: "Get $10 off orders over $50!",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    active: true,
  },
  {
    code: "HALFOFF",
    price: 50,
    isPercentage: true,
    minQuantity: 2,
    description: "50% off when you buy 2 or more movies!",
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    active: true,
  },
  {
    code: "LOYAL20",
    price: 20,
    isPercentage: true,
    minOrderCount: 5, // after 5 completed orders
    description: "20% off for loyal customers with 5+ orders!",
    active: true,
  },
  {
    code: "SPRING25",
    price: 25,
    isPercentage: true,
    minSubtotal: 75,
    description: "Celebrate spring with 25% off orders over $75!",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    active: true,
  },
  {
    code: "EXPIRED20",
    price: 20,
    isPercentage: true,
    minSubtotal: 30,
    description: "Old test coupon — 20% off (expired)",
    expiresAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    active: true,
  },
];
