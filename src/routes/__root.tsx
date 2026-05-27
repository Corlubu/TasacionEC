import {
  Outlet,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "react-hot-toast";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function NotFoundComponent() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
        <a
          href="/"
          className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}

function RootComponent() {
  const isFetching = useRouterState({ select: (s) => s.isLoading });

  if (isFetching) {
    return <div>Loading...</div>;
  }

  return (
    <TRPCReactProvider>
      <Toaster position="top-right" />
      <Outlet />
    </TRPCReactProvider>
  );
}
