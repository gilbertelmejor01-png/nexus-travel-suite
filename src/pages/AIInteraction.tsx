import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  Image,
  Sheet,
  MessageSquare,
  Sparkles,
  Loader2,
  X,
  Mail,
  Plane,
  Edit3,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProcessedData {
  destino: string;
  fechas: string;
  hotel: string;
  coste: number;
}

const AIInteraction = () => {
  const [activeTab, setActiveTab] = useState("pdf");
  const [files, setFiles] = useState<File[]>([]);
  const [email, setEmail] = useState("");
  const [textDescription, setTextDescription] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedData, setProcessedData] = useState<ProcessedData[]>([]);
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();

  // Procesamiento con envío de PDF al webhook
  const simulateProcessing = async () => {
    setProcessing(true);
    setProgress(0);

    try {
      // Solo procesar si hay archivos PDF en el tab de PDF
      if (activeTab === "pdf" && files.length > 0) {
        // Filtrar solo archivos PDF
        const pdfFiles = files.filter(
          (file) => file.type === "application/pdf"
        );

        if (pdfFiles.length > 0) {
          const steps = [
            { message: "Analizando documentos...", progress: 25 },
            { message: "Enviando PDF al webhook...", progress: 60 },
            { message: "Procesando respuesta...", progress: 85 },
            { message: "¡Listo!", progress: 100 },
          ];

          for (const step of steps) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setProgress(step.progress);

            // Enviar PDF al webhook cuando llegue al 60%
            if (step.progress === 60) {
              try {
                const formData = new FormData();
                // Enviar solo el primer PDF (o todos si quieres)
                formData.append("pdf", pdfFiles[0]);

                const response = await fetch(
                  "https://appn8napp.flowmaticn8n.us/webhook-test/b297050f-24cc-4da3-a4ab-d9bc5515d560",
                  {
                    method: "POST",
                    body: formData,
                  }
                );

                if (!response.ok) {
                  throw new Error("Error al enviar el PDF al webhook");
                }
              } catch (error) {
                console.error("Error enviando PDF:", error);
                throw error;
              }
            }

            if (step.progress === 100) {
              // Mock data
              setProcessedData([
                {
                  destino: "París",
                  fechas: "15-20 Jun 2024",
                  hotel: "Hotel Luxe",
                  coste: 1250,
                },
                {
                  destino: "Roma",
                  fechas: "22-25 Jun 2024",
                  hotel: "Grand Hotel",
                  coste: 890,
                },
              ]);
            }
          }

          setProcessing(false);
          toast({
            title: "Procesamiento completado",
            description: "El PDF ha sido enviado y procesado exitosamente",
          });
        } else {
          setProcessing(false);
          toast({
            title: "Error",
            description: "No se encontraron archivos PDF para procesar",
            variant: "destructive",
          });
        }
      } else {
        // Para otros tabs o sin archivos, mantener comportamiento original
        const steps = [
          { message: "Analizando documentos...", progress: 25 },
          { message: "Extrayendo datos...", progress: 60 },
          { message: "Estructurando información...", progress: 85 },
          { message: "¡Listo!", progress: 100 },
        ];

        for (const step of steps) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setProgress(step.progress);

          if (step.progress === 100) {
            // Mock data
            setProcessedData([
              {
                destino: "París",
                fechas: "15-20 Jun 2024",
                hotel: "Hotel Luxe",
                coste: 1250,
              },
              {
                destino: "Roma",
                fechas: "22-25 Jun 2024",
                hotel: "Grand Hotel",
                coste: 890,
              },
            ]);
          }
        }

        setProcessing(false);
        toast({
          title: "Procesamiento completado",
          description: "Los datos han sido extraídos exitosamente",
        });
      }
    } catch (error) {
      setProcessing(false);
      console.error("Error en el procesamiento:", error);
      toast({
        title: "Error en el procesamiento",
        description:
          "Hubo un problema al procesar el archivo. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxFiles: 5,
    onDrop: (acceptedFiles) => {
      setFiles((prev) => [...prev, ...acceptedFiles]);
      toast({
        title: "Archivos agregados",
        description: `${acceptedFiles.length} archivo(s) agregado(s)`,
      });
    },
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const optimizeDescription = () => {
    const optimized = `Viaje organizado para pareja: ${textDescription}. Incluye alojamiento en hoteles 4-5 estrellas, desayuno incluido, traslados aeropuerto-hotel, y recomendaciones gastronómicas locales.`;
    setTextDescription(optimized);
    toast({
      title: "Descripción optimizada",
      description: "La IA ha mejorado tu descripción",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Interacción con IA
        </h1>
        <p className="text-muted-foreground">
          Procesa información de viajes usando inteligencia artificial
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pdf" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Subir PDF
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Captura Email
          </TabsTrigger>
          <TabsTrigger value="sheet" className="flex items-center gap-2">
            <Sheet className="h-4 w-4" />
            Hoja Cálculo
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Texto Natural
          </TabsTrigger>
        </TabsList>

        {/* PDF Upload */}
        <TabsContent value="pdf" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subir Documentos PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-flowmatic-teal bg-flowmatic-teal/5"
                    : "border-muted-foreground/25 hover:border-flowmatic-teal/50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-flowmatic-teal" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive
                    ? "Suelta los archivos aquí"
                    : "Arrastra archivos o haz clic"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Límite: 5 archivos (PDF, JPG, PNG) - Máx. 10MB cada uno
                </p>
              </div>

              {/* Files Preview */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">Archivos seleccionados:</h4>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-flowmatic-teal" />
                        <span className="text-sm">{file.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Capture */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Captura de Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email asociado</label>
                <Input
                  type="email"
                  placeholder="cliente@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="h-4 w-4" />}
                />
              </div>

              <div
                {...getRootProps()}
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors border-muted-foreground/25 hover:border-flowmatic-teal/50"
              >
                <input {...getInputProps()} />
                <Image className="h-8 w-8 mx-auto mb-2 text-flowmatic-teal" />
                <p className="font-medium">Subir imágenes de emails</p>
                <p className="text-xs text-muted-foreground">
                  Solo imágenes claras de emails
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google Sheets */}
        <TabsContent value="sheet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conexión con Google Sheets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!connected ? (
                <div className="text-center py-8">
                  <Sheet className="h-16 w-16 mx-auto mb-4 text-flowmatic-teal" />
                  <h3 className="font-medium mb-2">Conectar Google Sheets</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Autoriza el acceso para importar datos de tus hojas de
                    cálculo
                  </p>
                  <Button
                    variant="flowmatic"
                    onClick={() => setConnected(true)}
                  >
                    Conectar con Google
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 text-success mb-4">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm">Conectado exitosamente</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Seleccionar hoja
                    </label>
                    <select className="w-full p-2 border rounded-md">
                      <option>Presupuestos 2024</option>
                      <option>Clientes Principales</option>
                      <option>Destinos Populares</option>
                    </select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Natural Text */}
        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Descripción en Texto Natural</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Describe el viaje</label>
                <Textarea
                  placeholder="Ej: Viaje de luna de miel a París del 15 al 20 de junio, hotel boutique en Montmartre, incluye cena romántica en Torre Eiffel..."
                  value={textDescription}
                  onChange={(e) => setTextDescription(e.target.value)}
                  rows={6}
                  className="mt-2"
                />
              </div>
              <Button
                variant="outline"
                onClick={optimizeDescription}
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Optimizar descripción
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Process Button */}
      <div className="flex justify-center">
        <Button
          variant="flowmatic"
          size="lg"
          onClick={simulateProcessing}
          disabled={processing || (activeTab === "pdf" && files.length === 0)}
          className="min-w-48"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Procesar con IA
            </>
          )}
        </Button>
      </div>

      {/* Processing Progress */}
      {processing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Procesando datos...</span>
                <span className="text-sm text-muted-foreground">
                  {progress}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Preview */}
      {processedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previsualización de Datos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Destino</th>
                    <th className="text-left p-2">Fechas</th>
                    <th className="text-left p-2">Hotel</th>
                    <th className="text-left p-2">Coste</th>
                  </tr>
                </thead>
                <tbody>
                  {processedData.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{item.destino}</td>
                      <td className="p-2">{item.fechas}</td>
                      <td className="p-2">{item.hotel}</td>
                      <td className="p-2">€{item.coste.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-4 mt-6">
              <Button variant="outline" className="flex-1">
                <Edit3 className="h-4 w-4 mr-2" />
                Editar manualmente
              </Button>
              <Button variant="flowmatic" className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                Enviar al cliente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIInteraction;
