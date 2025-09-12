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
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

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
                <label className="text-sm font-medium">
                  Información de n8n
                </label>
                <div className="border rounded-md p-3 bg-muted/30 min-h-[80px]">
                  <p className="text-sm text-muted-foreground">
                    {n8nResponse ||
                      "Aquí se mostrará la información traída de n8n..."}
                  </p>
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


quiero que me adecues eb formato recat  y esta informacion :let result = {
  programme_detaille: "",
  table_itineraire_bref: [],
  prix_par_personne: "",
  chambre_simple: "",
  remarques_tarifs: "",
  inclus: [],
  non_inclus: [],
  pays_destination: "" // nuevo campo
}; se va a extrae de la base de datos firebse , colletion: conversacion y de autetication o id :xvbV2piJNxukwOUWODPk conversacion tsx :let data;
try {
  data = typeof $json.output === "string" ? JSON.parse($json.output) : $json;
} catch (e) {
  return [{
    json: {
      error: "Échec de l'analyse JSON : la sortie du AI Agent1 doit être un objet JSON valide contenant programme_detaille, table_itineraire_bref, etc. Détail : " + e.message
    }
  }];
}

// Funciones existentes (sin cambios)
const extractHotels = () => {
  const seen = new Set();
  return (data.table_itineraire_bref || [])
    .filter(entry => entry.hôtel && !seen.has(entry.hôtel) && seen.add(entry.hôtel))
    .map(entry => ({
      nom: entry.hôtel,
      description: `Nuit à ${entry.nuit || "emplacement inconnu"}`
    }));
};

const renderHotels = (hotels) => {
  const hotelImages = {
    "El Mesón de Maria": "https://res.cloudinary.com/dckcnx0sz/image/upload/v1752806775/Captura_de_pantalla_de_2025-07-17_21-42-28_wu28bg.png",
    "Hotel Atitlan 4*": "https://res.cloudinary.com/dckcnx0sz/image/upload/v1752806775/Captura_de_pantalla_de_2025-07-17_21-42-28_wu28bg.png",
    "Jungle Lodge 3*": "https://res.cloudinary.com/dckcnx0sz/image/upload/v1752806775/Captura_de_pantalla_de_2025-07-17_21-42-28_wu28bg.png",
    "Hôtel accueillant et moderne - King Room": "https://res.cloudinary.com/dckcnx0sz/image/upload/v1752809571/Captura_de_pantalla_de_2025-07-17_21-18-08_m8z7sc.png"
  };

  return hotels.map(hotel => {
    const defaultImage = "https://res.cloudinary.com/dckcnx0sz/image/upload/v1752806775/Captura_de_pantalla_de_2025-07-17_21-42-28_wu28bg.png";
    const image = hotelImages[hotel.nom] || defaultImage;
    return `<li><strong>${hotel.nom}</strong> - ${hotel.description || ""}<div><img src="${image}" alt="${hotel.nom}" class="hotel-image"></div></li>`;
  }).join("");
};

const renderTable = (rows) => Array.isArray(rows) ? rows.map(r => `<tr><td>${r.jour}</td><td>${r.date}</td><td>${r.programme}</td><td>${r.nuit}</td></tr>`).join("") : "";
const renderList = (items) => Array.isArray(items) ? items.map(i => `<li>${i}</li>`).join("") : "";

