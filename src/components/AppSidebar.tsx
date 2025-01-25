"use client";
import {
  X,
  Menu,
  LayoutDashboard,
  FilePlus,
  UsersIcon,
  SquareChartGantt,
  LogOut,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebarStore } from "@/store/sidebarStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function AppSidebar() {
  const { isExpanded, toggleSidebar } = useSidebarStore();
  const router = useRouter();
  const path = usePathname();

  const items = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Invoices", url: "/invoices", icon: FilePlus },
    { title: "Products", url: "/products", icon: SquareChartGantt },
    { title: "Companies", url: "/buyers", icon: UsersIcon },
  ];

  return (
    <div>
      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-gradient-to-b from-blue-50 to-white transition-all duration-300 shadow-lg flex flex-col",
          isExpanded ? "w-64" : "w-16"
        )}
        style={{ pointerEvents: isExpanded ? "auto" : "none" }}
      >
        <div className="p-4 flex-1 pointer-events-auto">
          <div className="flex items-center justify-between mb-6">
            {isExpanded && (
              <h2 className="text-lg font-semibold text-gray-700">
                Invoice Gen
              </h2>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="hover:bg-blue-200"
            >
              {isExpanded ? (
                <X className="h-5 w-5 text-gray-600" />
              ) : (
                <Menu className="h-5 w-5 text-gray-600" />
              )}
            </Button>
          </div>
          <nav className="mt-6">
            {items.map((item) => {
              const isActive = path === item.url;
              return (
                <div key={item.url} className="mb-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => router.push(item.url)}
                        className={cn(
                          "flex items-center w-full p-2 rounded-md transition-colors",
                          "hover:bg-blue-100",
                          isActive ? "bg-blue-200" : "",
                          "gap-3"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5",
                            isActive ? "text-blue-600" : "text-gray-600"
                          )}
                        />
                        {isExpanded && (
                          <span
                            className={cn(
                              "text-sm font-medium whitespace-nowrap",
                              isActive ? "text-blue-600" : "text-gray-600"
                            )}
                          >
                            {item.title}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    {!isExpanded && (
                      <TooltipContent
                        side="right"
                        className="bg-gray-800 text-white"
                      >
                        {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200 pointer-events-auto ">
       
       <div
           className={cn(
             "flex items-center",
             isExpanded ? "justify-start" : "justify-center"
           )}
           onClick={() => router.replace("/account")}
         >
           <UsersIcon className="h-5 w-5 cursor-pointer" />
           {isExpanded && (
             <span className="ml-2 text-sm font-medium">Account</span>
           )}
       </div>
  </div>
        <div className="p-4 border-gray-200 pointer-events-auto mb-2">
       
          <div
            className={cn(
              "flex items-center",
              isExpanded ? "justify-start" : "justify-center"
            )}
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut className="h-5 w-5 cursor-pointer" />
            {isExpanded && (
              <span className="ml-2 text-sm font-medium">Sign out</span>
            )}
          </div>
        </div>
       

        
      </div>

      {/* Overlay */}
      {isExpanded && (
        <div
          onClick={toggleSidebar}
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-30 z-40"
        ></div>
      )}
    </div>
  );
}
