// Datos de ubicación jerárquicos: País → Departamento/Estado → Ciudad

export const LOCATION_DATA = [
  {
    codigo: "CO",
    nombre: "Colombia",
    bandera: "🇨🇴",
    departamentos: [
      { nombre: "Cesar", ciudades: ["Valledupar", "Aguachica", "Codazzi", "La Jagua de Ibirico"] },
      { nombre: "Bogotá D.C.", ciudades: ["Bogotá"] },
      { nombre: "Antioquia", ciudades: ["Medellín", "Bello", "Itagüí", "Envigado", "Sabaneta"] },
      { nombre: "Bolívar", ciudades: ["Cartagena", "Magangué", "El Carmen de Bolívar"] },
      { nombre: "Valle del Cauca", ciudades: ["Cali", "Buenaventura", "Palmira", "Tuluá"] },
      { nombre: "Atlántico", ciudades: ["Barranquilla", "Soledad", "Malambo"] },
      { nombre: "Santander", ciudades: ["Bucaramanga", "Floridablanca", "Girón", "Barrancabermeja"] },
      { nombre: "Cundinamarca", ciudades: ["Soacha", "Facatativá", "Zipaquirá", "Chía"] },
      { nombre: "Nariño", ciudades: ["Pasto", "Tumaco", "Ipiales"] },
      { nombre: "Córdoba", ciudades: ["Montería", "Cereté", "Sahagún"] },
    ],
  },
  {
    codigo: "MX",
    nombre: "México",
    bandera: "🇲🇽",
    departamentos: [
      { nombre: "Ciudad de México", ciudades: ["Ciudad de México"] },
      { nombre: "Jalisco", ciudades: ["Guadalajara", "Zapopan", "Tlaquepaque", "Tonalá"] },
      { nombre: "Nuevo León", ciudades: ["Monterrey", "San Nicolás", "Guadalupe", "Apodaca"] },
      { nombre: "Oaxaca", ciudades: ["Oaxaca", "Salina Cruz", "Juchitán"] },
      { nombre: "Yucatán", ciudades: ["Mérida", "Valladolid", "Progreso"] },
      { nombre: "Puebla", ciudades: ["Puebla", "Tehuacán", "Atlixco"] },
    ],
  },
  {
    codigo: "PE",
    nombre: "Perú",
    bandera: "🇵🇪",
    departamentos: [
      { nombre: "Lima", ciudades: ["Lima", "Miraflores", "San Isidro", "Barranco"] },
      { nombre: "Cusco", ciudades: ["Cusco", "Pisac", "Ollantaytambo", "Aguas Calientes"] },
      { nombre: "Arequipa", ciudades: ["Arequipa", "Mollendo", "Camaná"] },
      { nombre: "La Libertad", ciudades: ["Trujillo", "Chimbote", "Huaraz"] },
    ],
  },
  {
    codigo: "ES",
    nombre: "España",
    bandera: "🇪🇸",
    departamentos: [
      { nombre: "Comunidad de Madrid", ciudades: ["Madrid", "Alcalá de Henares", "Getafe", "Leganés"] },
      { nombre: "Cataluña", ciudades: ["Barcelona", "Girona", "Tarragona", "Lleida"] },
      { nombre: "Andalucía", ciudades: ["Sevilla", "Málaga", "Granada", "Córdoba"] },
      { nombre: "Comunitat Valenciana", ciudades: ["Valencia", "Alicante", "Castellón"] },
    ],
  },
  {
    codigo: "JP",
    nombre: "Japón",
    bandera: "🇯🇵",
    departamentos: [
      { nombre: "Tokio", ciudades: ["Tokio", "Shinjuku", "Shibuya", "Akihabara"] },
      { nombre: "Osaka", ciudades: ["Osaka", "Namba", "Umeda"] },
      { nombre: "Kioto", ciudades: ["Kioto", "Arashiyama", "Fushimi"] },
      { nombre: "Hokkaido", ciudades: ["Sapporo", "Hakodate", "Asahikawa"] },
    ],
  },
  {
    codigo: "IT",
    nombre: "Italia",
    bandera: "🇮🇹",
    departamentos: [
      { nombre: "Lazio", ciudades: ["Roma", "Tivoli", "Viterbo"] },
      { nombre: "Lombardía", ciudades: ["Milán", "Bérgamo", "Brescia", "Como"] },
      { nombre: "Toscana", ciudades: ["Florencia", "Siena", "Pisa", "Livorno"] },
      { nombre: "Campania", ciudades: ["Nápoles", "Pompeya", "Salerno", "Amalfi"] },
    ],
  },
  {
    codigo: "US",
    nombre: "Estados Unidos",
    bandera: "🇺🇸",
    departamentos: [
      { nombre: "New York", ciudades: ["Nueva York", "Buffalo", "Rochester", "Syracuse"] },
      { nombre: "California", ciudades: ["Los Ángeles", "San Francisco", "San Diego", "Sacramento"] },
      { nombre: "Illinois", ciudades: ["Chicago", "Aurora", "Naperville", "Joliet"] },
      { nombre: "Florida", ciudades: ["Miami", "Orlando", "Tampa", "Jacksonville"] },
    ],
  },
];

// Helper: obtener ciudades aplanadas por país (para compatibilidad con mockData)
export function getCiudadesPorPais(codigoPais) {
  const pais = LOCATION_DATA.find(p => p.codigo === codigoPais);
  if (!pais) return [];
  return pais.departamentos.flatMap(d => d.ciudades);
}

// Helper: obtener departamento de una ciudad
export function getDepartamentoDeCiudad(codigoPais, ciudad) {
  const pais = LOCATION_DATA.find(p => p.codigo === codigoPais);
  if (!pais) return null;
  return pais.departamentos.find(d => d.ciudades.includes(ciudad))?.nombre || null;
}
