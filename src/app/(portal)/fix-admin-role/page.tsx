import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function FixAdminRolePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return <div className="p-6">Nicht eingeloggt</div>;
  }

  // Automatisch die Rolle auf ADMIN setzen für admin@mga-portal.com
  if (session.user.email === 'admin@mga-portal.com') {
    await prisma.user.update({
      where: { email: 'admin@mga-portal.com' },
      data: { role: 'ADMIN' }
    });
    
    // Nach Update zur Hauptseite weiterleiten
    redirect('/');
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Admin Role Fix</h1>
        <p>Diese Seite ist nur für admin@mga-portal.com</p>
      </div>
    </div>
  );
}