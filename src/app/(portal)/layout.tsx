import { DesktopSidebar } from "@/components/desktop-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar - nur auf md und größer sichtbar */}
      <aside className="hidden md:flex">
        <DesktopSidebar />
      </aside>
      
      {/* Haupt-Inhaltsbereich */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>
      
      {/* Mobile Bottom Navigation - nur auf kleinen Bildschirmen */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
}