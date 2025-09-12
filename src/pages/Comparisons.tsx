import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Calendar,
  MapPin,
  BarChart3,
  Sparkles,
  Save,
  Mail,
  FileText,
  ArrowRight,
  Target,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Comparisons = () => {
  const [tipoComparacion, setTipoComparacion] = useState("periodos");
  const [metricas, setMetricas] = useState({
    viajes: true,
    valorPromedio: true,
    satisfaccion: false,
  });
  const [analisisGenerado, setAnalisisGenerado] = useState(false);

  const comparacionData = {
    periodos: {
      actual: {
        periodo: "Junio 2024",
        viajes: 73,
        valor: 205000,
        satisfaccion: 4.6,
      },
      anterior: {
        periodo: "Mayo 2024",
        viajes: 67,
        valor: 189000,
        satisfaccion: 4.5,
      },
    },
    destinos: {
      paris: { viajes: 45, valor: 142000, satisfaccion: 4.8 },
      barcelona: { viajes: 38, valor: 118000, satisfaccion: 4.7 },
    },
    datasets: {
      dataset1: {
        nombre: "Clientes Premium",
        viajes: 234,
        valor: 580000,
        satisfaccion: 4.8,
      },
      dataset2: {
        nombre: "Clientes Estándar",
        viajes: 456,
        valor: 320000,
        satisfaccion: 4.4,
      },
    },
  };

  const analisisIA = {
    hallazgos: [
      "📈 Crecimiento del 9% en número de viajes mes a mes",
      "💰 Incremento del 8.5% en valor promedio por viaje",
      "⭐ Mejora en satisfacción del cliente (+0.1 puntos)",
      "🎯 París mantiene el liderazgo con mejor ratio valor/satisfacción",
    ],
    recomendaciones: [
      "Potenciar marketing en destinos con alta satisfacción pero bajo volumen",
      "Implementar programa de fidelización para clientes recurrentes",
      "Optimizar precios en temporada alta basado en demanda histórica",
    ],
  };

  const generarAnalisis = () => {
    setAnalisisGenerado(true);
  };

  const calcularVariacion = (actual: number, anterior: number) => {
    const variacion = ((actual - anterior) / anterior) * 100;
    return {
      valor: Math.abs(variacion).toFixed(1),
      positivo: variacion > 0,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Comparaciones Avanzadas
        </h1>
        <p className="text-muted-foreground">
          Análisis comparativo inteligente con insights de IA
        </p>
      </div>

      {/* Configuración de Comparación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-flowmatic-teal" />
            Configurar Comparación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={tipoComparacion} onValueChange={setTipoComparacion}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="periodos" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Períodos
              </TabsTrigger>
              <TabsTrigger value="destinos" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Destinos
              </TabsTrigger>
              <TabsTrigger value="datasets" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Datasets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="periodos" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Período Base
                  </label>
                  <Select defaultValue="junio2024">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junio2024">Junio 2024</SelectItem>
                      <SelectItem value="mayo2024">Mayo 2024</SelectItem>
                      <SelectItem value="abril2024">Abril 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Período Comparación
                  </label>
                  <Select defaultValue="mayo2024">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mayo2024">Mayo 2024</SelectItem>
                      <SelectItem value="junio2023">Junio 2023</SelectItem>
                      <SelectItem value="abril2024">Abril 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="destinos" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Destino Principal
                  </label>
                  <Select defaultValue="paris">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paris">París</SelectItem>
                      <SelectItem value="barcelona">Barcelona</SelectItem>
                      <SelectItem value="roma">Roma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Destino Comparación
                  </label>
                  <Select defaultValue="barcelona">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="barcelona">Barcelona</SelectItem>
                      <SelectItem value="roma">Roma</SelectItem>
                      <SelectItem value="londres">Londres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="datasets" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Dataset A
                  </label>
                  <Select defaultValue="premium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="premium">Clientes Premium</SelectItem>
                      <SelectItem value="estandar">
                        Clientes Estándar
                      </SelectItem>
                      <SelectItem value="nuevos">Clientes Nuevos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Dataset B
                  </label>
                  <Select defaultValue="estandar">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estandar">
                        Clientes Estándar
                      </SelectItem>
                      <SelectItem value="premium">Clientes Premium</SelectItem>
                      <SelectItem value="recurrentes">
                        Clientes Recurrentes
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Métricas a Comparar */}
          <div>
            <h3 className="text-sm font-medium mb-3">Métricas a Comparar</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="viajes"
                  checked={metricas.viajes}
                  onCheckedChange={(checked) =>
                    setMetricas((prev) => ({ ...prev, viajes: !!checked }))
                  }
                />
                <label htmlFor="viajes" className="text-sm">
                  Número de viajes
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="valor"
                  checked={metricas.valorPromedio}
                  onCheckedChange={(checked) =>
                    setMetricas((prev) => ({
                      ...prev,
                      valorPromedio: !!checked,
                    }))
                  }
                />
                <label htmlFor="valor" className="text-sm">
                  Valor promedio
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="satisfaccion"
                  checked={metricas.satisfaccion}
                  onCheckedChange={(checked) =>
                    setMetricas((prev) => ({
                      ...prev,
                      satisfaccion: !!checked,
                    }))
                  }
                />
                <label htmlFor="satisfaccion" className="text-sm">
                  Satisfacción
                </label>
              </div>
            </div>
          </div>

          <Button
            variant="flowmatic"
            onClick={generarAnalisis}
            className="w-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generar Análisis Comparativo
          </Button>
        </CardContent>
      </Card>

      {/* Resultados del Análisis */}
      {analisisGenerado && (
        <>
          {/* Gráfico Comparativo */}
          <Card>
            <CardHeader>
              <CardTitle>Comparación Visual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Comparación de Períodos */}
                <div className="space-y-4">
                  <h4 className="font-medium text-center">
                    Junio 2024 vs Mayo 2024
                  </h4>
                  <div className="space-y-3">
                    {metricas.viajes && (
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">Viajes</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">73</Badge>
                          <ArrowRight className="h-3 w-3" />
                          <Badge variant="secondary">67</Badge>
                          <Badge
                            variant={
                              calcularVariacion(73, 67).positivo
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {calcularVariacion(73, 67).positivo ? "+" : "-"}
                            {calcularVariacion(73, 67).valor}%
                          </Badge>
                        </div>
                      </div>
                    )}

                    {metricas.valorPromedio && (
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">Valor Total</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">€205k</Badge>
                          <ArrowRight className="h-3 w-3" />
                          <Badge variant="secondary">€189k</Badge>
                          <Badge
                            variant={
                              calcularVariacion(205000, 189000).positivo
                                ? "default"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {calcularVariacion(205000, 189000).positivo
                              ? "+"
                              : "-"}
                            {calcularVariacion(205000, 189000).valor}%
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gráfico de radar simulado */}
                <div className="flex items-center justify-center">
                  <div className="w-48 h-48 bg-gradient-subtle rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-2 text-flowmatic-teal" />
                      <p className="text-sm font-medium">Gráfico Radar</p>
                      <p className="text-xs text-muted-foreground">
                        Comparación multidimensional
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Análisis Textual IA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-flowmatic-teal" />
                Análisis Inteligente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hallazgos Clave */}
              <div>
                <h4 className="font-medium mb-3">Hallazgos Clave</h4>
                <div className="space-y-2">
                  {analisisIA.hallazgos.map((hallazgo, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-flowmatic-teal rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm">{hallazgo}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recomendaciones */}
              <div>
                <h4 className="font-medium mb-3">
                  Recomendaciones Estratégicas
                </h4>
                <div className="space-y-2">
                  {analisisIA.recomendaciones.map((recomendacion, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-flowmatic-teal/5 rounded-lg border border-flowmatic-teal/20"
                    >
                      <Target className="h-4 w-4 text-flowmatic-teal mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{recomendacion}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla Resumen */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen Comparativo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Métrica</th>
                      <th className="text-left p-3">Junio 2024</th>
                      <th className="text-left p-3">Mayo 2024</th>
                      <th className="text-left p-3">Variación</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Número de Viajes</td>
                      <td className="p-3">73</td>
                      <td className="p-3">67</td>
                      <td className="p-3">
                        <Badge variant="default" className="text-xs">
                          +9.0%
                        </Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Valor Total</td>
                      <td className="p-3">€205,000</td>
                      <td className="p-3">€189,000</td>
                      <td className="p-3">
                        <Badge variant="default" className="text-xs">
                          +8.5%
                        </Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Valor Promedio</td>
                      <td className="p-3">€2,808</td>
                      <td className="p-3">€2,821</td>
                      <td className="p-3">
                        <Badge variant="destructive" className="text-xs">
                          -0.5%
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Acciones Finales */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Editar informe
                </Button>
                <Button variant="secondary" className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar en histórico
                </Button>
                <Button variant="flowmatic" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar por email
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Comparisons;
