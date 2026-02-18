import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { AdminSidebar } from '@/components/admin/sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/admin/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, name: true, email: true },
  });

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Erisim Reddedildi</h1>
          <p className="text-gray-400 mt-2">Bu sayfaya erisim yetkiniz bulunmamaktadir.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <AdminSidebar userName={user.name ?? user.email ?? 'Admin'} />
      <main className="flex-1 p-6 overflow-auto lg:pl-6 pl-4 pt-16 lg:pt-6">
        {children}
      </main>
    </div>
  );
}
