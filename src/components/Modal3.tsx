import { useState } from "react";
import { 
  X, 
  MapPin, 
  Building2, 
  Plus, 
  Calendar as CalendarIcon,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CiudadBloque {
  id: string;
  ciudad: string;
  fechaEntrada: Date | null;
  fechaSalida: Date | null;
  hotel: string;
}

interface ItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pais: string, ciudades: CiudadBloque[]) => void;
}

const ItineraryCreationModal2 = ({ isOpen, onClose, onSave }: ItineraryModalProps) => {
  const [pais, setPais] = useState("");
  const [ciudades, setCiudades] = useState<CiudadBloque[]>([
    { id: "1", ciudad: "", fechaEntrada: null, fechaSalida: null, hotel: "" }
  ]);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const paises = [
    "España", "Francia", "Italia", "Reino Unido", "Alemania", 
    "Portugal", "Países Bajos", "Bélgica", "Suiza", "Austria"
  ];

  const agregarCiudad = () => {
    const nuevaCiudad: CiudadBloque = {
      id: Date.now().toString(),
      ciudad: "",
      fechaEntrada: null,
      fechaSalida: null,
      hotel: ""
    };
    setCiudades([...ciudades, nuevaCiudad]);
  };

  const eliminarCiudad = (id: string) => {
    if (ciudades.length > 1) {
      setCiudades(ciudades.filter(ciudad => ciudad.id !== id));
    }
  };

  const actualizarCiudad = (id: string, campo: keyof CiudadBloque, valor: any) => {
    setCiudades(ciudades.map(ciudad => 
      ciudad.id === id ? { ...ciudad, [campo]: valor } : ciudad
    ));
  };

  const formularioCompleto = pais && ciudades.every(ciudad => 
    ciudad.ciudad && ciudad.fechaEntrada && ciudad.fechaSalida && ciudad.hotel
  );

  const handleSubmit = async () => {
    if (!formularioCompleto) return;
    
    setIsSending(true);
    
    try {
      // Aquí iría la lógica para enviar los datos al webhook
      // Por ahora simulamos un envío exitoso
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onSave(pais, ciudades);
      toast({
        title: "Itinerario creado",
        description: "El itinerario se ha creado exitosamente"
      });
      
      // Cerrar el modal después de un breve tiempo
      setTimeout(() => {
        onClose();
        setIsSending(false);
      }, 1000);
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al crear itinerario",
        description: "Hubo un problema al crear el itinerario"
      });
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-4xl mx-4 bg-background rounded-xl shadow-xl overflow-hidden"
        style={{ boxShadow: "0 10px 30px -10px hsl(208 59% 25% / 0.15)" }}
      >
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-flowmatic-dark-blue to-flowmatic-medium-blue p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Crear Nuevo Itinerario
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
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Selección de País */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-flowmatic-teal" />
                País de Destino
              </label>
              <Select value={pais} onValueChange={setPais} disabled={isSending}>
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

            {/* Bloques de Ciudades */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-flowmatic-medium-blue" />
                  Itinerario por Ciudades
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={agregarCiudad}
                  disabled={isSending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir ciudad
                </Button>
              </div>

              {ciudades.map((ciudad, index) => (
                <div key={ciudad.id} className="p-4 border border-muted rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Ciudad {index + 1}</h4>
                    {ciudades.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => eliminarCiudad(ciudad.id)}
                        disabled={isSending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ciudad */}
                    <div>
                      <label className="text-sm font-medium block mb-2">Ciudad</label>
                      <Input
                        placeholder="Ej: París"
                        value={ciudad.ciudad}
                        onChange={(e) => actualizarCiudad(ciudad.id, 'ciudad', e.target.value)}
                        disabled={isSending}
                      />
                    </div>

                    {/* Hotel */}
                    <div>
                      <label className="text-sm font-medium block mb-2">Hotel</label>
                      <Input
                        placeholder="Ej: Hotel Boutique Central"
                        value={ciudad.hotel}
                        onChange={(e) => actualizarCiudad(ciudad.id, 'hotel', e.target.value)}
                        disabled={isSending}
                      />
                    </div>

                    {/* Fecha Entrada */}
                    <div>
                      <label className="text-sm font-medium block mb-2">Fecha de Entrada</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !ciudad.fechaEntrada && "text-muted-foreground"
                            )}
                            disabled={isSending}
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
                            onSelect={(date) => actualizarCiudad(ciudad.id, 'fechaEntrada', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Fecha Salida */}
                    <div>
                      <label className="text-sm font-medium block mb-2">Fecha de Salida</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !ciudad.fechaSalida && "text-muted-foreground"
                            )}
                            disabled={isSending}
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
                            onSelect={(date) => actualizarCiudad(ciudad.id, 'fechaSalida', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pie de página con acciones */}
        <div className="bg-muted/50 p-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {ciudades.filter(c => c.ciudad).length} ciudades configuradas
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isSending}
            >
              Cancelar
            </Button>
            <Button 
              variant="flowmatic"
              onClick={handleSubmit}
              disabled={!formularioCompleto || isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Crear Itinerario
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryCreationModal2;