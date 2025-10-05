import React, { useState, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
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

// Styles from Plantilla.html adapted for React
const plantillaStyles = `
.previa-container {
  --brand-color: #667eea;
  --brand-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --dark: #0f172a;
  --light: #f8fafc;
  --gray: #64748b;
  --paper: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #fff;
  color: var(--dark);
  line-height: 1.6;
  font-size: 15px;
}

.hero-section {
  min-height: 400px;
  background: var(--brand-gradient);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.05"><path d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/></g></g></svg>') repeat;
}

.hero-content {
  text-align: center;
  color: white;
  z-index: 1;
  padding: 40px 20px;
  max-width: 800px;
}

.hero-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 40px;
}

.hero-logo img {
  height: 50px;
  filter: brightness(0) invert(1);
}

.hero-logo h2 {
  font-size: 1.8rem;
  font-weight: 300;
  letter-spacing: 3px;
  text-transform: uppercase;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 200;
  margin-bottom: 15px;
  letter-spacing: -1px;
  color: white;
}

.hero-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  font-weight: 300;
  color: white;
}

.hero-meta {
  position: absolute;
  top: 20px;
  right: 20px;
  text-align: right;
  color: white;
  font-size: 0.85rem;
  opacity: 0.8;
}

.main-content {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.content-section {
  margin-bottom: 50px;
}

.section-header {
  margin-bottom: 30px;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 300;
  color: var(--dark);
  margin-bottom: 10px;
}

.section-subtitle {
  color: var(--gray);
  font-size: 0.95rem;
}

.timeline {
  position: relative;
  padding-left: 40px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--brand-gradient);
}

.timeline-item {
  position: relative;
  padding-bottom: 40px;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -35px;
  top: 5px;
  width: 12px;
  height: 12px;
  background: white;
  border: 3px solid var(--brand-color);
  border-radius: 50%;
}

.timeline-date {
  font-weight: 600;
  color: var(--brand-color);
  margin-bottom: 8px;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.timeline-content {
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  border-left: 4px solid var(--brand-color);
}

.timeline-location {
  display: inline-block;
  margin-top: 10px;
  padding: 5px 12px;
  background: var(--light);
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--gray);
}

.programme-grid {
  display: grid;
  gap: 25px;
}

.programme-card {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 30px;
  padding: 25px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.programme-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 15px;
}

.programme-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.programme-day {
  display: inline-block;
  padding: 6px 14px;
  background: var(--brand-gradient);
  color: white;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 12px;
  width: fit-content;
}

.programme-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--dark);
  margin-bottom: 12px;
}

.programme-desc {
  color: var(--gray);
  line-height: 1.7;
}

/* Estilos para imágenes en programme détaillé */
.programme-detaille img,
.programme-content img {
  display: block !important;
  margin: 1rem auto !important;
  max-width: 100% !important;
  height: auto !important;
}

/* Estilos para el contenido del programa */
.programme-content p {
  margin-bottom: 1rem;
  line-height: 1.6;
  color: #374151;
}

.programme-content strong {
  color: #1f2937;
  font-weight: 600;
}

.programme-content em {
  color: #6b7280;
  font-style: italic;
}

.programme-content ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.programme-content li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

/* Estilos para el editor en modo vista previa */
.programme-content-editor {
  min-height: 256px;
  outline: none;
}

.programme-content-editor:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

.services-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.service-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.service-header {
  padding: 20px;
  font-weight: 600;
  font-size: 1.1rem;
  color: white;
  background: var(--brand-gradient);
}

.service-list {
  padding: 25px;
  list-style: none;
}

.service-list li {
  padding: 12px 0;
  padding-left: 30px;
  position: relative;
  color: var(--dark);
  border-bottom: 1px solid var(--light);
}

.service-list li:last-child {
  border-bottom: none;
}

.service-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--brand-color);
  font-weight: bold;
  font-size: 1.1rem;
}

.service-list.excluded li::before {
  content: '✗';
  color: var(--brand-color);
}

.hotels-grid {
  display: grid;
  gap: 25px;
}

.hotel-card {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 25px;
  padding: 25px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.hotel-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 15px;
}

.hotel-info h4 {
  font-size: 1.2rem;
  color: var(--dark);
  margin-bottom: 10px;
}

.hotel-info p {
  color: var(--gray);
  line-height: 1.6;
}

.hotel-stars {
  display: flex;
  gap: 3px;
  margin-top: 10px;
  color: #f59e0b;
}

.note-box {
  margin-top: 20px;
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.note-box p {
  color: var(--gray);
  font-size: 0.9rem;
}

.price-info-section {
  background: white;
  border-radius: 25px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  margin-top: 40px;
}

.price-info-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 30px;
  align-items: center;
}

.price-main {
  text-align: center;
  border-right: 2px solid var(--light);
  padding-right: 30px;
}

.price-label {
  font-size: 0.9rem;
  color: var(--gray);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 15px;
}

.price-amount {
  font-size: 3rem;
  font-weight: 200;
  color: var(--dark);
  margin-bottom: 10px;
}

.price-per {
  color: var(--gray);
  font-size: 0.95rem;
}

.info-item {
  text-align: center;
}

.info-item h4 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--gray);
  margin-bottom: 8px;
}

.info-item p {
  color: var(--dark);
  font-weight: 500;
  font-size: 1rem;
}

.cta-section {
  background: var(--brand-gradient);
  color: white;
  padding: 60px 40px;
  text-align: center;
  margin-top: 60px;
}

.cta-section h2 {
  font-size: 2.5rem;
  font-weight: 200;
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.cta-section p {
  font-size: 1.1rem;
  opacity: 0.9;
}

.conditions {
  background: var(--light);
  padding: 40px;
  border-top: 3px solid var(--brand-color);
}

.conditions h3 {
  text-align: center;
  font-size: 1.5rem;
  color: var(--dark);
  margin-bottom: 25px;
  font-weight: 300;
}

.conditions-content {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  padding: 30px;
  border-radius: 15px;
  color: var(--gray);
  line-height: 1.8;
}

@media (max-width: 1024px) {
  .programme-card, .hotel-card {
    grid-template-columns: 1fr;
  }
  .price-info-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .price-main {
    border-right: none;
    border-bottom: 2px solid var(--light);
    padding-right: 0;
    padding-bottom: 20px;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  .services-grid {
    grid-template-columns: 1fr;
  }
  .main-content {
    padding: 20px;
  }
  .price-amount {
    font-size: 2.5rem;
  }
}
`;
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
  // Nuevas propiedades para elementos editables del header
  propositionTitle?: string;
  reference?: string;
  brandName?: string;
  groupeText?: string;
  // Condiciones generales del perfil de empresa
  condicionesGenerales?: string;
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
  // Estados para controlar secciones ocultas y restaurar
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());
  const [deletedSections, setDeletedSections] = useState<Map<string, any>>(new Map());

  // Estados para manejo de imágenes y enlaces
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  // Referencia para ReactQuill
  const quillRef = useRef<ReactQuill>(null);
  const [previewContent, setPreviewContent] = useState("");


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

  // Actualizar previsualización cuando cambie el contenido de programme_detaille
  React.useEffect(() => {
    if (editedData?.programme_detaille) {
      setPreviewContent(editedData.programme_detaille);
    }
  }, [editedData?.programme_detaille]);

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

  // Función para validar URLs de imágenes
  const validateImageUrl = (url: string): boolean => {
    try {
      new URL(url);
      return url.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) !== null;
    } catch {
      return false;
    }
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

  // Función para obtener estadísticas del contenido
  const getContentStats = (content: string) => {
    const textContent = content.replace(/<[^>]*>/g, '');
    return {
      characters: textContent.length,
      words: textContent.split(/\s+/).filter(word => word.length > 0).length,
      paragraphs: (content.match(/<p>/g) || []).length,
      images: (content.match(/<img/g) || []).length
    };
  };

  // Función para validar contenido mínimo
  const validateProgrammeContent = (content: string): boolean => {
    const textContent = content.replace(/<[^>]*>/g, '');
    return textContent.trim().length >= 50; // Mínimo 50 caracteres
  };



  // Función para manejar cambios en el editor de manera segura
  const handleProgrammeChange = (value: string) => {
    handleChange("programme_detaille", value);
    
    // Validación de contenido mínimo
    if (!validateProgrammeContent(value)) {
      setSaveError("⚠️ Le contenu est trop court. Ajoutez au moins 50 caractères.");
      setTimeout(() => setSaveError(null), 3000);
    }
  };



  // Configuración de ReactQuill para programme_detaille
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

  // Función para manejar cambios en el editor de manera segura
  

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



  // Prompt específico para programme_detaille
  const getProgrammeDetaillePrompt = (currentContent: string) => `
Eres un experto en redacción de itinerarios de viaje. Mejora este programa detallado:

CONTENIDO ACTUAL:
${currentContent}

INSTRUCCIONES ESPECÍFICAS:
- Mantén un tono atractivo y descriptivo
- Incluye horarios sugeridos cuando sea relevante
- Destaca experiencias únicas y momentos especiales
- Usa lenguaje evocador pero profesional
- Estructura en párrafos claros con transiciones suaves
- Incluye recomendaciones prácticas cuando sea apropiado
- Mantén la información esencial del itinerario
- Resalta los aspectos culturales y gastronómicos
- Proporciona contexto histórico cuando sea relevante
- Sugiere opciones alternativas para diferentes intereses

FORMATO DE RESPUESTA:
- Devuelve SOLO el contenido HTML mejorado, sin explicaciones adicionales
- Usa etiquetas HTML semánticas (p, strong, em, ul, li)
- Incluye horarios en formato: <em>Matin :</em>, <em>Après-midi :</em>, <em>Soirée :</em>
- Destaca los momentos claves con <strong>
- Mantén un estilo coherente y profesional
`;

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

    // Crear el contenido HTML basado en la plantilla existente
    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${editedData.titreVoyage || "Proposition de Voyage"} — Flowtrip</title>
