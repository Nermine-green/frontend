import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex">
      <AdminSidebar />
      <main className="flex-1 p-6 ml-56">{children}</main>
    </div>
  );
}
