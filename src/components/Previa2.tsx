import React, { useState, useRef } from "react";
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
  FileText,
} from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./proposition.css"

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
  personalisationText?: string;
  detailVoyageTitle?: string;
  prixDetailText?: string;
  hotelsIntroText?: string;
  disponibilityText?: string;
  bonVoyageTitle?: string;
  brandName?: string;
  clientName?: string;
  // Condiciones generales del perfil de empresa
  condicionesGenerales?: string;
  programDescription?: string;
}

interface PreviaProps {
  data: VoyageData | null;
  loading: boolean;
  error: string | null;
}

const Previa2 = ({ data, loading, error }: PreviaProps) => {
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
  // Estados para controlar secciones ocultas y restaurar
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());
  const [deletedSections, setDeletedSections] = useState<Map<string, any>>(new Map());


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

  const quillModules = React.useMemo(() => ({
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
    clipboard: {
      matchVisual: false, // Evita problemas de formato al pegar
    }
  }), []);

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

  // Efecto para manejar el foco del editor de manera segura
  React.useEffect(() => {
    if (editing && quillRef.current) {
      const quill = quillRef.current.getEditor();
      
      let isHandlingFocus = false;
      
      const handleFocus = (eventName: string, ...args: any[]) => {
        // Solo manejar eventos de foco si no estamos ya en medio de otro manejo
        if (isHandlingFocus || eventName !== 'selection-change') return;
        
        isHandlingFocus = true;
        try {
          const selection = quill.getSelection();
          if (!selection) {
            const length = quill.getLength();
            // Solo establecer selección si el editor está activo y visible
            if (length > 0 && document.activeElement === quill.root) {
              quill.setSelection(length, 0);
            }
          }
        } catch (error) {
          console.warn('Error al manejar el foco del editor:', error);
        } finally {
          isHandlingFocus = false;
        }
      };

      quill.on('editor-change', handleFocus);
      
      return () => {
        quill.off('editor-change', handleFocus);
      };
    }
  }, [editing, quillRef.current]);

  // Función para manejar cambios en el editor de manera segura
  const handleProgrammeChange = (value: string) => {
    handleChange("programme_detaille", value);
  };

  // Función para inicializar el editor de manera segura
  const handleEditorInit = () => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      try {
        // Asegurarse de que el editor tenga una selección válida
        const length = quill.getLength();
        if (length > 0) {
          quill.setSelection(length, 0);
        }
      } catch (error) {
        console.warn('Error al inicializar el editor:', error);
      }
    }
  };

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

  // Funciones para manejar eliminación y restauración de secciones
  const hideSection = (sectionId: string) => {
    setHiddenSections(prev => new Set(prev).add(sectionId));
  };

  const restoreSection = (sectionId: string) => {
    setHiddenSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionId);
      return newSet;
    });
  };

  const deleteSection = (sectionId: string, sectionData: any) => {
    setDeletedSections(prev => new Map(prev).set(sectionId, sectionData));
    setHiddenSections(prev => new Set(prev).add(sectionId));
  };

  const restoreDeletedSection = (sectionId: string) => {
    const sectionData = deletedSections.get(sectionId);
    if (sectionData) {
      setEditedData(prev => ({ ...prev, ...sectionData }));
      setDeletedSections(prev => {
        const newMap = new Map(prev);
        newMap.delete(sectionId);
        return newMap;
      });
      setHiddenSections(prev => {
        const newSet = new Set(prev);
        newSet.delete(sectionId);
        return newSet;
      });
    }
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
    if (!editedData) {
      setSaveError("❌ No hay datos para guardar");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Verificar que tenemos el ID de conversación
      if (!conversacionId) {
        throw new Error("No se pudo obtener el ID de conversación del usuario");
      }

      // Validar datos críticos antes de guardar
      if (!editedData.table_itineraire_bref || editedData.table_itineraire_bref.length === 0) {
        throw new Error("El itinerario no puede estar vacío");
      }

      const docRef = doc(db, "conversacion", conversacionId);
      await updateDoc(docRef, {
        output: editedData,
        lastUpdated: new Date(), // Agregar timestamp para tracking
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setEditing(false);
    } catch (error) {
      console.error("Error saving data:", error);
      setSaveError(`Error al guardar: ${error.message}`);
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

  // Función para descargar la plantilla HTML directamente desde el frontend
  const descargarPlantillaHTML = () => {
    if (!editedData) return;

    // Crear el contenido HTML basado en la plantilla existente de Previa2
    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${editedData.titreVoyage || "Proposition de Voyage"} — Flowtrip</title>
<style>
/* Estilos EXACTOS de Previa2.tsx basados en proposition.css */
:root {
  --header-grad-a: #d4a574; /* doré doux */
  --header-grad-b: #8b7355; /* bronze */
  --hairline: #e0e0e0;
  --muted: #666;
}

.doc {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background: white;
  color: #333;
  line-height: 1.7;
  font-size: 10.5pt;
  max-width: 300mm;
  margin: 0 auto;
}

/* Header raffiné y más compacto */
.hero-header {
  background: linear-gradient(135deg, var(--header-grad-a) 0%, var(--header-grad-b) 100%);
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: white;
  position: relative;
  padding: 16px 20px 20px;
}

.hero-top {
  position: absolute;
  top: 10px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.brand-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
}

.brand-inline img {
  height: 28px;
  display: block;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
}

.brand-name {
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  font-size: 16px;
}

.client-name {
  color: #fff;
  font-weight: 500;
  letter-spacing: 0.3px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  font-size: 14px;
}

.hero-content h1 {
  font-size: 2.1rem;
  font-weight: 300;
  margin-bottom: 0.2rem;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.22);
  color: white;
}

.hero-content p {
  font-size: 1.02rem;
  font-weight: 300;
  opacity: 0.96;
  color: white;
}

.main-content {
  max-width: 2000px;
  margin: 0 auto;
  padding: 1.2rem 0.8rem;
}

.section {
  margin-bottom: 3.2rem;
}

.section-title {
  font-size: 1.35rem;
  color: #2c3e50;
  font-weight: 500;
  margin-bottom: 1.6rem;
  text-align: center;
  position: relative;
  padding-bottom: 0.9rem;
}

.section-title::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 2px;
  background: var(--header-grad-a);
}

/* Tableau itinéraire */
.itineraire-table {
  border: 1px solid var(--hairline);
  border-radius: 6px;
  overflow: hidden;
  margin: 1.6rem 0;
  background: white;
}

.itineraire-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10.5pt;
}

.itineraire-table th {
  background: #f8f9fa;
  color: #2c3e50;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 10pt;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--hairline);
}

.itineraire-table td {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: top;
}

.itineraire-table tr:last-child td {
  border-bottom: none;
}

.day-cell {
  font-weight: 600;
  color: var(--header-grad-a);
  white-space: nowrap;
}

/* Programme détaillé */
.programme-section {
  margin: 2.4rem 0;
}

.programme-text {
  max-width: 760px;
  margin: 0 auto;
  font-size: 11pt;
  line-height: 1.8;
  color: #555;
  text-align: justify;
}

.programme-text p {
  margin-bottom: 16px;
}

/* Services (Inclus / Non inclus) */
.services-table {
  border: 1px solid var(--hairline);
  border-radius: 6px;
  overflow: hidden;
  margin: 2rem 0;
}

.services-table table {
  width: 100%;
  border-collapse: collapse;
}

.services-table th {
  background: linear-gradient(135deg, var(--header-grad-a) 0%, var(--header-grad-b) 100%);
  color: #fff;
  padding: 1.1rem;
  text-align: center;
  font-weight: 600;
  font-size: 11pt;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  width: 50%;
}

.services-table td {
  padding: 1.4rem;
  vertical-align: top;
  width: 50%;
}

.inclus-list, .non-inclus-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.inclus-list li, .non-inclus-list li {
  padding: 0.45rem 0 0.45rem 1.2rem;
  font-size: 10.5pt;
  line-height: 1.6;
  position: relative;
  border-bottom: 1px solid #f1f5f9;
}

.inclus-list li:last-child, .non-inclus-list li:last-child {
  border-bottom: none;
}

.inclus-list li::before {
  content: "✓";
  position: absolute;
  left: 0;
  top: 0.1rem;
  color: #333;
  font-weight: 800;
}

.non-inclus-list li::before {
  content: "✗";
  position: absolute;
  left: 0;
  top: 0.1rem;
  color: #333;
  font-weight: 800;
}

/* Prix */
.prix-section {
  text-align: center;
  padding: 2.2rem 2rem;
  background: #f8f9fa;
  margin: 2.4rem 0;
  border-radius: 6px;
}

.prix-montant {
  font-size: 2.3rem;
  color: #2c3e50;
  font-weight: 300;
  margin-bottom: 0.4rem;
}

.prix-detail {
  color: #666;
  font-size: 1.05rem;
}

.chambre-simple {
  margin-top: 0.8rem;
  color: #666;
  font-size: 1rem;
}

/* Hôtels */
.hotels-section {
  margin: 2.6rem 0;
}

.hotels-intro {
  text-align: center;
  margin-bottom: 1.6rem;
  color: #555;
  font-size: 11pt;
}

.hotels-list {
  display: grid;
  gap: 1.2rem;
  max-width: 760px;
  margin: 0 auto;
}

.hotel-item {
  padding: 1.4rem;
  border: 1px solid var(--hairline);
  border-radius: 6px;
  background: white;
}

.hotel-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.35rem;
  font-size: 11pt;
}

.hotel-description {
  color: #666;
  font-size: 10pt;
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.hotel-stars {
  color: #d4a574;
  font-size: 10pt;
}

.hotel-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  margin-top: 1rem;
}

.note-simple {
  background: #f8f9fa;
  padding: 1.2rem;
  border-left: 3px solid var(--header-grad-a);
  margin: 1.6rem 0;
  font-size: 10pt;
  color: #555;
}

/* Footer */
.footer-section {
  background: var(--header-grad-a);
  color: white;
  padding: 2.4rem 2rem;
  margin-top: 3rem;
  text-align: center;
}

.footer-section h2 {
  font-size: 1.7rem;
  font-weight: 300;
  margin-bottom: 0.4rem;
  text-transform: capitalize;
}

.footer-section p {
  font-size: 1.05rem;
  font-weight: 300;
  opacity: 0.95;
}

/* Responsive */
@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 1.8rem;
  }
  
  .hero-content p {
    font-size: 1rem;
  }
  
  .main-content {
    padding: 1rem 0.5rem;
  }
  
  .section-title {
    font-size: 1.2rem;
  }
  
  .itineraire-table table {
    font-size: 9pt;
  }
  
  .itineraire-table th,
  .itineraire-table td {
    padding: 0.8rem;
  }
  
  .prix-montant {
    font-size: 2rem;
  }
  
  .services-table td {
    padding: 1rem;
  }
  
  .footer-section h2 {
    font-size: 1.4rem;
  }
  
  .footer-section {
    padding: 1.8rem 1rem;
  }
}
</style>
</head>
<body>
<div class="doc">
  <!-- Header - Réplica exacta del diseño de Previa2 -->
  <div class="hero-header">
    <div class="hero-top">
      <div class="brand-inline">
        <img src="${editedData.logoUrl}" alt="Logo Flowtrip">
        <span class="brand-name">${editedData.brandName || "FLOWTRIP"}</span>
      </div>
      <div class="client-name">${editedData.clientName || "Mme Doulcet"}</div>
    </div>
    <div class="hero-content">
      <h1>${editedData.titreVoyage}</h1>
      <p>${editedData.programDescription || `Programme sur mesure — ${editedData.table_itineraire_bref.length} jours`}</p>
    </div>
  </div>

  <!-- Contenido Principal - Estructura idéntica a Previa2 -->
  <div class="main-content">
    <!-- Vos Envies -->
    <section class="section">
      <h2 class="section-title">${editedData.titre_vos_envies || "VOS ENVIES"}</h2>
      <div style="border: 1px solid #d1d5db; min-height: 96px; padding: 16px; border-radius: 8px; background: #fafafa;">
        ${editedData.vos_envies || "Vos envies seront ajoutés ici..."}
      </div>
    </section>

    <!-- Itinéraire -->
    <section class="section">
      <h2 class="section-title">${editedData.titre_itineraire_bref || "VOTRE ITINÉRAIRE"}</h2>
      <div class="itineraire-table">
        <table>
          <thead>
            <tr>
              <th>${editedData.titre_jour || "JOUR"}</th>
              <th>${editedData.titre_date || "DATE"}</th>
              <th>${editedData.titre_programme_table || "PROGRAMME"}</th>
              <th>${editedData.titre_nuit || "NUIT"}</th>
              <th>${editedData.titre_hotel || "HÔTEL"}</th>
            </tr>
          </thead>
          <tbody>
            ${(editedData.table_itineraire_bref || [])
              .map(
                (row, index) => `
            <tr>
              <td>${row.jour}</td>
              <td>${row.date}</td>
              <td>${row.programme}</td>
              <td>${row.nuit}</td>
              <td>${row.hôtel}</td>
            </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <div class="note-simple">
        <strong>Personnalisation :</strong> ${editedData.personalisationText || "Ce programme peut être ajusté en fonction de vos souhaits."}
      </div>
    </section>

    <!-- Programme détaillé -->
    <section class="section programme-section">
      <h2 class="section-title">${editedData.titre_programme_detaille || "PROGRAMME DÉTAILLÉ"}</h2>
      <div class="programme-text">
        ${editedData.programme_detaille || "<p>Description du programme à venir</p>"}
      </div>
    </section>

    <!-- Services -->
    <section class="section">
      <h2 class="section-title">${editedData.detailVoyageTitle || "Détail de Votre Voyage"}</h2>
      <div class="services-table">
        <table>
          <thead>
            <tr>
              <th>${editedData.titre_inclus || "INCLUS"}</th>
              <th>${editedData.titre_non_inclus || "NON INCLUS"}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <ul class="inclus-list">
                  ${(editedData.inclus || [])
                    .map((item) => `<li>${item}</li>`)
                    .join("") || "<li>Aucun service inclus</li>"}
                </ul>
              </td>
              <td>
                <ul class="non-inclus-list">
                  ${(editedData.non_inclus || [])
                    .map((item) => `<li>${item}</li>`)
                    .join("") || "<li>Aucun service non inclus</li>"}
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Prix -->
    <section class="prix-section">
      <div class="prix-montant">${editedData.prix_par_personne || "À confirmer"}</div>
      <div class="prix-detail">${editedData.prixDetailText || "par personne (base 30)"}</div>
      ${editedData.chambre_simple ? `
      <div class="chambre-simple">
        <strong>${editedData.titre_chambre_simple || "Chambre simple"}:</strong> ${editedData.chambre_simple}
      </div>
      ` : ""}
    </section>

    <!-- Hébergements -->
    <section class="section hotels-section">
      <h2 class="section-title">${editedData.titre_hebergements || "VOS HÉBERGEMENTS"}</h2>
      <div class="hotels-intro">
        <p>${editedData.hotelsIntroText || "Hébergements sélectionnés pour leur charme, confort et situation privilégiée."}</p>
      </div>
      <div class="hotels-list">
        ${(editedData.hebergements_personnalises || [])
          .map(
            (hotel, index) => `
        <div class="hotel-item">
          <div class="hotel-name">${hotel.nom}</div>
          <div class="hotel-description">${hotel.description}</div>
          ${hotel.images && hotel.images[0] ? `<img src="${hotel.images[0]}" alt="${hotel.nom}" class="hotel-image">` : ""}
        </div>
        `
          )
          .join("")}
      </div>
      <div class="note-simple">
        ${editedData.disponibilityText || "Les hébergements sont sujets à disponibilité. Un établissement de catégorie équivalente sera proposé si nécessaire."}
      </div>
    </section>
  </div>

  <!-- Footer -->
  <div class="footer-section">
    <h2>${editedData.bonVoyageTitle || "Bon Voyage !"}</h2>
    <p>${editedData.bonVoyageText || "Votre aventure vous attend"}</p>
  </div>
</div>
</body>
</html>`;

    // Crear blob y descargar
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voyage-plan-prev2.html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
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

  if (!conversacionId && currentUser) {
    return (
      <div className="text-center py-8 bg-orange-50 border border-orange-200 rounded">
        <div className="text-orange-600 font-semibold">
          ⚠ Configuración incompleta
        </div>
        <div className="text-sm text-gray-500 mt-2">
          No se pudo obtener la configuración de conversación del usuario.
        </div>
      </div>
    );
  }

  return (
    <div className="doc">
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

          <Button variant="secondary" onClick={descargarPlantillaHTML}>
            <FileText className="h-4 w-4 mr-2" />
            Descargar HTML
          </Button>

          {/*<Button>
            <Send className="h-4 w-4 mr-2" /> Enviar al cliente
          </Button>*/}
        </div>
      </div>

      {/* Botón de rediseño global con IA */}
      {editing && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Usa IA para rediseñar toda la plantilla
              </p>
            </div>
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

      {/* Panel de secciones eliminadas */}
      {editing && deletedSections.size > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="text-lg font-semibold mb-2">Sections supprimées</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(deletedSections.keys()).map(sectionId => (
              <Button
                key={sectionId}
                onClick={() => restoreDeletedSection(sectionId)}
                variant="outline"
                size="sm"
                className="bg-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Restaurer {sectionId}
              </Button>
            ))}
          </div>
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
      <div className="hero-header">
        <div className="hero-top">
          <div className="brand-inline">
            {editing ? (
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label className="block text-xs">URL del Logo:</Label>
                  <Input
                    value={editedData.logoUrl}
                    onChange={(e) => handleChange("logoUrl", e.target.value)}
                    className="w-48 text-sm"
                    placeholder="https://ejemplo.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="block text-xs">Nombre Marca:</Label>
                  <Input
                    value={editedData.brandName || "FLOWTRIP"}
                    onChange={(e) => handleChange("brandName", e.target.value)}
                    className="font-semibold w-32"
                    placeholder="FLOWTRIP"
                  />
                </div>
              </div>
            ) : (
              <>
                <img src={editedData.logoUrl} alt="Logo Flowtrip" />
                <span className="brand-name">FLOWTRIP</span>
              </>
            )}
          </div>
          <div className="client-name">
            {editing ? (
              <Input
                value={editedData.clientName || "Mme Doulcet"}
                onChange={(e) => handleChange("clientName", e.target.value)}
                className="w-32 text-sm"
                placeholder="Mme Doulcet"
              />
            ) : (
              editedData.clientName || "Mme Doulcet"
            )}
          </div>
        </div>
        <div className="hero-content">
          {editing ? (
            <div className="space-y-2">
              <Input
                value={editedData.titreVoyage}
                onChange={(e) => handleChange("titreVoyage", e.target.value)}
                className="text-3xl font-bold text-center w-full bg-transparent border-none"
                placeholder="Votre voyage avec Flowmatic"
              />
              <div className="flex items-center justify-center gap-2">
                <Input
                  value={
                    editedData.programDescription ||
                    `Programme sur mesure — ${editedData.table_itineraire_bref.length} jours`
                  }
                  onChange={(e) =>
                    handleChange("programDescription", e.target.value)
                  }
                  className="text-lg text-center bg-transparent border-none w-auto"
                  placeholder={`Programme sur mesure — ${editedData.table_itineraire_bref.length} jours`}
                />
                <Button
                  onClick={() => openAiModal("programDescription")}
                  size="sm"
                  variant="outline"
                >
                  ✨
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h1>{editedData.titreVoyage}</h1>
              <p>
                Programme sur mesure — {editedData.table_itineraire_bref.length}{" "}
                jours
              </p>
            </>
          )}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="main-content">
        {/* Vos Envies */}
        {!hiddenSections.has('vos_envies_section') && (
          <section className="section">
            {editing && (
              <div className="flex justify-end mb-2">
                <Button
                  onClick={() => deleteSection('vos_envies_section', {
                    titre_vos_envies: editedData.titre_vos_envies,
                    vos_envies: editedData.vos_envies
                  })}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer cette section
                </Button>
              </div>
            )}
            <h2 className="section-title">
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
            </h2>
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
        )}

        {/* Itinéraire */}
        {!hiddenSections.has('itineraire_section') && (
          <section className="section">
            {editing && (
              <div className="flex justify-end mb-2">
                <Button
                  onClick={() => deleteSection('itineraire_section', {
                    titre_itineraire_bref: editedData.titre_itineraire_bref,
                    table_itineraire_bref: editedData.table_itineraire_bref,
                    titre_jour: editedData.titre_jour,
                    titre_date: editedData.titre_date,
                    titre_programme_table: editedData.titre_programme_table,
                    titre_nuit: editedData.titre_nuit,
                    titre_hotel: editedData.titre_hotel
                  })}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer cette section
                </Button>
              </div>
            )}
          <h2 className="section-title">
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
                <Button onClick={addNewItineraryEntry} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter un jour
                </Button>
              </div>
            ) : (
              editedData.titre_itineraire_bref
            )}
          </h2>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="itinerary" type="itinerary">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="itineraire-table"
                >
                  <table>
                    <thead>
                      <tr>
                        <th></th>
                        <th>
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
                        <th>
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
                        <th>
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
                        <th>
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
                        <th>
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
                        {editing && <th>Actions</th>}
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
                                className="text-center"
                              >
                                {editing && (
                                  <GripVertical className="h-4 w-4 text-gray-400" />
                                )}
                              </td>
                              <td>
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
                                      className="w-16"
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
                              <td>
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
                                      className="w-[100px]"
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
                              <td>
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
                                      className="w-28"
                                      rows={2}
                                    />
                                    <Button
                                      onClick={() =>
                                        openAiModal(
                                          `Día ${index + 1} - Programme`
                                        )
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
                              <td>
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
                                      className="w-[80px]"
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
                              <td>
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
                                      className="w-[70px]"
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
                                <td>
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
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <div className="note-simple">
            {editing ? (
              <div className="flex items-center gap-2">
                <strong>Personnalisation :</strong>
                <Input
                  value="Ce programme peut être ajusté en fonction de vos souhaits."
                  onChange={(e) =>
                    handleChange("personalisationText", e.target.value)
                  }
                  className="flex-1"
                  placeholder="Ce programme peut être ajusté en fonction de vos souhaits."
                />
                <Button
                  onClick={() => openAiModal("Personnalisation")}
                  size="sm"
                  variant="outline"
                >
                  ✨
                </Button>
              </div>
            ) : (
              <>
                <strong>Personnalisation :</strong>{" "}
                {editedData.personalisationText ||
                  "Ce programme peut être ajusté en fonction de vos souhaits."}
              </>
            )}
          </div>
        </section>
        )}

        {/* Programme détaillé */}
        {!hiddenSections.has('programme_detaille_section') && (
          <section className="section programme-section">
            {editing && (
              <div className="flex justify-end mb-2">
                <Button
                  onClick={() => deleteSection('programme_detaille_section', {
                    titre_programme_detaille: editedData.titre_programme_detaille,
                    programme_detaille: editedData.programme_detaille
                  })}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer cette section
                </Button>
              </div>
            )}
          <h2 className="section-title">
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
                  onClick={() => handleChange("titre_programme_detaille", "")}
                  size="sm"
                  variant="destructive"
                >
                  🗑️
                </Button>
              </div>
            ) : (
              editedData.titre_programme_detaille
            )}
          </h2>
            {editing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={editedData.programDescription || "Contenido del programa:"}
                    onChange={(e) => handleChange("programDescription", e.target.value)}
                    className="w-64"
                    placeholder="Contenido del programa:"
                  />
                  <Button
                    onClick={() => openAiModal("programDescription")}
                    size="sm"
                    variant="outline"
                  >
                    ✨
                  </Button>
                </div>
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
                onChange={handleProgrammeChange}
                modules={quillModules}
                formats={quillFormats}
                theme="snow"
                preserveWhitespace={true}
                bounds={'.programme-section'}
                onFocus={handleEditorInit}
                placeholder="Écrivez votre programme détaillé ici..."
              />
            </div>
          ) : (
            <div
              className="programme-text"
              dangerouslySetInnerHTML={{
                __html: editedData.programme_detaille,
              }}
            />
          )}
        </section>
        )}

        {/* Services */}
        <section className="section">
          <h2 className="section-title">
            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedData.detailVoyageTitle || "Détail de Votre Voyage"}
                  onChange={(e) =>
                    handleChange("detailVoyageTitle", e.target.value)
                  }
                  className="text-2xl font-bold"
                  placeholder="Détail de Votre Voyage"
                />
                <Button
                  onClick={() => openAiModal("detailVoyageTitle")}
                  size="sm"
                  variant="outline"
                >
                  ✨
                </Button>
              </div>
            ) : (
              editedData.detailVoyageTitle || "Détail de Votre Voyage"
            )}
          </h2>
          <div className="services-table">
            <table>
              <thead>
                <tr>
                  <th>
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
                  </th>
                  <th>
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
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <ul className="inclus-list">
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
                  </td>
                  <td>
                    <ul className="non-inclus-list">
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
                                onClick={() =>
                                  openAiModal(`non_inclus_${index}`)
                                }
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
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Prix */}
        <section className="prix-section">
          <div className="prix-montant">
            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedData.prix_par_personne}
                  onChange={(e) =>
                    handleChange("prix_par_personne", e.target.value)
                  }
                  className="flex-1"
                />
                <Button
                  onClick={() => openAiModal("prix_par_personne")}
                  size="sm"
                  variant="outline"
                >
                  ✨
                </Button>
              </div>
            ) : (
              editedData.prix_par_personne
            )}
          </div>
          <div className="prix-detail">
            {editing ? (
              <div className="flex items-center gap-2 justify-center">
                <Input
                  value={editedData.prixDetailText || "par personne (base 30)"}
                  onChange={(e) => handleChange("prixDetailText", e.target.value)}
                  className="text-center bg-transparent border-none"
                  placeholder="par personne (base 30)"
                />
                <Button
                  onClick={() => openAiModal("prixDetailText")}
                  variant="ghost"
                  size="sm"
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  ✨
                </Button>
              </div>
            ) : (
              editedData.prixDetailText || "par personne (base 30)"
            )}
          </div>
        </section>

        {/* Hébergements */}
        <section className="section hotels-section">
          <h2 className="section-title">
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
              </div>
            ) : (
              editedData.titre_hebergements
            )}
          </h2>
          <div className="hotels-intro">
            {editing ? (
              <div className="flex items-center gap-2">
                <Textarea
                  value={editedData.hotelsIntroText || "Hébergements sélectionnés pour leur charme, confort et situation privilégiée."}
                  onChange={(e) =>
                    handleChange("hotelsIntroText", e.target.value)
                  }
                  className="w-full text-center"
                  rows={2}
                  placeholder="Hébergements sélectionnés pour leur charme, confort et situation privilégiée."
                />
                <Button
                  onClick={() => openAiModal("hotelsIntroText")}
                  variant="ghost"
                  size="sm"
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  ✨
                </Button>
              </div>
            ) : (
              <p>
                {editedData.hotelsIntroText ||
                  "Hébergements sélectionnés pour leur charme, confort et situation privilégiée."}
              </p>
            )}
          </div>
          <div className="hotels-list">
            {/* Hoteles extraídos del itinerario */}
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
                <div key={index} className="hotel-item">
                  <img src={image} alt={hotel.nom} className="hotel-image" />
                  <div className="hotel-info">
                    <div className="hotel-name">{hotel.nom}</div>
                    <div className="hotel-description">{hotel.description}</div>
                    <div className="hotel-stars">★★★★☆</div>
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
                  </div>
                </div>
              );
            })}

            {/* Hoteles personalizados (editables) */}
            {(editedData.hebergements_personnalises || []).map(
              (hotel, index) => (
                <div key={`personalized-${index}`} className="hotel-item">
                  {hotel.images[0] ? (
                    <img
                      src={hotel.images[0]}
                      alt={hotel.nom}
                      className="hotel-image"
                    />
                  ) : (
                    <div className="hotel-image bg-gray-200 flex items-center justify-center">
                      <span>🖼️</span>
                    </div>
                  )}
                  <div className="hotel-info">
                    <div className="hotel-name">{hotel.nom}</div>
                    <div className="hotel-description">{hotel.description}</div>
                    <div className="hotel-stars">★★★★☆</div>
                  </div>
                </div>
              )
            )}
          </div>
          <div className="note-simple">
            {editing ? (
              <div className="flex items-center gap-2">
                <Textarea
                  value={editedData.disponibilityText || "Les hébergements sont sujets à disponibilité. Un établissement de catégorie équivalente sera proposé si nécessaire."}
                  onChange={(e) =>
                    handleChange("disponibilityText", e.target.value)
                  }
                  className="w-full"
                  rows={2}
                  placeholder="Les hébergements sont sujets à disponibilité. Un établissement de catégorie équivalente sera proposé si nécessaire."
                />
                <Button
                  onClick={() => openAiModal("disponibilityText")}
                  variant="ghost"
                  size="sm"
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  ✨
                </Button>
              </div>
            ) : (
              editedData.disponibilityText ||
              "Les hébergements sont sujets à disponibilité. Un établissement de catégorie équivalente sera proposé si nécessaire."
            )}
          </div>
        </section>
      </div>

      <section className="Codiciones_generales" >
          {editedData.condicionesGenerales && (
            <div className="conditions">
              <h3>Conditions Générales</h3>
              <div className="conditions-content">
                {editedData.condicionesGenerales}
              </div>
            </div>
          )}
        </section>

      {/* Footer */}
      <div className="footer-section">
        {editing ? (
          <div className="space-y-4 text-center">
            <div className="flex items-center gap-2 justify-center">
              <Input
                value={editedData.bonVoyageTitle || "Bon Voyage !"}
                onChange={(e) => handleChange("bonVoyageTitle", e.target.value)}
                className="text-3xl font-bold text-center"
                placeholder="Bon Voyage !"
              />
              <Button
                onClick={() => openAiModal("bonVoyageTitle")}
                variant="ghost"
                size="sm"
                className="text-yellow-600 hover:text-yellow-700"
              >
                ✨
              </Button>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <Textarea
                value={editedData.bonVoyageText || "Votre aventure vous attend"}
                onChange={(e) => handleChange("bonVoyageText", e.target.value)}
                className="text-lg text-center bg-transparent border-none"
                rows={2}
                placeholder="Votre aventure vous attend"
              />
              <Button
                onClick={() => openAiModal("bonVoyageText")}
                variant="ghost"
                size="sm"
                className="text-yellow-600 hover:text-yellow-700"
              >
                ✨
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h2>{editedData.bonVoyageTitle || "Bon Voyage !"}</h2>
            <p>{editedData.bonVoyageText || "Votre aventure vous attend"}</p>
          </>
        )}
      </div>

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

export default Previa2;

/* SUMMARY
- Reemplacé JSX por estructura HTML con clases y semántica fiel al diseño.
- class → className, for → htmlFor.
- Integrado dinámicamente: titreVoyage, pays_destination, prix_par_personne, table_itineraire_bref, inclus, non_inclus, programme_detaille, hebergements_personnalises.
- TODO: revisar si en “Programme détaillé” se requiere añadir loop como en HTML o mantener Quill content.
*/
