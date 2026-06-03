import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "~/components/DashboardLayout";
import { useAuthStore } from "~/stores/auth-store";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Shield,
  ShieldCheck,
  UserCircle,
  Loader2,
  UserPlus,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/admin/users")({
  component: UsersAdminPage,
});

function UsersAdminPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated, user } = useAuthStore();
  const trpc = useTRPC();

  const queryClient = useQueryClient();
  // Estados para el Modal de Crear Usuario
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "APPRAISER" as "APPRAISER" | "SUPERVISOR" | "ADMIN",
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
      return;
    }
    if (user?.role !== "ADMIN") {
      toast.error("Acceso denegado. Solo administradores.");
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, user, navigate]);

  const usersQuery = useQuery(trpc.getUsers.queryOptions({ token: token! }));

  const updateUserRoleMutation = useMutation(
    trpc.updateUserRole.mutationOptions({
      onSuccess: () => {
        toast.success("Rol de usuario actualizado");
        queryClient.invalidateQueries();
      },
      onError: (error: any) => {
        toast.error(error.message || "Error al actualizar el rol");
      },
    }),
  );

  const createUserMutation = useMutation(
    trpc.createUser.mutationOptions({
      onSuccess: () => {
        toast.success("¡Usuario creado exitosamente!");
        setIsCreateModalOpen(false);
        setFormData({ name: "", email: "", password: "", role: "APPRAISER" }); // Limpiar formulario
        queryClient.invalidateQueries();
      },
      onError: (error: any) => {
        toast.error(error.message || "Error al crear el usuario");
      },
    }),
  );

  const handleRoleChange = (
    userId: number,
    newRole: "APPRAISER" | "SUPERVISOR" | "ADMIN",
  ) => {
    if (window.confirm(`¿Estás seguro de cambiar el rol a ${newRole}?`)) {
      updateUserRoleMutation.mutate({
        token: token!,
        userId,
        role: newRole,
      });
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    createUserMutation.mutate({
      token: token!,
      ...formData,
    });
  };

  if (usersQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Cabecera con Botón de Nuevo Usuario */}
        <div className="mb-8 flex flex-col items-start justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-gray-900">
              <ShieldCheck className="mr-3 h-8 w-8 text-blue-600" />
              Gestión de Equipo
            </h1>
            <p className="mt-2 text-gray-600">
              Administra los accesos, permisos y roles de todos los usuarios de
              la plataforma.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition-all hover:bg-blue-700"
          >
            <UserPlus className="h-5 w-5" />
            <span>Nuevo Usuario</span>
          </button>
        </div>

        {/* Tabla de Usuarios */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500"
                >
                  Usuario
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500"
                >
                  Rol Actual
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500"
                >
                  Avalúos / Reportes
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500"
                >
                  Fecha de Registro
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500"
                >
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {usersQuery.data?.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <UserCircle className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <div className="font-semibold text-gray-900">
                          {u.name}
                        </div>
                        <div className="text-sm text-gray-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${u.role === "ADMIN" ? "bg-purple-100 text-purple-800" : ""} ${u.role === "SUPERVISOR" ? "bg-blue-100 text-blue-800" : ""} ${u.role === "APPRAISER" ? "bg-green-100 text-green-800" : ""} `}
                    >
                      {u.role === "ADMIN" && (
                        <Shield className="mr-1.5 h-3 w-3" />
                      )}
                      {u.role === "SUPERVISOR" && (
                        <ShieldCheck className="mr-1.5 h-3 w-3" />
                      )}
                      {u.role === "APPRAISER" && (
                        <Users className="mr-1.5 h-3 w-3" />
                      )}
                      {u.role === "APPRAISER"
                        ? "Perito"
                        : u.role === "SUPERVISOR"
                          ? "Supervisor"
                          : "Administrador"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-600">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold">
                        {u._count.properties} Propiedades
                      </span>
                      <span className="text-xs text-gray-400">
                        {u._count.valuationReports} Reportes
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString("es-EC")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <select
                      disabled={
                        u.id === user?.id || updateUserRoleMutation.isPending
                      }
                      value={u.role}
                      onChange={(e) =>
                        handleRoleChange(u.id, e.target.value as any)
                      }
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      <option value="APPRAISER">Perito</option>
                      <option value="SUPERVISOR">Supervisor</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {usersQuery.data?.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              No se encontraron usuarios registrados en el sistema.
            </div>
          )}
        </div>
      </div>

      {/* Modal para Crear Nuevo Usuario */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md transform rounded-2xl bg-white p-6 shadow-2xl transition-all">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center text-xl font-bold text-gray-900">
                <UserPlus className="mr-2 h-6 w-6 text-blue-600" />
                Invitar Nuevo Usuario
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ej. Juan Pérez"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="juan@empresa.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Contraseña Temporal
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Rol del Usuario
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as any })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="APPRAISER">Perito (Elabora avalúos)</option>
                  <option value="SUPERVISOR">
                    Supervisor (Revisa avalúos)
                  </option>
                  <option value="ADMIN">Administrador (Acceso total)</option>
                </select>
              </div>

              <div className="mt-8 flex justify-end space-x-3 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg px-5 py-2.5 font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="flex items-center space-x-2 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {createUserMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span>Crear Usuario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
