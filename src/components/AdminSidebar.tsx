"use client";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminSidebar() {
  const router = useRouter();
  return (
    <aside className="min-h-screen h-screen w-56 bg-white border-r border-b2dfdb flex flex-col z-40 fixed md:static left-0 top-0">
      <div className="p-6 border-b border-b2dfdb">
        <h2 className="text-2xl font-bold mb-2">Admin Panel</h2>
        <p className="text-xs text-muted-foreground">ACTIA Engineering services</p>
      </div>
      <nav className="flex-1 flex flex-col gap-2 p-4">
        <Button variant="link" asChild className="justify-start">
          <Link href="/admin/dashboard">Dashboard</Link>
        </Button>
        <Button variant="link" asChild className="justify-start">
          <Link href="/admin/tests">Manage Tests</Link>
        </Button>
        <Button variant="link" asChild className="justify-start">
          <Link href="/admin/maintenance">Maintenance Records</Link>
        </Button>
        <Button variant="link" asChild className="justify-start">
          <Link href="/admin/users">User Management</Link>
        </Button>
        {/* Add more admin links as needed */}
        <Button
          variant="link"
          className="justify-start text-destructive"
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('authToken');
              localStorage.removeItem('userRole');
              localStorage.removeItem('username');
              localStorage.removeItem('email');
            }
            router.push('/login');
          }}
        >
          Logout
        </Button>
      </nav>
    </aside>
  );
}
