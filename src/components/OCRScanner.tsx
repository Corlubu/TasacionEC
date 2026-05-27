import { useState, useRef } from "react";
import { Camera, Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface OCRScannerProps {
  onDataExtracted: (data: IDData) => void;
  onImageCaptured?: (imageData: string) => void;
}

interface IDData {
  idNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  nationality?: string;
  expirationDate?: string;
  rawText?: string;
  confidence?: number;
}

export function OCRScanner({ onDataExtracted, onImageCaptured }: OCRScannerProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<IDData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("No se pudo acceder a la cámara");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const captureFromCamera = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedImage(imageData);
      stopCamera();
      processImage(imageData);
      
      if (onImageCaptured) {
        onImageCaptured(imageData);
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setCapturedImage(imageData);
      processImage(imageData);
      
      if (onImageCaptured) {
        onImageCaptured(imageData);
      }
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (imageData: string) => {
    setProcessing(true);
    
    try {
      // TODO: Replace with actual tRPC call to OCR processing endpoint
      // Example structure for future implementation:
      //
      // const trpc = useTRPC();
      // const result = await trpc.processOCR.mutate({
      //   token: authToken,
      //   imageData: imageData,
      //   documentType: "ECUADORIAN_ID"
      // });
      //
      // The backend endpoint should:
      // 1. Upload image to MinIO/S3
      // 2. Call AWS Textract or Google Document AI
      // 3. Parse the OCR response for Ecuadorian ID fields
      // 4. Return structured data
      //
      // Backend implementation would be in:
      // src/server/trpc/procedures/ocr.ts
      //
      // export const processOCR = baseProcedure
      //   .input(z.object({
      //     token: z.string(),
      //     imageData: z.string(),
      //     documentType: z.enum(["ECUADORIAN_ID", "PROPERTY_DEED", "UTILITY_BILL"])
      //   }))
      //   .mutation(async ({ input }) => {
      //     // 1. Authenticate user
      //     const userId = await getUserIdFromToken(input.token);
      //     
      //     // 2. Decode base64 and upload to MinIO
      //     const buffer = Buffer.from(input.imageData.split(',')[1], 'base64');
      //     const objectKey = `ocr/${userId}/${Date.now()}.jpg`;
      //     await minioClient.putObject('ocr-documents', objectKey, buffer);
      //     
      //     // 3. Call AWS Textract
      //     // const textract = new AWS.Textract();
      //     // const result = await textract.detectDocumentText({
      //     //   Document: { S3Object: { Bucket: 'ocr-documents', Name: objectKey } }
      //     // }).promise();
      //     
      //     // 4. Parse results for Ecuadorian ID
      //     // const parsedData = parseEcuadorianID(result.Blocks);
      //     
      //     // 5. Return structured data
      //     // return parsedData;
      //   });
      
      // TEMPORARY: Simulate OCR processing
      // This will be replaced with the actual tRPC call above
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Mock extracted data - will be replaced with real OCR results
      const mockData: IDData = {
        idNumber: "1234567890",
        fullName: "EJEMPLO NOMBRE APELLIDO",
        dateOfBirth: "01/01/1990",
        nationality: "ECUATORIANA",
        expirationDate: "01/01/2030",
        rawText: "Texto extraído de la cédula...",
        confidence: 0.85,
      };
      
      setExtractedData(mockData);
      onDataExtracted(mockData);
      toast.success("Datos extraídos exitosamente");
    } catch (error) {
      console.error("Error processing OCR:", error);
      toast.error("Error al procesar la imagen");
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setExtractedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Escanear Cédula de Identidad
        </h3>
        
        {!capturedImage && !cameraActive && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={startCamera}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Camera className="w-5 h-5" />
              <span>Usar Cámara</span>
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center space-x-2 bg-white border-2 border-blue-600 text-blue-600 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span>Subir Imagen</span>
            </button>
          </div>
        )}

        {cameraActive && (
          <div className="space-y-3">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={captureFromCamera}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Capturar
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {capturedImage && (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={capturedImage}
                alt="Cédula capturada"
                className="w-full rounded-lg border border-gray-300"
              />
              <button
                type="button"
                onClick={reset}
                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {processing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-sm font-semibold text-blue-900">
                  Procesando imagen con OCR...
                </span>
              </div>
            )}

            {extractedData && !processing && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-900">
                    Datos extraídos (Confianza: {((extractedData.confidence || 0) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  {extractedData.idNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cédula:</span>
                      <span className="font-semibold text-gray-900">
                        {extractedData.idNumber}
                      </span>
                    </div>
                  )}
                  {extractedData.fullName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nombre:</span>
                      <span className="font-semibold text-gray-900">
                        {extractedData.fullName}
                      </span>
                    </div>
                  )}
                  {extractedData.dateOfBirth && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha de Nacimiento:</span>
                      <span className="font-semibold text-gray-900">
                        {extractedData.dateOfBirth}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              <strong>Estado:</strong> El componente está preparado para integración con servicios de OCR reales (AWS Textract o Google Document AI). 
              La función processImage está estructurada para realizar llamadas al endpoint tRPC futuro que procesará cédulas ecuatorianas.
              Actualmente en modo de demostración con datos simulados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