<style>
${plantillaStyles}
</style>
</head>
<body>
<div class="previa-container">
  <!-- Hero Section -->
  <section class="hero-section">
    <div class="hero-meta">
      <div>Proposition de Voyage</div>
      <div>Référence: FLO-2025-001</div>
    </div>
    <div class="hero-content">
      <div class="hero-logo">
        <img src="${
          editedData.logoUrl
        }" alt="Logo Flowtrip" class="hero-logo-img">
        <h2>FLOWTRIP</h2>
      </div>
      <h1 class="hero-title">${editedData.titreVoyage}</h1>
      <p class="hero-subtitle">${
        editedData.titre_immersion || "Immersion au"
      } ${editedData.pays_destination || "Destination"}</p>
    </div>
  </section>

  <main class="main-content">
    <!-- Sección Vos Envies -->
    ${
      editedData.vos_envies
        ? `
    <div class="content-section">
      <div class="section-header">
        <h3 class="section-title">${
          editedData.titre_vos_envies || "VOS ENVIES"
        }</h3>
      </div>
      <div class="border border-gray-400 p-4">
        ${editedData.vos_envies}
      </div>
    </div>
    `
        : ""
    }

    <!-- Itinéraire Section -->
    <div class="content-section">
      <div class="section-header">
        <h3 class="section-title">${
          editedData.titre_itineraire_bref || "VOTRE ITINÉRAIRE"
        }</h3>
        <p class="section-subtitle">${
          editedData.table_itineraire_bref.length
        } jours de découverte</p>
      </div>

      <div class="timeline">
        ${editedData.table_itineraire_bref
          .map(
            (row, index) => `
        <div class="timeline-item">
          <div class="timeline-date">${row.jour} • ${row.date}</div>
          <div class="timeline-content">
            <p>${row.programme}</p>
            ${
              row.nuit || row.hôtel
                ? `
            <span class="timeline-location">
              ${row.nuit ? `Nuit à ${row.nuit}` : ""}
              ${row.nuit && row.hôtel ? " • " : ""}
              ${row.hôtel || ""}
            </span>
            `
                : ""
            }
          </div>
        </div>
        `
          )
          .join("")}
      </div>

      ${
        editedData.note_programme
          ? `
      <div class="note-box mt-6">
        <p><strong>NOTE :</strong> ${editedData.note_programme}</p>
      </div>
      `
          : ""
      }
    </div>

    <!-- Programme Détaillé -->
    ${
      editedData.programme_detaille
        ? `
    <div class="content-section">
      <div class="section-header">
        <h3 class="section-title">${
          editedData.titre_programme_detaille || "PROGRAMME DÉTAILLÉ"
        }</h3>
        <p class="section-subtitle">Chaque jour, une nouvelle découverte</p>
      </div>
      ${
        editedData.imageProgrammeUrl
          ? `
      <div class="flex justify-center mb-6">
        <img src="${editedData.imageProgrammeUrl}" alt="Programme détaillé" class="w-full max-w-2xl h-64 object-cover rounded-lg">
      </div>
      `
          : ""
      }
      <div class="prose max-w-none programme-detaille">
        ${editedData.programme_detaille}
      </div>
    </div>
    `
        : ""
    }

    <!-- Services Section -->
    <div class="content-section">
      <div class="section-header">
        <h3 class="section-title">Détails de votre voyage</h3>
        <p class="section-subtitle">Tout ce qui est inclus dans votre forfait</p>
      </div>

      <div class="services-grid">
        <!-- Service Inclus -->
        <div class="service-card">
          <div class="service-header">
            ${editedData.titre_inclus || "INCLUS DANS VOTRE VOYAGE"}
          </div>
          <ul class="service-list">
            ${
              editedData.inclus?.map((item) => `<li>${item}</li>`).join("") ||
              "<li>Aucun service inclus</li>"
            }
          </ul>
        </div>

        <!-- Service Non Inclus -->
        <div class="service-card">
          <div class="service-header">
            ${editedData.titre_non_inclus || "NON INCLUS"}
          </div>
          <ul class="service-list excluded">
            ${
              editedData.non_inclus
                ?.map((item) => `<li>${item}</li>`)
                .join("") || "<li>Aucun service non inclus</li>"
            }
          </ul>
        </div>
      </div>

      <!-- Información de precios -->
      <div class="p-4 my-4 rounded" style="background-color: ${
        editedData.themeColor
      }20; border-left: 4px solid ${editedData.themeColor};">
        <p><strong>${editedData.titre_tarif || "TARIF par personne"}: ${
      editedData.prix_par_personne || "à confirmer"
    }</strong></p>
        <p class="mt-2">${
          editedData.titre_chambre_simple || "Chambre simple"
        }: ${editedData.chambre_simple || "sur demande"}</p>
        ${
          editedData.remarques_tarifs
            ? `
        <p class="mt-2">${editedData.titre_remarques || "Remarques"}: ${
                editedData.remarques_tarifs
              }</p>
        `
            : ""
        }
      </div>
    </div>

    <!-- Hébergements Section -->
    ${
      extractHotels().length > 0 ||
      editedData.hebergements_personnalises?.length > 0
        ? `
    <div class="content-section">
      <div class="section-header">
        <h3 class="section-title">${
          editedData.titre_hebergements || "VOS HÉBERGEMENTS"
        }</h3>
        <p class="section-subtitle">${
          editedData.intro_hebergements ||
          "Sélection d'établissements de charme"
        }</p>
      </div>

      <div class="hotels-grid">
        <!-- Hoteles del itinerario -->
        ${extractHotels()
          .map((hotel) => {
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

            return `
          <div class="hotel-card">
            <img src="${image}" alt="${hotel.nom}" class="hotel-image">
            <div class="hotel-info">
              <h4>${hotel.nom}</h4>
              <p>${hotel.description}</p>
              <div class="hotel-stars">★★★★☆</div>
            </div>
          </div>
          `;
          })
          .join("")}

        <!-- Hoteles personalizados -->
        ${
          editedData.hebergements_personnalises
            ?.map(
              (hotel) => `
        <div class="hotel-card">
          ${
            hotel.images.length > 0
              ? `
          <img src="${hotel.images[0]}" alt="${hotel.nom}" class="hotel-image">
          `
              : `
          <div class="hotel-image bg-gray-200 flex items-center justify-center">
            <span>🖼️</span>
          </div>
          `
          }
          <div class="hotel-info">
            <h4>${hotel.nom}</h4>
            <p>${hotel.description}</p>
            <div class="hotel-stars">★★★★☆</div>
          </div>
        </div>
        `
            )
            .join("") || ""
        }
      </div>

      ${
        editedData.note_hebergement
          ? `
      <div class="note-box mt-6">
        <p><strong>NOTE :</strong> ${editedData.note_hebergement}</p>
      </div>
      `
          : ""
      }
    </div>
    `
        : ""
    }

    <!-- Price Info Section -->
    <div class="price-info-section">
      <div class="price-info-grid">
        <div class="price-main">
          <div class="price-label">${
            editedData.titre_tarif || "Tarif Indicatif"
          }</div>
          <div class="price-amount">${
            editedData.prix_par_personne || "1 399 €"
          }</div>
          <div class="price-per">par personne (base 30)</div>
        </div>
        <div class="info-item">
          <h4>Durée</h4>
          <p>${editedData.table_itineraire_bref.length} jours / ${
      editedData.table_itineraire_bref.length - 1
    } nuits</p>
        </div>
        <div class="info-item">
          <h4>Groupe</h4>
          <p>${editedData.groupeText || "Base 30 personnes"}</p>
        </div>
        <div class="info-item">
          <h4>Chambre simple</h4>
          <p>${editedData.chambre_simple || "sur demande"}</p>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <section class="cta-section">
      <h2>${editedData.bonVoyageText || "BON VOYAGE !"}</h2>
      <p>Votre aventure vous attend</p>
    </section>
  </main>
