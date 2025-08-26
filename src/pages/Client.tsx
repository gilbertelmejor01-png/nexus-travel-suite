import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

interface Cliente {
  id: string;
  email: string;
  telefono: string;
  destino: {
    pais: string;
    valor: number;
    fecha: string;
  };
  estado: "pendiente" | "revision" | "pago" | "firmado" | "finalizado";
}

const PAISES = [
  "España", "Francia", "Italia", "Alemania", "Reino Unido", "Portugal",
  "Grecia", "Turquía", "Marruecos", "Egipto", "Tailandia", "Japón",
  "Estados Unidos", "México", "Brasil", "Argentina", "Chile", "Perú"
];

const ESTADOS = [
  { value: "pendiente", label: "Pendiente", color: "bg-yellow-500" },
  { value: "revision", label: "Revisión", color: "bg-blue-500" },
  { value: "pago", label: "Pago", color: "bg-orange-500" },
  { value: "firmado", label: "Firmado", color: "bg-green-500" },
  { value: "finalizado", label: "Finalizado", color: "bg-gray-500" }
];

const Client = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<{
    email: string;
    telefono: string;
    destino: {
      pais: string;
      valor: number;
      fecha: string;
    };
    estado: "pendiente" | "revision" | "pago" | "firmado" | "finalizado";
  }>({
    email: "",
    telefono: "",
    destino: {
      pais: "",
      valor: 0,
      fecha: ""
    },
    estado: "pendiente"
  });
  const { toast } = useToast();

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const clientesData: Cliente[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.clientes) {
          data.clientes.forEach((cliente: any) => {
            clientesData.push({
              id: cliente.id || doc.id,
              ...cliente
            });
          });
        }
      });
      setClientes(clientesData);
    } catch (error) {
      console.error("Error cargando clientes:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive"
      });
    }
  };

  const guardarCliente = async () => {
    if (!formData.email || !formData.telefono || !formData.destino.pais) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive"
      });
      return;
    }

    try {
      const nuevoCliente = {
        ...formData,
        id: editingClient?.id || Date.now().toString()
      };

      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        
        if (editingClient) {
          // Actualizar cliente existente
          setClientes(clientes.map(c => c.id === editingClient.id ? nuevoCliente : c));
        } else {
          // Agregar nuevo cliente
          await addDoc(collection(db, "users"), {
            userId: auth.currentUser.uid,
            clientes: [nuevoCliente]
          });
          setClientes([...clientes, nuevoCliente]);
        }

        toast({
          title: "Éxito",
          description: editingClient ? "Cliente actualizado" : "Cliente agregado",
        });
        
        resetForm();
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Error guardando cliente:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el cliente",
        variant: "destructive"
      });
    }
  };

  const eliminarCliente = async (id: string) => {
    try {
      setClientes(clientes.filter(c => c.id !== id));
      toast({
        title: "Éxito",
        description: "Cliente eliminado",
      });
    } catch (error) {
      console.error("Error eliminando cliente:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente",
        variant: "destructive"
      });
    }
  };

  const editarCliente = (cliente: Cliente) => {
    setEditingClient(cliente);
    setFormData({
      email: cliente.email,
      telefono: cliente.telefono,
      destino: cliente.destino,
      estado: cliente.estado
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: "",
      telefono: "",
      destino: {
        pais: "",
        valor: 0,
        fecha: ""
      },
      estado: "pendiente"
    });
    setEditingClient(null);
  };

  const getEstadoBadge = (estado: string) => {
    const estadoObj = ESTADOS.find(e => e.value === estado);
    return (
      <Badge className={`${estadoObj?.color} text-white`}>
        {estadoObj?.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Clientes</h1>
          <p className="text-muted-foreground">
            Administra la información de tus clientes
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Agregar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? "Editar Cliente" : "Agregar Cliente"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="cliente@email.com"
                />
              </div>
              
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  placeholder="+34 600 000 000"
                />
              </div>
              
              <div>
                <Label htmlFor="pais">País de Destino</Label>
                <Select 
                  value={formData.destino.pais} 
                  onValueChange={(value) => setFormData({
                    ...formData, 
                    destino: {...formData.destino, pais: value}
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar país" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAISES.map(pais => (
                      <SelectItem key={pais} value={pais}>{pais}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="valor">Valor (€)</Label>
                <Input
                  id="valor"
                  type="number"
                  value={formData.destino.valor}
                  onChange={(e) => setFormData({
                    ...formData, 
                    destino: {...formData.destino, valor: Number(e.target.value)}
                  })}
                  placeholder="1000"
                />
              </div>
              
              <div>
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.destino.fecha}
                  onChange={(e) => setFormData({
                    ...formData, 
                    destino: {...formData.destino, fecha: e.target.value}
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select 
                  value={formData.estado} 
                  onValueChange={(value: any) => setFormData({...formData, estado: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map(estado => (
                      <SelectItem key={estado.value} value={estado.value}>
                        {estado.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={guardarCliente} className="flex-1">
                  {editingClient ? "Actualizar" : "Guardar"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell>{cliente.email}</TableCell>
                  <TableCell>{cliente.telefono}</TableCell>
                  <TableCell>{cliente.destino.pais}</TableCell>
                  <TableCell>€{cliente.destino.valor}</TableCell>
                  <TableCell>{cliente.destino.fecha}</TableCell>
                  <TableCell>{getEstadoBadge(cliente.estado)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editarCliente(cliente)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarCliente(cliente.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Client;