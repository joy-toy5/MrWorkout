import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Next.js 16 Proxy（原 middleware）
 * 保护需要登录的路由，未认证用户服务端重定向到 /login
 */

const protectedRoutes = ["/profile", "/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 仅对受保护路由执行认证检查
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // 通过 NextAuth 获取 session
  const session = await auth();

  if (!session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/admin/:path*"],
};
