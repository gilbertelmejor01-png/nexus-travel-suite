import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Upload, Image, Save, Cpu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

interface PerfilEmpresa {
  nombreEmpresa: string;
  logo: {
    tipo: "url" | "archivo";
    valor: string;
  };
  copyright: string;
  conexionesIA?: {
    creacionItinerario: string;
    itinerarioRapido: string;
    analiticasIA: string;
    conversacion: string; // Nuevo campo
  };
}

export default function Perfil() {
  const [perfil, setPerfil] = useState<PerfilEmpresa>({
    nombreEmpresa: "",
    logo: {
      tipo: "url",
      valor: ""
    },
    copyright: " 2025 Flowmatic – L'IA au service des Pros du Tourisme",
    conexionesIA: {
      creacionItinerario: "",
      itinerarioRapido: "",
      analiticasIA: "",
      conversacion: "" // Nuevo campo inicializado
    }
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [guardando, setGuardando] = useState(false);
  const { toast } = useToast();
  const { uid } = useAuth();

  useEffect(() => {
    cargarPerfil();
  }, [uid]);

 const cargarPerfil = async () => {
    try {
      if (!uid) return;
      const perfilDocRef = doc(db, "users", uid, "perfil", "empresa");
      const perfilSnap = await getDoc(perfilDocRef);
      if (perfilSnap.exists()) {
        const data: any = perfilSnap.data();
        setPerfil(prev => ({
          ...prev,
          ...data,
          conexionesIA: {
            creacionItinerario: data?.conexionesIA?.creacionItinerario || "",
            itinerarioRapido: data?.conexionesIA?.itinerarioRapido || "",
            analiticasIA: data?.conexionesIA?.analiticasIA || "",
            conversacion: data?.conexionesIA?.conversacion || "", // Cargar nuevo campo
            ...data?.conexionesIA,
          },
        }));
        if (data?.logo?.valor) setLogoPreview(data.logo.valor);
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive"
      });
    }
  };

  const guardarPerfil = async () => {
    if (!perfil.nombreEmpresa.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la empresa es obligatorio",
        variant: "destructive"
      });
      return;
    }

    setGuardando(true);
    try {
      if (!uid) {
        toast({ title: "Sesión requerida", description: "Inicia sesión para guardar tu perfil.", variant: "destructive" });
        return;
      }
      const perfilDocRef = doc(db, "users", uid, "perfil", "empresa");
      const exists = (await getDoc(perfilDocRef)).exists();
      if (exists) {
        await updateDoc(perfilDocRef, { ...perfil, updatedAt: new Date() } as any);
      } else {
        await setDoc(perfilDocRef, { ...perfil, createdAt: new Date(), updatedAt: new Date() } as any);
      }

      toast({
        title: "Éxito",
        description: "Perfil guardado correctamente",
      });
    } catch (error) {
      console.error("Error guardando perfil:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el perfil",
        variant: "destructive"
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleLogoChange = (tipo: "url" | "archivo", valor: string) => {
    setPerfil({
      ...perfil,
      logo: { tipo, valor }
    });
    setLogoPreview(valor);
  };

  const handleConexionIAChange = (campo: keyof typeof perfil.conexionesIA, valor: string) => {
    setPerfil({
      ...perfil,
      conexionesIA: {
        ...perfil.conexionesIA,
        [campo]: valor
      }
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.includes('image/')) {
        toast({
          title: "Error",
          description: "Solo se permiten archivos de imagen",
          variant: "destructive"
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo debe ser menor a 5MB",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataURL = e.target?.result as string;
        handleLogoChange("archivo", dataURL);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Perfil de Empresa</h1>
          <p className="text-muted-foreground">
            Configura la información de tu empresa
          </p>
        </div>
        
        <Button 
          onClick={guardarPerfil} 
          disabled={guardando}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nombreEmpresa">Nombre de la Empresa</Label>
              <Input
                id="nombreEmpresa"
                value={perfil.nombreEmpresa}
                onChange={(e) => setPerfil({...perfil, nombreEmpresa: e.target.value})}
                placeholder="Tu Empresa S.L."
              />
            </div>
            
            <div>
              <Label htmlFor="copyright">Copyright</Label>
              <Textarea
                id="copyright"
                value={perfil.copyright}
                onChange={(e) => setPerfil({...perfil, copyright: e.target.value})}
                placeholder=" 2025 Tu Empresa – Descripción"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Logo de la Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview del logo */}
            {logoPreview && (
              <div className="flex justify-center p-4 border rounded-lg bg-muted/50">
                <img 
                  src={logoPreview} 
                  alt="Logo preview" 
                  className="max-h-24 max-w-full object-contain"
                  onError={() => {
                    setLogoPreview("");
                    toast({
                      title: "Error",
                      description: "No se pudo cargar la imagen",
                      variant: "destructive"
                    });
                  }}
                />
              </div>
            )}
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  {perfil.logo.valor ? "Cambiar Logo" : "Agregar Logo"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar/Cambiar Logo</DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="url" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url">URL</TabsTrigger>
                    <TabsTrigger value="archivo">Archivo</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="url" className="space-y-4">
                    <div>
                      <Label htmlFor="logoUrl">URL de la imagen</Label>
                      <Input
                        id="logoUrl"
                        placeholder="https://ejemplo.com/logo.png"
                        onChange={(e) => handleLogoChange("url", e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={() => setIsDialogOpen(false)}
                      className="w-full"
                    >
                      Usar URL
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="archivo" className="space-y-4">
                    <div>
                      <Label htmlFor="logoFile">Seleccionar archivo</Label>
                      <Input
                        id="logoFile"
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleFileUpload}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Formatos: JPG, PNG. Máximo 5MB
                      </p>
                    </div>
                    <Button 
                      onClick={() => setIsDialogOpen(false)}
                      className="w-full"
                    >
                      Usar Archivo
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
            
            {perfil.logo.valor && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setPerfil({...perfil, logo: {tipo: "url", valor: ""}});
                  setLogoPreview("");
                }}
                className="w-full"
              >
                Quitar Logo
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conexiones con IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-flowmatic-teal" />
            Conexiones con IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="creacionItinerario" className="mb-2 block">
                URL de Creación de Itinerario
              </Label>
              <Input
                id="creacionItinerario"
                value={perfil.conexionesIA?.creacionItinerario || ""}
                onChange={(e) => handleConexionIAChange("creacionItinerario", e.target.value)}
                placeholder="https://api.ejemplo.com/creacion-itinerario"
              />
            </div>
            
            <div>
              <Label htmlFor="itinerarioRapido" className="mb-2 block">
                URL de Itinerario Rápido
              </Label>
              <Input
                id="itinerarioRapido"
                value={perfil.conexionesIA?.itinerarioRapido || ""}
                onChange={(e) => handleConexionIAChange("itinerarioRapido", e.target.value)}
                placeholder="https://api.ejemplo.com/itinerario-rapido"
              />
            </div>
            
            <div>
              <Label htmlFor="analiticasIA" className="mb-2 block">
                URL de Analíticas de IA
              </Label>
              <Input
                id="analiticasIA"
                value={perfil.conexionesIA?.analiticasIA || ""}
                onChange={(e) => handleConexionIAChange("analiticasIA", e.target.value)}
                placeholder="https://api.ejemplo.com/analiticas-ia"
              />
            </div>
            <div>
              <Label htmlFor="conversacion" className="mb-2 block">
                URL informacion  (plantilla)
              </Label>
              <Input
                id="conversacion"
                value={perfil.conexionesIA?.conversacion || ""}
                onChange={(e) => handleConexionIAChange("conversacion", e.target.value)}
                placeholder="https://firestore.googleapis.com/v1/projects/..."
              />
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Estas URLs se utilizarán para conectar con los servicios de IA de tu empresa.
          </p>
        </CardContent>
      </Card>

      {/* Vista Previa */}
      <Card>
        <CardHeader>
          <CardTitle>Vista Previa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <img 
                    src={logoPreview} 
                    alt="Logo" 
                    className="h-12 w-12 object-contain"
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    {perfil.nombreEmpresa || "Nombre de la Empresa"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {perfil.copyright}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}