</div>
</body>
</html>`;

    // Crear blob y descargar
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voyage-plan.html";
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
    <div className="previa-container">
      <style>{plantillaStyles}</style>

      {/* Botones de edición/guardar en la parte superior */}
      <div className="flex justify-between items-center mb-4 p-4 bg-white rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Previsualización</h1>
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
          <Button variant="secondary" onClick={descargarPlantillaHTML}>
            <FileText className="h-4 w-4 mr-2" />
            Descargar HTML
          </Button>
          {/*<Button>
            <Send className="h-4 w-4 mr-2" />
            Enviar al cliente
          </Button>*/}
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
            <div className="flex items-end"></div>
          </div>
        </div>
      )}

      {/* Hero Section - Diseño de Plantilla.html */}
      <section className="hero-section">
        <div className="hero-meta">
          {editing ? (
            <div className="space-y-2">
              <Input
                value={editedData.propositionTitle || "Proposition de Voyage"}
                onChange={(e) =>
                  handleChange("propositionTitle", e.target.value)
                }
                className="text-white bg-transparent border-white/30 text-right"
                placeholder="Proposition de Voyage"
              />
              <Input
                value={editedData.reference || "Référence: FLO-2025-001"}
                onChange={(e) => handleChange("reference", e.target.value)}
                className="text-white bg-transparent border-white/30 text-right"
                placeholder="Référence: FLO-2025-001"
              />
            </div>
          ) : (
            <>
              <div>
                {editedData.propositionTitle || "Proposition de Voyage"}
              </div>
              <div>{editedData.reference || "Référence: FLO-2025-001"}</div>
            </>
          )}
        </div>
        <div className="hero-content">
          <div className="hero-logo">
            {editing ? (
              <>
                <Label className="block mb-2 text-white">URL del Logo:</Label>
                <Input
                  value={editedData.logoUrl}
                  onChange={(e) => handleChange("logoUrl", e.target.value)}
                  className="mb-4 bg-white/20 text-white placeholder:text-white/70"
                  placeholder="URL del logo..."
                />
              </>
            ) : (
              <img
                src={editedData.logoUrl}
                alt="Logo Flowtrip"
                className="hero-logo-img"
              />
            )}
            {editing ? (
              <Input
                value={editedData.brandName || "FLOWTRIP"}
                onChange={(e) => handleChange("brandName", e.target.value)}
                className="text-white bg-transparent border-white/30 text-center font-semibold text-1.8rem"
                placeholder="FLOWTRIP"
              />
            ) : (
              <h2>{editedData.brandName || "FLOWTRIP"}</h2>
            )}
          </div>
          {editing ? (
            <div className="space-y-4">
              <Input
                value={editedData.titreVoyage}
                onChange={(e) => handleChange("titreVoyage", e.target.value)}
                className="hero-title bg-transparent border-white/30 text-white text-center"
                placeholder="Título del viaje..."
              />
              <div className="flex items-center justify-center gap-2">
                <Input
                  type="text"
                  value={editedData.titre_immersion}
                  onChange={(e) =>
                    handleChange("titre_immersion", e.target.value)
                  }
                  className="inline-block w-32 text-center bg-transparent border-white/30 text-white"
                />
                <Input
                  type="text"
                  value={editedData.pays_destination}
                  onChange={(e) =>
                    handleChange("pays_destination", e.target.value)
                  }
                  className="inline-block w-32 text-center bg-transparent border-white/30 text-white"
                />
              </div>
            </div>
          ) : (
            <>
              <h1 className="hero-title">{editedData.titreVoyage}</h1>
              <p className="hero-subtitle">
                {editedData.titre_immersion || "Immersion au"}{" "}
                {editedData.pays_destination || "Destination"}
              </p>
            </>
          )}
        </div>
      </section>

      <main className="main-content">
        <div className="section my-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold border-b border-gray-300 pb-2">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedData.titre_vos_envies}
                    onChange={(e) =>
                      handleChange("titre_vos_envies", e.target.value)
                    }
                    className="text-lg font-semibold"
                  />
                  <Button
                    onClick={() => openAiModal("Titre Vos Envies")}
                    variant="ghost"
                    size="sm"
                    className="text-yellow-600 hover:text-yellow-700"
                  >
                    ✨
                  </Button>
                </div>
              ) : (
                editedData.titre_vos_envies || "VOS ENVIES"
              )}
            </h2>
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
                className="text-red-600 hover:text-red-800"
              >
                🗑️ Eliminar
              </Button>
            )}
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
        </div>

        <div className="content-section">
          <div className="section-header">
            <h3 className="section-title">
              {editing ? (
                <Input
                  value={editedData.titre_itineraire_bref}
                  onChange={(e) =>
                    handleChange("titre_itineraire_bref", e.target.value)
                  }
                  className="section-title bg-transparent border-none text-2xl font-light"
                />
              ) : (
                editedData.titre_itineraire_bref || "VOTRE ITINÉRAIRE"
              )}
            </h3>
            <p className="section-subtitle">
              {editedData.table_itineraire_bref.length} jours de découverte
            </p>
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
                          className="timeline-item"
                        >
                          <div className="timeline-date">
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
                                  className="bg-transparent border-none p-0 font-semibold"
                                />
                                <Input
                                  value={row.date}
                                  onChange={(e) =>
                                    handleItineraryChange(
                                      index,
                                      "date",
                                      e.target.value
                                    )
                                  }
                                  className="bg-transparent border-none p-0"
                                />
                                <Button
                                  onClick={() =>
                                    openAiModal(`Día ${index + 1} - Date/Jour`)
                                  }
                                  variant="ghost"
                                  size="sm"
                                  className="text-yellow-600 hover:text-yellow-700"
                                >
                                  ✨
                                </Button>
                              </div>
                            ) : (
                              `${row.jour} • ${row.date}`
                            )}
                          </div>
                          <div className="timeline-content">
                            <div
                              {...provided.dragHandleProps}
                              className="absolute left-[-35px] top-5"
                            >
                              <GripVertical className="h-4 w-4 text-gray-400" />
                            </div>
                            {editing ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={row.programme}
                                  onChange={(e) =>
                                    handleItineraryChange(
                                      index,
                                      "programme",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border-gray-300"
                                  rows={3}
                                  placeholder="Description du programme..."
                                />
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
                                    placeholder="Nuit à..."
                                    className="flex-1"
                                  />
                                  <Input
                                    value={row.hôtel}
                                    onChange={(e) =>
                                      handleItineraryChange(
                                        index,
                                        "hôtel",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Hôtel"
                                    className="flex-1"
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
                              </div>
                            ) : (
                              <>
                                <p>{row.programme}</p>
                                <span className="timeline-location">
                                  {row.nuit && `Nuit à ${row.nuit}`}
                                  {row.nuit && row.hôtel && " • "}
                                  {row.hôtel}
                                </span>
                              </>
                            )}
                            {editing && (
                              <div className="flex justify-end mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItineraryEntry(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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

          {editing && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={addNewItineraryEntry}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter un jour
              </Button>
            </div>
          )}

          <div
            className="note-box mt-6"
            style={{
              backgroundColor: editedData.themeColor + "20",
              borderLeft: `4px solid ${editedData.themeColor}`,
            }}
          >
            {editing ? (
              <Textarea
                value={editedData.note_programme || ""}
                onChange={(e) => handleChange("note_programme", e.target.value)}
                className="w-full bg-transparent border-none"
                rows={2}
                placeholder="Note sur le programme..."
              />
            ) : (
              <p>
                <strong>NOTE :</strong>{" "}
                {editedData.note_programme ||
                  "Le programme a été établi sur la base de nos derniers échanges et peut être adapté selon vos souhaits."}
              </p>
            )}
          </div>
        </div>

        <div className="content-section">
          <div className="section-header">
            <h3 className="section-title">
              {editing ? (
                <Input
                  value={editedData.titre_programme_detaille}
                  onChange={(e) =>
                    handleChange("titre_programme_detaille", e.target.value)
                  }
                  className="section-title bg-transparent border-none text-2xl font-light"
                />
              ) : (
                editedData.titre_programme_detaille || "PROGRAMME DÉTAILLÉ"
              )}
            </h3>
            <p className="section-subtitle">
              Chaque jour, une nouvelle découverte
            </p>
          </div>

          {editing ? (
            <section className="space-y-4">
              <section className="mb-4">
                <Label className="block mb-2">
                  URL de l'image principale du programme:
                </Label>
                <section className="flex items-center gap-2">
                  <Input
                    value={editedData.imageProgrammeUrl}
                    onChange={(e) =>
                      handleChange("imageProgrammeUrl", e.target.value)
                    }
                    className="flex-1"
                    placeholder="https://example.com/image.jpg"
                  />
                  <Button
                    onClick={() => openAiModal("imageProgrammeUrl")}
                    variant="ghost"
                    size="sm"
                    className="text-yellow-600 hover:text-yellow-700"
                  >
                    ✨
                  </Button>
                </section>
                {editedData.imageProgrammeUrl && !validateImageUrl(editedData.imageProgrammeUrl) && (
                  <span className="text-red-500 text-sm mt-1 block">
                    ⚠️ URL de imagen no válida
                  </span>
                )}
              </section>

              <section className="mb-4">
                <section className="flex items-center justify-between mb-2">
                  <Label>Contenu détaillé du programme:</Label>
                  <section className="flex items-center gap-2">
                    {editedData.programme_detaille && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        📊 {getContentStats(editedData.programme_detaille).words} mots, 
                        {getContentStats(editedData.programme_detaille).images} images
                      </span>
                    )}
                  </section>
                </section>
                
                {/* EDITOR SIMPLIFICADO - SOLO VISTA DE EDICIÓN DIRECTA */}
                {editing ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Label>Contenido del programa:</Label>
                      <Button
                        onClick={() => {
                          const prompt = getProgrammeDetaillePrompt(editedData.programme_detaille || "");
                          setAiPrompt(prompt);
                          openAiModal("programme_detaille");
                        }}
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
                  <div className="prose max-w-none programme-detaille border rounded-md p-6 bg-white">
                    {editedData.programme_detaille ? (
                      <div 
                        className="programme-content"
                        dangerouslySetInnerHTML={{ 
                          __html: editedData.programme_detaille 
                        }} 
                      />
                    ) : (
                      <p className="text-gray-500 italic">Description du programme à venir</p>
                    )}
                  </div>
                )}
                
                {editedData.programme_detaille && !validateProgrammeContent(editedData.programme_detaille) && (
                  <span className="text-orange-500 text-sm mt-2 block">
                    ⚠️ Contenu trop court. Ajoutez plus de détails pour un programme complet.
                  </span>
                )}
              </section>

              {editedData.imageProgrammeUrl && validateImageUrl(editedData.imageProgrammeUrl) && (
                <section className="flex justify-center">
                  <img
                    src={editedData.imageProgrammeUrl}
                    alt="Programme détaillé"
                    className="max-w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      setSaveError("❌ Impossible de charger l'image. Vérifiez l'URL.");
                      setTimeout(() => setSaveError(null), 5000);
                    }}
                  />
                </section>
              )}
            </section>
          ) : (
            <>
              {editedData.imageProgrammeUrl && validateImageUrl(editedData.imageProgrammeUrl) && (
                <section className="flex justify-center mb-6">
                  <img
                    src={editedData.imageProgrammeUrl}
                    alt="Programme détaillé"
                    className="w-full max-w-2xl h-64 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </section>
              )}
              <section
                className="prose max-w-none programme-detaille"
                dangerouslySetInnerHTML={{
                  __html:
                    editedData.programme_detaille ||
                    "<p>Description du programme à venir</p>",
                }}
              />
              {editedData.programme_detaille && (
                <section className="mt-4 text-sm text-gray-500 border-t pt-2">
                  <strong></strong> 
                  
                </section>
              )}
            </>
          )}

          {editing && (
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => {
                  setEditedData((prev) => ({
                    ...prev,
                    titre_programme_detaille: "",
                    imageProgrammeUrl: "",
                    programme_detaille: "",
                  }));
                }}
                variant="outline"
                className="text-red-600 hover:text-red-700"
              >
                🗑️ Supprimer cette section
              </Button>
            </div>
          )}
        </div>

        <div className="content-section">
          <div className="section-header">
            <h3 className="section-title">
              {editing ? (
                <Input
                  value="Détails de votre voyage"
                  onChange={(e) => {
                    // Este texto es fijo pero podríamos hacerlo editable si se desea
                  }}
                  className="w-full"
                />
              ) : (
                "Détails de votre voyage"
              )}
            </h3>
            <p className="section-subtitle">
              {editing ? (
                <Input
                  value="Tout ce qui est inclus dans votre forfait"
                  onChange={(e) => {
                    // Este texto es fijo pero podríamos hacerlo editable si se desea
                  }}
                  className="w-full"
                />
              ) : (
                "Tout ce qui est inclus dans votre forfait"
              )}
            </p>
          </div>

          <div className="services-grid">
            {/* Service Card - Inclus */}
            <div className="service-card">
              <div className="service-header">
                {editing ? (
                  <Input
                    value={editedData.titre_inclus}
                    onChange={(e) =>
                      handleChange("titre_inclus", e.target.value)
                    }
                    className="font-semibold text-white bg-transparent border-none text-center w-full"
                    placeholder="Titre inclus..."
                  />
                ) : (
                  editedData.titre_inclus || "INCLUS DANS VOTRE VOYAGE"
                )}
              </div>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="inclus" type="inclus">
                  {(provided) => (
                    <ul
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="service-list"
                    >
                      {editedData.inclus?.map((item, index) => (
                        <Draggable
                          key={index}
                          draggableId={`inclus-${index}`}
                          index={index}
                        >
                          {(provided) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              {editing ? (
                                <div className="flex items-center gap-2">
                                  <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
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
                                </div>
                              ) : (
                                <span>{item}</span>
                              )}
                            </li>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
              </DragDropContext>
              {editing && (
                <div className="p-4 border-t">
                  <Button
                    onClick={() => addNewListItem("inclus")}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un service inclus
                  </Button>
                </div>
              )}
            </div>

            {/* Service Card - Non Inclus */}
            <div className="service-card">
              <div className="service-header">
                {editing ? (
                  <Input
                    value={editedData.titre_non_inclus}
                    onChange={(e) =>
                      handleChange("titre_non_inclus", e.target.value)
                    }
                    className="font-semibold text-white bg-transparent border-none text-center w-full"
                    placeholder="Titre non inclus..."
                  />
                ) : (
                  editedData.titre_non_inclus || "NON INCLUS"
                )}
              </div>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="non_inclus" type="non_inclus">
                  {(provided) => (
                    <ul
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="service-list excluded"
                    >
                      {editedData.non_inclus?.map((item, index) => (
                        <Draggable
                          key={index}
                          draggableId={`non_inclus-${index}`}
                          index={index}
                        >
                          {(provided) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              {editing ? (
                                <div className="flex items-center gap-2">
                                  <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
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
                                </div>
                              ) : (
                                <span>{item}</span>
                              )}
                            </li>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
              </DragDropContext>
              {editing && (
                <div className="p-4 border-t">
                  <Button
                    onClick={() => addNewListItem("non_inclus")}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un service non inclus
                  </Button>
                </div>
              )}
            </div>
          </div>

          {!hiddenSections.has('tarifs_section') && (
            <div
              className="p-4 my-4 rounded"
              style={{
                backgroundColor: editedData.themeColor + "20",
                borderLeft: `4px solid ${editedData.themeColor}`,
              }}
            >
              {editing && (
                <div className="flex justify-end mb-2">
                  <Button
                    onClick={() => deleteSection('tarifs_section', {
                      titre_tarif: editedData.titre_tarif,
                      prix_par_personne: editedData.prix_par_personne,
                      titre_chambre_simple: editedData.titre_chambre_simple,
                      chambre_simple: editedData.chambre_simple,
                      titre_remarques: editedData.titre_remarques,
                      remarques_tarifs: editedData.remarques_tarifs
                    })}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer cette section
                  </Button>
                </div>
              )}
            <p>
              <strong>
                {editing ? (
                  <Input
                    value={editedData.titre_tarif}
                    onChange={(e) =>
                      handleChange("titre_tarif", e.target.value)
                    }
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
                  onChange={(e) =>
                    handleChange("chambre_simple", e.target.value)
                  }
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
          )}
        </div>

        <div className="content-section">
          <div className="section-header">
            <h3 className="section-title">
              {editing ? (
                <Input
                  value={editedData.titre_hebergements}
                  onChange={(e) =>
                    handleChange("titre_hebergements", e.target.value)
                  }
                  className="section-title bg-transparent border-none text-2xl font-light"
                />
              ) : (
                editedData.titre_hebergements || "VOS HÉBERGEMENTS"
              )}
            </h3>
            <p className="section-subtitle">
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedData.intro_hebergements || "Sélection d'établissements de charme"}
                    onChange={(e) => handleChange("intro_hebergements", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => openAiModal("intro_hebergements")}
                    size="sm"
                    variant="outline"
                  >
                    ✨
                  </Button>
                  <Button
                    onClick={() => handleChange("intro_hebergements", "")}
                    size="sm"
                    variant="destructive"
                  >
                    🗑️
                  </Button>
                </div>
              ) : (
                editedData.intro_hebergements || "Sélection d'établissements de charme"
              )}
            </p>
          </div>

          {/* Hoteles extraídos del itinerario */}
          {!hiddenSections.has('hotels_extracted') && (
            <div className="hotels-grid">
              {editing && (
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold">Hébergements extraits</h4>
                  <Button
                    onClick={() => deleteSection('hotels_extracted', {
                      table_itineraire_bref: editedData.table_itineraire_bref
                    })}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer cette section
                  </Button>
                </div>
              )}
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
                  <div key={index} className="hotel-card">
                    <img src={image} alt={hotel.nom} className="hotel-image" />
                    <div className="hotel-info">
                      <h4>
                        {editing ? (
                          <Input
                            value={hotel.nom}
                            onChange={(e) => {
                              const updatedItinerary = [...editedData.table_itineraire_bref];
                              const entryIndex = updatedItinerary.findIndex(entry => entry.hôtel === hotel.nom);
                              if (entryIndex !== -1) {
                                updatedItinerary[entryIndex] = {
                                  ...updatedItinerary[entryIndex],
                                  hôtel: e.target.value
                                };
                                setEditedData({
                                  ...editedData,
                                  table_itineraire_bref: updatedItinerary
                                });
                              }
                            }}
                            className="w-full mb-2"
                          />
                        ) : (
                          hotel.nom
                        )}
                      </h4>
                      <p>
                        {editing ? (
                          <Textarea
                            value={hotel.description}
                            onChange={(e) => {
                              // Actualizar la descripción si es necesario
                              // Esto podría requerir lógica adicional dependiendo de cómo se almacenen las descripciones
                            }}
                            className="w-full"
                            rows={2}
                          />
                        ) : (
                          hotel.description
                        )}
                      </p>
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
            </div>
          )}

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
                  className="hotels-grid mt-6"
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
                            className="hotel-card"
                          >
                            {hotel.images.length > 0 ? (
                              <img
                                src={hotel.images[0]}
                                alt={hotel.nom}
                                className="hotel-image"
                              />
                            ) : (
                              <div className="hotel-image bg-gray-200 flex items-center justify-center">
                                <ImageIcon className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                            <div className="hotel-info">
                              <div
                                {...provided.dragHandleProps}
                                className="mb-2"
                              >
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
                                <>
                                  <h4>{hotel.nom}</h4>
                                  <p>{hotel.description}</p>
                                  <div className="hotel-stars">★★★★☆</div>
                                </>
                              )}

                              <div className="mt-4 grid grid-cols-2 gap-2">
                                {hotel.images.map((image, imgIndex) => (
                                  <div key={imgIndex} className="relative">
                                    <img
                                      src={image}
                                      alt={hotel.nom}
                                      className="rounded-md h-20 w-full object-cover"
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
                                        <Trash2 className="h-3 w-3 text-red-500" />
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
                                        hotelImages[`personalized-${index}`] ||
                                        ""
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
                                      size="sm"
                                    >
                                      <ImageIcon className="h-4 w-4 mr-1" />
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
                                className="absolute top-2 right-2"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
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

          {editing && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={addNewHotelPersonnalise}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter un hôtel personnalisé
              </Button>
            </div>
          )}

          <div className="note-box mt-6">
            {editing ? (
              <Textarea
                value={editedData.note_hebergement || ""}
                onChange={(e) =>
                  handleChange("note_hebergement", e.target.value)
                }
                className="w-full"
                rows={2}
                placeholder="Note sur les hébergements..."
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

        {/* Price Info Section - Diseño especial de Plantilla.html */}
        <div className="price-info-section">
          <div className="price-info-grid">
            <div className="price-main">
              <div className="price-label">
                {editing ? (
                  <Input
                    value={editedData.titre_tarif}
                    onChange={(e) =>
                      handleChange("titre_tarif", e.target.value)
                    }
                    className="text-center bg-transparent border-none"
                    placeholder="Titre tarif..."
                  />
                ) : (
                  editedData.titre_tarif || "Tarif Indicatif"
                )}
              </div>
              <div className="price-amount">
                {editing ? (
                  <Input
                    value={editedData.prix_par_personne}
                    onChange={(e) =>
                      handleChange("prix_par_personne", e.target.value)
                    }
                    className="text-center text-3xl font-light bg-transparent border-none"
                    placeholder="1 399 €"
                  />
                ) : (
                  editedData.prix_par_personne || "1 399 €"
                )}
              </div>
              <div className="price-per">par personne (base 30)</div>
            </div>

            <div className="info-item">
              <h4>Durée</h4>
              <p>
                {editedData.table_itineraire_bref.length} jours /{" "}
                {editedData.table_itineraire_bref.length - 1} nuits
              </p>
            </div>

            <div className="info-item">
              <h4>Groupe</h4>
              <p>Base 30 personnes</p>
            </div>

            <div className="info-item">
              <h4>Chambre simple</h4>
              <p>
                {editing ? (
                  <Input
                    value={editedData.chambre_simple}
                    onChange={(e) =>
                      handleChange("chambre_simple", e.target.value)
                    }
                    className="text-center bg-transparent border-none p-0"
                    placeholder="sur demande"
                  />
                ) : (
                  editedData.chambre_simple || "sur demande"
                )}
              </p>
            </div>
          </div>

          {editedData.remarques_tarifs && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                {editing ? (
                  <Input
                    value={editedData.titre_remarques}
                    onChange={(e) =>
                      handleChange("titre_remarques", e.target.value)
                    }
                    className="bg-transparent border-none"
                    placeholder="Remarques"
                  />
                ) : (
                  editedData.titre_remarques || "Remarques"
                )}
              </h4>
              {editing ? (
                <Textarea
                  value={editedData.remarques_tarifs}
                  onChange={(e) =>
                    handleChange("remarques_tarifs", e.target.value)
                  }
                  className="w-full bg-white"
                  rows={2}
                  placeholder="Ajoutez des remarques sur les tarifs..."
                />
              ) : (
                <p className="text-sm text-gray-600">
                  {editedData.remarques_tarifs}
                </p>
              )}
            </div>
          )}
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

        {/* CTA Section - Diseño especial de Plantilla.html */}
        <section className="cta-section">
          <h2>
            {editing ? (
              <Input
                value={editedData.bonVoyageText}
                onChange={(e) => handleChange("bonVoyageText", e.target.value)}
                className="text-2xl font-light text-white bg-transparent border-none text-center w-full"
                placeholder="BON VOYAGE !"
              />
            ) : (
              editedData.bonVoyageText || "BON VOYAGE !"
            )}
          </h2>
          <p>
            {editing ? (
              <Input
                value={editedData.bonVoyageText || "Votre aventure vous attend"}
                onChange={(e) => handleChange("bonVoyageText", e.target.value)}
                className="w-full text-center"
              />
            ) : (
              editedData.bonVoyageText || "Votre aventure vous attend"
            )}
          </p>
        </section>

        <div className="footer text-center py-6 border-t border-gray-300 mt-4">
          {editing ? (
            <Input
              value={editedData.bonVoyageText}
              onChange={(e) => handleChange("bonVoyageText", e.target.value)}
              className="text-xl font-bold text-center"
              style={{ color: editedData.themeColor }}
            />
          ) : (
            <h2
              className="text-xl font-bold"
              style={{ color: editedData.themeColor }}
            >
              {editedData.bonVoyageText}
            </h2>
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
                    onClick={() =>
                      callAI(aiPrompt, activeAiSection || undefined)
                    }
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
                  <Button
                    onClick={() => setShowAiModal(false)}
                    variant="outline"
                  >
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

        {/* Modal para agregar imagen */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                🖼️ Ajouter une Image
              </h3>
              <Input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="mb-4"
              />
              <div className="flex gap-2">
                <Button 
                 
                >
                  Ajouter l'Image
                </Button>
                <Button
                  onClick={() => setShowImageModal(false)}
                  variant="outline"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Previa;
