import React, { useState } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Edit3,
  Trash2,
  Plus,
  GripVertical,
  Palette,
  Image as ImageIcon,
  Download,
  Send,
} from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface ItineraryEntry {
  jour: string;
  date: string;
  programme: string;
  nuit: string;
  hôtel: string;
}

interface HotelInfo {
  nom: string;
  description: string;
  images: string[];
}

export interface VoyageData {
  programme_detaille: string;
  table_itineraire_bref: ItineraryEntry[];
  prix_par_personne: string;
  chambre_simple: string;
  remarques_tarifs: string;
  inclus: string[];
  non_inclus: string[];
  pays_destination: string;
  themeColor: string;
  titreVoyage: string;
  logoUrl: string;
  imageProgrammeUrl: string;
  bonVoyageText: string;
  vos_envies: string;
  note_hebergement: string;
  note_programme: string;
  intro_hebergements: string;
  // Nuevos campos para títulos editables
  titre_vos_envies: string;
  titre_itineraire_bref: string;
  titre_programme_detaille: string;
  titre_inclus: string;
  titre_non_inclus: string;
  titre_hebergements: string;
  titre_immersion: string;
  // Nuevos campos para textos editables de tarifas
  titre_tarif: string;
  titre_chambre_simple: string;
  titre_remarques: string;
  // Nuevos campos para encabezados de tabla editables
  titre_jour: string;
  titre_date: string;
  titre_programme_table: string;
  titre_nuit: string;
  titre_hotel: string;
  // Hoteles personalizados
  hebergements_personnalises: HotelInfo[];
}

interface PreviaProps {
  data: VoyageData | null;
  loading: boolean;
  error: string | null;
}

