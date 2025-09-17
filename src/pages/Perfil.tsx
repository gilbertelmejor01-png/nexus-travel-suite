import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  CodicionesGenrales: string;
  conexionesIA?: {
    creacionItinerario: string;
    itinerarioRapido: string;
    analiticasIA: string;
    conversacion: string;
  };
}

export default function Perfil() {
  const { t } = useTranslation();
  const [perfil, setPerfil] = useState<PerfilEmpresa>({
    nombreEmpresa: "",
    logo: {
      tipo: "url",
      valor: "",
    },
    copyright: t("default_copyright"),
    CodicionesGenrales: "",
    conexionesIA: {
      creacionItinerario: "",
      itinerarioRapido: "",
      analiticasIA: "",
      conversacion: "",
    },
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
        setPerfil((prev) => ({
          ...prev,
          ...data,
          conexionesIA: {
            creacionItinerario: data?.conexionesIA?.creacionItinerario || "",
            itinerarioRapido: data?.conexionesIA?.itinerarioRapido || "",
            analiticasIA: data?.conexionesIA?.analiticasIA || "",
            conversacion: data?.conexionesIA?.conversacion || "",
            ...data?.conexionesIA,
          },
        }));
        if (data?.logo?.valor) setLogoPreview(data.logo.valor);
      }
    } catch (error) {
      console.error(t("error_loading_profile"), error);
      toast({
        title: t("error_title"),
        description: t("profile_load_error"),
        variant: "destructive",
      });
    }
  };

  const guardarPerfil = async () => {
    if (!perfil.nombreEmpresa.trim()) {
      toast({
        title: t("error_title"),
        description: t("company_name_required"),
        variant: "destructive",
      });
      return;
    }

    setGuardando(true);
    try {
      if (!uid) {
        toast({
          title: t("session_required"),
          description: t("login_to_save_profile"),
          variant: "destructive",
        });
        return;
      }
      const perfilDocRef = doc(db, "users", uid, "perfil", "empresa");
      const exists = (await getDoc(perfilDocRef)).exists();
      if (exists) {
        await updateDoc(perfilDocRef, {
          ...perfil,
          updatedAt: new Date(),
        } as any);
      } else {
        await setDoc(perfilDocRef, {
          ...perfil,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
      }

      toast({
        title: t("success_title"),
        description: t("profile_saved_success"),
      });
    } catch (error) {
      console.error(t("error_saving_profile"), error);
      toast({
        title: t("error_title"),
        description: t("profile_save_error"),
        variant: "destructive",
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleLogoChange = (tipo: "url" | "archivo", valor: string) => {
    setPerfil({
      ...perfil,
      logo: { tipo, valor },
    });
    setLogoPreview(valor);
  };

  const handleConexionIAChange = (
    campo: keyof typeof perfil.conexionesIA,
    valor: string
  ) => {
    setPerfil({
      ...perfil,
      conexionesIA: {
        ...perfil.conexionesIA,
        [campo]: valor,
      },
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.includes("image/")) {
        toast({
          title: t("error_title"),
          description: t("only_image_files_allowed"),
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t("error_title"),
          description: t("file_size_exceeded"),
          variant: "destructive",
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
          <h1 className="text-3xl font-bold text-foreground">
            {t("company_profile")}
          </h1>
          <p className="text-muted-foreground">{t("configure_company_info")}</p>
        </div>

        <Button
          onClick={guardarPerfil}
          disabled={guardando}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {guardando ? t("saving") : t("save")}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t("general_information")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nombreEmpresa">{t("company_name")}</Label>
              <Input
                id="nombreEmpresa"
                value={perfil.nombreEmpresa}
                onChange={(e) =>
                  setPerfil({ ...perfil, nombreEmpresa: e.target.value })
                }
                placeholder={t("company_name_placeholder")}
              />
            </div>
            <div>
              <Label htmlFor="Codiciones genrales">
                {t("Codiciones generales")}
              </Label>
              <Textarea
                id="CodicionesGenerales"
                value={perfil.CodicionesGenrales}
                onChange={(e) =>
                  setPerfil({ ...perfil, CodicionesGenrales: e.target.value })
                }
                placeholder={t("Codiciones generales_placeholder")}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="copyright">{t("copyright")}</Label>
              <Textarea
                id="copyright"
                value={perfil.copyright}
                onChange={(e) =>
                  setPerfil({ ...perfil, copyright: e.target.value })
                }
                placeholder={t("copyright_placeholder")}
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
              {t("company_logo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview del logo */}
            {logoPreview && (
              <div className="flex justify-center p-4 border rounded-lg bg-muted/50">
                <img
                  src={logoPreview}
                  alt={t("logo_preview_alt")}
                  className="max-h-24 max-w-full object-contain"
                  onError={() => {
                    setLogoPreview("");
                    toast({
                      title: t("error_title"),
                      description: t("image_load_error"),
                      variant: "destructive",
                    });
                  }}
                />
              </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  {perfil.logo.valor ? t("change_logo") : t("add_logo")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("add_change_logo")}</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="url" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url">{t("url")}</TabsTrigger>
                    <TabsTrigger value="archivo">{t("file")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="url" className="space-y-4">
                    <div>
                      <Label htmlFor="logoUrl">{t("image_url")}</Label>
                      <Input
                        id="logoUrl"
                        placeholder={t("image_url_placeholder")}
                        onChange={(e) =>
                          handleLogoChange("url", e.target.value)
                        }
                      />
                    </div>
                    <Button
                      onClick={() => setIsDialogOpen(false)}
                      className="w-full"
                    >
                      {t("use_url")}
                    </Button>
                  </TabsContent>

                  <TabsContent value="archivo" className="space-y-4">
                    <div>
                      <Label htmlFor="logoFile">{t("select_file")}</Label>
                      <Input
                        id="logoFile"
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleFileUpload}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("file_formats_limit")}
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsDialogOpen(false)}
                      className="w-full"
                    >
                      {t("use_file")}
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            {perfil.logo.valor && (
              <Button
                variant="outline"
                onClick={() => {
                  setPerfil({ ...perfil, logo: { tipo: "url", valor: "" } });
                  setLogoPreview("");
                }}
                className="w-full"
              >
                {t("remove_logo")}
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
            {t("ai_connections")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="creacionItinerario" className="mb-2 block">
                {t("itinerary_creation_url")}
              </Label>
              <Input
                id="creacionItinerario"
                value={perfil.conexionesIA?.creacionItinerario || ""}
                onChange={(e) =>
                  handleConexionIAChange("creacionItinerario", e.target.value)
                }
                placeholder={t("itinerary_creation_url_placeholder")}
              />
            </div>

            <div>
              <Label htmlFor="itinerarioRapido" className="mb-2 block">
                {t("quick_itinerary_url")}
              </Label>
              <Input
                id="itinerarioRapido"
                value={perfil.conexionesIA?.itinerarioRapido || ""}
                onChange={(e) =>
                  handleConexionIAChange("itinerarioRapido", e.target.value)
                }
                placeholder={t("quick_itinerary_url_placeholder")}
              />
            </div>

            <div>
              <Label htmlFor="analiticasIA" className="mb-2 block">
                {t("ai_analytics_url")}
              </Label>
              <Input
                id="analiticasIA"
                value={perfil.conexionesIA?.analiticasIA || ""}
                onChange={(e) =>
                  handleConexionIAChange("analiticasIA", e.target.value)
                }
                placeholder={t("ai_analytics_url_placeholder")}
              />
            </div>
            <div>
              <Label htmlFor="conversacion" className="mb-2 block">
                {t("conversation_url")}
              </Label>
              <Input
                id="conversacion"
                value={perfil.conexionesIA?.conversacion || ""}
                onChange={(e) =>
                  handleConexionIAChange("conversacion", e.target.value)
                }
                placeholder={t("conversation_url_placeholder")}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {t("ai_urls_description")}
          </p>
        </CardContent>
      </Card>

      {/* Vista Previa */}
      <Card>
        <CardHeader>
          <CardTitle>{t("preview")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt={t("logo_alt")}
                    className="h-12 w-12 object-contain"
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    {perfil.nombreEmpresa || t("company_name_default")}
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
