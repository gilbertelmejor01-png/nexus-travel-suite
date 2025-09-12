import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  MapPin,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  Users,
  Plane,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

interface Cliente {
  id: string;
  nombre?: string;
  email?: string;
  destino: {
    pais: string;
    valor: number;
    fecha: string; // formato YYYY-MM-DD
  };
}

const Analytics = () => {
  const [periodo, setPeriodo] = useState("mes");
  const [destino, setDestino] = useState("todos");
  const [tipoCliente, setTipoCliente] = useState("todos");
  const { uid } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        if (!uid) return;
        const ref = collection(db, "users", uid, "clientes");
        const snap = await getDocs(ref);
        const docs: Cliente[] = snap.docs.map((d) => {
          const data: any = d.data();
          const dest = data.destino || {};
          return {
            id: d.id,
            nombre: data.nombre || data.email || "Cliente",
            destino: {
              pais: dest.pais || "Sin destino",
              valor: Number(dest.valor) || 0,
              fecha: dest.fecha || "",
            },
          } as Cliente;
        });
        setClientes(docs);
      } catch (e: any) {
        console.error("Error cargando analytics", e);
        setError(e?.message || "Error desconocido");
      }
    };
    fetchClientes();
  }, [uid]);

  const monthLabel = (m: number) =>
    [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ][m] || "";

  // Destinos Populares desde Firestore (top 5)
  const destinosPopulares = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of clientes) {
      const pais = (c.destino?.pais || "Sin destino").trim();
      counts.set(pais, (counts.get(pais) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, viajes]) => ({ name, viajes }))
      .sort((a, b) => b.viajes - a.viajes)
      .slice(0, 5)
      .map((item, idx) => ({
        ...item,
        valoracion: Math.max(4.4, 4.9 - idx * 0.1),
      }));
  }, [clientes]);

  // Evolución temporal y valoración total por mes
  const evolucionTemporal = useMemo(() => {
    const byMonth = new Map<number, { viajes: number; valor: number }>();
    for (const c of clientes) {
      const f = c.destino?.fecha || "";
      const parts = f.split("-");
      if (parts.length >= 2) {
        const m = Math.max(0, Math.min(11, Number(parts[1]) - 1));
        const prev = byMonth.get(m) || { viajes: 0, valor: 0 };
        byMonth.set(m, {
          viajes: prev.viajes + 1,
          valor: prev.valor + (Number(c.destino?.valor) || 0),
        });
      }
    }
    return Array.from({ length: 12 }, (_, m) => {
      const v = byMonth.get(m) || { viajes: 0, valor: 0 };
      return { mes: monthLabel(m), viajes: v.viajes, valoracion: v.valor };
    });
  }, [clientes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard Analítico
          </h1>
          <p className="text-muted-foreground">
            Análisis profundo de tus datos de viajes
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Generar informe PDF
        </Button>
      </div>

      {/* Filtros Maestros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Análisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoy">Hoy</SelectItem>
                  <SelectItem value="semana">Esta semana</SelectItem>
                  <SelectItem value="mes">Este mes</SelectItem>
                  <SelectItem value="año">Este año</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Destino</label>
              <Select value={destino} onValueChange={setDestino}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los destinos</SelectItem>
                  <SelectItem value="paris">París</SelectItem>
                  <SelectItem value="barcelona">Barcelona</SelectItem>
                  <SelectItem value="roma">Roma</SelectItem>
                  <SelectItem value="londres">Londres</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Tipo de Cliente
              </label>
              <Select value={tipoCliente} onValueChange={setTipoCliente}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="nuevos">Nuevos</SelectItem>
                  <SelectItem value="recurrentes">Recurrentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Destinos Populares */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-flowmatic-teal" />
              Destinos Populares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {destinosPopulares.map((destino, index) => (
                <div
                  key={destino.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-flowmatic-teal/10 rounded-full text-flowmatic-teal font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{destino.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {destino.viajes} viajes
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-1">
                      ⭐ {destino.valoracion.toFixed(1)}
                    </Badge>
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div
                        className="bg-gradient-flowmatic h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            (destino.viajes /
                              Math.max(
                                ...destinosPopulares.map((d) => d.viajes)
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mapa Térmico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-flowmatic-medium-blue" />
              Actividad por Región
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-subtle rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-flowmatic rounded-full flex items-center justify-center mb-4 mx-auto">
                    <MapPin className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-muted-foreground">
                    Mapa térmico interactivo
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Click para filtrar por región
                  </p>
                </div>
              </div>

              {/* Indicadores de intensidad */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Baja</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`w-3 h-3 rounded ${
                        level <= 2
                          ? "bg-blue-300"
                          : level <= 4
                          ? "bg-flowmatic-teal"
                          : "bg-flowmatic-green"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">Alta</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolución Temporal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-flowmatic-green" />
            Evolución Temporal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="viajes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="viajes">Número de Viajes</TabsTrigger>
              <TabsTrigger value="valoracion">Valoración Total</TabsTrigger>
              <TabsTrigger value="satisfaccion">Satisfacción</TabsTrigger>
            </TabsList>

            <TabsContent value="viajes" className="mt-6">
              <div className="h-64 bg-gradient-subtle rounded-lg p-4">
                <div className="flex items-end justify-between h-full">
                  {evolucionTemporal.map((data, index) => (
                    <div
                      key={data.mes}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className="bg-gradient-flowmatic rounded-t-lg w-8 transition-all duration-300 hover:scale-105"
                        style={{
                          height: `${
                            (data.viajes /
                              Math.max(
                                ...evolucionTemporal.map((d) => d.viajes || 0)
                              )) *
                            200
                          }px`,
                        }}
                      />
                      <span className="text-xs font-medium">{data.mes}</span>
                      <Badge variant="secondary" className="text-xs">
                        {data.viajes}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="valoracion" className="mt-6">
              <div className="h-64 bg-gradient-subtle rounded-lg p-4">
                <div className="flex items-end justify-between h-full">
                  {evolucionTemporal.map((data, index) => (
                    <div
                      key={data.mes}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className="bg-flowmatic-teal rounded-t-lg w-8 transition-all duration-300 hover:scale-105"
                        style={{
                          height: `${
                            (data.valoracion /
                              Math.max(
                                ...evolucionTemporal.map(
                                  (d) => d.valoracion || 0
                                )
                              )) *
                            200
                          }px`,
                        }}
                      />
                      <span className="text-xs font-medium">{data.mes}</span>
                      <Badge variant="secondary" className="text-xs">
                        €{(data.valoracion / 1000).toFixed(0)}k
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="satisfaccion" className="mt-6">
              <div className="text-center py-16 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4" />
                <p>Datos de satisfacción próximamente</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Composición de Viajes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-flowmatic-dark-blue" />
              Composición de Viajes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evolucionTemporal.map((tipo) => (
                <div key={tipo.mes} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{tipo.mes}</span>
                    <span className="text-muted-foreground">
                      {tipo.viajes} viajes
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-flowmatic h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          (tipo.viajes /
                            Math.max(
                              ...evolucionTemporal.map((d) => d.viajes || 0)
                            )) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              Comparar períodos
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Exportar datos
            </Button>
            <Button variant="teal" className="w-full justify-start">
              <Plane className="h-4 w-4 mr-2" />
              Crear presupuesto basado en tendencias
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