const Previa = ({ data, loading, error }: PreviaProps) => {
  const { currentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState<VoyageData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [activeHotelIndex, setActiveHotelIndex] = useState<number | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [hotelImages, setHotelImages] = useState<{ [key: string]: string }>({});
  const [conversacionId, setConversacionId] = useState<string | null>(null);
  // Estados para la funcionalidad de IA granular
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [activeAiSection, setActiveAiSection] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  // Función para obtener el ID de conversación desde el perfil del usuario
  const obtenerConversacionId = async (uid: string): Promise<string | null> => {
    try {
      const perfilDocRef = doc(db, "users", uid, "perfil", "empresa");
      const perfilSnap = await getDoc(perfilDocRef);

      if (perfilSnap.exists()) {
        const data = perfilSnap.data();
        return data?.conexionesIA?.conversacion || null;
      }
      return null;
    } catch (error) {
      console.error("Error obteniendo ID de conversación:", error);
      return null;
    }
  };

  // Función para llamar a la API de IA
  const callAI = async (prompt: string, section?: string) => {
    if (!editedData || !prompt.trim()) return;

    setAiLoading(true);
    setAiResponse(null);

    try {
      const systemPrompt = `Eres un editor inteligente especializado en documentos de viaje. Tu función es modificar, enriquecer, traducir, reorganizar o rediseñar el contenido del documento según las instrucciones del usuario.

REGLAS IMPORTANTES:
1. SIEMPRE responde en el idioma solicitado por el usuario
2. Para descripciones → da 3 opciones diferentes
3. Para cambios visuales → devuelve JSON con estilos sugeridos
4. Para eliminación/movimiento → devuelve JSON actualizado
5. NUNCA elimines información crítica (fechas, precios, contactos)
6. Mantén la estructura JSON de VoyageData
7. Si el usuario pide eliminar una sección, devuelve JSON con esa sección vacía o eliminada
8. Para rediseño completo de plantilla, puedes modificar:
   - themeColor (colores del tema)
   - Estilos de imágenes (tamaños, centrado, etc.)
   - Tipografía y disposición
   - Paletas de colores
   - Estilos visuales generales

FORMATO DE RESPUESTA:
- Explicación breve para el usuario
- Resultado aplicable (texto o JSON según el caso)

${section ? `SECCIÓN ESPECÍFICA A MODIFICAR: ${section}` : ""}

DATOS ACTUALES DEL DOCUMENTO:
${JSON.stringify(editedData, null, 2)}`;

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error de API: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (aiResponse) {
        setAiResponse(aiResponse);

        // Intentar parsear si es JSON
        try {
          const parsedResponse = JSON.parse(aiResponse);
          if (parsedResponse && typeof parsedResponse === "object") {
            // Aplicar cambios automáticamente si es JSON válido
            setEditedData({
              ...editedData,
              ...parsedResponse,
            });
          }
        } catch (e) {
          // Si no es JSON, solo mostrar la respuesta
          console.log("Respuesta de IA (no JSON):", aiResponse);
        }
      }
    } catch (error) {
      console.error("Error llamando a la IA:", error);
      setAiResponse("Error al procesar la solicitud. Intente nuevamente.");
    } finally {
      setAiLoading(false);
    }
  };

  // Función para abrir el modal de IA para una sección específica
  const openAiModal = (section: string) => {
    setActiveAiSection(section);
    setShowAiModal(true);
    setAiPrompt("");
    setAiResponse(null);
  };

  // Inicializar datos editados cuando los datos llegan
  React.useEffect(() => {
    if (data && !editedData) {
      setEditedData({
        titreVoyage: "Votre voyage avec Néogusto",
        logoUrl:
          "https://res.cloudinary.com/dckcnx0sz/image/upload/v1752805614/Captura_de_pantalla_de_2025-07-17_21-14-15_za6iuo.png",
        imageProgrammeUrl:
          "https://www.vinccihoteles.com/media/uploads/cms_apps/imagenes/disposicion-articulos-viaje-angulo-alto.jpg?q=pr:sharp/rs:fill/w:900/h:500/g:ce/f:jpg",
        bonVoyageText: "BON VOYAGE !",
        vos_envies: "",
        note_hebergement:
          "NOTE : Les hébergements proposés sont sujets à disponibilité au moment de la réservation.",
        note_programme:
          "Le programme a été établi sur la base de nos derniers échanges et peut être adapté selon vos souhaits.",
        intro_hebergements:
          "Hébergements sélectionnés pour leur confort, charme et localisation.",
        // Valores por defecto para los títulos
        titre_vos_envies: "VOS ENVIES",
        titre_itineraire_bref: "VOTRE ITINÉRAIRE EN BREF",
        titre_programme_detaille: "PROGRAMME DÉTAILLÉ",
        titre_inclus: "INCLUS",
        titre_non_inclus: "NON INCLUS",
        titre_hebergements: "VOS HÉBERGEMENTS",
        titre_immersion: "Immersion au",
        // Valores por defecto para textos de tarifas
        titre_tarif: "TARIF par personne",
        titre_chambre_simple: "Chambre simple",
        titre_remarques: "Remarques",
        // Valores por defecto para encabezados de tabla
        titre_jour: "JOUR",
        titre_date: "DATE",
        titre_programme_table: "PROGRAMME",
        titre_nuit: "NUIT",
        titre_hotel: "HÔTEL",
        // Hoteles personalizados
        hebergements_personnalises: [],

        ...data,
        themeColor: data.themeColor || "#3b82f6",
      });
    }
  }, [data]);

  // Obtener el ID de conversación cuando el usuario esté autenticado
  React.useEffect(() => {
    const cargarConversacionId = async () => {
      if (currentUser?.uid) {
        const id = await obtenerConversacionId(currentUser.uid);
        setConversacionId(id);
      }
    };

    cargarConversacionId();
  }, [currentUser]);

  const extractHotels = (): HotelInfo[] => {
    if (!editedData?.table_itineraire_bref) return [];

    const seen = new Set<string>();
    return editedData.table_itineraire_bref
      .filter(
        (entry) =>
          entry.hôtel && !seen.has(entry.hôtel) && seen.add(entry.hôtel)
      )
      .map((entry) => ({
        nom: entry.hôtel,
        description: `Nuit à ${entry.nuit || "emplacement inconnu"}`,
        images: [],
      }));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !editedData) return;

    // Reordenar itinerario
    if (result.type === "itinerary") {
      const items = Array.from(editedData.table_itineraire_bref);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      setEditedData({
        ...editedData,
        table_itineraire_bref: items,
      });
    }
    // Reordenar listas (inclus, non_inclus)
    else if (result.type === "inclus" || result.type === "non_inclus") {
      const field = result.type;
      const items = Array.from(editedData[field] as string[]);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      setEditedData({
        ...editedData,
        [field]: items,
      });
    }
    // Reordenar hoteles personalizados
    else if (result.type === "hebergements_personnalises") {
      const items = Array.from(editedData.hebergements_personnalises || []);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      setEditedData({
        ...editedData,
        hebergements_personnalises: items,
      });
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
  };

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "link",
    "image",
  ];

  const handleChange = (field: keyof VoyageData, value: string) => {
    if (!editedData) return;

    setEditedData({
      ...editedData,
      [field]: value,
    });
  };

  const handleArrayChange = (field: keyof VoyageData, value: string) => {
    if (!editedData) return;

    const arrayValue = value.split("\n").filter((item) => item.trim() !== "");
    setEditedData({
      ...editedData,
      [field]: arrayValue,
    });
  };

  const handleItineraryChange = (
    index: number,
    field: keyof ItineraryEntry,
    value: string
  ) => {
    if (!editedData) return;

    const updatedItinerary = [...editedData.table_itineraire_bref];
    updatedItinerary[index] = {
      ...updatedItinerary[index],
      [field]: value,
    };

    setEditedData({
      ...editedData,
      table_itineraire_bref: updatedItinerary,
    });
  };

  const addNewItineraryEntry = () => {
    if (!editedData) return;

    const newEntry: ItineraryEntry = {
      jour: "",
      date: "",
      programme: "",
      nuit: "",
      hôtel: "",
    };

    setEditedData({
      ...editedData,
      table_itineraire_bref: [...editedData.table_itineraire_bref, newEntry],
    });
  };

  const removeItineraryEntry = (index: number) => {
    if (!editedData) return;

    const updatedItinerary = [...editedData.table_itineraire_bref];
    updatedItinerary.splice(index, 1);

    setEditedData({
      ...editedData,
      table_itineraire_bref: updatedItinerary,
    });
  };

  const addNewListItem = (field: "inclus" | "non_inclus") => {
    if (!editedData) return;

    const currentList = editedData[field] || [];
    setEditedData({
      ...editedData,
      [field]: [...currentList, ""],
    });
  };

  const removeListItem = (field: "inclus" | "non_inclus", index: number) => {
    if (!editedData) return;

    const currentList = editedData[field] || [];
    const updatedList = [...currentList];
    updatedList.splice(index, 1);

    setEditedData({
      ...editedData,
      [field]: updatedList,
    });
  };

  const handleListItemChange = (
    field: "inclus" | "non_inclus",
    index: number,
    value: string
  ) => {
    if (!editedData) return;

    const updatedList = [...editedData[field]];
    updatedList[index] = value;

    setEditedData({
      ...editedData,
      [field]: updatedList,
    });
  };

  const addImageToHotel = (hotelIndex: number) => {
    if (!editedData || !newImageUrl.trim()) return;

    const hotels = extractHotels();
    if (hotelIndex >= hotels.length) return;

    // En una implementación real, actualizaríamos el estado para incluir la nueva imagen
    // Esta es una simplificación para demostrar la funcionalidad
    setNewImageUrl("");
  };

  const addNewHotelPersonnalise = () => {
    if (!editedData) return;

    const newHotel: HotelInfo = {
      nom: "Nouvel hôtel",
      description: "Description de l'hôtel",
      images: [],
    };

    setEditedData({
      ...editedData,
      hebergements_personnalises: [
        ...(editedData.hebergements_personnalises || []),
        newHotel,
      ],
    });
  };

  const removeHotelPersonnalise = (index: number) => {
    if (!editedData) return;

    const updatedHotels = [...(editedData.hebergements_personnalises || [])];
    updatedHotels.splice(index, 1);

    setEditedData({
      ...editedData,
      hebergements_personnalises: updatedHotels,
    });
  };

  const handleHotelPersonnaliseChange = (
    index: number,
    field: keyof HotelInfo,
    value: string
  ) => {
    if (!editedData) return;

    const updatedHotels = [...(editedData.hebergements_personnalises || [])];
    updatedHotels[index] = {
      ...updatedHotels[index],
      [field]: value,
    };

    setEditedData({
      ...editedData,
      hebergements_personnalises: updatedHotels,
    });
  };

  const addImageToHotelPersonnalise = (
    hotelIndex: number,
    imageUrl: string
  ) => {
    if (!editedData || !imageUrl.trim()) return;

    const updatedHotels = [...(editedData.hebergements_personnalises || [])];
    const currentImages = updatedHotels[hotelIndex].images || [];

    updatedHotels[hotelIndex] = {
      ...updatedHotels[hotelIndex],
      images: [...currentImages, imageUrl.trim()],
    };

    setEditedData({
      ...editedData,
      hebergements_personnalises: updatedHotels,
    });
  };

  const removeImageFromHotelPersonnalise = (
    hotelIndex: number,
    imageIndex: number
  ) => {
    if (!editedData) return;

    const updatedHotels = [...(editedData.hebergements_personnalises || [])];
    const updatedImages = [...updatedHotels[hotelIndex].images];
    updatedImages.splice(imageIndex, 1);

    updatedHotels[hotelIndex] = {
      ...updatedHotels[hotelIndex],
      images: updatedImages,
    };

    setEditedData({
      ...editedData,
      hebergements_personnalises: updatedHotels,
    });
  };

  const handleSave = async () => {
    if (!editedData) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Verificar que tenemos el ID de conversación
      if (!conversacionId) {
        throw new Error("No se pudo obtener el ID de conversación del usuario");
      }

      const docRef = doc(db, "conversacion", conversacionId);
      await updateDoc(docRef, {
        output: editedData,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setEditing(false);
    } catch (error) {
      console.error("Error saving data:", error);
      setSaveError("Error al guardar los cambios. Intente nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  const generarPDF = async () => {
    if (!editedData) return;

    setGeneratingPdf(true);
    try {
      const response = await fetch("http://38.242.224.81:3000/generar-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedData),
      });

      if (!response.ok) {
        throw new Error(
          `Error del servidor: ${response.status} ${response.statusText}`
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "voyage-plan.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando PDF:", error);
      setSaveError(
        `Error de conexión: No se pudo conectar al servidor. Verifica que el servidor esté ejecutándose en http://38.242.224.81:3000`
      );
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-8 bg-blue-50 border border-blue-200 rounded">
        <div className="text-blue-600 font-semibold">
          🔄 Cargando datos de Firebase...
        </div>
      </div>
    );

  if (error)
    return (
      <div className="text-center py-8 bg-red-50 border border-red-200 rounded">
        <div className="text-red-600 font-semibold">❌ Error: {error}</div>
      </div>
    );

  if (!editedData)
    return (
      <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded">
        <div className="text-yellow-600 font-semibold">
          ⚠️ No hay datos disponibles
        </div>
        <div className="text-sm text-gray-500 mt-2">
          Verificando conexión con Firebase...
        </div>
      </div>
    );

  // Validar que tenemos el ID de conversación
  if (!conversacionId && currentUser) {
    return (
      <div className="text-center py-8 bg-orange-50 border border-orange-200 rounded">
        <div className="text-orange-600 font-semibold">
          ⚠️ Configuración incompleta
        </div>
        <div className="text-sm text-gray-500 mt-2">
          No se pudo obtener la configuración de conversación del usuario.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-white shadow-md rounded-lg">
      {/* Botones de edición/guardar en la parte superior */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Previsualización</h1>
          <p className="text-muted-foreground">
            Vista previa del presupuesto antes del envío
          </p>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <Button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Editar
            </Button>
          ) : (
            <>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="animate-spin">↻</span> Guardando...
                  </>
                ) : (
                  "💾 Guardar Cambios"
                )}
              </Button>
              <Button
                onClick={() => {
                  setEditing(false);
                  setEditedData(data);
                }}
                variant="outline"
              >
                ❌ Cancelar
              </Button>
            </>
          )}
          <Button
            variant="secondary"
            onClick={generarPDF}
            disabled={generatingPdf}
          >
            <Download className="h-4 w-4 mr-2" />
            {generatingPdf ? "Generando PDF..." : "Descargar PDF"}
          </Button>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Enviar al cliente
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          ✅ Cambios guardados exitosamente en Firebase!
        </div>
      )}

      {saveError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          ❌ {saveError}
        </div>
      )}

      {/* Selector de color */}
      {editing && (
        <div className="mb-4 p-4 border rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Palette className="h-4 w-4" />
                Color del tema:
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={editedData.themeColor}
                  onChange={(e) =>
                    setEditedData({
                      ...editedData,
                      themeColor: e.target.value,
                    })
                  }
                  className="w-12 h-12 p-1"
                />
                <Input
                  type="text"
                  value={editedData.themeColor}
                  onChange={(e) =>
                    setEditedData({
                      ...editedData,
                      themeColor: e.target.value,
                    })
                  }
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => openAiModal("rediseñar_plantilla")}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                🎨 Rediseñar Toda la Plantilla con IA
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header principal con diseño profesional */}
      <div
        className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 p-8 mb-8 overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${editedData.themeColor}15, ${editedData.themeColor}05)`,
          borderColor: editedData.themeColor + '30'
        }}
      >
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full -translate-y-16 translate-x-16 opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-200 to-blue-200 rounded-full translate-y-12 -translate-x-12 opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-10"></div>
        {editing ? (
          <div className="space-y-6">
            <div className="text-center">
              <Label className="block mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                URL del Logo
              </Label>
              <Input
                value={editedData.logoUrl}
                onChange={(e) => handleChange("logoUrl", e.target.value)}
                className="w-full max-w-md mx-auto border-2 border-gray-200 focus:border-blue-400 rounded-xl px-4 py-3 text-center"
                placeholder="Ingresa la URL del logo"
              />
            </div>
            <div className="text-center">
              <Label className="block mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Título del Viaje
              </Label>
              <Input
                value={editedData.titreVoyage}
                onChange={(e) => handleChange("titreVoyage", e.target.value)}
                className="w-full max-w-lg mx-auto border-2 border-gray-200 focus:border-blue-400 rounded-xl px-4 py-3 text-center text-lg font-medium"
                placeholder="Ingresa el título del viaje"
              />
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Logo con efecto de sombra y marco */}
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
                  <img
                    src={editedData.logoUrl}
                    alt="Logo Flowmatic"
                    className="h-20 w-auto mx-auto object-contain"
                  />
                </div>
              </div>
            </div>
            
            {/* Título principal con diseño elegante */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 relative z-10">
                  {editedData.titreVoyage}
                </h1>
                {/* Línea decorativa debajo del título */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              </div>
              
              {/* Subtítulo con estilo */}
              <div className="mt-4">
                <p className="text-lg text-gray-600 font-medium tracking-wide">
                  Experiencia de Viaje Premium
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Sección de destino con diseño elegante */}
        <div className="text-center mt-8">
          {editing ? (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <div className="flex-1 max-w-xs">
                  <Label className="block mb-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Tipo de Experiencia
                  </Label>
                  <Input
                    type="text"
                    value={editedData.titre_immersion}
                    onChange={(e) => handleChange("titre_immersion", e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-blue-400 rounded-xl px-4 py-3 text-center font-medium"
                    style={{ color: editedData.themeColor }}
                    placeholder="Immersion au"
                  />
                </div>
                <div className="flex-1 max-w-xs">
                  <Label className="block mb-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Destino
                  </Label>
                  <Input
                    type="text"
                    value={editedData.pays_destination}
                    onChange={(e) => handleChange("pays_destination", e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-blue-400 rounded-xl px-4 py-3 text-center font-medium"
                    style={{ color: editedData.themeColor }}
                    placeholder="Portugal"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Contenedor principal con efectos visuales */}
              <div className="relative inline-block">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl blur-sm opacity-50"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg border border-white/50">
                  <h2 
                    className="text-2xl md:text-3xl font-bold mb-2"
                    style={{ color: editedData.themeColor }}
                  >
                    {editedData.titre_immersion || "Immersion au"}
                  </h2>
                  <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-3"></div>
                  <h3 
                    className="text-3xl md:text-4xl font-extrabold tracking-wide"
                    style={{ color: editedData.themeColor }}
                  >
                    {editedData.pays_destination || "Destination"}
                  </h3>
                </div>
              </div>
              
              {/* Elementos decorativos */}
              <div className="flex justify-center mt-6 space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sección Vos Envies con diseño moderno */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">💭</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedData.titre_vos_envies}
                    onChange={(e) =>
                      handleChange("titre_vos_envies", e.target.value)
                    }
                    className="text-xl font-bold border-2 border-gray-200 focus:border-yellow-400 rounded-xl px-4 py-2"
                    placeholder="VOS ENVIES"
                  />
                  <Button
                    onClick={() => openAiModal("Titre Vos Envies")}
                    variant="ghost"
                    size="sm"
                    className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg"
                  >
                    ✨
                  </Button>
                </div>
              ) : (
                editedData.titre_vos_envies || "VOS ENVIES"
              )}
            </h2>
          </div>
          {editing && (
            <Button
              onClick={() => {
                setEditedData((prev) => ({
                  ...prev,
                  titre_vos_envies: "",
                  vos_envies: "",
                }));
              }}
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-800 hover:bg-red-50 border-red-200"
            >
              🗑️ Eliminar
            </Button>
          )}
        </div>
        
        {editing ? (
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                value={editedData.vos_envies || ""}
                onChange={(e) => handleChange("vos_envies", e.target.value)}
                className="w-full border-2 border-gray-200 focus:border-yellow-400 rounded-xl px-4 py-3 h-32 resize-none"
                placeholder="Ajoutez vos envies ici..."
              />
              <Button
                onClick={() => openAiModal("Contenu Vos Envies")}
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
              >
                ✨
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 min-h-32">
            <p className="text-gray-700 leading-relaxed">
              {editedData.vos_envies || "Vos envies seront ajoutés ici..."}
            </p>
          </div>
        )}
      </div>

      <div className="section my-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">
            {editing ? (
              <Input
                value={editedData.titre_itineraire_bref}
                onChange={(e) =>
                  handleChange("titre_itineraire_bref", e.target.value)
                }
                className="text-lg font-semibold"
              />
            ) : (
              editedData.titre_itineraire_bref || "VOTRE ITINÉRAIRE EN BREF"
            )}
          </h2>
          {editing && (
            <div className="flex gap-2">
            <Button onClick={addNewItineraryEntry} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter un jour
            </Button>
              <Button
                onClick={() => {
                  setEditedData((prev) => ({
                    ...prev,
                    titre_itineraire_bref: "",
                    table_itineraire_bref: [],
                  }));
                }}
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-800"
              >
                🗑️ Eliminar
              </Button>
            </div>
          )}
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="itinerary" type="itinerary">
            {(provided) => (
              <table
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="w-full border-collapse"
              >
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left"></th>
                    <th className="p-2 text-left">
                      {editing ? (
                        <Input
                          value={editedData.titre_jour}
                          onChange={(e) =>
                            handleChange("titre_jour", e.target.value)
                          }
                          className="font-semibold"
                        />
                      ) : (
                        editedData.titre_jour || "JOUR"
                      )}
                    </th>
                    <th className="p-2 text-left">
                      {editing ? (
                        <Input
                          value={editedData.titre_date}
                          onChange={(e) =>
                            handleChange("titre_date", e.target.value)
                          }
                          className="font-semibold"
                        />
                      ) : (
                        editedData.titre_date || "DATE"
                      )}
                    </th>
                    <th className="p-2 text-left">
                      {editing ? (
                        <Input
                          value={editedData.titre_programme_table}
                          onChange={(e) =>
                            handleChange(
                              "titre_programme_table",
                              e.target.value
                            )
                          }
                          className="font-semibold"
                        />
                      ) : (
                        editedData.titre_programme_table || "PROGRAMME"
                      )}
                    </th>
                    <th className="p-2 text-left">
                      {editing ? (
                        <Input
                          value={editedData.titre_nuit}
                          onChange={(e) =>
                            handleChange("titre_nuit", e.target.value)
                          }
                          className="font-semibold"
                        />
                      ) : (
                        editedData.titre_nuit || "NUIT"
                      )}
                    </th>
                    <th className="p-2 text-left">
                      {editing ? (
                        <Input
                          value={editedData.titre_hotel}
                          onChange={(e) =>
                            handleChange("titre_hotel", e.target.value)
                          }
                          className="font-semibold"
                        />
                      ) : (
                        editedData.titre_hotel || "HÔTEL"
                      )}
                    </th>
                    {editing && <th className="p-2 text-left">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {editedData.table_itineraire_bref.map((row, index) => (
                    <Draggable
                      key={index}
                      draggableId={index.toString()}
                      index={index}
                    >
                      {(provided) => (
                        <tr
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="border-b"
                        >
                          <td
                            {...provided.dragHandleProps}
                            className="p-2 text-center"
                          >
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          </td>
                          <td className="p-2">
                            {editing ? (
                              <div className="flex items-center gap-2">
                              <Input
                                value={row.jour}
                                onChange={(e) =>
                                  handleItineraryChange(
                                    index,
                                    "jour",
                                    e.target.value
                                  )
                                }
                                  className="flex-1"
                                />
                                <Button
                                  onClick={() =>
                                    openAiModal(`Día ${index + 1} - Jour`)
                                  }
                                  variant="ghost"
                                  size="sm"
                                  className="text-yellow-600 hover:text-yellow-700"
                                >
                                  ✨
                                </Button>
                              </div>
                            ) : (
                              row.jour
                            )}
                          </td>
                          <td className="p-2">
                            {editing ? (
                              <div className="flex items-center gap-2">
                              <Input
                                value={row.date}
                                onChange={(e) =>
                                  handleItineraryChange(
                                    index,
                                    "date",
                                    e.target.value
                                  )
                                }
                                  className="flex-1"
                                />
                                <Button
                                  onClick={() =>
                                    openAiModal(`Día ${index + 1} - Date`)
                                  }
                                  variant="ghost"
                                  size="sm"
                                  className="text-yellow-600 hover:text-yellow-700"
                                >
                                  ✨
                                </Button>
                              </div>
                            ) : (
                              row.date
                            )}
                          </td>
                          <td className="p-2">
                            {editing ? (
                              <div className="flex items-center gap-2">
                              <Textarea
                                value={row.programme}
                                onChange={(e) =>
                                  handleItineraryChange(
                                    index,
                                    "programme",
                                    e.target.value
                                  )
                                }
                                  className="flex-1"
                                rows={2}
                              />
                                <Button
                                  onClick={() =>
                                    openAiModal(`Día ${index + 1} - Programme`)
                                  }
                                  variant="ghost"
                                  size="sm"
                                  className="text-yellow-600 hover:text-yellow-700"
                                >
                                  ✨
                                </Button>
                              </div>
                            ) : (
                              row.programme
                            )}
                          </td>
                          <td className="p-2">
                            {editing ? (
                              <div className="flex items-center gap-2">
                              <Input
                                value={row.nuit}
                                onChange={(e) =>
                                  handleItineraryChange(
                                    index,
                                    "nuit",
                                    e.target.value
                                  )
                                }
                                  className="flex-1"
                                />
                                <Button
                                  onClick={() =>
                                    openAiModal(`Día ${index + 1} - Nuit`)
                                  }
                                  variant="ghost"
                                  size="sm"
                                  className="text-yellow-600 hover:text-yellow-700"
                                >
                                  ✨
                                </Button>
                              </div>
                            ) : (
                              row.nuit
                            )}
                          </td>
                          <td className="p-2">
                            {editing ? (
                              <div className="flex items-center gap-2">
                              <Input
                                value={row.hôtel}
                                onChange={(e) =>
                                  handleItineraryChange(
                                    index,
                                    "hôtel",
                                    e.target.value
                                  )
                                }
                                  className="flex-1"
                                />
                                <Button
                                  onClick={() =>
                                    openAiModal(`Día ${index + 1} - Hôtel`)
                                  }
                                  variant="ghost"
                                  size="sm"
                                  className="text-yellow-600 hover:text-yellow-700"
                                >
                                  ✨
                                </Button>
                              </div>
                            ) : (
                              row.hôtel
                            )}
                          </td>
                          {editing && (
                            <td className="p-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItineraryEntry(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </tbody>
              </table>
            )}
          </Droppable>
        </DragDropContext>

        <div
          className="p-3 my-4 rounded"
          style={{
            backgroundColor: editedData.themeColor + "20",
            borderLeft: `4px solid ${editedData.themeColor}`,
          }}
        >
          {editing ? (
            <Textarea
              value={editedData.note_programme || ""}
              onChange={(e) => handleChange("note_programme", e.target.value)}
              className="w-full"
              rows={3}
            />
          ) : (
            <p>
              {editedData.note_programme ||
                "Le programme a été établi sur la base de nos derniers échanges et peut être adapté selon vos souhaits."}
            </p>
          )}
        </div>
      </div>

      <div className="section programme-detaille my-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold border-b border-gray-300 pb-2">
            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedData.titre_programme_detaille}
                  onChange={(e) =>
                    handleChange("titre_programme_detaille", e.target.value)
                  }
                  className="text-lg font-semibold"
                />
                <Button
                  onClick={() => openAiModal("titre_programme_detaille")}
                  size="sm"
                  variant="ghost"
                  className="text-purple-600 hover:text-purple-800"
                >
                  ✨
                </Button>
              </div>
            ) : (
              editedData.titre_programme_detaille || "PROGRAMME DÉTAILLÉ"
            )}
          </h2>
          {editing && (
            <div className="flex gap-2">
              <Button
                onClick={() => openAiModal("rediseñar_plantilla")}
                size="sm"
                variant="outline"
                className="text-blue-600 hover:text-blue-800"
              >
                🎨 Rediseñar IA
              </Button>
              <Button
                onClick={() => {
                  setEditedData((prev) => ({
                    ...prev,
                    titre_programme_detaille: "",
                    imageProgrammeUrl: "",
                    programme_detaille: "",
                  }));
                }}
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-800"
              >
                🗑️ Eliminar
              </Button>
            </div>
          )}
        </div>
        <div className="mb-4">
          {editing ? (
            <>
              <Label className="block mb-2">
                URL de la imagen del programa:
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={editedData.imageProgrammeUrl}
                  onChange={(e) =>
                    handleChange("imageProgrammeUrl", e.target.value)
                  }
                  className="mb-2"
                />
                <Button
                  onClick={() => openAiModal("imageProgrammeUrl")}
                  size="sm"
                  variant="ghost"
                  className="text-purple-600 hover:text-purple-800"
                >
                  ✨
                </Button>
              </div>
            </>
          ) : (
            <img
              src={editedData.imageProgrammeUrl}
              alt="Programme détaillé"
              className="w-full rounded mb-4"
            />
          )}
        </div>
        {editing ? (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Label>Contenido del programa:</Label>
              <Button
                onClick={() => openAiModal("programme_detaille")}
                size="sm"
                variant="ghost"
                className="text-purple-600 hover:text-purple-800"
              >
                ✨
              </Button>
            </div>
            <ReactQuill
              value={editedData.programme_detaille}
              onChange={(value) => handleChange("programme_detaille", value)}
              modules={quillModules}
              formats={quillFormats}
              theme="snow"
              className="h-96 mb-8"
            />
          </div>
        ) : (
          <div
            className="prose"
            dangerouslySetInnerHTML={{
              __html:
                editedData.programme_detaille ||
                "<p>Description du programme à venir</p>",
            }}
          />
        )}
      </div>

      <div className="section my-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold bg-gray-800 text-white p-2">
                {editing ? (
                  <Input
                    value={editedData.titre_inclus}
                    onChange={(e) =>
                      handleChange("titre_inclus", e.target.value)
                    }
                    className="font-semibold text-white bg-transparent border-none"
                  />
                ) : (
                  editedData.titre_inclus || "INCLUS"
                )}
              </h3>
              {editing && (
                <Button
                  onClick={() => addNewListItem("inclus")}
                  size="sm"
                  variant="ghost"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="inclus" type="inclus">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="border p-4 min-h-48"
                  >
                    {editedData.inclus?.map((item, index) => (
                      <Draggable
                        key={index}
                        draggableId={`inclus-${index}`}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded"
                          >
                            <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            {editing ? (
                              <>
                                <Input
                                  value={item}
                                  onChange={(e) =>
                                    handleListItemChange(
                                      "inclus",
                                      index,
                                      e.target.value
                                    )
                                  }
                                  className="flex-1"
                                />
                                <Button
                                  onClick={() =>
                                    openAiModal(`Inclus - Item ${index + 1}`)
                                  }
                                  variant="ghost"
                                  size="sm"
                                  className="text-yellow-600 hover:text-yellow-700"
                                >
                                  ✨
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeListItem("inclus", index)
                                  }
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            ) : (
                              <span>{item}</span>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold bg-gray-800 text-white p-2">
                {editing ? (
                  <Input
                    value={editedData.titre_non_inclus}
                    onChange={(e) =>
                      handleChange("titre_non_inclus", e.target.value)
                    }
                    className="font-semibold text-white bg-transparent border-none"
                  />
                ) : (
                  editedData.titre_non_inclus || "NON INCLUS"
                )}
              </h3>
              {editing && (
                <Button
                  onClick={() => addNewListItem("non_inclus")}
                  size="sm"
                  variant="ghost"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="non_inclus" type="non_inclus">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="border p-4 min-h-48"
                  >
                    {editedData.non_inclus?.map((item, index) => (
                      <Draggable
                        key={index}
                        draggableId={`non_inclus-${index}`}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded"
                          >
                            <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            {editing ? (
                              <>
                                <Input
                                  value={item}
                                  onChange={(e) =>
                                    handleListItemChange(
                                      "non_inclus",
                                      index,
                                      e.target.value
                                    )
                                  }
                                  className="flex-1"
                                />
                                <Button
                                  onClick={() =>
                                    openAiModal(
                                      `Non Inclus - Item ${index + 1}`
                                    )
                                  }
                                  variant="ghost"
                                  size="sm"
                                  className="text-yellow-600 hover:text-yellow-700"
                                >
                                  ✨
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeListItem("non_inclus", index)
                                  }
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            ) : (
                              <span>{item}</span>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>

        <div
          className="p-4 my-4 rounded"
          style={{
            backgroundColor: editedData.themeColor + "20",
            borderLeft: `4px solid ${editedData.themeColor}`,
          }}
        >
          <p>
            <strong>
              {editing ? (
                <Input
                  value={editedData.titre_tarif}
                  onChange={(e) => handleChange("titre_tarif", e.target.value)}
                  className="inline-block w-48 mx-2 font-bold"
                />
              ) : (
                editedData.titre_tarif || "TARIF par personne"
              )}
              :{" "}
              {editing ? (
                <Input
                  value={editedData.prix_par_personne}
                  onChange={(e) =>
                    handleChange("prix_par_personne", e.target.value)
                  }
                  className="inline-block w-32 mx-2"
                />
              ) : (
                editedData.prix_par_personne || "à confirmer"
              )}
            </strong>
          </p>
          <p className="mt-2">
            {editing ? (
              <Input
                value={editedData.titre_chambre_simple}
                onChange={(e) =>
                  handleChange("titre_chambre_simple", e.target.value)
                }
                className="inline-block w-48 mx-2"
              />
            ) : (
              editedData.titre_chambre_simple || "Chambre simple"
            )}
            :{" "}
            {editing ? (
              <Input
                value={editedData.chambre_simple}
                onChange={(e) => handleChange("chambre_simple", e.target.value)}
                className="inline-block w-32 mx-2"
              />
            ) : (
              editedData.chambre_simple || "sur demande"
            )}
          </p>
          <p className="mt-2">
            {editing ? (
              <Input
                value={editedData.titre_remarques}
                onChange={(e) =>
                  handleChange("titre_remarques", e.target.value)
                }
                className="inline-block w-48 mx-2"
              />
            ) : (
              editedData.titre_remarques || "Remarques"
            )}
            :{" "}
            {editing ? (
              <Input
                value={editedData.remarques_tarifs}
                onChange={(e) =>
                  handleChange("remarques_tarifs", e.target.value)
                }
                className="inline-block w-full mt-2"
              />
            ) : (
              editedData.remarques_tarifs || "aucune"
            )}
          </p>
        </div>
      </div>

      <div className="section my-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold border-b border-gray-300 pb-2 mb-3">
            {editing ? (
              <Input
                value={editedData.titre_hebergements}
                onChange={(e) =>
                  handleChange("titre_hebergements", e.target.value)
                }
                className="text-lg font-semibold"
              />
            ) : (
              editedData.titre_hebergements || "VOS HÉBERGEMENTS"
            )}
          </h2>
          {editing && (
            <Button onClick={addNewHotelPersonnalise} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter un hôtel
            </Button>
          )}
        </div>
        <img
          src={editedData.logoUrl}
          alt="Hébergements"
          className="mx-auto h-12 mb-4"
        />

        {/* Texto introductorio editable */}
        {editing ? (
          <Textarea
            value={editedData.intro_hebergements || ""}
            onChange={(e) => handleChange("intro_hebergements", e.target.value)}
            className="w-full mb-4"
            rows={3}
          />
        ) : (
          <p className="mb-4">{editedData.intro_hebergements}</p>
        )}

        <ul className="space-y-4">
          {extractHotels().map((hotel, index) => {
            const hotelImages: Record<string, string> = {
              "El Mesón de Maria":
                "https://res.cloudinary.com/dckcnx0sz/image/upload/v1752806775/Captura_de_pantalla_de_2025-07-17_21-42-28_wu28bg.png",
              "Hotel Atitlan 4*":
                "https://res.cloudinary.com/dckcnx0sz/image/upload/v1752806775/Captura_de_pantalla_de_2025-07-17_21-42-28_wu28bg.png",
              "Jungle Lodge 3*":
                "https://res.cloudinary.com/dckcnx0sz/image/upload/v1752806775/Captura_de_pantalla_de_2025-07-17_21-42-28_wu28bg.png",
              "Hôtel accueillant et moderne - King Room":
                "https://res.cloudinary.com/dckcnx0sz/image/upload/v1752809571/Captura_de_pantalla_de_2025-07-17_21-18-08_m8z7sc.png",
            };

            const defaultImage =
              "https://res.cloudinary.com/dckcnx0sz/image/upload/v1752806775/Captura_de_pantalla_de_2025-07-17_21-42-28_wu28bg.png";
            const image = hotelImages[hotel.nom] || defaultImage;

            return (
              <li key={index} className="border rounded-lg p-4">
                <div className="font-semibold text-lg mb-2">
                  {hotel.nom} - {hotel.description}
                </div>
                <div className="mt-2">
                  <img
                    src={image}
                    alt={hotel.nom}
                    className="hotel-image rounded-md max-h-48 mx-auto"
                  />
                </div>
                {editing && (
                  <div className="mt-4">
                    <Label className="block mb-2">
                      Ajouter une image (URL):
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="https://example.com/image.jpg"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={() => setActiveHotelIndex(index)}>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* Hoteles personalizados (editables) */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable
            droppableId="hebergements_personnalises"
            type="hebergements_personnalises"
          >
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-4 mt-6"
              >
                {editedData.hebergements_personnalises?.map((hotel, index) => (
                  <Draggable
                    key={`personalized-${index}`}
                    draggableId={`personalized-${index}`}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div {...provided.dragHandleProps} className="mb-2">
                              <GripVertical className="h-4 w-4 text-gray-400" />
                            </div>

                            {editing ? (
                              <>
                                <div className="mb-2">
                                  <Label>Nom de l'hôtel:</Label>
                                  <Input
                                    value={hotel.nom}
                                    onChange={(e) =>
                                      handleHotelPersonnaliseChange(
                                        index,
                                        "nom",
                                        e.target.value
                                      )
                                    }
                                    className="w-full"
                                  />
                                </div>
                                <div className="mb-2">
                                  <Label>Description:</Label>
                                  <Input
                                    value={hotel.description}
                                    onChange={(e) =>
                                      handleHotelPersonnaliseChange(
                                        index,
                                        "description",
                                        e.target.value
                                      )
                                    }
                                    className="w-full"
                                  />
                                </div>
                              </>
                            ) : (
                              <div className="font-semibold text-lg mb-2">
                                {hotel.nom} - {hotel.description}
                              </div>
                            )}

                            <div className="mt-4">
                              {hotel.images.map((image, imgIndex) => (
                                <div key={imgIndex} className="relative mb-2">
                                  <img
                                    src={image}
                                    alt={hotel.nom}
                                    className="hotel-image rounded-md max-h-48 mx-auto"
                                  />
                                  {editing && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        removeImageFromHotelPersonnalise(
                                          index,
                                          imgIndex
                                        )
                                      }
                                      className="absolute top-0 right-0"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>

                            {editing && (
                              <div className="mt-4">
                                <Label className="block mb-2">
                                  Ajouter une image (URL):
                                </Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="text"
                                    placeholder="https://example.com/image.jpg"
                                    value={
                                      hotelImages[`personalized-${index}`] || ""
                                    }
                                    onChange={(e) =>
                                      setHotelImages({
                                        ...hotelImages,
                                        [`personalized-${index}`]:
                                          e.target.value,
                                      })
                                    }
                                    className="flex-1"
                                  />
                                  <Button
                                    onClick={() =>
                                      addImageToHotelPersonnalise(
                                        index,
                                        hotelImages[`personalized-${index}`] ||
                                          ""
                                      )
                                    }
                                  >
                                    <ImageIcon className="h-4 w-4 mr-2" />
                                    Ajouter
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

                          {editing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeHotelPersonnalise(index)}
                              className="ml-2"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div
          className="p-3 my-4 rounded"
          style={{
            backgroundColor: editedData.themeColor + "20",
            borderLeft: `4px solid ${editedData.themeColor}`,
          }}
        >
          {editing ? (
            <Textarea
              value={editedData.note_hebergement || ""}
              onChange={(e) => handleChange("note_hebergement", e.target.value)}
              className="w-full"
              rows={2}
            />
          ) : (
            <p>
              <strong>NOTE :</strong>{" "}
              {editedData.note_hebergement ||
                "Les hébergements proposés sont sujets à disponibilité au moment de la réservation."}
            </p>
          )}
        </div>
      </div>

      {/* Footer elegante con BON VOYAGE */}
      <div className="mt-12">
        {editing ? (
          <div className="text-center">
            <Label className="block mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Mensaje de Despedida
            </Label>
            <Input
              value={editedData.bonVoyageText}
              onChange={(e) => handleChange("bonVoyageText", e.target.value)}
              className="w-full max-w-md mx-auto border-2 border-gray-200 focus:border-blue-400 rounded-xl px-6 py-4 text-center text-xl font-bold"
              style={{ color: editedData.themeColor }}
              placeholder="BON VOYAGE !"
            />
          </div>
        ) : (
          <div className="relative">
            {/* Contenedor principal del footer */}
            <div className="relative bg-gradient-to-r from-gray-50 to-blue-50 rounded-3xl p-8 border-2 border-gray-200 shadow-lg">
              {/* Elementos decorativos de fondo */}
              <div className="absolute top-4 left-4 w-8 h-8 bg-blue-200 rounded-full opacity-30"></div>
              <div className="absolute top-8 right-8 w-6 h-6 bg-purple-200 rounded-full opacity-30"></div>
              <div className="absolute bottom-6 left-1/4 w-4 h-4 bg-blue-300 rounded-full opacity-40"></div>
              <div className="absolute bottom-4 right-1/4 w-5 h-5 bg-purple-300 rounded-full opacity-40"></div>
              
              {/* Contenido principal */}
              <div className="relative z-10">
                {/* Línea decorativa superior */}
                <div className="flex justify-center mb-6">
                  <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                </div>
                
                {/* Mensaje principal */}
                <h2
                  className="text-3xl md:text-4xl font-extrabold mb-4 tracking-wide"
                  style={{ color: editedData.themeColor }}
                >
                  {editedData.bonVoyageText}
                </h2>
                
                {/* Subtítulo elegante */}
                <p className="text-lg text-gray-600 font-medium mb-6">
                  Que tengas un viaje inolvidable ✈️
                </p>
                
                {/* Línea decorativa inferior */}
                <div className="flex justify-center">
                  <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>
            
            {/* Elementos decorativos adicionales */}
            <div className="flex justify-center mt-6 space-x-3">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de IA */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-800">
                ✨ Editor IA - {activeAiSection}
              </h3>
              <Button
                onClick={() => setShowAiModal(false)}
                variant="ghost"
                size="sm"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-purple-50 p-3 rounded border">
                <p className="text-sm text-purple-700 mb-2">
                  <strong>Instrucciones para la IA:</strong>
                </p>
                <div className="text-xs text-purple-600 space-y-1">
                  <div>• "Hazlo más descriptivo" → 3 versiones mejoradas</div>
                  <div>• "Traduce a español" → traducción completa</div>
                  <div>• "Resume" → versión concisa</div>
                  <div>• "Eliminar esta sección" → quitar contenido</div>
                  <div>• "Cambiar estilo" → nuevo formato</div>
                </div>
              </div>

              <div>
                <Label className="block mb-2 text-sm font-medium">
                  ¿Qué quieres que la IA haga con esta sección?
                </Label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe los cambios que quieres que la IA haga..."
                  className="w-full"
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => callAI(aiPrompt, activeAiSection || undefined)}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="flex items-center gap-2"
                >
                  {aiLoading ? (
                    <>
                      <span className="animate-spin">↻</span>
                      Procesando...
                    </>
                  ) : (
                    <>✨ Ejecutar IA</>
                  )}
                </Button>
                <Button onClick={() => setShowAiModal(false)} variant="outline">
                  Cancelar
                </Button>
              </div>

              {aiResponse && (
                <div className="bg-gray-50 p-4 rounded border">
                  <h4 className="font-semibold mb-2 text-purple-800">
                    Respuesta de la IA:
                  </h4>
                  <div className="bg-white p-3 rounded text-sm whitespace-pre-wrap border">
                    {aiResponse}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => setAiResponse(null)}
                      variant="outline"
                      size="sm"
                    >
                      Limpiar
                    </Button>
                    <Button onClick={() => setShowAiModal(false)} size="sm">
                      Aplicar y Cerrar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Previa;
