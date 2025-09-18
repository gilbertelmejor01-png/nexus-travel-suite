import React, { useState, useRef } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
import "./proposition.css"; // CSS del template

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
  titre_vos_envies: string;
  titre_itineraire_bref: string;
  titre_programme_detaille: string;
  titre_inclus: string;
  titre_non_inclus: string;
  titre_hebergements: string;
  titre_immersion: string;
  titre_tarif: string;
  titre_chambre_simple: string;
  titre_remarques: string;
  titre_jour: string;
  titre_date: string;
  titre_programme_table: string;
  titre_nuit: string;
  titre_hotel: string;
  hebergements_personnalises: HotelInfo[];
  conditions_generales?: string;
  client_name?: string;
}

interface PreviaProps {
  data: VoyageData | null;
  loading: boolean;
  error: string | null;
}

const Previa3 = ({ data, loading, error }: PreviaProps) => {
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

  // Estados para manejo de imágenes y enlaces en ReactQuill
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const quillRef = useRef<ReactQuill>(null);

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

  // Función para llamar a la API de IA (DeepSeek)
  const callAI = async (prompt: string, section?: string) => {
    if (!editedData || !prompt.trim()) return;

    setAiLoading(true);
    setAiResponse(null);

    // Verificar que la API key esté configurada
    const apiKey =
      import.meta.env.VITE_DEEPSEEK_API_KEY ||
      import.meta.env.VITE_OPENAI_API_KEY;
    const apiUrl =
      import.meta.env.VITE_DEEPSEEK_API_URL ||
      "https://api.deepseek.com/v1/chat/completions";

    if (!apiKey) {
      setAiResponse(
        "❌ Error: API key no configurada. Verifica tu archivo .env"
      );
      setAiLoading(false);
      return;
    }

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

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat", // Modelo de DeepSeek
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
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error de API:", response.status, errorText);
        throw new Error(`Error de API: ${response.status} - ${errorText}`);
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
      console.error("Error detallado llamando a la IA:", error);

      // Manejo de errores específicos
      if (error.message.includes("401")) {
        setAiResponse(
          "❌ Error 401: API key inválida o expirada. Verifica tu clave de DeepSeek."
        );
      } else if (error.message.includes("429")) {
        setAiResponse("❌ Error 429: Límite de tasa excedido o sin créditos.");
      } else if (error.message.includes("Failed to fetch")) {
        setAiResponse(
          "❌ Error de conexión: No se pudo conectar a la API de DeepSeek."
        );
      } else {
        setAiResponse("❌ Error al procesar la solicitud: " + error.message);
      }
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
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
      ],
      handlers: {
        link: () => setShowLinkModal(true),
        image: () => setShowImageModal(true),
      },
    },
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

    // Actualizar el estado para incluir la nueva imagen
    const hotelName = hotels[hotelIndex].nom;
    const updatedHotels = [...(editedData.hebergements_personnalises || [])];

    // Buscar el hotel por nombre y añadir la imagen
    const hotelIndexInPersonalized = updatedHotels.findIndex(
      (hotel) => hotel.nom === hotelName
    );

    if (hotelIndexInPersonalized !== -1) {
      const currentImages =
        updatedHotels[hotelIndexInPersonalized].images || [];
      updatedHotels[hotelIndexInPersonalized] = {
        ...updatedHotels[hotelIndexInPersonalized],
        images: [...currentImages, newImageUrl.trim()],
      };

      setEditedData({
        ...editedData,
        hebergements_personnalises: updatedHotels,
      });
    }

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

  // Función para agregar imagen desde el modal
  const handleAddImage = () => {
    if (imageUrl && quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      if (range) {
        quill.insertEmbed(range.index, "image", imageUrl);
        setShowImageModal(false);
        setImageUrl("");
      }
    }
  };

  // Función para agregar enlace desde el modal
  const handleAddLink = () => {
    if (linkUrl && quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      if (range) {
        quill.formatText(range.index, range.length, "link", linkUrl);
        setShowLinkModal(false);
        setLinkUrl("");
      }
    }
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
          ⚠ No hay datos disponibles
        </div>
        <div className="text-sm text-gray-500 mt-2">
          Verificando conexión con Firebase...
        </div>
      </div>
    );

  return (
    <div className="document">
      {/* Botones de edición/guardar en la parte superior */}
      <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Previsualización / Documento
          </h1>
          <p className="text-muted-foreground">
            Vista previa del documento Flowtrip
          </p>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <Button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" /> Editar
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
            <Download className="h-4 w-4 mr-2" />{" "}
            {generatingPdf ? "Generando PDF..." : "Descargar PDF"}
          </Button>

          <Button>
            <Send className="h-4 w-4 mr-2" /> Enviar al cliente
          </Button>
        </div>
      </div>

      {/* Botón de rediseño global con IA */}
      {editing && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-end"></div>
          </div>
        </div>
      )}

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

      {/* Modal de IA */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              ✨ Editor IA - {activeAiSection}
            </h3>
            <Textarea
              placeholder="Describe qué quieres que la IA haga con esta sección..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="mb-4"
              rows={4}
            />
            <div className="flex gap-2 mb-4">
              <Button
                onClick={() => callAI(aiPrompt, activeAiSection || undefined)}
                disabled={aiLoading || !aiPrompt.trim()}
                className="flex-1"
              >
                {aiLoading ? "🤖 Procesando..." : "✨ Aplicar con IA"}
              </Button>
              <Button onClick={() => setShowAiModal(false)} variant="outline">
                ❌ Cerrar
              </Button>
            </div>
            {aiResponse && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h4 className="font-semibold mb-2">Respuesta de la IA:</h4>
                <div className="whitespace-pre-wrap text-sm">{aiResponse}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HEADER */}
      <section className="cover">
        <div className="cover-top">
          <div className="brand">
            {editing ? (
              <div className="space-y-2">
                <Label className="block">URL del Logo:</Label>
                <Input
                  value={editedData.logoUrl}
                  onChange={(e) => handleChange("logoUrl", e.target.value)}
                  className="w-full"
                  placeholder="https://ejemplo.com/logo.png"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input value="FLOWTRIP" readOnly className="font-semibold" />
                  <Input
                    value="Voyages d'Exception"
                    readOnly
                    className="text-sm"
                  />
                </div>
              </div>
            ) : (
              <>
                <img src={editedData.logoUrl} alt="Logo" />
                <div>
                  <h3>FLOWTRIP</h3>
                  <p>Voyages d'Exception</p>
                </div>
              </>
            )}
          </div>
          <div className="ref">
            {editing ? (
              <div className="space-y-2">
                <Input
                  value="Proposition de Voyage"
                  readOnly
                  className="font-semibold"
                />
                <div className="flex items-center gap-2">
                  <span>Référence:</span>
                  <Input value="FLO-2025-001" readOnly className="w-32" />
                </div>
              </div>
            ) : (
              <>
                <div>Proposition de Voyage</div>
                <div>Référence: FLO-2025-001</div>
              </>
            )}
          </div>
        </div>
        {editing ? (
          <Input
            value={editedData.titreVoyage}
            onChange={(e) => handleChange("titreVoyage", e.target.value)}
            className="text-4xl font-light text-center w-full bg-transparent border-none"
            placeholder="Votre voyage avec Flowmatic"
          />
        ) : (
          <h1>{editedData.titreVoyage}</h1>
        )}
      </section>

      <div className="layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="side-block">
            <div className="side-title">Destination</div>
            {editing ? (
              <Input
                value={editedData.pays_destination}
                onChange={(e) =>
                  handleChange("pays_destination", e.target.value)
                }
                className="w-full"
              />
            ) : (
              <div className="pill">{editedData.pays_destination}</div>
            )}
          </div>
          <div className="side-block">
            <div className="side-title">Tarif indicatif</div>
            {editing ? (
              <div className="space-y-2">
                <Input
                  value={editedData.prix_par_personne}
                  onChange={(e) =>
                    handleChange("prix_par_personne", e.target.value)
                  }
                  className="w-full text-2xl font-bold text-center"
                  placeholder="1399 EUR./pax/séjour"
                />
                <Input
                  value="par personne"
                  readOnly
                  className="w-full text-center text-sm"
                />
              </div>
            ) : (
              <div className="price-card">
                <div className="price-main">{editedData.prix_par_personne}</div>
                <div className="price-sub">par personne</div>
              </div>
            )}
          </div>
        </aside>

        {/* Content */}
        <main className="content">
          {/* Vos Envies */}
          <section className="section">
            <div className="sec-head">
              <div className="sec-title">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedData.titre_vos_envies}
                      onChange={(e) =>
                        handleChange("titre_vos_envies", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      onClick={() => openAiModal("titre_vos_envies")}
                      size="sm"
                      variant="outline"
                    >
                      ✨
                    </Button>
                    <Button
                      onClick={() => handleChange("titre_vos_envies", "")}
                      size="sm"
                      variant="destructive"
                    >
                      🗑️
                    </Button>
                  </div>
                ) : (
                  editedData.titre_vos_envies
                )}
              </div>
            </div>
            {editing ? (
              <div className="flex items-start gap-2">
                <Textarea
                  value={editedData.vos_envies || ""}
                  onChange={(e) => handleChange("vos_envies", e.target.value)}
                  className="flex-1 border border-gray-400 h-24 my-3"
                  placeholder="Ajoutez vos envies ici..."
                />
                <Button
                  onClick={() => openAiModal("Contenu Vos Envies")}
                  variant="ghost"
                  size="sm"
                  className="text-yellow-600 hover:text-yellow-700 mt-3"
                >
                  ✨
                </Button>
              </div>
            ) : (
              <div className="border border-gray-400 h-24 my-3 p-2">
                {editedData.vos_envies || "Vos envies seront ajoutés ici..."}
              </div>
            )}
          </section>

          {/* Itinéraire en bref */}
          <section className="section">
            <div className="sec-head">
              <div className="sec-title">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedData.titre_itineraire_bref}
                      onChange={(e) =>
                        handleChange("titre_itineraire_bref", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      onClick={() => openAiModal("titre_itineraire_bref")}
                      size="sm"
                      variant="outline"
                    >
                      ✨
                    </Button>
                    <Button
                      onClick={() => handleChange("titre_itineraire_bref", "")}
                      size="sm"
                      variant="destructive"
                    >
                      🗑️
                    </Button>
                  </div>
                ) : (
                  editedData.titre_itineraire_bref
                )}
              </div>
              <span className="badge">
                {editedData.table_itineraire_bref.length} jours
              </span>
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="itinerary" type="itinerary">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="timeline"
                  >
                    {editedData.table_itineraire_bref.map((row, index) => (
                      <Draggable
                        key={index}
                        draggableId={index.toString()}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="row"
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="drag-handle"
                            >
                              {editing && (
                                <GripVertical className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <div className="t-jour">
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
                                    placeholder="Jour 1"
                                  />
                                  <span>·</span>
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
                                    placeholder="Vendredi 14 avril 2023"
                                  />
                                </div>
                              ) : (
                                row.jour + " · " + row.date
                              )}
                            </div>
                            <div className="t-program">
                              {editing ? (
                                <Textarea
                                  value={row.programme}
                                  onChange={(e) =>
                                    handleItineraryChange(
                                      index,
                                      "programme",
                                      e.target.value
                                    )
                                  }
                                  className="w-full"
                                  rows={3}
                                  placeholder="Arrivée à Madrid, visite guidée du musée du Prado..."
                                />
                              ) : (
                                <p>{row.programme}</p>
                              )}
                            </div>
                            <div className="t-nuit">
                              {editing ? (
                                <Input
                                  value={row.nuit}
                                  onChange={(e) =>
                                    handleItineraryChange(
                                      index,
                                      "nuit",
                                      e.target.value
                                    )
                                  }
                                  className="w-full"
                                  placeholder="Madrid"
                                />
                              ) : (
                                row.nuit
                              )}
                            </div>
                            {editing && (
                              <div className="flex items-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItineraryEntry(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {editing && (
                      <div className="row">
                        <div className="t-jour">
                          <Button
                            onClick={addNewItineraryEntry}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter un jour
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </section>

          {/* Programme détaillé */}
          <section className="section">
            <div className="sec-head">
              <div className="sec-title">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedData.titre_programme_detaille}
                      onChange={(e) =>
                        handleChange("titre_programme_detaille", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      onClick={() => openAiModal("titre_programme_detaille")}
                      size="sm"
                      variant="outline"
                    >
                      ✨
                    </Button>
                    <Button
                      onClick={() =>
                        handleChange("titre_programme_detaille", "")
                      }
                      size="sm"
                      variant="destructive"
                    >
                      🗑️
                    </Button>
                  </div>
                ) : (
                  editedData.titre_programme_detaille
                )}
              </div>
            </div>
            {editing ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label>Contenido del programa:</Label>
                  <Button
                    onClick={() => openAiModal("programme_detaille")}
                    size="sm"
                    variant="outline"
                  >
                    ✨ IA
                  </Button>
                </div>
                <ReactQuill
                  ref={quillRef}
                  value={editedData.programme_detaille}
                  onChange={(value) =>
                    handleChange("programme_detaille", value)
                  }
                  modules={quillModules}
                  formats={quillFormats}
                  theme="snow"
                />
              </div>
            ) : (
              <div
                className="prog-body"
                dangerouslySetInnerHTML={{
                  __html: editedData.programme_detaille,
                }}
              />
            )}
          </section>

          {/* Détails / Services */}
          <section className="section">
            <div className="sec-head">
              {editing ? (
                <Input
                  value="Détails de votre voyage"
                  readOnly
                  className="sec-title text-2xl font-bold"
                />
              ) : (
                <div className="sec-title">Détails de votre voyage</div>
              )}
            </div>
            <div className="grid-2">
              <div className="card">
                <div className="card-head green">
                  {editing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editedData.titre_inclus}
                        onChange={(e) =>
                          handleChange("titre_inclus", e.target.value)
                        }
                        className="flex-1"
                      />
                      <Button
                        onClick={() => openAiModal("titre_inclus")}
                        size="sm"
                        variant="outline"
                      >
                        ✨
                      </Button>
                      <Button
                        onClick={() => handleChange("titre_inclus", "")}
                        size="sm"
                        variant="destructive"
                      >
                        🗑️
                      </Button>
                    </div>
                  ) : (
                    editedData.titre_inclus
                  )}
                </div>
                <div className="card-body">
                  <ul className="list-clean">
                    {editedData.inclus.map((item, index) => (
                      <li key={index}>
                        {editing ? (
                          <div className="flex items-center gap-2">
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
                              onClick={() => openAiModal(`inclus_${index}`)}
                              size="sm"
                              variant="outline"
                            >
                              ✨
                            </Button>
                            <Button
                              onClick={() => removeListItem("inclus", index)}
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          item
                        )}
                      </li>
                    ))}
                    {editing && (
                      <li>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => addNewListItem("inclus")}
                            size="sm"
                            variant="outline"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => openAiModal("inclus")}
                            size="sm"
                            variant="outline"
                          >
                            ✨ IA
                          </Button>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              <div className="card">
                <div className="card-head red">
                  {editing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editedData.titre_non_inclus}
                        onChange={(e) =>
                          handleChange("titre_non_inclus", e.target.value)
                        }
                        className="flex-1"
                      />
                      <Button
                        onClick={() => openAiModal("titre_non_inclus")}
                        size="sm"
                        variant="outline"
                      >
                        ✨
                      </Button>
                      <Button
                        onClick={() => handleChange("titre_non_inclus", "")}
                        size="sm"
                        variant="destructive"
                      >
                        🗑️
                      </Button>
                    </div>
                  ) : (
                    editedData.titre_non_inclus
                  )}
                </div>
                <div className="card-body">
                  <ul className="list-clean neg">
                    {editedData.non_inclus.map((item, index) => (
                      <li key={index}>
                        {editing ? (
                          <div className="flex items-center gap-2">
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
                              onClick={() => openAiModal(`non_inclus_${index}`)}
                              size="sm"
                              variant="outline"
                            >
                              ✨
                            </Button>
                            <Button
                              onClick={() =>
                                removeListItem("non_inclus", index)
                              }
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          item
                        )}
                      </li>
                    ))}
                    {editing && (
                      <li>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => addNewListItem("non_inclus")}
                            size="sm"
                            variant="outline"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => openAiModal("non_inclus")}
                            size="sm"
                            variant="outline"
                          >
                            ✨ IA
                          </Button>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Hébergements personnalisés */}
          <section className="section">
            <div className="sec-head">
              <div className="sec-title">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedData.titre_hebergements}
                      onChange={(e) =>
                        handleChange("titre_hebergements", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      onClick={() => openAiModal("titre_hebergements")}
                      size="sm"
                      variant="outline"
                    >
                      ✨
                    </Button>
                    <Button
                      onClick={() => handleChange("titre_hebergements", "")}
                      size="sm"
                      variant="destructive"
                    >
                      🗑️
                    </Button>
                    <Button onClick={addNewHotelPersonnalise} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter un hôtel
                    </Button>
                  </div>
                ) : (
                  editedData.titre_hebergements
                )}
              </div>
            </div>

            <div className="hotels-intro">
              {editing ? (
                <Textarea
                  value={editedData.intro_hebergements || ""}
                  onChange={(e) =>
                    handleChange("intro_hebergements", e.target.value)
                  }
                  className="w-full"
                  rows={2}
                />
              ) : (
                <p>{editedData.intro_hebergements}</p>
              )}
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable
                droppableId="hebergements_personnalises"
                type="hebergements_personnalises"
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="hotels-list"
                  >
                    {editedData.hebergements_personnalises?.map(
                      (hotel, index) => (
                        <Draggable
                          key={`personalized-${index}`}
                          draggableId={`personalized-${index}`}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="hotel-item"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="mb-2"
                                  >
                                    {editing && (
                                      <GripVertical className="h-4 w-4 text-gray-400" />
                                    )}
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
                                    <>
                                      <div className="hotel-name">
                                        {hotel.nom}
                                      </div>
                                      <div className="hotel-description">
                                        {hotel.description}
                                      </div>
                                    </>
                                  )}

                                  <div className="mt-4">
                                    {hotel.images.map((image, imgIndex) => (
                                      <div
                                        key={imgIndex}
                                        className="relative mb-2"
                                      >
                                        <img
                                          src={image}
                                          alt={hotel.nom}
                                          className="hotel-image"
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
                                            hotelImages[
                                              `personalized-${index}`
                                            ] || ""
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
                                              hotelImages[
                                                `personalized-${index}`
                                              ] || ""
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
                                    onClick={() =>
                                      removeHotelPersonnalise(index)
                                    }
                                    className="ml-2"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      )
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <div className="note-box">
              {editing ? (
                <Textarea
                  value={editedData.note_hebergement || ""}
                  onChange={(e) =>
                    handleChange("note_hebergement", e.target.value)
                  }
                  className="w-full"
                  rows={2}
                />
              ) : (
                <p>
                  <strong>NOTE :</strong> {editedData.note_hebergement}
                </p>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* CTA */}
      <section className="cta">
        {editing ? (
          <div className="space-y-4 text-center">
            <Input
              value="Bon voyage"
              readOnly
              className="text-3xl font-light text-center bg-transparent border-none"
            />
            <Textarea
              value="Votre aventure espagnole vous attend"
              onChange={(e) => handleChange("bonVoyageText", e.target.value)}
              className="text-lg text-center bg-transparent border-none"
              rows={2}
              placeholder="Votre aventure espagnole vous attend"
            />
          </div>
        ) : (
          <>
            <h2>Bon voyage</h2>
            <p>
              {editedData.bonVoyageText ||
                "Votre aventure espagnole vous attend"}
            </p>
          </>
        )}
      </section>

      {/* Modal para agregar imagen */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">🖼️ Agregar Imagen</h3>
            <Input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button onClick={handleAddImage} disabled={!imageUrl.trim()}>
                Agregar Imagen
              </Button>
              <Button
                onClick={() => setShowImageModal(false)}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar enlace */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">🔗 Agregar Enlace</h3>
            <Input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://ejemplo.com"
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button onClick={handleAddLink} disabled={!linkUrl.trim()}>
                Agregar Enlace
              </Button>
              <Button onClick={() => setShowLinkModal(false)} variant="outline">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Previa3;
