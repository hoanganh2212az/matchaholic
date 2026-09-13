import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://matchaholic.vercel.app";
const title = "matcha.holic - Menu & Đặt món Matcha Bar";
const description =
  "Menu matcha latte, sữa yến mạch, coconut matcha, bánh ngọt và cà phê từ matcha.holic. Đặt món nhanh chóng và gửi trực tiếp qua Facebook Messenger.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: siteUrl,
    locale: "vi_VN",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "matcha.holic menu and order preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={fontSans.variable}>
      <body>{children}</body>
    </html>
  );
}
