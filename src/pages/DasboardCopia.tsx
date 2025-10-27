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
  AlertCircle,
  Plus,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/use-toast";

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
  createdAt?: any;
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
  const { t } = useTranslation();
  const { toast } = useToast();

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        if (!uid) {
          setLoading(true);
          return;
        }
        setLoading(true);
        // Leer de subcolección: /users/{uid}/clientes
        const clientesRef = collection(db, "users", uid, "clientes");
        const snap = await getDocs(clientesRef);
        const clientesData: Cliente[] = snap.docs.map((d) => {
          const data: any = d.data();
          const createdAt: Timestamp | undefined = data.createdAt;
          return {
            id: d.id,
            nombre: data.nombre || "Cliente sin nombre",
            email: data.email,
            destino: data.destino || {
              pais: "Sin destino",
              valor: 0,
              fecha: "",
            },
            estado: (data.estado || "pendiente") as Cliente["estado"],
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

        const viajesActivos = clientesData.filter((c) =>
          ["firmado", "pago"].includes(c.estado)
        ).length;
        const presupuestosPendientes = clientesData.filter((c) =>
          ["pendiente", "revision"].includes(c.estado)
        ).length;
        const presupuestosCompletados = clientesData.filter((c) =>
          ["firmado", "pago", "finalizado"].includes(c.estado)
        ).length;
        const valoracionTotal = clientesData.reduce(
          (sum, c) => sum + (Number(c.destino?.valor) || 0),
          0
        );

        // Alertas: pendientes o revisión con más de 3 días
        const alertas = clientesData
          .filter((c) => ["pendiente", "revision"].includes(c.estado))
          .map((c) => {
            const fc = c.fechaCreacion?.toDate?.() || new Date();
            const dias = Math.floor(
              (now.getTime() - fc.getTime()) / (1000 * 60 * 60 * 24)
            );
            return {
              id: c.id,
              nombre: c.email || "Cliente sin nombre",
              tipo: "sinRespuesta",
              dias,
              presupuestoVence: null,
              cliente: c.email || "Cliente sin nombre",
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
            nombre: c.nombre || "Cliente sin nombre",
            cliente: c.email || "Cliente sin nombre",
            destino: c.destino?.pais || "Sin destino",
            valor: Number(c.destino?.valor) || 0,
            estado: c.estado,
            fecha:
              c.fechaCreacion?.toDate?.().toISOString().split("T")[0] ||
              c.destino?.fecha ||
              "Sin fecha",
          }));

        setData({
          kpis: {
            viajesActivos: { count: viajesActivos, change: 15.2 },
            clientesUnicos: {
              total: clientesData.length,
              nuevos: nuevosClientes.length,
              recurrentes: Math.max(
                0,
                clientesData.length - nuevosClientes.length
              ),
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
        console.error("Error fetching clientes:", err);
        setError((err as any)?.message || "Error desconocido");
        setLoading(false);
      }
    };
    fetchClientes();
  }, [uid]);

  const [currentPage, setCurrentPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<"edit" | "new" | null>(
    null
  );
  const [nuevoPresupuesto, setNuevoPresupuesto] = useState({
    nombre: "",
    cliente: "",
    destino: "",
    valor: "",
    estado: "pendiente",
  });
  const itemsPerPage = 10;

  // Abrir modal para acciones de presupuesto
  const openBudgetModal = (action: "edit" | "new", client?: string) => {
    setSelectedAction(action);
    setSelectedClient(client || null);
    setShowBudgetModal(true);
  };

  // Cerrar modal
  const closeBudgetModal = () => {
    setShowBudgetModal(false);
    setSelectedAction(null);
    setSelectedClient(null);
    setNuevoPresupuesto({
      nombre: "",
      cliente: "",
      destino: "",
      valor: "",
      estado: "pendiente",
    });
  };

  // Manejar cambios en el formulario de nuevo presupuesto
  const handleNuevoPresupuestoChange = (field: string, value: string) => {
    setNuevoPresupuesto((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Función para crear o editar presupuesto
  const crearNuevoPresupuesto = async () => {
    if (!uid) {
      toast({
        title: t("error_title"),
        description: t("unauthorized"),
        variant: "destructive",
      });
      return;
    }

    if (!nuevoPresupuesto.nombre || !nuevoPresupuesto.cliente || !nuevoPresupuesto.destino || !nuevoPresupuesto.valor) {
      toast({
        title: t("error_title"),
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      const esEdicion = selectedRow !== null;
      
      if (esEdicion) {
        // Lógica para editar presupuesto existente
        toast({
          title: "✅ Presupuesto actualizado",
          description: `Presupuesto de ${nuevoPresupuesto.cliente} actualizado exitosamente`,
        });
      } else {
        // Lógica para crear nuevo presupuesto
        toast({
          title: "✅ Presupuesto creado",
          description: `Nuevo presupuesto para ${nuevoPresupuesto.cliente} creado exitosamente`,
        });
      }
      
      closeBudgetModal();
      
      // Recargar datos después de crear/editar
      const fetchClientes = async () => {
        const clientesRef = collection(db, "users", uid, "clientes");
        const snap = await getDocs(clientesRef);
        const clientesData: Cliente[] = snap.docs.map((d) => {
          const data: any = d.data();
          const createdAt: Timestamp | undefined = data.createdAt;
          return {
            id: d.id,
            nombre: data.nombre || "Cliente sin nombre",
            email: data.email,
            destino: data.destino || {
              pais: "Sin destino",
              valor: 0,
              fecha: "",
            },
            estado: (data.estado || "pendiente") as Cliente["estado"],
            fechaCreacion: createdAt,
          } as Cliente;
        });

        // Actualizar la tabla con los nuevos datos
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
            nombre: c.nombre || "Cliente sin nombre",
            cliente: c.email || "Cliente sin nombre",
            destino: c.destino?.pais || "Sin destino",
            valor: Number(c.destino?.valor) || 0,
            estado: c.estado,
            fecha:
              c.fechaCreacion?.toDate?.().toISOString().split("T")[0] ||
              c.destino?.fecha ||
              "Sin fecha",
          }));

        setData((prev) => ({
          ...prev,
          ultimosPresupuestos: ultimos,
        }));
      };
      
      fetchClientes();
    } catch (error) {
      console.error("Error procesando presupuesto:", error);
      toast({
        title: t("error_title"),
        description: "Error al procesar el presupuesto",
        variant: "destructive",
      });
    }
  };

  // Función para editar presupuesto existente
  const editarPresupuestoExistente = () => {
    if (!selectedRow) return;
    
    // Encontrar el presupuesto seleccionado
    const presupuestoAEditar = data.ultimosPresupuestos.find(
      (p) => p.id === selectedRow
    );
    
    if (!presupuestoAEditar) {
      toast({
        title: "❌ Error",
        description: "No se encontró el presupuesto seleccionado",
        variant: "destructive",
      });
      return;
    }
    
    // Prellenar el formulario con los datos existentes
    setNuevoPresupuesto({
      nombre: presupuestoAEditar.nombre || "",
      cliente: presupuestoAEditar.cliente || "",
      destino: presupuestoAEditar.destino || "",
      valor: presupuestoAEditar.valor.toString() || "",
      estado: presupuestoAEditar.estado || "pendiente",
    });
    
    // Cambiar directamente al formulario de edición
    setSelectedAction("edit");
    
    toast({
      title: "📝 Modo edición",
      description: `Editando presupuesto de ${presupuestoAEditar.cliente}`,
    });
  };

  // Función para crear nuevo presupuesto para cliente existente
  const crearPresupuestoParaCliente = () => {
    if (!selectedClient) return;
    
    // Resetear el formulario pero prellenar el cliente
    setNuevoPresupuesto({
      nombre: "",
      cliente: selectedClient,
      destino: "",
      valor: "",
      estado: "pendiente",
    });
    
    // Cambiar a modo nuevo presupuesto
    setSelectedAction("new");
  };

  // Función para contar presupuestos por cliente
  const contarPresupuestosPorCliente = () => {
    const conteo: Record<string, number> = {};
    data.ultimosPresupuestos.forEach((presupuesto) => {
      const cliente = presupuesto.cliente;
      conteo[cliente] = (conteo[cliente] || 0) + 1;
    });
    return conteo;
  };

  const presupuestosPorCliente = contarPresupuestosPorCliente();

  // Función para manejar click en fila
  const handleRowClick = (presupuestoId: string, cliente: string) => {
    setSelectedRow(presupuestoId);
    // Abrir modal con opciones para este cliente
    openBudgetModal("edit", cliente);
  };

  if (!uid) return <div className="p-8 text-center">{t("loading_data")}</div>;
  if (loading)
    return <div className="p-8 text-center">{t("loading_data")}</div>;
  if (error)
    return (
      <div className="p-8 text-center text-red-500">
        {t("error_loading")} {error}
      </div>
    );

  const { kpis, alertas, ultimosPresupuestos } = data;

  // Filtrar presupuestos
  const mapFiltroToEstado = (val: string) => {
    switch (val) {
      case t("pending_status"):
        return "pendiente";
      case t("in_review"):
        return "revision";
      case t("signed"):
        return "firmado";
      case t("lost"):
        return "perdido";
      case t("due_today"):
        return "vence_hoy";
      default:
        return "todos";
    }
  };
  const presupuestosFiltrados = (data.ultimosPresupuestos || []).filter(
    (presupuesto) => {
      if (!presupuesto) return false;
      const nombre = presupuesto.nombre || "Cliente sin nombre";
      const filtroEstadoBD = mapFiltroToEstado(filtroEstado);
      const matchEstado =
        filtroEstadoBD === "todos" || presupuesto.estado === filtroEstadoBD;
      const cliente =
        typeof presupuesto.cliente === "string" ? presupuesto.cliente : "";
      const destino =
        typeof presupuesto.destino === "string" ? presupuesto.destino : "";
      const matchBusqueda =
        cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
        destino.toLowerCase().includes(busqueda.toLowerCase());
      return matchEstado && matchBusqueda;
    }
  );

  // Paginación
  const totalPages = Math.max(
    1,
    Math.ceil(presupuestosFiltrados.length / itemsPerPage)
  );
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
      case "firmado":
        return "text-success";
      case "pago":
        return "text-success";
      case "finalizado":
        return "text-muted-foreground";
      case "pendiente":
        return "text-flowmatic-medium-blue";
      case "revision":
        return "text-flowmatic-teal";
      default:
        return "text-foreground";
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      [t("client"), t("destination"), t("value"), t("status"), t("date")],
      ...presupuestosFiltrados.map((p) => [
        p.nombre,
        p.cliente,
        p.destino,
        `€${p.valor}`,
        p.estado,
        p.fecha,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "presupuestos.csv";
    a.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const presupuestosProgress =
    data.kpis.presupuestos.total > 0
      ? (data.kpis.presupuestos.completados / data.kpis.presupuestos.total) *
        100
      : 0;

  const ESTADOS = [
    { value: "pendiente", label: t("pending_status"), color: "bg-yellow-500" },

    { value: "firmado", label: t("signed"), color: "bg-green-500" },
    { value: "finalizado", label: t("completed"), color: "bg-gray-500" },
  ];

  const handleStatusChange = async (clienteId: string, nuevoEstado: string) => {
    if (!uid) {
      toast({
        title: t("error_title"),
        description: t("unauthorized"),
        variant: "destructive",
      });
      return;
    }
    try {
      const clienteRef = doc(db, "users", uid, "clientes", clienteId);
      await updateDoc(clienteRef, { estado: nuevoEstado });

      setData((prevData) => ({
        ...prevData,
        ultimosPresupuestos: prevData.ultimosPresupuestos.map((p) =>
          p.id === clienteId ? { ...p, estado: nuevoEstado } : p
        ),
      }));

      toast({ title: t("success_title"), description: t("status_updated") });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: t("error_title"),
        description: t("status_update_error"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {t("executive_summary")}
          </h1>
          <p className="text-muted-foreground">
            {t("travel_business_overview")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {t("last_update")}: {new Date().toLocaleTimeString("es-ES")}
          </span>
        </div>
      </div>

      {/* KPIs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Viajes Activos */}
        <Card className="hover:shadow-flowmatic transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("Facturacion total")}
            </CardTitle>
            <Plane className="h-4 w-4 text-flowmatic-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.ultimosPresupuestos.filter(p => p.estado === "firmado").length}
            </div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="h-3 w-3 mr-1" />+
              {data.kpis.viajesActivos.change}% vs mes anterior
            </div>
          </CardContent>
        </Card>

        {/* Clientes Únicos */}
        <Card className="hover:shadow-flowmatic transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("unique_clients")}
            </CardTitle>
            <Users className="h-4 w-4 text-flowmatic-medium-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.kpis.clientesUnicos.total}
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {data.kpis.clientesUnicos.nuevos} {t("new")}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {data.kpis.clientesUnicos.recurrentes} {t("recurring")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Presupuestos */}
        <Card className="hover:shadow-flowmatic transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("budgets")}
            </CardTitle>
            <FileText className="h-4 w-4 text-flowmatic-green" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.kpis.presupuestos.total}
            </div>
            <div className="mt-2">
              <Progress value={presupuestosProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>
                  {Math.round(presupuestosProgress)}% {t("completed")}
                </span>
                <span>
                  {data.kpis.presupuestos.pendientes} {t("pending")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valoración Total */}
        <Card className="hover:shadow-flowmatic transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("total_valuation")}
            </CardTitle>
            <Euro className="h-4 w-4 text-flowmatic-dark-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(data.kpis.valoracionTotal)}
            </div>
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="h-3 w-3 mr-1" />+
              {data.kpis.valoracionTotal}% anual
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla de Presupuestos */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-flowmatic-teal" />
              {t("budget_management")}
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("search_placeholder")}
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t("filter_status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">{t("all_statuses")}</SelectItem>
                  <SelectItem value={t("pending_status")}>
                    {t("pending_status")}
                  </SelectItem>
                  <SelectItem value={t("signed")}>{t("signed")}</SelectItem>
                  <SelectItem value={t("lost")}>{t("lost")}</SelectItem>
                  <SelectItem value={t("due_today")}>
                    
                  </SelectItem>
                  <SelectItem value={t("in_review")}>
                   
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {t("export_csv")}
              </Button>
              <Button
                onClick={() => openBudgetModal("new")}
                className="bg-flowmatic-teal hover:bg-flowmatic-teal/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("add_budget")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("client")}</TableHead>
                    <TableHead>{t("destination")}</TableHead>
                    <TableHead>{t("value")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("budgets_count")}</TableHead>
                    <TableHead>{t("date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((presupuesto) => (
                    <TableRow
                      key={presupuesto.id}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        selectedRow === presupuesto.id ? "bg-blue-50" : ""
                      }`}
                      onClick={() =>
                        handleRowClick(presupuesto.id, presupuesto.cliente)
                      }
                    >
                      <TableCell className="font-medium">
                        {presupuesto.nombre}
                      </TableCell>
                      <TableCell>{presupuesto.cliente}</TableCell>
                      <TableCell>{presupuesto.destino}</TableCell>
                      <TableCell>
                        €{presupuesto.valor.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={presupuesto.estado}
                          onValueChange={(nuevoEstado) =>
                            handleStatusChange(presupuesto.id, nuevoEstado)
                          }
                        >
                          <SelectTrigger className="w-[120px] focus:ring-0 border-none p-0 h-auto bg-transparent">
                            <SelectValue asChild>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getEstadoColor(
                                  presupuesto.estado
                                )}`}
                              >
                                {presupuesto.estado}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {ESTADOS.map((estado) => (
                              <SelectItem
                                key={estado.value}
                                value={estado.value}
                              >
                                {estado.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {presupuestosPorCliente[presupuesto.cliente] || 1}
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
                {t("showing")} {(currentPageSafe - 1) * itemsPerPage + 1}{" "}
                {t("to")}{" "}
                {Math.min(
                  currentPageSafe * itemsPerPage,
                  presupuestosFiltrados.length
                )}{" "}
                {t("of")} {presupuestosFiltrados.length} {t("budgets_lower")}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("previous")}
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = i + 1;
                    if (totalPages <= 5) {
                      return (
                        <Button
                          key={pageNumber}
                          variant={
                            currentPage === pageNumber ? "default" : "outline"
                          }
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
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  {t("next")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas Urgentes */}
      </div>

      {/* Recomendación AI */}
      <Card className="bg-gradient-subtle border-flowmatic-teal">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-flowmatic-teal" />
            {t("ai_recommendation")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed mb-4">
            {t("ai_default_message")}
          </p>
          <Button variant="teal" className="w-full sm:w-auto">
            {t("apply_suggestion")}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Modal para acciones de presupuesto */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-flowmatic-teal">
                {selectedAction === "edit"
                  ? "Acciones de Presupuesto"
                  : "Nuevo Presupuesto"}
              </h3>
              <Button
                onClick={closeBudgetModal}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {selectedAction === "edit" && selectedClient && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Acciones para el cliente: <strong>{selectedClient}</strong>
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={editarPresupuestoExistente}
                    className="w-full"
                  >
                    ✏️ Editar Presupuesto Existente
                  </Button>
                  <Button
                    onClick={crearPresupuestoParaCliente}
                    variant="outline"
                    className="w-full"
                  >
                    ➕ Crear Nuevo Presupuesto
                  </Button>
                </div>
              </div>
            )}

            {selectedAction === "new" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {selectedClient ? `Crear presupuesto para ${selectedClient}` : "Crear un nuevo presupuesto"}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Nombre del presupuesto *
                    </label>
                    <Input 
                      placeholder="Ej: Viaje a París 2025" 
                      value={nuevoPresupuesto.nombre}
                      onChange={(e) => handleNuevoPresupuestoChange("nombre", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Cliente *
                    </label>
                    <Input 
                      placeholder="Nombre del cliente" 
                      value={nuevoPresupuesto.cliente}
                      onChange={(e) => handleNuevoPresupuestoChange("cliente", e.target.value)}
                      disabled={!!selectedClient}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Destino *
                    </label>
                    <Input 
                      placeholder="Ej: París, Francia" 
                      value={nuevoPresupuesto.destino}
                      onChange={(e) => handleNuevoPresupuestoChange("destino", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Valor (€) *
                    </label>
                    <Input 
                      placeholder="0.00" 
                      type="number"
                      value={nuevoPresupuesto.valor}
                      onChange={(e) => handleNuevoPresupuestoChange("valor", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Estado
                    </label>
                    <Select 
                      value={nuevoPresupuesto.estado}
                      onValueChange={(value) => handleNuevoPresupuestoChange("estado", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="revision">En Revisión</SelectItem>
                        <SelectItem value="firmado">Firmado</SelectItem>
                        <SelectItem value="pago">Pagado</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={crearNuevoPresupuesto}
                    className="flex-1 bg-flowmatic-teal hover:bg-flowmatic-teal/90"
                    disabled={!nuevoPresupuesto.nombre || !nuevoPresupuesto.cliente || !nuevoPresupuesto.destino || !nuevoPresupuesto.valor}
                  >
                    💾 Guardar Presupuesto
                  </Button>
                  <Button
                    onClick={closeBudgetModal}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
