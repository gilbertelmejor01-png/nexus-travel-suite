import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

interface Cliente {
  id: string;
  nombre: string;
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
  "España",
  "Francia",
  "Italia",
  "Alemania",
  "Reino Unido",
  "Portugal",
  "Grecia",
  "Turquía",
  "Marruecos",
  "Egipto",
  "Tailandia",
  "Japón",
  "Estados Unidos",
  "México",
  "Brasil",
  "Argentina",
  "Chile",
  "Perú",
];

const Client = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<{
    nombre: string;
    email: string;
    telefono: string;
    destino: {
      pais: string;
      valor: number;
      fecha: string;
    };
    estado: "pendiente" | "revision" | "pago" | "firmado" | "finalizado";
  }>({
    nombre: "",
    email: "",
    telefono: "",
    destino: {
      pais: "",
      valor: 0,
      fecha: "",
    },
    estado: "pendiente",
  });
  const { toast } = useToast();
  const { uid, getSubcollectionRef } = useAuth();
  const { t } = useTranslation();

  const ESTADOS = [
    { value: "pendiente", label: t("pending_status"), color: "bg-yellow-500" },
    { value: "revision", label: t("in_review"), color: "bg-blue-500" },
    { value: "pago", label: t("signed"), color: "bg-orange-500" },
    { value: "firmado", label: t("signed"), color: "bg-green-500" },
    { value: "finalizado", label: t("completed"), color: "bg-gray-500" },
  ];

  useEffect(() => {
    if (!uid) return;
    const colRef = getSubcollectionRef("clientes");
    if (!colRef) return;
    const q = query(colRef, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Cliente[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setClientes(list);
      },
      (err) => {
        console.error("Error suscribiendo clientes:", err);
        toast({
          title: t("error_title"),
          description: t("error_loading"),
          variant: "destructive",
        });
      }
    );
    return () => unsub();
  }, [uid, getSubcollectionRef]);

  const cargarClientes = async () => {
    try {
      if (!uid) return;
      const colRef = getSubcollectionRef("clientes");
      if (!colRef) return;
      const querySnapshot = await getDocs(colRef);
      const clientesData: Cliente[] = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setClientes(clientesData);
    } catch (error) {
      console.error("Error cargando clientes:", error);
      toast({
        title: t("error_title"),
        description: t("error_loading"),
        variant: "destructive",
      });
    }
  };

  const guardarCliente = async () => {
    if ( !formData.nombre || !formData.email || !formData.telefono || !formData.destino.pais) {
      toast({
        title: t("error_title"),
        description: t("processing_error"),
        variant: "destructive",
      });
      return;
    }

    try {
      if (!uid) {
        toast({
          title: t("error_title"),
          description: t("unauthorized"),
          variant: "destructive",
        });
        return;
      }

      const payloadBase = { ...formData } as Omit<Cliente, "id"> & any;

      const colRef = getSubcollectionRef("clientes");
      if (!colRef)
        throw new Error("No se pudo acceder a la subcolección de clientes");

      if (editingClient) {
        await updateDoc(doc(db, "users", uid, "clientes", editingClient.id), {
          ...payloadBase,
          updatedAt: new Date(),
        } as any);
        setClientes(
          clientes.map((c) =>
            c.id === editingClient.id
              ? ({ ...payloadBase, id: editingClient.id } as Cliente)
              : c
          )
        );
      } else {
        const docRef = await addDoc(colRef, {
          ...payloadBase,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
        setClientes([
          ...clientes,
          { ...payloadBase, id: docRef.id } as Cliente,
        ]);
      }

      toast({
        title: t("successfully_connected"),
        description: editingClient
          ? t("description_optimized")
          : t("files_added_count", { count: 1 }),
      });

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error guardando cliente:", error);
      toast({
        title: t("error_title"),
        description: t("processing_error"),
        variant: "destructive",
      });
    }
  };

  const eliminarCliente = async (id: string) => {
    try {
      if (!uid) return;
      await deleteDoc(doc(db, "users", uid, "clientes", id));
      setClientes(clientes.filter((c) => c.id !== id));
      toast({
        title: t("successfully_connected"),
        description: t("description_optimized"),
      });
    } catch (error) {
      console.error("Error eliminando cliente:", error);
      toast({
        title: t("error_title"),
        description: t("processing_error"),
        variant: "destructive",
      });
    }
  };

  const editarCliente = (cliente: Cliente) => {
    setEditingClient(cliente);
    setFormData({
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono,
      destino: cliente.destino,
      estado: cliente.estado,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      email: "",
      telefono: "",
      destino: {
        pais: "",
        valor: 0,
        fecha: "",
      },
      estado: "pendiente",
    });
    setEditingClient(null);
  };

  const getEstadoBadge = (estado: string) => {
    const estadoObj = ESTADOS.find((e) => e.value === estado);
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
          <h1 className="text-3xl font-bold text-foreground">
            {t("client_management")}
          </h1>
          <p className="text-muted-foreground">
            {t("client_management_description")}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t("add_client")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? t("edit_client") : t("add_client")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
               <div>
                <Label htmlFor="nombre">{t("associated_nombre")}</Label>
                <Input
                  id="nombre"
                  type="nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder={t("client_nombre_placeholder")}
                />
              </div>
              <div>
                <Label htmlFor="email">{t("associated_email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder={t("client_email_placeholder")}
                />
              </div>

              <div>
                <Label htmlFor="telefono">{t("phone")}</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  placeholder="+34 600 000 000"
                />
              </div>

              <div>
                <Label htmlFor="pais">{t("destination_country")}</Label>
                <Select
                  value={formData.destino.pais}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      destino: { ...formData.destino, pais: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_country")} />
                  </SelectTrigger>
                  <SelectContent>
                    {PAISES.map((pais) => (
                      <SelectItem key={pais} value={pais}>
                        {pais}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="valor">{t("value_eur")}</Label>
                <Input
                  id="valor"
                  type="number"
                  value={formData.destino.valor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      destino: {
                        ...formData.destino,
                        valor: Number(e.target.value),
                      },
                    })
                  }
                  placeholder="1000"
                />
              </div>

              <div>
                <Label htmlFor="fecha">{t("date")}</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.destino.fecha}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      destino: { ...formData.destino, fecha: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="estado">{t("status")}</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, estado: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((estado) => (
                      <SelectItem key={estado.value} value={estado.value}>
                        {estado.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={guardarCliente} className="flex-1">
                  {editingClient ? t("update") : t("save")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("client_list")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead>{t("nombre")}</TableHead>
                <TableHead>{t("associated_email")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead>{t("destination")}</TableHead>
                <TableHead>{t("value")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cliente) => (
                <TableRow key={cliente.id}>
                   <TableCell>{cliente.nombre}</TableCell>
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
