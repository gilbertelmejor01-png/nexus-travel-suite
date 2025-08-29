import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
}

interface PreviaProps {
  data: VoyageData | null;
  loading: boolean;
  error: string | null;
}

const Previa = ({ data, loading, error }: PreviaProps) => {
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState<VoyageData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [activeHotelIndex, setActiveHotelIndex] = useState<number | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Inicializar datos editados cuando los datos llegan
  React.useEffect(() => {
    if (data && !editedData) {
      setEditedData({
        titreVoyage: "Votre voyage avec Néogusto",
        logoUrl: "https://res.cloudinary.com/dckcnx0sz/image/upload/v1752805614/Captura_de_pantalla_de_2025-07-17_21-14-15_za6iuo.png",
        imageProgrammeUrl: "https://www.vinccihoteles.com/media/uploads/cms_apps/imagenes/disposicion-articulos-viaje-angulo-alto.jpg?q=pr:sharp/rs:fill/w:900/h:500/g:ce/f:jpg",
        bonVoyageText: "BON VOYAGE !",
        ...data,
        themeColor: data.themeColor || "#3b82f6",
      });
    }
  }, [data]);

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

  const handleSave = async () => {
    if (!editedData) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const docRef = doc(db, "conversacion", "xvbV2piJNxukwOUWODPk");
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
      const response = await fetch('http://38.242.224.81:3000/generar-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      });
  
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'voyage-plan.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando PDF:', error);
      setSaveError(`Error de conexión: No se pudo conectar al servidor. Verifica que el servidor esté ejecutándose en http://38.242.224.81:3000`);
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
      )}

      <div
        className="header-box text-center py-4 rounded-lg mb-6"
        style={{ backgroundColor: editedData.themeColor + "20" }}
      >
        {editing ? (
          <div className="mb-4">
            <Label className="block mb-2">URL del Logo:</Label>
            <Input
              value={editedData.logoUrl}
              onChange={(e) => handleChange("logoUrl", e.target.value)}
              className="mb-4"
            />
            <Label className="block mb-2">Título del Viaje:</Label>
            <Input
              value={editedData.titreVoyage}
              onChange={(e) => handleChange("titreVoyage", e.target.value)}
            />
          </div>
        ) : (
          <>
            <img
              src={editedData.logoUrl}
              alt="Logo Néogusto"
              className="mx-auto h-16 mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-800">
              {editedData.titreVoyage}
            </h1>
          </>
        )}
        <h1
          className="text-xl font-semibold mt-2"
          style={{ color: editedData.themeColor }}
        >
          Immersion au{" "}
          {editing ? (
            <Input
              type="text"
              value={editedData.pays_destination}
              onChange={(e) => handleChange("pays_destination", e.target.value)}
              className="inline-block w-48 mx-2 text-center"
              style={{ color: editedData.themeColor }}
            />
          ) : (
            editedData.pays_destination || "Destination"
          )}
        </h1>
      </div>

      <div className="section my-6">
        <h2 className="text-lg font-semibold border-b border-gray-300 pb-2 mb-3">
          VOS ENVIES
        </h2>
        <div className="border border-gray-400 h-24 my-3"></div>
      </div>

      <div className="section my-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">
            VOTRE ITINÉRAIRE EN BREF
          </h2>
          {editing && (
            <Button onClick={addNewItineraryEntry} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter un jour
            </Button>
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
                    <th className="p-2 text-left">JOUR</th>
                    <th className="p-2 text-left">DATE</th>
                    <th className="p-2 text-left">PROGRAMME</th>
                    <th className="p-2 text-left">NUIT</th>
                    <th className="p-2 text-left">HÔTEL</th>
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
                              <Input
                                value={row.jour}
                                onChange={(e) =>
                                  handleItineraryChange(
                                    index,
                                    "jour",
                                    e.target.value
                                  )
                                }
                                className="w-full"
                              />
                            ) : (
                              row.jour
                            )}
                          </td>
                          <td className="p-2">
                            {editing ? (
                              <Input
                                value={row.date}
                                onChange={(e) =>
                                  handleItineraryChange(
                                    index,
                                    "date",
                                    e.target.value
                                  )
                                }
                                className="w-full"
                              />
                            ) : (
                              row.date
                            )}
                          </td>
                          <td className="p-2">
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
                                rows={2}
                              />
                            ) : (
                              row.programme
                            )}
                          </td>
                          <td className="p-2">
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
                              />
                            ) : (
                              row.nuit
                            )}
                          </td>
                          <td className="p-2">
                            {editing ? (
                              <Input
                                value={row.hôtel}
                                onChange={(e) =>
                                  handleItineraryChange(
                                    index,
                                    "hôtel",
                                    e.target.value
                                  )
                                }
                                className="w-full"
                              />
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
          className="bg-orange-100 border-l-4 border-orange-500 p-3 my-4 rounded"
          style={{ borderLeftColor: editedData.themeColor }}
        >
          <p>
            Le programme a été établi sur la base de nos derniers échanges et{" "}
            <strong>peut être adapté selon vos souhaits</strong>.
          </p>
        </div>
      </div>

      <div className="section programme-detaille my-6">
        <h2 className="text-lg font-semibold border-b border-gray-300 pb-2 mb-3">
          PROGRAMME DÉTAILLÉ
        </h2>
        <div className="mb-4">
          {editing ? (
            <>
              <Label className="block mb-2">URL de la imagen del programa:</Label>
              <Input
                value={editedData.imageProgrammeUrl}
                onChange={(e) => handleChange("imageProgrammeUrl", e.target.value)}
                className="mb-2"
              />
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
              <h3 className="font-semibold bg-gray-800 text-white p-2">INCLUS</h3>
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
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeListItem("inclus", index)}
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
              <h3 className="font-semibold bg-gray-800 text-white p-2">NON INCLUS</h3>
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
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeListItem("non_inclus", index)}
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
          className="bg-orange-100 border-l-4 p-4 my-4 rounded"
          style={{ borderLeftColor: editedData.themeColor }}
        >
          <p>
            <strong>
              TARIF par personne :{" "}
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
            Chambre simple :{" "}
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
            Remarques :{" "}
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
        <h2 className="text-lg font-semibold border-b border-gray-300 pb-2 mb-3">
          VOS HÉBERGEMENTS
        </h2>
        <img
          src="https://res.cloudinary.com/dckcnx0sz/image/upload/v1752805614/Captura_de_pantalla_de_2025-07-17_21-14-15_za6iuo.png"
          alt="Hébergements"
          className="mx-auto h-12 mb-4"
        />
        <p className="mb-4">
          Hébergements sélectionnés pour leur <strong>confort</strong>,{" "}
          <strong>charme</strong> et <strong>localisation</strong>.
        </p>

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
                    <Label className="block mb-2">Ajouter une image (URL):</Label>
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

        <div
          className="bg-orange-100 border-l-4 p-3 my-4 rounded"
          style={{ borderLeftColor: editedData.themeColor }}
        >
          <p>
            <strong>NOTE :</strong> Les hébergements proposés sont sujets à
            disponibilité au moment de la réservation.
          </p>
        </div>
      </div>

      <div className="footer text-center py-6 border-t border-gray-300 mt-4">
        {editing ? (
          <Input
            value={editedData.bonVoyageText}
            onChange={(e) => handleChange("bonVoyageText", e.target.value)}
            className="text-xl font-bold text-center"
            style={{ color: editedData.themeColor }}
          />
        ) : (
          <h2 className="text-xl font-bold" style={{ color: editedData.themeColor }}>
            {editedData.bonVoyageText}
          </h2>
        )}
      </div>
    </div>
  );
};

export default Previa;