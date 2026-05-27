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

export function PhotoGallery({ propertyId, propertyStatus, onPhotosChange }: PhotoGalleryProps) {
  const { token } = useAuthStore();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const photosQuery = useQuery(
    trpc.getPropertyPhotos.queryOptions({
      token: token!,
      propertyId,
    })
  );

  const generateBatchUrlsMutation = useMutation(
    trpc.generateBatchUploadUrls.mutationOptions()
  );

  const confirmUploadMutation = useMutation(
    trpc.confirmPhotoUpload.mutationOptions()
  );

  const deletePhotoMutation = useMutation(
    trpc.deletePropertyPhoto.mutationOptions()
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Validate photo count
    const newTotal = currentPhotoCount + files.length;
    if (newTotal > 20) {
      toast.error(`No se pueden subir ${files.length} fotos. Máximo 20 fotos por propiedad. Actual: ${currentPhotoCount}`);
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

      // Upload files to MinIO and confirm in parallel
      const uploadPromises = result.uploadUrls.map(async (urlData, index) => {
        const file = files[index];
        const progressKey = file.name;

        try {
          setUploadProgress((prev) => ({ ...prev, [progressKey]: 0 }));

          // Upload to MinIO
          const response = await fetch(urlData.uploadUrl, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });

          if (!response.ok) {
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
          queryKey: trpc.getPropertyPhotos.queryKey({ token: token!, propertyId }),
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
          queryKey: trpc.getPropertyPhotos.queryKey({ token: token!, propertyId }),
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
          <p className="text-sm text-gray-600 mt-1">
            {currentPhotoCount} de 20 fotos {currentPhotoCount < 5 && "(mínimo 5 requeridas)"}
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
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Subir Fotos</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Photo count warning */}
      {currentPhotoCount < 5 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-900">
              Fotos insuficientes
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Se requieren al menos 5 fotos para completar el registro de la propiedad.
              Faltan {5 - currentPhotoCount} foto(s).
            </p>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && Object.keys(uploadProgress).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-900 mb-2">
            Subiendo fotos...
          </p>
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="mb-2">
              <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
                <span className="truncate max-w-xs">{fileName}</span>
                <span>
                  {progress === -1 ? "Error" : progress === 100 ? "Completado" : `${progress}%`}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1.5">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-200 rounded-lg aspect-square"
            />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No hay fotos aún</p>
          {isDraft && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Subir tus primeras fotos
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                <img
                  src={photo.url}
                  alt={photo.caption || "Property photo"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-xs text-white font-semibold">
                  {getCategoryLabel(photo.category)}
                </p>
                {photo.caption && (
                  <p className="text-xs text-white/80 truncate">{photo.caption}</p>
                )}
              </div>
              {isDraft && (
                <button
                  onClick={() => handleDelete(photo.id)}
                  disabled={deletePhotoMutation.isPending}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
