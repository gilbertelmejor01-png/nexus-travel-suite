import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ItineraryEntry {
  jour: string;
  date: string;
  programme: string;
  nuit: string;
  hôtel: string;
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
}

interface HotelInfo {
  nom: string;
  description: string;
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

  // Inicializar datos editados cuando los datos llegan
  React.useEffect(() => {
    if (data && !editedData) {
      setEditedData(data);
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
      }));
  };

  const renderTable = () => {
    if (!editedData?.table_itineraire_bref) return null;

    return (
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left p-2">JOUR</th>
            <th className="text-left p-2">DATE</th>
            <th className="text-left p-2">PROGRAMME</th>
            <th className="text-left p-2">NUIT</th>
          </tr>
        </thead>
        <tbody>
          {editedData.table_itineraire_bref.map((row, index) => (
            <tr key={index}>
              <td className="p-2">
                {editing ? (
                  <input
                    type="text"
                    value={row.jour}
                    onChange={(e) => handleItineraryChange(index, "jour", e.target.value)}
                    className="w-full border p-1"
                  />
                ) : (
                  row.jour
                )}
              </td>
              <td className="p-2">
                {editing ? (
                  <input
                    type="text"
                    value={row.date}
                    onChange={(e) => handleItineraryChange(index, "date", e.target.value)}
                    className="w-full border p-1"
                  />
                ) : (
                  row.date
                )}
              </td>
              <td className="p-2">
                {editing ? (
                  <textarea
                    value={row.programme}
                    onChange={(e) => handleItineraryChange(index, "programme", e.target.value)}
                    className="w-full border p-1"
                    rows={2}
                  />
                ) : (
                  row.programme
                )}
              </td>
              <td className="p-2">
                {editing ? (
                  <input
                    type="text"
                    value={row.nuit}
                    onChange={(e) => handleItineraryChange(index, "nuit", e.target.value)}
                    className="w-full border p-1"
                  />
                ) : (
                  row.nuit
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderList = (items: string[], field: keyof VoyageData) => {
    if (editing) {
      const value = editedData?.[field]?.join("\n") || "";
      return (
        <textarea
          value={value}
          onChange={(e) => handleArrayChange(field, e.target.value)}
          className="w-full border p-2"
          rows={5}
        />
      );
    }
    
    return (
      <ul className="list-disc pl-5">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  };

  const handleChange = (field: keyof VoyageData, value: string) => {
    if (!editedData) return;
    
    setEditedData({
      ...editedData,
      [field]: value
    });
  };

  const handleArrayChange = (field: keyof VoyageData, value: string) => {
    if (!editedData) return;
    
    const arrayValue = value.split("\n").filter(item => item.trim() !== "");
    setEditedData({
      ...editedData,
      [field]: arrayValue
    });
  };

  const handleItineraryChange = (index: number, field: keyof ItineraryEntry, value: string) => {
    if (!editedData) return;
    
    const updatedItinerary = [...editedData.table_itineraire_bref];
    updatedItinerary[index] = {
      ...updatedItinerary[index],
      [field]: value
    };
    
    setEditedData({
      ...editedData,
      table_itineraire_bref: updatedItinerary
    });
  };

  const handleSave = async () => {
    if (!editedData) return;
    
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      const docRef = doc(db, "conversacion", "xvbV2piJNxukwOUWODPk");
      await updateDoc(docRef, {
        output: editedData
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
      <div className="flex justify-end gap-2 mb-4">
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
          >
            ✏️ Editar Información
          </button>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="animate-spin mr-2">↻</span> Guardando...
                </>
              ) : (
                "💾 Guardar Cambios"
              )}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditedData(data);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              ❌ Cancelar
            </button>
          </>
        )}
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

      <div className="header-box text-center py-4">
        <img
          src="https://res.cloudinary.com/dckcnx0sz/image/upload/v1752805614/Captura_de_pantalla_de_2025-07-17_21-14-15_za6iuo.png"
          alt="Logo Néogusto"
          className="mx-auto h-16 mb-4"
        />
        <h1 className="text-2xl font-bold text-gray-800">
          Votre voyage avec Néogusto
        </h1>
        <h1 className="text-xl font-semibold text-orange-700">
          Immersion au{" "}
          {editing ? (
            <input
              type="text"
              value={editedData.pays_destination}
              onChange={(e) => handleChange("pays_destination", e.target.value)}
              className="border p-1 w-full max-w-xs"
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
        <h2 className="text-lg font-semibold border-b border-gray-300 pb-2 mb-3">
          VOTRE ITINÉRAIRE EN BREF
        </h2>
        {renderTable()}
        <div className="bg-orange-100 border-l-4 border-orange-500 p-3 my-4 rounded">
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
        <img
          src="https://www.vinccihoteles.com/media/uploads/cms_apps/imagenes/disposicion-articulos-viaje-angulo-alto.jpg?q=pr:sharp/rs:fill/w:900/h:500/g:ce/f:jpg"
          alt="Programme détaillé"
          className="w-full rounded mb-4"
        />
        {editing ? (
          <textarea
            value={editedData.programme_detaille}
            onChange={(e) => handleChange("programme_detaille", e.target.value)}
            className="w-full border p-2"
            rows={10}
          />
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
        <table className="w-full border-collapse">
          <tr>
            <th className="text-left p-2 bg-gray-800 text-white">INCLUS</th>
            <th className="text-left p-2 bg-gray-800 text-white">NON INCLUS</th>
          </tr>
          <tr>
            <td className="p-2 border">
              {renderList(editedData.inclus || [], "inclus")}
            </td>
            <td className="p-2 border">
              {renderList(editedData.non_inclus || [], "non_inclus")}
            </td>
          </tr>
        </table>

        <div className="bg-orange-100 border-l-4 border-orange-700 p-4 my-4 rounded">
          <p>
            <strong>
              TARIF par personne :{" "}
              {editing ? (
                <input
                  type="text"
                  value={editedData.prix_par_personne}
                  onChange={(e) => handleChange("prix_par_personne", e.target.value)}
                  className="border p-1 w-full max-w-xs"
                />
              ) : (
                editedData.prix_par_personne || "à confirmer"
              )}
            </strong>
          </p>
          <p>
            Chambre simple :{" "}
            {editing ? (
              <input
                type="text"
                value={editedData.chambre_simple}
                onChange={(e) => handleChange("chambre_simple", e.target.value)}
                className="border p-1 w-full max-w-xs"
              />
            ) : (
              editedData.chambre_simple || "sur demande"
            )}
          </p>
          <p>
            Remarques :{" "}
            {editing ? (
              <input
                type="text"
                value={editedData.remarques_tarifs}
                onChange={(e) => handleChange("remarques_tarifs", e.target.value)}
                className="border p-1 w-full"
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
                <div className="font-semibold">
                  {editing ? (
                    <input
                      type="text"
                      value={hotel.nom}
                      onChange={(e) => {
                        // Esta es una implementación más compleja que requeriría actualizar todo el itinerario
                        // Por simplicidad, no implementaremos la edición de nombres de hoteles en esta versión
                      }}
                      className="border p-1 w-full"
                      disabled
                    />
                  ) : (
                    <strong className="text-lg">{hotel.nom}</strong>
                  )}{" "}
                  - {hotel.description}
                </div>
                <div className="mt-2">
                  <img
                    src={image}
                    alt={hotel.nom}
                    className="hotel-image rounded-md max-h-48 mx-auto"
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <div className="bg-orange-100 border-l-4 border-gray-500 p-3 my-4 rounded">
          <p>
            <strong>NOTE :</strong> Les hébergements proposés sont sujets à
            disponibilité au moment de la réservation.
          </p>
        </div>
      </div>

      <div className="footer text-center py-6 border-t border-gray-300 mt-4">
        <h2 className="text-xl font-bold text-orange-700">BON VOYAGE !</h2>
      </div>
    </div>
  );
};

export default Previa;