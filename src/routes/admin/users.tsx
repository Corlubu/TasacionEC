import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "~/components/DashboardLayout";
import { useAuthStore } from "~/stores/auth-store";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Shield, ShieldCheck, UserCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/users")({
  component: UsersAdminPage,
});

function UsersAdminPage() {
  const navigate = useNavigate();
  const { token, isAuthenticated, user } = useAuthStore();
  const trpc = useTRPC();

  // Protección de Ruta Doble (Autenticación + Rol)
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
      return;
    }
    if (user?.role !== "ADMIN") {
      toast.error("Acceso denegado. Solo administradores.");
      navigate({ to: "/dashboard" }); // o a donde prefieras enviarlo
    }
  }, [isAuthenticated, user, navigate]);

  const usersQuery = useQuery(trpc.getUsers.queryOptions({ token: token! }));

  const updateUserRoleMutation = useMutation(
    trpc.updateUserRole.mutationOptions({
      onSuccess: () => {
        toast.success("Rol de usuario actualizado");
        usersQuery.refetch();
      },
      onError: (error: any) => {
        toast.error(error.message || "Error al actualizar el rol");
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
        <div className="mb-8 flex items-center justify-between">
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
        </div>

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
    </DashboardLayout>
  );
}
