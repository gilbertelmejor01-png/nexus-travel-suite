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
  ChevronRight,
  Clock,
  AlertCircle
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

interface Cliente {
  id: string;
  nombre?: string;
  email?: string;
  destino: {
    pais: string;
    valor: number;
    fecha: string;
  };
  estado: "pendiente" | "revision" | "pago" | "firmado" | "finalizado";
  fechaCreacion?: Timestamp;
  presupuestoVence?: Timestamp;
}

// Initial data structure
const initialData = {
  kpis: {
    viajesActivos: { count: 0, change: 15.2 },
    clientesUnicos: { total: 0, nuevos: 0, recurrentes: 0 },
    presupuestos: { total: 0, completados: 0, pendientes: 0 },
    valoracionTotal: 0,
  },
  alertas: [],
  ultimosPresupuestos: [],
};

const Dashboard = () => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { uid } = useAuth();

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        if (!uid) {
          setLoading(true);
          return;
        }
        setLoading(true);
        // Leer de subcolección: /users/{uid}/clientes
        const clientesRef = collection(db, 'users', uid, 'clientes');
        const snap = await getDocs(clientesRef);
        const clientesData: Cliente[] = snap.docs.map((d) => {
          const data: any = d.data();
          const createdAt: Timestamp | undefined = data.createdAt;
          return {
            id: d.id,
            email: data.email,
            destino: data.destino || { pais: 'Sin destino', valor: 0, fecha: '' },
            estado: (data.estado || 'pendiente') as Cliente['estado'],
            fechaCreacion: createdAt,
          } as Cliente;
        });

        // KPIs y métricas
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const nuevosClientes = clientesData.filter((c) => {
          const fc = c.fechaCreacion?.toDate?.();
          return !!fc && fc >= thirtyDaysAgo;
        });

        const viajesActivos = clientesData.filter((c) => ['firmado', 'pago'].includes(c.estado)).length;
        const presupuestosPendientes = clientesData.filter((c) => ['pendiente', 'revision'].includes(c.estado)).length;
        const presupuestosCompletados = clientesData.filter((c) => ['firmado', 'pago', 'finalizado'].includes(c.estado)).length;
        const valoracionTotal = clientesData.reduce((sum, c) => sum + (Number(c.destino?.valor) || 0), 0);

        // Alertas: pendientes o revisión con más de 3 días
        const alertas = clientesData
          .filter((c) => ['pendiente', 'revision'].includes(c.estado))
          .map((c) => {
            const fc = c.fechaCreacion?.toDate?.() || new Date();
            const dias = Math.floor((now.getTime() - fc.getTime()) / (1000 * 60 * 60 * 24));
            return {
              id: c.id,
              nombre: c.email || 'Cliente sin nombre',
              tipo: 'sinRespuesta',
              dias,
              presupuestoVence: null,
              cliente: c.email || 'Cliente sin nombre',
            };
          })
          .filter((a) => a.dias >= 3)
          .sort((a, b) => b.dias - a.dias)
          .slice(0, 3);

        // Tabla: últimos presupuestos por fechaCreacion
        const ultimos = clientesData
          .slice()
          .sort((a, b) => {
            const da = a.fechaCreacion?.toDate?.() || new Date(0);
            const dbb = b.fechaCreacion?.toDate?.() || new Date(0);
            return dbb.getTime() - da.getTime();
          })
          .slice(0, 5)
          .map((c) => ({
            id: c.id,
            cliente: c.email || 'Cliente sin nombre',
            destino: c.destino?.pais || 'Sin destino',
            valor: Number(c.destino?.valor) || 0,
            estado: c.estado,
            fecha: c.fechaCreacion?.toDate?.().toISOString().split('T')[0] || (c.destino?.fecha || 'Sin fecha'),
          }));

        setData({
          kpis: {
            viajesActivos: { count: viajesActivos, change: 15.2 },
            clientesUnicos: {
              total: clientesData.length,
              nuevos: nuevosClientes.length,
              recurrentes: Math.max(0, clientesData.length - nuevosClientes.length),
            },
            presupuestos: {
              total: clientesData.length,
              completados: presupuestosCompletados,
              pendientes: presupuestosPendientes,
            },
            valoracionTotal,
          },
          alertas,
          ultimosPresupuestos: ultimos,
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching clientes:', err);
        setError((err as any)?.message || 'Error desconocido');
        setLoading(false);
      }
    };
    fetchClientes();
  }, [uid]);

  const [currentPage, setCurrentPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");
  const itemsPerPage = 10;

  if (!uid) return <div className="p-8 text-center">Cargando datos...</div>;
  if (loading) return <div className="p-8 text-center">Cargando datos...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error al cargar los datos: {error}</div>;

  const { kpis, alertas, ultimosPresupuestos } = data;

  // Filtrar presupuestos
  const mapFiltroToEstado = (val: string) => {
    switch (val) {
      case 'Pendiente': return 'pendiente';
      case 'En revisión': return 'revision';
      case 'Firmado': return 'firmado';
      case 'Perdido': return 'perdido'; // no mapeado en BD; quedará sin coincidencias
      case 'Vence hoy': return 'vence_hoy'; // no mapeado en BD
      default: return 'todos';
    }
  };
  const presupuestosFiltrados = (data.ultimosPresupuestos || []).filter(presupuesto => {
    if (!presupuesto) return false;
    const filtroEstadoBD = mapFiltroToEstado(filtroEstado);
    const matchEstado = filtroEstadoBD === "todos" || presupuesto.estado === filtroEstadoBD;
    const cliente = typeof presupuesto.cliente === 'string' ? presupuesto.cliente : '';
    const destino = typeof presupuesto.destino === 'string' ? presupuesto.destino : '';
    const matchBusqueda = cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
                         destino.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  // Paginación
  const totalPages = Math.max(1, Math.ceil(presupuestosFiltrados.length / itemsPerPage));
  const currentPageSafe = Math.min(Math.max(1, currentPage), totalPages);
  const currentItems = presupuestosFiltrados.slice(
    (currentPageSafe - 1) * itemsPerPage,
    currentPageSafe * itemsPerPage
  );
  
  // Update current page if it's out of bounds
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "firmado": return "text-success";
      case "pago": return "text-success";
      case "finalizado": return "text-muted-foreground";
      case "pendiente": return "text-flowmatic-medium-blue";
      case "revision": return "text-flowmatic-teal";
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

  const presupuestosProgress = data.kpis.presupuestos.total > 0 
    ? (data.kpis.presupuestos.completados / data.kpis.presupuestos.total) * 100 
    : 0;

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
            <div className="text-3xl font-bold">{data.kpis.viajesActivos.count}</div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{data.kpis.viajesActivos.change}% vs mes anterior
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
            <div className="text-3xl font-bold">{data.kpis.clientesUnicos.total}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {data.kpis.clientesUnicos.nuevos} nuevos
              </Badge>
              <Badge variant="outline" className="text-xs">
                {data.kpis.clientesUnicos.recurrentes} recurrentes
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
            <div className="text-3xl font-bold">{data.kpis.presupuestos.total}</div>
            <div className="mt-2">
              <Progress value={presupuestosProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{Math.round(presupuestosProgress)}% completados</span>
                <span>{data.kpis.presupuestos.pendientes} pendientes</span>
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
            <div className="text-3xl font-bold">{formatCurrency(data.kpis.valoracionTotal)}</div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{data.kpis.valoracionTotal}% anual
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
                  {currentItems.map((presupuesto) => (
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
                Mostrando {(currentPageSafe - 1) * itemsPerPage + 1} a {Math.min(currentPageSafe * itemsPerPage, presupuestosFiltrados.length)} de {presupuestosFiltrados.length} presupuestos
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
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Alertas Urgentes</h2>
              <Badge variant="destructive" className="rounded-full px-2">
                {data.alertas.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.alertas.length > 0 ? data.alertas.map((alerta) => (
              <div key={alerta.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{alerta.nombre || alerta.cliente || 'Cliente sin nombre'}</p>
                  <p className="text-xs text-muted-foreground">
                    {alerta.tipo === 'sinRespuesta' 
                      ? `${alerta.dias} días sin respuesta` 
                      : 'Presupuesto vence pronto'}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  <Clock className="h-4 w-4 mr-1" />
                  Recordar
                </Button>
              </div>
            )) : (
              <div className="p-4 text-center text-muted-foreground">
                No hay alertas pendientes
              </div>
            )}
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
          <p className="text-sm leading-relaxed mb-4">
            {data.recomendacionAI || "Recomendaciones basadas en tus datos aparecerán aquí."}
          </p>
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