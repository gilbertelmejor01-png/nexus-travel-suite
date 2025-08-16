import React from 'react';

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
  console.log('Previa component rendered with:', { data, loading, error });
  const extractHotels = (): HotelInfo[] => {
    if (!data?.table_itineraire_bref) return [];
    
    const seen = new Set<string>();
    return data.table_itineraire_bref
      .filter(entry => entry.hôtel && !seen.has(entry.hôtel) && seen.add(entry.hôtel))
      .map(entry => ({
        nom: entry.hôtel,
        description: `Nuit à ${entry.nuit || "emplacement inconnu"}`
      }));
  };

  const renderTable = () => {
    if (!data?.table_itineraire_bref) return null;
    
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
          {data.table_itineraire_bref.map((row, index) => (
            <tr key={index}>
              <td className="p-2">{row.jour}</td>
              <td className="p-2">{row.date}</td>
              <td className="p-2">{row.programme}</td>
              <td className="p-2">{row.nuit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderList = (items: string[]) => {
    return items.map((item, index) => <li key={index}>{item}</li>);
  };

  if (loading) return (
    <div className="text-center py-8 bg-blue-50 border border-blue-200 rounded">
      <div className="text-blue-600 font-semibold">🔄 Cargando datos de Firebase...</div>
    </div>
  );
  
  if (error) return (
    <div className="text-center py-8 bg-red-50 border border-red-200 rounded">
      <div className="text-red-600 font-semibold">❌ Error: {error}</div>
    </div>
  );
  
  if (!data) return (
    <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded">
      <div className="text-yellow-600 font-semibold">⚠️ No hay datos disponibles</div>
      <div className="text-sm text-gray-500 mt-2">Verificando conexión con Firebase...</div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 bg-white shadow-md rounded-lg">
      <div className="header-box text-center py-4">
        <img 
          src="https://res.cloudinary.com/dckcnx0sz/image/upload/v1752805614/Captura_de_pantalla_de_2025-07-17_21-14-15_za6iuo.png" 
          alt="Logo Néogusto"
          className="mx-auto h-16 mb-4"
        />
        <h1 className="text-2xl font-bold text-gray-800">Votre voyage avec Néogusto</h1>
        <h1 className="text-xl font-semibold text-orange-700">Immersion au {data.pays_destination || "Destination"}</h1>
      </div>

      <div className="section my-6">
        <h2 className="text-lg font-semibold border-b border-gray-300 pb-2 mb-3">VOS ENVIES</h2>
        <div className="border border-gray-400 h-24 my-3"></div>
      </div>

      <div className="section my-6">
        <h2 className="text-lg font-semibold border-b border-gray-300 pb-2 mb-3">VOTRE ITINÉRAIRE EN BREF</h2>
        {renderTable()}
        <div className="bg-orange-100 border-l-4 border-orange-500 p-3 my-4 rounded">
          <p>Le programme a été établi sur la base de nos derniers échanges et <strong>peut être adapté selon vos souhaits</strong>.</p>
        </div>
      </div>

      <div className="section programme-detaille my-6">
        <h2 className="text-lg font-semibold border-b border-gray-300 pb-2 mb-3">PROGRAMME DÉTAILLÉ</h2>
        <img 
          src="https://www.vinccihoteles.com/media/uploads/cms_apps/imagenes/disposicion-articulos-viaje-angulo-alto.jpg?q=pr:sharp/rs:fill/w:900/h:500/g:ce/f:jpg" 
          alt="Programme détaillé"
          className="w-full rounded mb-4"
        />
        <div className="prose" dangerouslySetInnerHTML={{ __html: data.programme_detaille || "<p>Description du programme à venir</p>" }} />
      </div>

      <div className="section my-6">
        <table className="w-full border-collapse">
          <tr>
            <th className="text-left p-2 bg-gray-800 text-white">INCLUS</th>
            <th className="text-left p-2 bg-gray-800 text-white">NON INCLUS</th>
          </tr>
          <tr>
            <td className="p-2 border">
              <ul className="list-disc pl-5">{renderList(data.inclus || [])}</ul>
            </td>
            <td className="p-2 border">
              <ul className="list-disc pl-5">{renderList(data.non_inclus || [])}</ul>
            </td>
          </tr>
        </table>
        
        <div className="bg-orange-100 border-l-4 border-orange-700 p-4 my-4 rounded">
          <p><strong>TARIF par personne : {data.prix_par_personne || "à confirmer"}</strong></p>
          <p>Chambre simple : {data.chambre_simple || "sur demande"}</p>
          <p>Remarques : {data.remarques_tarifs || "aucune"}</p>
        </div>
      </div>

      <div className="section my-6">
        <h2 className="text-lg font-semibold border-b border-gray-300 pb-2 mb-3">VOS HÉBERGEMENTS</h2>
        <img 
          src="https://res.cloudinary.com/dckcnx0sz/image/upload/v1752805614/Captura_de_pantalla_de_2025-07-17_21-14-15_za6iuo.png" 
          alt="Hébergements"
          className="mx-auto h-12 mb-4"
        />
        <p className="mb-4">Hébergements sélectionnés pour leur <strong>confort</strong>, <strong>charme</strong> et <strong>localisation</strong>.</p>
        
        <ul className="space-y-4">
          {extractHotels().map((hotel, index) => {
            const hotelImages: Record<string, string> = {
              "El Mesón de Maria": "https://res.cloudinary.com/dckcnx0sz/image/upload/v1752806775/Captura_de_pantalla_de_2025-07-17_21-42-28_wu28bg.png",
              "Hotel Atitlan 4*": "https://res.cloudinary.com/dckcnx0sz/image/upload/v1752806775/Captura_de_pantalla_de_2025-07-17_21-42-28_wu28bg.png",
              "Jungle Lodge 3*": "https://res.cloudinary.com/dckcnx0sz/image/upload/v1752806775/Captura_de_pantalla_de_2025-07-17_21-42-28_wu28bg.png",
              "Hôtel accueillant et moderne - King Room": "https://res.cloudinary.com/dckcnx0sz/image/upload/v1752809571/Captura_de_pantalla_de_2025-07-17_21-18-08_m8z7sc.png"
            };

            const defaultImage = "https://res.cloudinary.com/dckcnx0sz/image/upload/v1752806775/Captura_de_pantalla_de_2025-07-17_21-42-28_wu28bg.png";
            const image = hotelImages[hotel.nom] || defaultImage;

            return (
              <li key={index} className="border rounded-lg p-4">
                <strong className="text-lg">{hotel.nom}</strong> - {hotel.description}
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
          <p><strong>NOTE :</strong> Les hébergements proposés sont sujets à disponibilité au moment de la réservation.</p>
        </div>
      </div>

      <div className="footer text-center py-6 border-t border-gray-300 mt-4">
        <h2 className="text-xl font-bold text-orange-700">BON VOYAGE !</h2>
      </div>
    </div>
  );
};

export default Previa;