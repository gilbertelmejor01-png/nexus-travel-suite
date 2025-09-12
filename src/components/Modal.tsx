import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  MapPin,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface CountryImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (country: string, image: File | null) => void;
}

const CountryImageModal = ({
  isOpen,
  onClose,
  onSave,
}: CountryImageModalProps) => {
  const [paisOrigen, setPaisOrigen] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const paises = [
    "España",
    "Francia",
    "Italia",
    "Reino Unido",
    "Alemania",
    "Portugal",
    "Países Bajos",
    "Bélgica",
    "Suiza",
    "Austria",
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validar tamaño máximo de 5MB
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Archivo demasiado grande",
          description: "Por favor, selecciona una imagen menor a 5MB",
        });
        return;
      }
      setImagen(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleTriggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveImage = () => {
    setImagen(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const enviarDatosAlWebhook = async () => {
    if (!paisOrigen) return;

    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append("pais", paisOrigen);
      if (imagen) {
        formData.append("imagen", imagen);
      }

      const response = await fetch(
        "https://appwebhookapp.flowmaticn8n.us/webhook/d8a36c09-92ca-4444-b475-f86290ee5b36",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        setIsSent(true);
        onSave(paisOrigen, imagen);

        toast({
          title: "Datos enviados exitosamente",
          description: "La información se ha enviado al webhook correctamente",
        });

        // Cerrar automáticamente después de 2 segundos
        setTimeout(() => {
          onClose();
          setIsSent(false);
        }, 2000);
      } else {
        throw new Error("Error en la respuesta del servidor");
      }
    } catch (error) {
      console.error("Error al enviar datos:", error);
      toast({
        variant: "destructive",
        title: "Error al enviar",
        description: "Hubo un problema al enviar los datos al webhook",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md mx-4 bg-background rounded-xl shadow-xl overflow-hidden"
        style={{ boxShadow: "0 10px 30px -10px hsl(208 59% 25% / 0.15)" }}
      >
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-flowmatic-dark-blue to-flowmatic-medium-blue p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Agregar País de Origen
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-flowmatic-teal transition-colors"
              disabled={isSending}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {isSent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                ¡Datos enviados!
              </h3>
              <p className="text-muted-foreground mt-2">
                La información se ha enviado correctamente al webhook
              </p>
            </div>
          ) : (
            <>
              {/* Selección de País */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  País de Origen
                </label>
                <Select
                  value={paisOrigen}
                  onValueChange={setPaisOrigen}
                  disabled={isSending}
                >
                  <SelectTrigger className="border-border">
                    <SelectValue placeholder="Selecciona un país" />
                  </SelectTrigger>
                  <SelectContent>
                    {paises.map((paisOption) => (
                      <SelectItem key={paisOption} value={paisOption}>
                        {paisOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subida de Imagen */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Imagen Representativa
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                  disabled={isSending}
                />

                {previewUrl ? (
                  <div className="relative group">
                    <div className="border border-border rounded-lg overflow-hidden">
                      <img
                        src={previewUrl}
                        alt="Vista previa"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="flex items-center gap-1"
                        disabled={isSending}
                      >
                        <X className="h-4 w-4" /> Eliminar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-flowmatic-teal transition-colors"
                    onClick={!isSending ? handleTriggerUpload : undefined}
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="bg-flowmatic-teal/10 p-3 rounded-full">
                        <Upload className="h-6 w-6 text-flowmatic-teal" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Haz clic para subir una imagen
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Formatos: JPG, PNG (Máx. 5MB)
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        disabled={isSending}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" /> Seleccionar
                        imagen
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Pie de página con acciones */}
        <div className="bg-muted/50 p-4 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSending || isSent}
          >
            Cancelar
          </Button>
          {!isSent && (
            <Button
              variant="flowmatic"
              onClick={enviarDatosAlWebhook}
              disabled={!paisOrigen || isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CountryImageModal;
