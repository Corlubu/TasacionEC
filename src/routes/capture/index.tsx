import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "~/components/DashboardLayout";
import { PropertyForm } from "~/components/PropertyForm";
import { useAuthStore } from "~/stores/auth-store";
import { useTRPC } from "~/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { PropertyMapPickerLeaflet } from "~/components/PropertyMapPickerLeaflet";

export const Route = createFileRoute("/capture/")({
  component: CapturePage,
});

function CapturePage() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const trpc = useTRPC();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError("No se pudo obtener la ubicación. Usando ubicación por defecto.");
          // Default to Quito, Ecuador
          setLocation({ lat: -0.1807, lng: -78.4678 });
        }
      );
    } else {
      setLocationError("Geolocalización no soportada. Usando ubicación por defecto.");
      setLocation({ lat: -0.1807, lng: -78.4678 });
    }
  }, []);

  const createPropertyMutation = useMutation(
    trpc.createProperty.mutationOptions({
      onSuccess: (data) => {
        toast.success("Propiedad registrada exitosamente");
        navigate({ to: `/properties/${data.id}` });
      },
      onError: (error: any) => {
        toast.error(error.message || "Error al registrar la propiedad");
      },
    })
  );

  const handleSubmit = (data: any) => {
    if (!location) {
      toast.error("Esperando ubicación GPS...");
      return;
    }

    createPropertyMutation.mutate({
      token: token!,
      ...data,
      latitude: location.lat,
      longitude: location.lng,
    });
  };

  const handleCancel = () => {
    navigate({ to: "/dashboard" });
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nueva Captura de Propiedad
          </h1>
          <p className="text-gray-600">
            Registra todos los datos de la propiedad con geolocalización automática
          </p>
        </div>

        {/* Location Status */}
        {locationError && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Aviso:</strong> {locationError}
            </p>
          </div>
        )}

        {location && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Ubicación GPS detectada:</strong> {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Puedes ajustar la ubicación en el mapa a continuación
            </p>
          </div>
        )}

        {/* Interactive Map for Location Selection */}
        <div className="mb-6">
          <PropertyMapPickerLeaflet
            initialLat={location?.lat || -0.1807}
            initialLng={location?.lng || -78.4678}
            onLocationChange={(lat, lng) => setLocation({ lat, lng })}
          />
        </div>

        {/* Full Property Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <PropertyForm
            initialValues={{
              state: "Pichincha",
            }}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={createPropertyMutation.isPending}
            submitLabel="Registrar Propiedad"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
