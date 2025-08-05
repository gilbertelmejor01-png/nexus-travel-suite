import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  X,
  Calendar as CalendarIcon,
  MapPin,
  Building2,
  Save,
  Send,
  Eye,
  Plane,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Modal from "../components/Modal";
interface CiudadBloque {
  id: string;
  ciudad: string;
  fechaEntrada: Date | null;
  fechaSalida: Date | null;
  hotel: string;
}

const ManualCreation = () => {
  const [pais, setPais] = useState("");
  const [ciudades, setCiudades] = useState<CiudadBloque[]>([
    { id: "1", ciudad: "", fechaEntrada: null, fechaSalida: null, hotel: "" },
  ]);
  const [enviado, setEnviado] = useState(false);
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

  const [modalOpen, setModalOpen] = useState(false);
  const [paisOrigen, setPaisOrigen] = useState("");
  const [imagenOrigen, setImagenOrigen] = useState<File | null>(null);

  const agregarCiudad = () => {
    const nuevaCiudad: CiudadBloque = {
      id: Date.now().toString(),
      ciudad: "",
      fechaEntrada: null,
      fechaSalida: null,
      hotel: "",
    };
    setCiudades([...ciudades, nuevaCiudad]);
  };

  const eliminarCiudad = (id: string) => {
    if (ciudades.length > 1) {
      setCiudades(ciudades.filter((ciudad) => ciudad.id !== id));
    }
  };

  const actualizarCiudad = (
    id: string,
    campo: keyof CiudadBloque,
    valor: any
  ) => {
    setCiudades(
      ciudades.map((ciudad) =>
        ciudad.id === id ? { ...ciudad, [campo]: valor } : ciudad
      )
    );
  };

  const calcularCostoEstimado = () => {
    const costoPorNoche = 120; // Costo promedio por noche
    let totalNoches = 0;

    ciudades.forEach((ciudad) => {
      if (ciudad.fechaEntrada && ciudad.fechaSalida) {
        const noches = Math.ceil(
          (ciudad.fechaSalida.getTime() - ciudad.fechaEntrada.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        totalNoches += noches;
      }
    });

    return totalNoches * costoPorNoche;
  };

  const guardarBorrador = () => {
    toast({
      title: "Borrador guardado",
      description: "El presupuesto se ha guardado como borrador",
    });
  };

  const enviarCliente = async () => {
    try {
      // Preparar los datos para enviar
      const formData = {
        paisDestino: pais,
        itinerarioCiudades: ciudades.map((ciudad) => ({
          ciudad: ciudad.ciudad,
          hotel: ciudad.hotel,
          fechaEntrada: ciudad.fechaEntrada
            ? format(ciudad.fechaEntrada, "yyyy-MM-dd")
            : null,
          fechaSalida: ciudad.fechaSalida
            ? format(ciudad.fechaSalida, "yyyy-MM-dd")
            : null,
        })),
      };

      // Enviar datos al webhook
      const response = await fetch(
        "https://appwebhookapp.flowmaticn8n.us/webhook/d8a36c09-92ca-4444-b475-f86290ee5b36",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        setEnviado(true);
        toast({
          title: "Presupuesto enviado",
          description:
            "El presupuesto ha sido enviado al AI Flowmatic exitosamente",
        });
      } else {
        throw new Error("Error en la respuesta del servidor");
      }
    } catch (error) {
      console.error("Error al enviar al webhook:", error);
      toast({
        title: "Error al enviar",
        description:
          "Hubo un problema al enviar el presupuesto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const formularioCompleto =
    pais &&
    ciudades.every(
      (ciudad) =>
        ciudad.ciudad &&
        ciudad.fechaEntrada &&
        ciudad.fechaSalida &&
        ciudad.hotel
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Creación Manual</h1>
        <p className="text-muted-foreground">
          Crea presupuestos personalizados paso a paso
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selección de País */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-flowmatic-teal" />
                País de Destino
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={pais} onValueChange={setPais}>
                <SelectTrigger>
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
            </CardContent>
          </Card>

          <Button onClick={() => setModalOpen(true)}>Agregar imagen</Button>
          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSave={(country, image) => {
              setPaisOrigen(country);
              setImagenOrigen(image);
            }}
          />
          {/* Bloques de Ciudades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-flowmatic-medium-blue" />
                Itinerario por Ciudades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ciudades.map((ciudad, index) => (
                <div
                  key={ciudad.id}
                  className="p-4 border border-muted rounded-lg space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Ciudad {index + 1}</h4>
                    {ciudades.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarCiudad(ciudad.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ciudad */}
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Ciudad
                      </label>
                      <Input
                        placeholder="Ej: París"
                        value={ciudad.ciudad}
                        onChange={(e) =>
                          actualizarCiudad(ciudad.id, "ciudad", e.target.value)
                        }
                      />
                    </div>

                    {/* Hotel */}
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Hotel
                      </label>
                      <Input
                        placeholder="Ej: Hotel Boutique Central"
                        value={ciudad.hotel}
                        onChange={(e) =>
                          actualizarCiudad(ciudad.id, "hotel", e.target.value)
                        }
                      />
                    </div>

                    {/* Fecha Entrada */}
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Fecha de Entrada
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !ciudad.fechaEntrada && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {ciudad.fechaEntrada ? (
                              format(ciudad.fechaEntrada, "PPP", { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={ciudad.fechaEntrada || undefined}
                            onSelect={(date) =>
                              actualizarCiudad(ciudad.id, "fechaEntrada", date)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Fecha Salida */}
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Fecha de Salida
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !ciudad.fechaSalida && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {ciudad.fechaSalida ? (
                              format(ciudad.fechaSalida, "PPP", { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={ciudad.fechaSalida || undefined}
                            onSelect={(date) =>
                              actualizarCiudad(ciudad.id, "fechaSalida", date)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={agregarCiudad}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir ciudad
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Previsualización */}
        <div className="space-y-6">
          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-flowmatic-green" />
                Previsualización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-gradient-subtle rounded-lg">
                <Plane className="h-8 w-8 mx-auto mb-2 text-flowmatic-teal" />
                <h3 className="font-medium">
                  Viaje a {pais || "País por seleccionar"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {ciudades.filter((c) => c.ciudad).length} ciudades
                  configuradas
                </p>
              </div>

              {ciudades.filter((c) => c.ciudad).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Itinerario:</h4>
                  {ciudades
                    .filter((c) => c.ciudad)
                    .map((ciudad, index) => (
                      <div
                        key={ciudad.id}
                        className="text-xs p-2 bg-muted rounded"
                      >
                        <p className="font-medium">
                          {index + 1}. {ciudad.ciudad}
                        </p>
                        {ciudad.hotel && <p>🏨 {ciudad.hotel}</p>}
                        {ciudad.fechaEntrada && ciudad.fechaSalida && (
                          <p>
                            📅 {format(ciudad.fechaEntrada, "dd/MM")} -{" "}
                            {format(ciudad.fechaSalida, "dd/MM")}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Costo Estimado:</span>
                  <Badge variant="secondary" className="text-sm">
                    €{calcularCostoEstimado().toLocaleString()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado del Formulario */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Estado del Presupuesto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>País seleccionado</span>
                <Badge variant={pais ? "default" : "secondary"}>
                  {pais ? "✓" : "Pendiente"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Ciudades completas</span>
                <Badge
                  variant={
                    ciudades.every((c) => c.ciudad && c.hotel)
                      ? "default"
                      : "secondary"
                  }
                >
                  {ciudades.filter((c) => c.ciudad && c.hotel).length}/
                  {ciudades.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Fechas configuradas</span>
                <Badge
                  variant={
                    ciudades.every((c) => c.fechaEntrada && c.fechaSalida)
                      ? "default"
                      : "secondary"
                  }
                >
                  {
                    ciudades.filter((c) => c.fechaEntrada && c.fechaSalida)
                      .length
                  }
                  /{ciudades.length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                onClick={guardarBorrador}
                className="w-full"
                disabled={!pais}
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar borrador
              </Button>
              <Button
                variant="flowmatic"
                onClick={enviarCliente}
                className="w-full"
                disabled={!formularioCompleto}
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar al AI Flowmatic
              </Button>
            </CardContent>
          </Card>

          {enviado && (
            <Card className="border-success">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Send className="h-6 w-6 text-success" />
                  </div>
                  <h3 className="font-medium text-success">¡Enviado!</h3>
                  <p className="text-sm text-muted-foreground">
                    El presupuesto ha sido enviado AI Flowmatic
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualCreation;
