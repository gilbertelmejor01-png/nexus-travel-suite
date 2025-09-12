import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Bot, 
  Users, 
  Search,
  Eye,
  Send,
  Copy,
  Download,
  Plus,
  Filter,
  Calendar,
  Euro
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const History = () => {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroFecha, setFiltroFecha] = useState("mes");

  // Mock data
  const presupuestos = [
    {
      id: "P-001",
      cliente: "María García",
      destino: "París",
      fechaCreacion: new Date("2024-06-15"),
      fechaEnvio: new Date("2024-06-16"),
      estado: "firmado",
      valor: 2450,
      descripcion: "Viaje romántico a París - 5 días"
    },
    {
      id: "P-002", 
      cliente: "Carlos López",
      destino: "Barcelona",
      fechaCreacion: new Date("2024-06-10"),
      fechaEnvio: new Date("2024-06-11"),
      estado: "pendiente",
      valor: 1890,
      descripcion: "Escapada de fin de semana"
    },
    {
      id: "P-003",
      cliente: "Ana Martín",
      destino: "Roma",
      fechaCreacion: new Date("2024-06-05"),
      fechaEnvio: null,
      estado: "borrador",
      valor: 3200,
      descripcion: "Tour cultural en familia"
    }
  ];

  const informesAI = [
    {
      id: "IA-001",
      tipo: "Comparación Temporal",
      fecha: new Date("2024-06-14"),
      descripcion: "Análisis Mayo vs Junio 2024",
      parametros: "Viajes, Valoración, Satisfacción"
    },
    {
      id: "IA-002",
      tipo: "Análisis Destinos",
      fecha: new Date("2024-06-12"),
      descripcion: "Destinos populares Q2 2024",
      parametros: "Top 10 destinos"
    }
  ];

  const clientes = [
    {
      id: "C-001",
      nombre: "María García",
      email: "maria@email.com",
      telefono: "+34 666 777 888",
      totalPresupuestos: 3,
      valorTotal: 7340,
      ultimoViaje: new Date("2024-06-16"),
      tipo: "recurrente"
    },
    {
      id: "C-002",
      nombre: "Carlos López", 
      email: "carlos@email.com",
      telefono: "+34 677 888 999",
      totalPresupuestos: 1,
      valorTotal: 1890,
      ultimoViaje: new Date("2024-06-11"),
      tipo: "nuevo"
    }
  ];

  const getEstadoBadge = (estado: string) => {
    const variants = {
      firmado: "default",
      pendiente: "secondary", 
      borrador: "outline",
      perdido: "destructive"
    };
    
    const labels = {
      firmado: "Firmado",
      pendiente: "Pendiente",
      borrador: "Borrador", 
      perdido: "Perdido"
    };
    
    return (
      <Badge variant={variants[estado as keyof typeof variants] as any}>
        {labels[estado as keyof typeof labels]}
      </Badge>
    );
  };

  const filtrarPresupuestos = () => {
    return presupuestos.filter(p => {
      const matchBusqueda = p.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
                           p.destino.toLowerCase().includes(busqueda.toLowerCase());
      const matchEstado = filtroEstado === "todos" || p.estado === filtroEstado;
      return matchBusqueda && matchEstado;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Historial Unificado</h1>
        <p className="text-muted-foreground">Accede a todo tu historial de presupuestos, informes y clientes</p>
      </div>

      <Tabs defaultValue="presupuestos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="presupuestos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Presupuestos
          </TabsTrigger>
          <TabsTrigger value="informes" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Informes IA
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
        </TabsList>

        {/* Presupuestos */}
        <TabsContent value="presupuestos" className="space-y-4">
          {/* Filtros y Búsqueda */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por cliente o destino..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="firmado">Firmados</SelectItem>
                    <SelectItem value="pendiente">Pendientes</SelectItem>
                    <SelectItem value="borrador">Borradores</SelectItem>
                    <SelectItem value="perdido">Perdidos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroFecha} onValueChange={setFiltroFecha}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semana">Esta semana</SelectItem>
                    <SelectItem value="mes">Este mes</SelectItem>
                    <SelectItem value="trimestre">Este trimestre</SelectItem>
                    <SelectItem value="año">Este año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Presupuestos */}
          <div className="space-y-4">
            {filtrarPresupuestos().map((presupuesto) => (
              <Card key={presupuesto.id} className="hover:shadow-flowmatic transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{presupuesto.id}</h3>
                        {getEstadoBadge(presupuesto.estado)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{presupuesto.descripcion}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Cliente: {presupuesto.cliente}</span>
                        <span>Destino: {presupuesto.destino}</span>
                        <span>Creado: {format(presupuesto.fechaCreacion, "dd/MM/yyyy")}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">€{presupuesto.valor.toLocaleString()}</p>
                        {presupuesto.fechaEnvio && (
                          <p className="text-xs text-muted-foreground">
                            Enviado: {format(presupuesto.fechaEnvio, "dd/MM/yyyy")}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {presupuesto.estado === "firmado" ? (
                          <Button variant="outline" size="sm">
                            <Send className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Informes IA */}
        <TabsContent value="informes" className="space-y-4">
          <div className="space-y-4">
            {informesAI.map((informe) => (
              <Card key={informe.id} className="hover:shadow-flowmatic transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Bot className="h-5 w-5 text-flowmatic-teal" />
                        <h3 className="font-medium">{informe.tipo}</h3>
                        <Badge variant="secondary">{informe.id}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{informe.descripcion}</p>
                      <p className="text-xs text-muted-foreground">
                        Parámetros: {informe.parametros} • {format(informe.fecha, "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Clientes */}
        <TabsContent value="clientes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {clientes.map((cliente) => (
              <Card key={cliente.id} className="hover:shadow-flowmatic transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{cliente.nombre}</span>
                    <Badge variant={cliente.tipo === "recurrente" ? "default" : "secondary"}>
                      {cliente.tipo === "recurrente" ? "Recurrente" : "Nuevo"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">📧 {cliente.email}</p>
                    <p className="text-muted-foreground">📱 {cliente.telefono}</p>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Presupuestos:</span>
                    <span className="font-medium">{cliente.totalPresupuestos}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Valor total:</span>
                    <span className="font-bold text-flowmatic-teal">€{cliente.valorTotal.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Último viaje:</span>
                    <span className="text-muted-foreground">{format(cliente.ultimoViaje, "dd/MM/yyyy")}</span>
                  </div>
                  
                  <Button variant="flowmatic" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear nuevo presupuesto
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default History;