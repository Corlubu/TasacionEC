import { useState, useRef } from "react";
import { useTRPC } from "~/trpc/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "~/stores/auth-store";
import { Upload, X, Image, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface PhotoGalleryProps {
  propertyId: number;
  propertyStatus: string;
  onPhotosChange?: () => void;
}

export function PhotoGallery({
  propertyId,
  propertyStatus,
  onPhotosChange,
}: PhotoGalleryProps) {
  const { token } = useAuthStore();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});

  const photosQuery = useQuery(
    trpc.getPropertyPhotos.queryOptions({
      token: token!,
      propertyId,
    }),
  );

  const generateBatchUrlsMutation = useMutation(
    trpc.generateBatchUploadUrls.mutationOptions(),
  );

  const confirmUploadMutation = useMutation(
    trpc.confirmPhotoUpload.mutationOptions(),
  );

  const deletePhotoMutation = useMutation(
    trpc.deletePropertyPhoto.mutationOptions(),
  );

  const photos = photosQuery.data || [];
  const currentPhotoCount = photos.length;
  const canUpload = currentPhotoCount < 20;
  const isDraft = propertyStatus === "DRAFT";

  const categories = [
    { value: "facade", label: "Fachada" },
    { value: "interior", label: "Interior" },
    { value: "kitchen", label: "Cocina" },
    { value: "bathroom", label: "Baño" },
    { value: "damage", label: "Daños" },
    { value: "document", label: "Documento" },
  ];

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    // Validate photo count
    const newTotal = currentPhotoCount + files.length;
    if (newTotal > 20) {
      toast.error(
        `No se pueden subir ${files.length} fotos. Máximo 20 fotos por propiedad. Actual: ${currentPhotoCount}`,
      );
      return;
    }

    if (currentPhotoCount + files.length < 5 && currentPhotoCount === 0) {
      toast.error("Debes subir al menos 5 fotos");
    }

    setUploading(true);

    try {
      // Prepare file data
      const fileData = files.map((file, index) => ({
        fileName: file.name,
        fileType: file.type,
        category: index === 0 ? "facade" : "interior", // Default categories
      }));

      // Generate batch upload URLs
      const result = await generateBatchUrlsMutation.mutateAsync({
        token: token!,
        propertyId,
        files: fileData,
      });

      // Upload files to Supabase S3 and confirm in parallel
      const uploadPromises = result.uploadUrls.map(async (urlData, index) => {
        const file = files[index];
        const progressKey = file.name;

        try {
          setUploadProgress((prev) => ({ ...prev, [progressKey]: 0 }));

          // 🚨 MAGIA APLICADA: Subimos a S3 sin el header conflictivo
          const response = await fetch(urlData.uploadUrl, {
            method: "PUT",
            body: file,
            // Eliminamos el headers: { "Content-Type": file.type } que rompía la firma criptográfica
          });

          if (!response.ok) {
            // Leemos el error exacto que nos devuelve Supabase para saber qué pasó
            const errorText = await response.text();
            console.error(`Error de S3 al subir ${file.name}:`, errorText);
            throw new Error(`Upload failed for ${file.name}`);
          }

          setUploadProgress((prev) => ({ ...prev, [progressKey]: 50 }));

          // Confirm upload in database
          await confirmUploadMutation.mutateAsync({
            token: token!,
            propertyId,
            objectKey: urlData.objectKey,
            category: urlData.category,
          });

          setUploadProgress((prev) => ({ ...prev, [progressKey]: 100 }));

          return { success: true, fileName: file.name };
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          setUploadProgress((prev) => ({ ...prev, [progressKey]: -1 }));
          return { success: false, fileName: file.name, error };
        }
      });

      const results = await Promise.all(uploadPromises);
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      // Invalidate queries to refresh the UI with all new photos
      if (successCount > 0) {
        // Invalidate the photos query
        await queryClient.invalidateQueries({
          queryKey: trpc.getPropertyPhotos.queryKey({
            token: token!,
            propertyId,
          }),
        });

        // Also invalidate the property query to update photo count in parent components
        await queryClient.invalidateQueries({
          queryKey: trpc.getProperty.queryKey({ token: token!, propertyId }),
        });

        // Call the callback if provided
        onPhotosChange?.();

        toast.success(`${successCount} foto(s) subida(s) exitosamente`);
      }

      if (failCount > 0) {
        toast.error(`${failCount} foto(s) fallaron al subir`);
      }
    } catch (error: any) {
      console.error("Error in batch upload:", error);
      toast.error(error.message || "Error al subir las fotos");
    } finally {
      setUploading(false);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (photoId: number) => {
    if (!isDraft) {
      toast.error("Solo se pueden eliminar fotos en estado BORRADOR");
      return;
    }

    if (window.confirm("¿Estás seguro de que deseas eliminar esta foto?")) {
      try {
        await deletePhotoMutation.mutateAsync({
          token: token!,
          photoId,
        });

        // Invalidate queries to refresh the UI
        await queryClient.invalidateQueries({
          queryKey: trpc.getPropertyPhotos.queryKey({
            token: token!,
            propertyId,
          }),
        });

        await queryClient.invalidateQueries({
          queryKey: trpc.getProperty.queryKey({ token: token!, propertyId }),
        });

        onPhotosChange?.();

        toast.success("Foto eliminada");
      } catch (error: any) {
        toast.error(error.message || "Error al eliminar la foto");
      }
    }
  };

  const getCategoryLabel = (category: string) => {
    return categories.find((c) => c.value === category)?.label || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Galería de Fotos</h3>
          <p className="mt-1 text-sm text-gray-600">
            {currentPhotoCount} de 20 fotos{" "}
            {currentPhotoCount < 5 && "(mínimo 5 requeridas)"}
          </p>
        </div>
        {isDraft && canUpload && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  <span>Subir Fotos</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Photo count warning */}
      {currentPhotoCount < 5 && (
        <div className="flex items-start space-x-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
          <div>
            <p className="text-sm font-semibold text-yellow-900">
              Fotos insuficientes
            </p>
            <p className="mt-1 text-sm text-yellow-700">
              Se requieren al menos 5 fotos para completar el registro de la
              propiedad. Faltan {5 - currentPhotoCount} foto(s).
            </p>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && Object.keys(uploadProgress).length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="mb-2 text-sm font-semibold text-blue-900">
            Subiendo fotos...
          </p>
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="mb-2">
              <div className="mb-1 flex items-center justify-between text-xs text-blue-700">
                <span className="max-w-xs truncate">{fileName}</span>
                <span>
                  {progress === -1
                    ? "Error"
                    : progress === 100
                      ? "Completado"
                      : `${progress}%`}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-blue-200">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    progress === -1 ? "bg-red-600" : "bg-blue-600"
                  }`}
                  style={{ width: `${progress === -1 ? 100 : progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photos Grid */}
      {photosQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-lg bg-gray-200"
            />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-12 text-center">
          <Image className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <p className="mb-4 text-gray-600">No hay fotos aún</p>
          {isDraft && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Subir tus primeras fotos
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-lg"
            >
              <div className="flex aspect-square items-center justify-center bg-gray-100">
                <img
                  src={photo.url}
                  alt={photo.caption || "Property photo"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-xs font-semibold text-white">
                  {getCategoryLabel(photo.category)}
                </p>
                {photo.caption && (
                  <p className="truncate text-xs text-white/80">
                    {photo.caption}
                  </p>
                )}
              </div>
              {isDraft && (
                <button
                  onClick={() => handleDelete(photo.id)}
                  disabled={deletePhotoMutation.isPending}
                  className="absolute right-2 top-2 rounded-full bg-red-600 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-700 disabled:opacity-50 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
