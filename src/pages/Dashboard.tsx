import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plane, 
  Users, 
  FileText, 
  Euro, 
  TrendingUp, 
  TrendingDown,
  MapPin,
  Bell,
  Sparkles,
  ArrowRight,
  Search,
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data - En producción vendría de Firebase
const mockData = {
  kpis: {
    viajesActivos: { count: 127, change: 15.2 },
    clientesUnicos: { total: 89, nuevos: 23, recurrentes: 66 },
    presupuestos: { pendientes: 34, firmados: 78, perdidos: 12, total: 124 },
    valoracion: { amount: 342500, change: 22.8 }
  },
  alertas: [
    { id: 1, cliente: "María García", dias: 8, tipo: "sin_respuesta" },
    { id: 2, cliente: "Carlos López", dias: 3, tipo: "presupuesto_vence" },
    { id: 3, cliente: "Ana Martín", dias: 10, tipo: "sin_respuesta" }
  ],
  recomendacionAI: "Basándome en las tendencias actuales, recomiendo promocionar destinos de temporada baja en el Mediterráneo para el próximo mes. Los clientes han mostrado 34% más interés en ofertas con descuentos anticipados."
};

// Datos de ejemplo para la tabla de presupuestos (156 registros simulados)
const generatePresupuestos = () => {
  const clientes = ["N. López", "A. García", "M. Rodríguez", "P. Fernández", "L. Martín", "C. Sánchez", "D. Pérez", "R. González", "E. Jiménez", "F. Ruiz"];
  const destinos = ["Ecuador", "Costa Rica", "Perú", "Colombia", "Argentina", "Chile", "México", "Brasil", "Uruguay", "Bolivia"];
  const estados = ["Pendiente", "Firmado", "Perdido", "Vence hoy", "En revisión"];
  
  return Array.from({ length: 156 }, (_, index) => ({
    id: index + 1,
    cliente: clientes[Math.floor(Math.random() * clientes.length)],
    destino: destinos[Math.floor(Math.random() * destinos.length)],
    valor: Math.floor(Math.random() * 6000) + 2000,
    estado: estados[Math.floor(Math.random() * estados.length)],
    fecha: new Date(2024, 6, Math.floor(Math.random() * 30) + 1).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
  }));
};

const allPresupuestos = generatePresupuestos();

const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");
  const itemsPerPage = 10;

  // Filtrar presupuestos
  const presupuestosFiltrados = allPresupuestos.filter(presupuesto => {
    const matchEstado = filtroEstado === "todos" || presupuesto.estado === filtroEstado;
    const matchBusqueda = presupuesto.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
                         presupuesto.destino.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  // Paginación
  const totalPages = Math.ceil(presupuestosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const presupuestosPaginados = presupuestosFiltrados.slice(startIndex, startIndex + itemsPerPage);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Firmado": return "text-success";
      case "Vence hoy": return "text-destructive";
      case "Perdido": return "text-muted-foreground";
      case "Pendiente": return "text-flowmatic-medium-blue";
      case "En revisión": return "text-flowmatic-teal";
      default: return "text-foreground";
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Cliente", "Destino", "Valor", "Estado", "Fecha"],
      ...presupuestosFiltrados.map(p => [p.cliente, p.destino, `€${p.valor}`, p.estado, p.fecha])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "presupuestos.csv";
    a.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const presupuestosProgress = (mockData.kpis.presupuestos.firmados / mockData.kpis.presupuestos.total) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resumen Ejecutivo</h1>
          <p className="text-muted-foreground">Visión general de tu negocio de viajes</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Última actualización: {new Date().toLocaleTimeString('es-ES')}</span>
        </div>
      </div>

      {/* KPIs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Viajes Activos */}
        <Card className="hover:shadow-flowmatic transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viajes Activos</CardTitle>
            <Plane className="h-4 w-4 text-flowmatic-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.kpis.viajesActivos.count}</div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{mockData.kpis.viajesActivos.change}% vs mes anterior
            </div>
          </CardContent>
        </Card>

        {/* Clientes Únicos */}
        <Card className="hover:shadow-flowmatic transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
            <Users className="h-4 w-4 text-flowmatic-medium-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.kpis.clientesUnicos.total}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {mockData.kpis.clientesUnicos.nuevos} nuevos
              </Badge>
              <Badge variant="outline" className="text-xs">
                {mockData.kpis.clientesUnicos.recurrentes} recurrentes
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Presupuestos */}
        <Card className="hover:shadow-flowmatic transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuestos</CardTitle>
            <FileText className="h-4 w-4 text-flowmatic-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.kpis.presupuestos.firmados}</div>
            <div className="mt-2">
              <Progress value={presupuestosProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{Math.round(presupuestosProgress)}% completados</span>
                <span>{mockData.kpis.presupuestos.pendientes} pendientes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valoración Total */}
        <Card className="hover:shadow-flowmatic transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valoración Total</CardTitle>
            <Euro className="h-4 w-4 text-flowmatic-dark-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockData.kpis.valoracion.amount)}</div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{mockData.kpis.valoracion.change}% anual
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla de Presupuestos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-flowmatic-teal" />
              Gestión de Presupuestos
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente o destino..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Firmado">Firmado</SelectItem>
                  <SelectItem value="Perdido">Perdido</SelectItem>
                  <SelectItem value="Vence hoy">Vence hoy</SelectItem>
                  <SelectItem value="En revisión">En revisión</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {presupuestosPaginados.map((presupuesto) => (
                    <TableRow key={presupuesto.id}>
                      <TableCell className="font-medium">{presupuesto.cliente}</TableCell>
                      <TableCell>{presupuesto.destino}</TableCell>
                      <TableCell>€{presupuesto.valor.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getEstadoColor(presupuesto.estado)}>
                          {presupuesto.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>{presupuesto.fecha}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Paginación */}
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, presupuestosFiltrados.length)} de {presupuestosFiltrados.length} presupuestos
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = i + 1;
                    if (totalPages <= 5) {
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNumber)}
                          className="w-8 h-8"
                        >
                          {pageNumber}
                        </Button>
                      );
                    }
                    return null;
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="text-muted-foreground">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-8 h-8"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas Urgentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-destructive" />
              Alertas Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockData.alertas.map((alerta) => (
              <div key={alerta.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{alerta.cliente}</p>
                  <p className="text-xs text-muted-foreground">
                    {alerta.tipo === 'sin_respuesta' 
                      ? `${alerta.dias} días sin respuesta`
                      : `Presupuesto vence en ${alerta.dias} días`
                    }
                  </p>
                </div>
                <Button variant="outline" size="sm" className="h-8">
                  <Bell className="h-3 w-3 mr-1" />
                  Recordar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recomendación AI */}
      <Card className="bg-gradient-subtle border-flowmatic-teal">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-flowmatic-teal" />
            Recomendación IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed mb-4">{mockData.recomendacionAI}</p>
          <Button variant="teal" className="w-full sm:w-auto">
            Aplicar sugerencia
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;