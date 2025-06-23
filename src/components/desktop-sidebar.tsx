"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu, X, FolderOpen, ListTodo, Users, Timer, Calendar } from "lucide-react";
import { useState } from "react";
import { OmniCreate } from "./omni-create";
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { CommandSearch } from "./command-search";

const QuickScheduleDialog = dynamic(
  () => import('./quick-schedule-dialog').then(mod => mod.QuickScheduleDialog),
  { ssr: false }
);
import { useSession } from "next-auth/react";
import { GlobalTimer } from "./global-timer";

const allNavigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
    allowedRoles: ['ADMIN', 'CLIENT'],
  },
  {
    name: "Projekte",
    href: "/projects",
    icon: FolderOpen,
    allowedRoles: ['ADMIN', 'CLIENT'],
  },
  {
    name: "Kontakte",
    href: "/contacts",
    icon: Users,
    allowedRoles: ['ADMIN'],
  },
  {
    name: "Aufgaben",
    href: "/tasks",
    icon: ListTodo,
    allowedRoles: ['ADMIN', 'CLIENT'],
  },
  {
    name: "Zeiterfassung",
    href: "/time-tracking",
    icon: Timer,
    allowedRoles: ['ADMIN'],
  },
  {
    name: "Kalender",
    href: "/calendar",
    icon: Calendar,
    allowedRoles: ['ADMIN'],
  },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Debug logging
  console.log('DesktopSidebar - Session status:', status);
  console.log('DesktopSidebar - Session data:', session);
  console.log('DesktopSidebar - User role:', session?.user?.role);
  
  // Filtere Navigation basierend auf Rolle
  // Vereinfachte Logik: Verwende CLIENT als Fallback wenn keine Rolle vorhanden
  const userRole = session?.user?.role || 'CLIENT';
  let navigationItems = allNavigationItems.filter(item => 
    item.allowedRoles.includes(userRole)
  );
  
  console.log('DesktopSidebar - Filtered items:', navigationItems.length);
  
  // Temporary: Show loading state if session is loading
  if (status === 'loading') {
    console.log('DesktopSidebar - Session is still loading...');
    // Show default items while loading
    navigationItems = allNavigationItems.filter(item => 
      item.allowedRoles.includes('CLIENT')
    );
  }
  
  // Temporary: If no items after filtering, show why
  if (navigationItems.length === 0 && status === 'authenticated') {
    console.warn('DesktopSidebar - No navigation items shown. Check if user role matches allowedRoles:', {
      userRole: session?.user?.role,
      validRoles: ['ADMIN', 'CLIENT']
    });
    // Fallback: Show CLIENT items if role is missing
    navigationItems = allNavigationItems.filter(item => 
      item.allowedRoles.includes('CLIENT')
    );
  }

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gray-100 dark:bg-gray-900 h-full transition-all duration-300 border-r border-gray-200 dark:border-gray-800`}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            MGA Portal
          </h2>
        )}
        <Button
          onClick={() => setIsCollapsed(!isCollapsed)}
          variant="ghost"
          size="icon"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </Button>
      </div>

      {/* Search and Create */}
      <div className="p-4 pt-0 space-y-2">
        {!isCollapsed && <CommandSearch />}
        <OmniCreate variant="desktop" className={isCollapsed ? "px-0" : ""} />
      </div>

      {/* Action Items - only show for admin */}
      {userRole === 'ADMIN' && (
        <div className="px-4 pb-4 space-y-2">
          <GlobalTimer />
          <div className="flex justify-center">
            <QuickScheduleDialog />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="p-4 pt-0">
        {navigationItems.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            Debug: No navigation items to display. Check console for details.
          </div>
        )}
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' 
                      : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}