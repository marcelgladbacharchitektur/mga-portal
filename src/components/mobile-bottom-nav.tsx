"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FolderOpen, ListTodo, Users, Timer, Calendar } from "lucide-react";
import { OmniCreate } from "./omni-create";
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
    name: "Zeit",
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

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  
  // Debug logging
  console.log('MobileBottomNav - Session status:', status);
  console.log('MobileBottomNav - Session data:', session);
  console.log('MobileBottomNav - User role:', session?.user?.role);
  
  // Filtere Navigation basierend auf Rolle
  // Vereinfachte Logik: Verwende CLIENT als Fallback wenn keine Rolle vorhanden
  const userRole = session?.user?.role || 'CLIENT';
  let navigationItems = allNavigationItems.filter(item => 
    item.allowedRoles.includes(userRole)
  );
  
  console.log('MobileBottomNav - Filtered items:', navigationItems.length);
  
  // Temporary: Show loading state if session is loading
  if (status === 'loading') {
    console.log('MobileBottomNav - Session is still loading...');
    // Show default items while loading
    navigationItems = allNavigationItems.filter(item => 
      item.allowedRoles.includes('CLIENT')
    );
  }
  
  // Temporary: If no items after filtering, show why
  if (navigationItems.length === 0 && status === 'authenticated') {
    console.warn('MobileBottomNav - No navigation items shown. Check if user role matches allowedRoles:', {
      userRole: session?.user?.role,
      validRoles: ['ADMIN', 'CLIENT']
    });
    // Fallback: Show CLIENT items if role is missing
    navigationItems = allNavigationItems.filter(item => 
      item.allowedRoles.includes('CLIENT')
    );
  }

  return (
    <nav className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      {/* Global Timer for Admin users */}
      {userRole === 'ADMIN' && (
        <div className="p-2 border-b border-gray-200 dark:border-gray-800">
          <GlobalTimer />
        </div>
      )}
      <div className="flex justify-around">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center gap-1 p-3 flex-1 transition-colors
                ${isActive 
                  ? 'text-gray-900 dark:text-gray-100' 
                  : 'text-gray-500 dark:text-gray-400'
                }
              `}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
        <OmniCreate variant="mobile" />
      </div>
    </nav>
  );
}