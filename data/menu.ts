import type { Extra, MenuItem } from "../types/menu";

export const FACEBOOK_PAGE_ID = "61564439125616";
export const FACEBOOK_PAGE_URL = `https://m.me/${FACEBOOK_PAGE_ID}`;

export const MATCHA_CHOICES = [
  "Matcha Satoen",
  "Matcha Special Mix",
  "Matcha Uji Ceremonial",
];

export const SWEETNESS_CHOICES = [
  "100% đường (Tiêu chuẩn)",
  "70% đường (Ít ngọt)",
  "50% đường (Vừa)",
  "30% đường (Rất ít)",
  "0% đường (Không đường)",
];

export const ICE_CHOICES = [
  "100% đá (Bình thường)",
  "70% đá (Ít đá)",
  "50% đá (Rất ít đá)",
  "Không đá",
  "Nóng (Warm/Hot)",
];

export const TOPPINGS: Extra[] = [
  { id: "salted-cream", name: "Kem mặn", price: 8 },
  { id: "white-boba", name: "Trân châu trắng", price: 5 },
  { id: "red-beans", name: "Đậu đỏ", price: 8 },
];

export const DRINKS: MenuItem[] = [
  {
    id: "matcha-sua-bo",
    name: "Matcha Sữa Bò",
    english: "Matcha Latte (Cow Milk)",
    category: "matcha",
    accent: "green",
    prices: { M: 29, L: 51 },
    extras: [{ id: "extra-matcha", name: "2g matcha", price: 8 }],
  },
  {
    id: "matcha-yen-mach",
    name: "Matcha Yến Mạch",
    english: "Matcha Latte (Oat Milk)",
    category: "matcha",
    accent: "soft",
    prices: { M: 40, L: 61 },
    extras: [{ id: "extra-matcha", name: "2g matcha", price: 8 }],
  },
  {
    id: "matcha-sua-mix",
    name: "Matcha Sữa Mix",
    english: "Matcha Latte (Cow + Oat)",
    category: "matcha",
    accent: "green",
    prices: { M: 35, L: 56 },
    extras: [{ id: "extra-matcha", name: "2g matcha", price: 8 }],
  },
  {
    id: "choco-sua-hat",
    name: "Choco Sữa Hạt",
    english: "Choco Latte",
    category: "matcha",
    accent: "cocoa",
    prices: { M: 40, L: 61 },
    extras: [{ id: "extra-choco", name: "2g choco", price: 8 }],
  },
  {
    id: "chuoi-latte",
    name: "Chuối Latte",
    english: "Banana Matcha Latte / Banana Choco Latte",
    category: "matcha",
    accent: "banana",
    prices: { M: 40, L: 61 },
    extras: [{ id: "extra-matcha-choco", name: "2g matcha/choco", price: 8 }],
  },
  {
    id: "coco-matcha",
    name: "Coco Matcha",
    english: "Matcha Coconut Water",
    category: "matcha",
    accent: "green",
    prices: { M: 40, L: 61 },
  },
  {
    id: "matcha-khoai-mon",
    name: "Matcha Khoai Môn",
    english: "Taro Matcha Latte",
    category: "matcha",
    accent: "taro",
    prices: { M: 42, L: 66 },
    extras: [
      { id: "extra-matcha", name: "2g matcha", price: 8 },
      { id: "extra-taro", name: "20g khoai môn", price: 8 },
    ],
  },
  {
    id: "matcha-xoai",
    name: "Matcha Xoài",
    english: "Mango Matcha Latte",
    category: "matcha",
    accent: "mango",
    prices: { M: 42, L: 66 },
    extras: [
      { id: "extra-matcha", name: "2g matcha", price: 8 },
      { id: "extra-mango", name: "10g xoài", price: 8 },
    ],
  },
];

export const PASTRIES: MenuItem[] = [
  {
    id: "almond-croissant",
    name: "Croissant Hạnh Nhân",
    english: "Almond Croissant",
    category: "pastry",
    accent: "pastry",
    prices: { M: 41 },
  },
  {
    id: "garlic-butter-croissant",
    name: "Croissant Bơ Tỏi",
    english: "Garlic Butter Croissant",
    category: "pastry",
    accent: "pastry",
    prices: { M: 41 },
  },
  {
    id: "pain-au-chocolat",
    name: "Pain au Chocolat",
    english: "Chocolate pastry",
    category: "pastry",
    accent: "cocoa",
    prices: { M: 38 },
    badge: "Must try",
  },
];

export const COFFEES: MenuItem[] = [
  {
    id: "ca-phe-den",
    name: "Cà phê Đen",
    english: "Black Coffee",
    category: "coffee",
    accent: "coffee",
    prices: { M: 29 },
  },
  {
    id: "ca-phe-nau",
    name: "Cà phê Nâu",
    english: "Brown Coffee",
    category: "coffee",
    accent: "coffee",
    prices: { M: 29 },
  },
  {
    id: "bac-xiu",
    name: "Bạc Xỉu",
    english: "White Coffee",
    category: "coffee",
    accent: "coffee",
    prices: { M: 29 },
  },
  {
    id: "ca-phe-muoi",
    name: "Cà phê Muối",
    english: "Salted Coffee",
    category: "coffee",
    accent: "coffee",
    prices: { M: 29 },
  },
];