// HTML optimizado para evitar páginas vacías
const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Immersion au ${data.pays_destination || "Destination"}</title>
  <style>
    /* TUS ESTILOS EXACTAMENTE COMO LOS TENÍAS */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8f9fa;
      color: #333;
      line-height: 1.6;
      font-size: 10.5pt;
      padding: 1rem;
    }
    
    .container {
      max-width: 100%;
      background: white;
      box-shadow: 0 0.2rem 1rem rgba(0,0,0,0.1);
      margin: 0 auto;
      padding: 1.5rem;
    }
    
    /* En-tête */
    .header-box {
      text-align: center;
      padding: 1rem 0;
      margin-bottom: 1rem;
    }
    
    .header-box img {
      max-height: 3.5rem;
      margin: 0 auto 1rem;
      display: block;
    }
    
    h1 {
      color: #963f17;
      font-size: 1.5rem;
      margin: 0.5rem 0;
      font-weight: 600;
    }
    
    /* Sections */
    .section {
      margin-bottom: 1.5rem;
    }
    
    h2 {
      color: #ae5227;
      font-size: 1.2rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e0e0e0;
      margin-bottom: 1rem;
      font-weight: 600;
    }
    
    /* Tableaux */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      font-size: 0.9rem;
      box-shadow: 0 0.1rem 0.3rem rgba(0,0,0,0.05);
    }
    
    th {
      background-color: #2c3e50;
      color: white;
      font-weight: 600;
      padding: 0.6rem;
      text-align: left;
    }
    
    td {
      padding: 0.6rem;
      border-bottom: 1px solid #eee;
    }
    
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    
    /* Listes */
    ul {
      padding-left: 1.2rem;
      margin: 0.5rem 0;
    }
    
    ul li {
      margin-bottom: 0.8rem;
      position: relative;
    }
    
    ul li:before {
      content: "•";
      color: #ae6527;
      font-weight: bold;
      position: absolute;
      left: -0.8rem;
    }
    
    /* Éléments spéciaux */
    .note {
      background-color: #e7cec2;
      border-left: 4px solid #74685d;
      padding: 0.8rem;
      margin: 1rem 0;
      border-radius: 0 4px 4px 0;
    }
    
    .price-box {
      background-color: #e7cec2;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 4px;
      border-left: 4px solid #ae6527;
    }
    
    /* Images */
    img {
      max-width: 100%;
      align-items: center;
      height: auto;
      margin: 0.5rem 0;
      border-radius: 4px;
      display: block;
    }
    
    .hotel-image {
      max-height: 10rem;
      object-fit: cover;
      margin-top: 0.5rem;
    }
    
    /* Pied de page */
    .footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 2px solid #ae6527;
    }
    
    /* MEJORAS ESPECÍFICAS PARA EVITAR PÁGINAS VACÍAS */
    @media print {
      /* Optimización de márgenes para aprovechar espacio */
      body {
        padding: 0;
        margin: 0.5cm;
        font-size: 10pt;
      }
      
      .container {
        padding: 0.5cm;
        box-shadow: none;
      }
      
      /* Control avanzado de saltos de página */
      .section {
        page-break-inside: auto;
        page-break-after: auto;
        page-break-before: auto;
      }
      
      .programme-detaille {
        page-break-inside: auto;
      }
      
      /* Permite dividir tablas largas entre páginas */
      table {
        page-break-inside: auto;
      }
      
      thead {
        display: table-header-group;
      }
      
      tr {
        page-break-inside: avoid;
      }
      
      /* Control de viudas/huérfanos para evitar líneas sueltas */
      p, h1, h2, h3, li {
        orphans: 3;  /* Mínimo 3 líneas al final de página */
        widows: 3;   /* Mínimo 3 líneas al inicio de página */
      }
      
      /* Evita que encabezados queden solos al final */
      h1, h2, h3 {
        page-break-after: avoid;
      }
      
      /* Permite dividir listas largas */
      ul {
        page-break-inside: auto;
      }
      
      li {
        page-break-inside: avoid;
      }
      
      /* Optimización de imágenes */
      img {
        max-height: 7cm;
        page-break-inside: avoid;
        page-break-after: avoid;
      }
      
      .hotel-image {
        max-height: 6cm;
      }
    }
  </style>
</head>
<body>
  <!-- Contenido exactamente igual al tuyo -->
  <div class="container">
    <div class="header-box">
      <img src="https://res.cloudinary.com/dckcnx0sz/image/upload/v1752805614/Captura_de_pantalla_de_2025-07-17_21-14-15_za6iuo.png" alt="Logo Néogusto">
      <h1>Votre voyage avec Néogusto</h1>
      <h1>Immersion au ${data.pays_destination || "Guatemala"}</h1>
    </div>

    <div class="section">
      <h2>VOS ENVIES</h2>
      <div style="border: 1px solid #333; height: 6rem; margin: 1rem 0;"></div>
    </div>

    <div class="section">
      <h2>VOTRE ITINÉRAIRE EN BREF</h2>
      <table>
        <thead>
          <tr>
            <th>JOUR</th>
            <th>DATE</th>
            <th>PROGRAMME</th>
            <th>NUIT</th>
          </tr>
        </thead>
        <tbody>
          ${renderTable(data.table_itineraire_bref || [])}
        </tbody>
      </table>
      <div class="note">
        <p>Le programme a été établi sur la base de nos derniers échanges et <strong>peut être adapté selon vos souhaits</strong>.</p>
      </div>
    </div>

    <div class="section programme-detaille">
      <h2>PROGRAMME DÉTAILLÉ</h2>
      <img src="https://www.vinccihoteles.com/media/uploads/cms_apps/imagenes/disposicion-articulos-viaje-angulo-alto.jpg?q=pr:sharp/rs:fill/w:900/h:500/g:ce/f:jpg" alt="Programme détaillé">
      ${data.programme_detaille || "<p>Description du programme à venir</p>"}
    </div>

    <div class="section">
      <table>
        <tr>
          <th>INCLUS</th>
          <th>NON INCLUS</th>
        </tr>
        <tr>
          <td><ul>${renderList(data.inclus || [])}</ul></td>
          <td><ul>${renderList(data.non_inclus || [])}</ul></td>
        </tr>
      </table>
      
      <div class="price-box">
        <p><strong>TARIF par personne : ${data.prix_par_personne || "à confirmer"}</strong></p>
        <p>Chambre simple : ${data.chambre_simple || "sur demande"}</p>
        <p>Remarques : ${data.remarques_tarifs || "aucune"}</p>
      </div>
    </div>

    <div class="section">
      <h2>VOS HÉBERGEMENTS</h2>
      <img src="https://res.cloudinary.com/dckcnx0sz/image/upload/v1752805614/Captura_de_pantalla_de_2025-07-17_21-14-15_za6iuo.png" alt="Hébergements" style="max-height: 3rem; margin: 0 auto 1rem; display: block;">
      <p>Hébergements sélectionnés pour leur <strong>confort</strong>, <strong>charme</strong> et <strong>localisation</strong>.</p>
      
      <ul>
        ${renderHotels(extractHotels())}
      </ul>
      
      <div class="note">
        <p><strong>NOTE :</strong> Les hébergements proposés sont sujets à disponibilité au moment de la réservation.</p>
      </div>
    </div>

    <div class="footer">
      <h2>BON VOYAGE !</h2>
    </div>
  </div>
</body>
</html>
`;

return [{
  json: {
    html
  }
}];