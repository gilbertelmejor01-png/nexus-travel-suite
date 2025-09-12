import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Eye, 
  Edit3, 
  Send, 
  Download,
  MapPin,
  Calendar,
  Building2,
  Euro,
  Users,
  Plane,
  Check,
  Star
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const Preview = () => {
  const [versionPrevia, setVersionPrevia] = useState("actual");

  // Mock data del presupuesto
  const presupuesto = {
    id: "P-2024-067",
    cliente: {
      nombre: "María García",
      email: "maria.garcia@email.com",
      telefono: "+34 666 777 888"
    },
    fechaCreacion: new Date("2024-06-15"),
    fechaValidez: new Date("2024-07-15"),
    destino: "Francia",
    duracion: 7,
    personas: 2,
    itinerario: [
      {
        ciudad: "París",
        fechaEntrada: new Date("2024-08-15"),
        fechaSalida: new Date("2024-08-18"),
        noches: 3,
        hotel: {
          nombre: "Hotel Boutique Montmartre",
          categoria: 4,
          descripcion: "Hotel boutique en el corazón de Montmartre con vistas a la Torre Eiffel"
        },
        actividades: [
          "Visita guiada al Louvre",
          "Cena romántica en Torre Eiffel",
          "Crucero por el Sena"
        ],
        costo: 1450
      },
      {
        ciudad: "Lyon",
        fechaEntrada: new Date("2024-08-18"),
        fechaSalida: new Date("2024-08-22"),
        noches: 4,
        hotel: {
          nombre: "Grand Hotel Lyon Centre",
          categoria: 5,
          descripcion: "Hotel de lujo en el centro histórico de Lyon"
        },
        actividades: [
          "Tour gastronómico",
          "Visita a bodegas del valle del Ródano",
          "Excursión a Annecy"
        ],
        costo: 1890
      }
    ],
    servicios: [
      { nombre: "Traslados aeropuerto-hotel", incluido: true, costo: 0 },
      { nombre: "Seguro de viaje premium", incluido: true, costo: 0 },
      { nombre: "Guía turístico especializado", incluido: false, costo: 450 },
      { nombre: "Vuelos (opcional)", incluido: false, costo: 680 }
    ],
    resumen: {
      subtotal: 3340,
      descuento: 170,
      impuestos: 234,
      total: 3404
    },
    condiciones: [
      "Precio válido hasta el 15 de julio de 2024",
      "50% de anticipo requerido para confirmar reserva",
      "Cancelación gratuita hasta 15 días antes del viaje",
      "Precios sujetos a disponibilidad hotelera"
    ]
  };

  const enviarPresupuesto = () => {
    console.log("Enviando presupuesto...");
  };

  const descargarPDF = () => {
    console.log("Descargando PDF...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Previsualización</h1>
          <p className="text-muted-foreground">Vista previa del presupuesto antes del envío</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit3 className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="secondary" onClick={descargarPDF}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
          <Button variant="flowmatic" onClick={enviarPresupuesto}>
            <Send className="h-4 w-4 mr-2" />
            Enviar al cliente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vista Previa Principal */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-flowmatic text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Propuesta de Viaje</CardTitle>
                  <p className="text-white/90">{presupuesto.id}</p>
                </div>
                <div className="text-right">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Plane className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              {/* Información del Cliente */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-flowmatic-teal" />
                  Información del Cliente
                </h3>
                <div className="bg-muted/50 p-4 rounded-lg space-y-1">
                  <p><strong>Cliente:</strong> {presupuesto.cliente.nombre}</p>
                  <p><strong>Email:</strong> {presupuesto.cliente.email}</p>
                  <p><strong>Teléfono:</strong> {presupuesto.cliente.telefono}</p>
                </div>
              </div>

              {/* Resumen del Viaje */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-flowmatic-teal" />
                  Resumen del Viaje
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <MapPin className="h-5 w-5 mx-auto mb-1 text-flowmatic-teal" />
                    <p className="text-sm font-medium">{presupuesto.destino}</p>
                    <p className="text-xs text-muted-foreground">Destino</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-5 w-5 mx-auto mb-1 text-flowmatic-teal" />
                    <p className="text-sm font-medium">{presupuesto.duracion} días</p>
                    <p className="text-xs text-muted-foreground">Duración</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Users className="h-5 w-5 mx-auto mb-1 text-flowmatic-teal" />
                    <p className="text-sm font-medium">{presupuesto.personas}</p>
                    <p className="text-xs text-muted-foreground">Personas</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Euro className="h-5 w-5 mx-auto mb-1 text-flowmatic-teal" />
                    <p className="text-sm font-medium">€{presupuesto.resumen.total.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>

              {/* Itinerario Detallado */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-flowmatic-teal" />
                  Itinerario Detallado
                </h3>
                <div className="space-y-4">
                  {presupuesto.itinerario.map((ciudad, index) => (
                    <Card key={index} className="border-l-4 border-l-flowmatic-teal">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-lg">{ciudad.ciudad}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(ciudad.fechaEntrada, "dd 'de' MMMM", { locale: es })} - {format(ciudad.fechaSalida, "dd 'de' MMMM", { locale: es })}
                            </p>
                            <p className="text-xs text-muted-foreground">{ciudad.noches} noches</p>
                          </div>
                          <Badge variant="secondary">€{ciudad.costo.toLocaleString()}</Badge>
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-4 w-4 text-flowmatic-medium-blue" />
                            <span className="font-medium">{ciudad.hotel.nombre}</span>
                            <div className="flex">
                              {[...Array(ciudad.hotel.categoria)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{ciudad.hotel.descripcion}</p>
                        </div>

                        <div>
                          <p className="font-medium text-sm mb-2">Actividades incluidas:</p>
                          <ul className="space-y-1">
                            {ciudad.actividades.map((actividad, actIndex) => (
                              <li key={actIndex} className="flex items-center gap-2 text-sm">
                                <Check className="h-3 w-3 text-success" />
                                {actividad}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Servicios Adicionales */}
              <div>
                <h3 className="font-semibold mb-3">Servicios y Opcionales</h3>
                <div className="space-y-2">
                  {presupuesto.servicios.map((servicio, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {servicio.incluido ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <div className="w-4 h-4 border border-muted-foreground rounded" />
                        )}
                        <span className="text-sm">{servicio.nombre}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {servicio.incluido ? "Incluido" : `+€${servicio.costo}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen de Costos */}
              <div>
                <h3 className="font-semibold mb-3">Resumen de Costos</h3>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>€{presupuesto.resumen.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-success">
                    <span>Descuento aplicado:</span>
                    <span>-€{presupuesto.resumen.descuento.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impuestos y tasas:</span>
                    <span>€{presupuesto.resumen.impuestos.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-flowmatic-teal">€{presupuesto.resumen.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Condiciones */}
              <div>
                <h3 className="font-semibold mb-3">Condiciones</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {presupuesto.condiciones.map((condicion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-flowmatic-teal rounded-full mt-2 flex-shrink-0" />
                      {condicion}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Estado del Presupuesto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-flowmatic-teal" />
                Estado del Presupuesto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Badge variant="secondary" className="mb-2">Borrador</Badge>
                <p className="text-sm text-muted-foreground">
                  Creado el {format(presupuesto.fechaCreacion, "dd/MM/yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Válido hasta el {format(presupuesto.fechaValidez, "dd/MM/yyyy")}
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total elementos:</span>
                  <span>{presupuesto.itinerario.length} ciudades</span>
                </div>
                <div className="flex justify-between">
                  <span>Servicios incluidos:</span>
                  <span>{presupuesto.servicios.filter(s => s.incluido).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Opcionales:</span>
                  <span>{presupuesto.servicios.filter(s => !s.incluido).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Edit3 className="h-4 w-4 mr-2" />
                Editar contenido
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Eye className="h-4 w-4 mr-2" />
                Vista móvil
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Generar PDF
              </Button>
              <Button variant="flowmatic" className="w-full justify-start">
                <Send className="h-4 w-4 mr-2" />
                Enviar ahora
              </Button>
            </CardContent>
          </Card>

          {/* Estadísticas Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Presupuesto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Precio por persona:</span>
                <span className="font-medium">€{Math.round(presupuesto.resumen.total / presupuesto.personas).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Precio por noche:</span>
                <span className="font-medium">€{Math.round(presupuesto.resumen.total / presupuesto.duracion).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Ahorro aplicado:</span>
                <span className="font-medium text-success">€{presupuesto.resumen.descuento}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Preview;