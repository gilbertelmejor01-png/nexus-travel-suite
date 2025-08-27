import { useState, useEffect } from "react";
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
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Modal2 from "../components/Modal2";
import Previa, { VoyageData } from "../components/Previa";
import Modal from "../components/Modal";

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
  const [n8nResponse, setN8nResponse] = useState<string>("");
  const [conversacionData, setConversacionData] = useState<string>("");
  const [voyageData, setVoyageData] = useState<VoyageData | null>(null);
  const { toast } = useToast();
  const [itineraryModalOpen, setItineraryModalOpen] = useState(false);
  const [paisDestino, setPaisDestino] = useState("");
  const [ciudadesItinerario, setCiudadesItinerario] = useState<CiudadBloque[]>(
    []
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [paisOrigen, setPaisOrigen] = useState("");
  const [imagenOrigen, setImagenOrigen] = useState<File | null>(null);

  // Función para obtener datos de la conversación desde Firestore
  // Modifica fetchConversacionData para obtener los datos estructurados
  const fetchConversacionData = async () => {
    console.log("🔄 Iniciando fetchConversacionData...");
    try {
      console.log("📡 Conectando a Firebase...");
      const conversacionDoc = await getDoc(
        doc(db, "conversacion", "xvbV2piJNxukwOUWODPk")
      );
      console.log("📄 Documento obtenido, existe:", conversacionDoc.exists());
      if (conversacionDoc.exists()) {
        const data = conversacionDoc.data();
        console.log("Datos de conversación obtenidos:", data);
        console.log("Estructura de data:", {
          hasOutput: !!data.output,
          outputType: typeof data.output,
          dataKeys: Object.keys(data),
          rawData: data
        });
        
        // Convertir los datos al formato VoyageData
        try {
          let parsedData: VoyageData | null = null;
          
          // Verificar si los datos tienen la estructura de Firestore con fields
          if (data.fields) {
            console.log("Parseando estructura de Firestore con fields");
            
            // Extraer datos de la estructura de Firestore
            const extractStringValue = (field: any) => field?.stringValue || '';
            const extractArrayValue = (field: any) => {
              try {
                return JSON.parse(field?.stringValue || '[]');
              } catch {
                return [];
              }
            };
            
            parsedData = {
              pays_destination: extractStringValue(data.fields.pays_destination),
              programme_detaille: extractStringValue(data.fields.programme_detaille),
              prix_par_personne: extractStringValue(data.fields.prix_par_personne),
              chambre_simple: extractStringValue(data.fields.chambre_simple),
              remarques_tarifs: extractStringValue(data.fields.remarques_tarifs),
              inclus: extractArrayValue(data.fields.inclus),
              non_inclus: extractArrayValue(data.fields.non_inclus),
              table_itineraire_bref: extractArrayValue(data.fields.table_itineraire_bref)
            };
            
            console.log("Datos extraídos de Firestore:", parsedData);
          }
          // Intentar diferentes estructuras de datos como fallback
          else if (typeof data.output === "string") {
            console.log("Parseando data.output como string");
            parsedData = JSON.parse(data.output);
          } else if (data.output && typeof data.output === "object") {
            console.log("Usando data.output como objeto");
            parsedData = data.output as VoyageData;
          } else if (data.response && typeof data.response === "string") {
            console.log("Parseando data.response como string");
            parsedData = JSON.parse(data.response);
          } else if (data.response && typeof data.response === "object") {
            console.log("Usando data.response como objeto");
            parsedData = data.response as VoyageData;
          } else {
            console.log("Usando datos directos");
            // Si no hay output ni response, intentar usar los datos directamente
            // Pero necesitamos parsear los arrays que vienen como strings JSON
            const parseArrayField = (field: any) => {
              if (typeof field === 'string') {
                try {
                  return JSON.parse(field);
                } catch {
                  return [];
                }
              }
              return Array.isArray(field) ? field : [];
            };
            
            parsedData = {
              pays_destination: data.pays_destination || '',
              programme_detaille: data.programme_detaille || '',
              prix_par_personne: data.prix_par_personne || '',
              chambre_simple: data.chambre_simple || '',
              remarques_tarifs: data.remarques_tarifs || '',
              inclus: parseArrayField(data.inclus),
              non_inclus: parseArrayField(data.non_inclus),
              table_itineraire_bref: parseArrayField(data.table_itineraire_bref)
            };
            
            console.log("Datos procesados con parsing de arrays:", parsedData);
          }

          console.log("Datos parseados:", parsedData);
          
          // Si no se pudieron parsear los datos, usar datos de prueba para verificar que el componente funciona
          if (parsedData && parsedData.programme_detaille) {
            setVoyageData(parsedData);
            console.log("voyageData establecido correctamente con datos reales");
          } else {
            console.log("No se pudieron parsear los datos, usando datos de prueba");
            // Datos de prueba para verificar que el componente Previa funciona
            const testData: VoyageData = {
              programme_detaille: "<h3>Día 1: Llegada</h3><p>Llegada al aeropuerto y traslado al hotel.</p><h3>Día 2: City Tour</h3><p>Recorrido por la ciudad histórica.</p>",
              table_itineraire_bref: [
                {
                  jour: "Día 1",
                  date: "15/06/2024",
                  programme: "Llegada y check-in",
                  nuit: "Hotel Central",
                  hôtel: "Hotel Boutique Central 4*"
                },
                {
                  jour: "Día 2",
                  date: "16/06/2024",
                  programme: "City Tour y museos",
                  nuit: "Hotel Central",
                  hôtel: "Hotel Boutique Central 4*"
                }
              ],
              prix_par_personne: "€1,250",
              chambre_simple: "€200 suplemento",
              remarques_tarifs: "Precios válidos hasta diciembre 2024",
              inclus: ["Alojamiento en hotel 4*", "Desayuno incluido", "Traslados aeropuerto", "Guía local"],
              non_inclus: ["Vuelos internacionales", "Comidas no especificadas", "Gastos personales", "Propinas"],
              pays_destination: "París, Francia"
            };
            setVoyageData(testData);
            console.log("Datos de prueba establecidos para verificar componente Previa");
          }
          
          setConversacionData(JSON.stringify(data, null, 2));
        } catch (parseError) {
          console.error("Error al parsear los datos de conversación:", parseError);
          setVoyageData(null);
          setConversacionData("Error al parsear los datos de conversación");
        }
      } else {
        console.log("No se encontró el documento de conversación");
        setConversacionData("No se encontraron datos de conversación");
      }
    } catch (error) {
      console.error("Error al obtener datos de conversación:", error);
      setConversacionData("Error al cargar datos de conversación");
    }
  };

  // Cargar datos de conversación al montar el componente
  useEffect(() => {
    console.log("useEffect ejecutándose - iniciando carga de datos");
    fetchConversacionData();
  }, []);

  // Función para forzar recarga de datos (para debugging)
  const forceReloadData = () => {
    console.log("Forzando recarga de datos...");
    setVoyageData(null);
    setConversacionData("");
    fetchConversacionData();
  };

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
                // Obtener el ID del usuario desde Firestore
                let userId = null;
                console.log("Usuario autenticado:", auth.currentUser?.uid);

                if (auth.currentUser) {
                  const userDoc = await getDoc(
                    doc(db, "users", auth.currentUser.uid)
                  );
                  console.log(
                    "Documento del usuario existe:",
                    userDoc.exists()
                  );

                  if (userDoc.exists()) {
                    userId = userDoc.id; // El ID del documento es igual a auth.currentUser.uid
                    console.log("ID del usuario obtenido:", userId);
                  } else {
                    console.log(
                      "No se encontró el documento del usuario en Firestore"
                    );
                  }
                } else {
                  console.log("No hay usuario autenticado");
                }

                const formData = new FormData();
                // Enviar el PDF
                formData.append("pdf", pdfFiles[0], pdfFiles[0].name);
                // Enviar el userId si está disponible
                if (userId) {
                  formData.append("userId", userId);
                  console.log("Enviando PDF con userId:", userId);
                } else {
                  console.log("Enviando PDF sin userId");
                }

                const response = await fetch(
                  "https://appn8napp.flowmaticn8n.us/webhook-test/b297050f-24cc-4da3-a4ab-d9bc5515d560",
                  {
                    method: "POST",
                    body: formData,
                  }
                );

                if (!response.ok) {
                } else {
                  try {
                    const raw = await response.text();
                    console.log("Respuesta cruda de n8n:", raw);

                    if (raw.trim()) {
                      try {
                        const data = JSON.parse(raw);
                        console.log("Respuesta de n8n parseada:", data);

                        setN8nResponse(
                          data.respuesta_ai ||
                            data.respuesta ||
                            JSON.stringify(data)
                        );
                      } catch (e) {
                        console.warn(
                          "No se pudo parsear la respuesta de n8n:",
                          e
                        );
                        setN8nResponse(raw); // Mostrar el texto aunque no sea JSON
                      }
                    } else {
                      console.warn("Respuesta vacía desde n8n");
                      setN8nResponse("⚠️ Sin respuesta desde n8n");
                    }
                  } catch (e) {
                    console.error("Error leyendo respuesta de n8n:", e);
                  }
                }
              } catch (error) {
                console.error("Error enviando PDF al webhook:", error);
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
      } else if (activeTab === "text" && textDescription.trim()) {
        // Procesar texto natural y enviar al webhook
        const steps = [
          { message: "Analizando descripción...", progress: 25 },
          { message: "Enviando a n8n...", progress: 60 },
          { message: "Procesando respuesta...", progress: 85 },
          { message: "¡Listo!", progress: 100 },
        ];

        for (const step of steps) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setProgress(step.progress);

          // Enviar texto al webhook cuando llegue al 60%
          if (step.progress === 60) {
            try {
              const response = await fetch(
                "https://appn8napp.flowmaticn8n.us/webhook-test/b297050f-24cc-4da3-a4ab-d9bc5515d560",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    sessionId: "12345",
                    mensaje_usuario: textDescription,
                  }),
                }
              );

              if (response.ok) {
                const data = await response.json();
                console.log("Respuesta AI:", data);
                // Almacenar la respuesta para mostrarla en la UI
                setN8nResponse(
                  data.respuesta_ai
                    ? `${data.mensaje_usuario}: ${data.respuesta_ai}`
                    : JSON.stringify(data)
                );
              } else {
                throw new Error("Error al enviar el texto al webhook");
              }
            } catch (error) {
              console.error("Error enviando texto:", error);
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
          description:
            "La descripción ha sido enviada y procesada exitosamente",
        });
      } else {
        // Para otros tabs o sin contenido, mantener comportamiento original
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
          
          <TabsTrigger value="text" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Texto Natural
          </TabsTrigger>
        </TabsList>

        <div>
          <Button onClick={() => setItineraryModalOpen(true)}>
            Crear Nuevo Itinerario
          </Button>
          <Button onClick={() => setModalOpen(true)}>Agregar imagen</Button>
        </div>
        <Modal2
          isOpen={itineraryModalOpen}
          onClose={() => setItineraryModalOpen(false)}
          onSave={(pais, ciudades) => {
            setPaisDestino(pais);
            setCiudadesItinerario(ciudades);
          }}
        />

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={(country, image) => {
            setPaisOrigen(country);
            setImagenOrigen(image);
          }}
        />

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
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">
                    Información de n8n
                  </label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={forceReloadData}
                    className="text-xs"
                  >
                    🔄 Debug: Recargar datos
                  </Button>
                </div>
                <div className="border rounded-md p-3 bg-muted/30 min-h-[200px]">
                  {console.log('Rendering Previa with voyageData:', voyageData)}
                  <Previa
                    data={voyageData}
                    loading={!voyageData && !conversacionData.includes("Error")}
                    error={conversacionData.includes("Error") ? conversacionData : null}
                  />
                </div>
              </div>

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
