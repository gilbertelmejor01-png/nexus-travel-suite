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
  ArrowRight
} from "lucide-react";

// Mock data - En producción vendría de Firebase
const mockData = {
  kpis: {
    viajesActivos: { count: 127, change: 15.2 },
    clientesUnicos: { total: 89, nuevos: 23, recurrentes: 66 },
    presupuestos: { pendientes: 34, firmados: 78, perdidos: 12, total: 124 },
    valoracion: { amount: 342500, change: 22.8 }
  },
  destinos: [
    { name: "París", count: 23, lat: 48.8566, lng: 2.3522 },
    { name: "Barcelona", count: 18, lat: 41.3851, lng: 2.1734 },
    { name: "Roma", count: 15, lat: 41.9028, lng: 12.4964 },
    { name: "Londres", count: 12, lat: 51.5074, lng: -0.1278 },
    { name: "Ámsterdam", count: 9, lat: 52.3676, lng: 4.9041 }
  ],
  alertas: [
    { id: 1, cliente: "María García", dias: 8, tipo: "sin_respuesta" },
    { id: 2, cliente: "Carlos López", dias: 3, tipo: "presupuesto_vence" },
    { id: 3, cliente: "Ana Martín", dias: 10, tipo: "sin_respuesta" }
  ],
  recomendacionAI: "Basándome en las tendencias actuales, recomiendo promocionar destinos de temporada baja en el Mediterráneo para el próximo mes. Los clientes han mostrado 34% más interés en ofertas con descuentos anticipados."
};

const Dashboard = () => {
  const [selectedDestino, setSelectedDestino] = useState<string | null>(null);

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
        {/* Mapa Interactivo */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-flowmatic-teal" />
              Destinos Populares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-subtle rounded-lg relative overflow-hidden">
              {/* Simulación de mapa */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-flowmatic rounded-full flex items-center justify-center mb-4 mx-auto">
                    <MapPin className="h-12 w-12 text-white" />
                  </div>
                  <p className="text-muted-foreground">Mapa interactivo</p>
                  <p className="text-sm text-muted-foreground">Destinos con mayor demanda</p>
                </div>
              </div>
              
              {/* Burbujas de destinos */}
              <div className="absolute top-4 left-4">
                {mockData.destinos.slice(0, 3).map((destino, index) => (
                  <div 
                    key={destino.name} 
                    className={`mb-2 cursor-pointer transition-all duration-300 ${
                      selectedDestino === destino.name ? 'scale-110' : 'hover:scale-105'
                    }`}
                    onClick={() => setSelectedDestino(destino.name)}
                  >
                    <Badge 
                      variant={selectedDestino === destino.name ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {destino.name} ({destino.count})
                    </Badge>
                  </div>
                ))}
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