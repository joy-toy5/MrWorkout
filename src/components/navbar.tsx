"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Dumbbell, Menu, User, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function Navbar() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoggedIn = status === "authenticated";
  const userName = session?.user?.name ?? "用户";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center gap-2">
          <Dumbbell className="size-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">肌肉百科</span>
        </Link>

        {/* 桌面端导航 — md 以上显示 */}
        <nav className="hidden md:flex md:flex-1 md:items-center md:gap-1">
          <Link href="/">
            <Button variant="ghost" size="sm">
              首页
            </Button>
          </Link>
        </nav>

        {/* 桌面端右侧操作区 — md 以上显示 */}
        <div className="hidden md:flex md:items-center md:gap-2">
          {isLoggedIn ? (
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger
                render={
                  <button className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted outline-none" />
                }
              >
                <Avatar size="sm">
                  <AvatarFallback>
                    {userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[100px] truncate font-medium">
                  {userName}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8}>
                <DropdownMenuItem
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push("/profile");
                  }}
                >
                  <User className="size-4" />
                  个人中心
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setDropdownOpen(false);
                    signOut({ redirectTo: "/" });
                  }}
                >
                  <LogOut className="size-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  登录
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">注册</Button>
              </Link>
            </>
          )}
        </div>

        {/* 移动端汉堡菜单 — md 以下显示 */}
        <div className="flex flex-1 items-center justify-end md:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" />
              }
            >
              <Menu className="size-5" />
              <span className="sr-only">打开菜单</span>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Dumbbell className="size-5 text-primary" />
                  肌肉百科
                </SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col gap-1 px-4">
                <Link
                  href="/"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <Home className="size-4" />
                  首页
                </Link>

                {isLoggedIn ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setSheetOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <User className="size-4" />
                      个人中心
                    </Link>
                    <button
                      onClick={() => {
                        signOut({ redirectTo: "/" });
                        setSheetOpen(false);
                      }}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="size-4" />
                      退出登录
                    </button>
                  </>
                ) : (
                  <div className="mt-4 flex flex-col gap-2 px-3">
                    <Link href="/login" onClick={() => setSheetOpen(false)}>
                      <Button variant="outline" className="w-full">
                        登录
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setSheetOpen(false)}>
                      <Button className="w-full">注册</Button>
                    </Link>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
