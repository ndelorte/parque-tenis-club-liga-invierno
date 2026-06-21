// Admin layout — sin Navbar ni Footer públicos.
// Auth guard se agrega en Sprint 7 (Supabase Auth).

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-border px-4 h-14 flex items-center justify-between">
        <span className="font-semibold text-gray-800 text-sm">
          Panel Admin — Parque Tenis Club
        </span>
        <a href="/admin/login" className="text-xs text-gray-500 hover:text-gray-700">
          Cerrar sesión
        </a>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
