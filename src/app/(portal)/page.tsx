import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AdminDashboardWithCalendar } from "@/components/dashboards/admin-dashboard-with-calendar";
import { ClientDashboard } from "@/components/dashboards/client-dashboard";
import { getFocusPoints } from "@/lib/dashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          Keine Session gefunden. Bitte melden Sie sich an.
        </div>
      </div>
    );
  }
  
  // Rollenbasierte Weiche
  if (session.user.role === 'CLIENT') {
    return <ClientDashboard />;
  }
  
  // ADMIN Dashboard - Get focus data
  const focusData = await getFocusPoints();
  
  return <AdminDashboardWithCalendar focusData={focusData} />;
}