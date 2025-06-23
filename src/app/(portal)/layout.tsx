import { DesktopSidebar } from "@/components/desktop-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { UserMenu } from "@/components/user-menu";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar - nur auf md und größer sichtbar */}
      <aside className="hidden md:flex">
        <DesktopSidebar />
      </aside>
      
      <div className="flex-1 flex flex-col">
        {/* Top Header mit User Menu */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 md:hidden">
              MGA Portal
            </h1>
            <div className="ml-auto">
              <UserMenu />
            </div>
          </div>
        </header>
        
        {/* Haupt-Inhaltsbereich */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Navigation - nur auf kleinen Bildschirmen */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
}