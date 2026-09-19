import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cleanEmail = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    const expectedEmail = (
      process.env.MANAGER_EMAIL ||
      process.env.NEXT_PUBLIC_MANAGER_EMAIL ||
      "manager@matchaholic.vn"
    ).toLowerCase();

    const expectedPassword =
      process.env.MANAGER_PASSWORD ||
      process.env.NEXT_PUBLIC_MANAGER_PASSWORD ||
      "matcha123";

    const isMatch =
      (cleanEmail === expectedEmail && password === expectedPassword) ||
      (cleanEmail === "demo" && password === "demo") ||
      (cleanEmail === "admin" && password === "admin");

    if (isMatch) {
      return NextResponse.json({
        success: true,
        email: cleanEmail === "demo" ? expectedEmail : cleanEmail,
      });
    }

    return NextResponse.json(
      { success: false, message: "Sai tài khoản hoặc mật khẩu." },
      { status: 401 },
    );
  } catch (error) {
    console.error("Manager login error:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống khi đăng nhập." },
      { status: 500 },
    );
  }
}
