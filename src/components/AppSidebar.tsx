"use client";

import {
  LayoutDashboard,
  FilePlus,
  UsersIcon,
  SquareChartGantt,
  LogOut,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const NAV_ITEMS = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Invoices", href: "/invoices", icon: FilePlus },
    { title: "Products", href: "/products", icon: SquareChartGantt },
    { title: "Companies", href: "/buyers", icon: UsersIcon },
  ];

  const BOTTOM_ITEMS = [
    { title: "Account", href: "/account", icon: UsersIcon },
    { title: "Sign Out", action: () => supabase.auth.signOut(), icon: LogOut },
  ];

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const closeMobileSheet = () => setIsOpen(false);

  const NavButton = ({
    item,
    isActive,
    onClick,
  }: {
    item: typeof NAV_ITEMS[number];
    isActive: boolean;
    onClick: () => void;
  }) => (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start h-12 rounded-lg transition-colors",
        !isCollapsed && "px-4"
      )}
      onClick={onClick}
    >
      <item.icon className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "mr-3")} />
      {!isCollapsed && (
        <span className="text-sm font-medium">{item.title}</span>
      )}
    </Button>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen border-r bg-background",
          isCollapsed ? "w-20" : "w-64",
          "transition-all duration-300 ease-in-out"
        )}
      >
        <div className="flex-1 flex flex-col px-3 py-4">
          <div className="flex items-center justify-between mb-4 px-2">
            {!isCollapsed && (
              <h1 className="text-xl font-semibold tracking-tight">Invoice Gen</h1>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="rounded-lg"
            >
              <ChevronLeft
                className={cn(
                  "h-5 w-5 transition-transform",
                  isCollapsed && "rotate-180"
                )}
              />
            </Button>
          </div>

          <nav className="flex-1 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <NavButton
                      item={item}
                      isActive={isActive}
                      onClick={() => router.push(item.href)}
                    />
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2">
            {BOTTOM_ITEMS.map((item) => (
              <Tooltip key={item.title} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-12 rounded-lg",
                      !isCollapsed && "px-4"
                    )}
                    onClick={() =>
                      item.href ? router.push(item.href) : item.action?.()
                    }
                  >
                    <item.icon
                      className={cn("h-5 w-5", isCollapsed ? "mx-auto" : "mr-3")}
                    />
                    {!isCollapsed && (
                      <span className="text-sm font-medium">{item.title}</span>
                    )}
                  </Button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>
        </div>
      </aside>

      {/* Mobile Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-64 px-3">
          <div className="flex flex-col h-full py-4">
            <h1 className="text-xl font-semibold tracking-tight px-2 mb-6">
              Invoice Gen
            </h1>
            
            <nav className="flex-1 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start h-12 rounded-lg px-4"
                  onClick={() => {
                    router.push(item.href);
                    closeMobileSheet();
                  }}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span className="text-sm font-medium">{item.title}</span>
                </Button>
              ))}
            </nav>

            <div className="mt-auto space-y-2">
              {BOTTOM_ITEMS.map((item) => (
                <Button
                  key={item.title}
                  variant="ghost"
                  className="w-full justify-start h-12 rounded-lg px-4"
                  onClick={() => {
                    item.href ? router.push(item.href) : item.action?.();
                    closeMobileSheet();
                  }}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span className="text-sm font-medium">{item.title}</span>
                </Button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Trigger */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 lg:hidden rounded-full shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>
    </>
  );
}