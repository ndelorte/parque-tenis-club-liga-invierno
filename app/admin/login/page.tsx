// Login con Supabase Auth — Sprint 7.

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-border rounded-xl p-8 w-full max-w-sm shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Acceso admin</h1>
        <p className="text-sm text-gray-500 mb-6">Parque Tenis Club</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              disabled
              placeholder="admin@parquetenis.com"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              disabled
              placeholder="••••••••"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400"
            />
          </div>
          <button
            disabled
            className="w-full bg-brand text-white py-2.5 rounded-lg text-sm font-semibold opacity-60 cursor-not-allowed"
          >
            Iniciar sesión
          </button>
        </div>

        <p className="mt-4 text-xs text-center text-gray-400">
          Autenticación disponible en Sprint 7.
        </p>
      </div>
    </div>
  );
}
