// ── Colombia — Valledupar (negocios originales) ───────────────
export const NEGOCIOS = [
  {
    id: 1,
    nombre: "La Parrilla de Don Lucho",
    categoria: "Carnes y asados",
    descripcion: "Asados a las brasas con leña de mangle, marinados 24 horas. La costilla es nuestra firma desde 1987.",
    portada: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400?w=600&q=80q=60?w=600&q=80auto=format&fit=crop",
    calificacion: 4.8,
    totalResenas: 124,
    etiquetas: ["carne asada", "costilla", "churrasco", "parrilla"],
    platoEstrella: { nombre: "Costilla a las brasas", precio: 28000 },
    platoEconomico: { nombre: "Pinchos mixtos", precio: 12000 },
    platoPremium: { nombre: "Churrasco completo", precio: 45000 },
    abierto: true,
    pais: "CO", ciudad: "Valledupar",
    sedes: [
      { id: 1, nombre: "Sede Centro", direccion: "Calle 15 #8-42, Centro", telefono: "3001234567", lat: 10.4631, lng: -73.2532, horario: { lunes: "11:00-22:00", martes: "11:00-22:00", miercoles: "11:00-22:00", jueves: "11:00-22:00", viernes: "11:00-23:00", sabado: "11:00-23:00", domingo: "11:00-21:00" } },
      { id: 2, nombre: "Sede Norte", direccion: "Carrera 19 #34-10, Barrio Los Almendros", telefono: "3009876543", lat: 10.4712, lng: -73.2498, horario: { lunes: "12:00-21:00", martes: "12:00-21:00", miercoles: "12:00-21:00", jueves: "12:00-21:00", viernes: "12:00-22:00", sabado: "12:00-22:00", domingo: "cerrado" } }
    ],
    resenas: [
      { id: 1, usuario: "Carlos M.", estrellas: 5, comentario: "La mejor costilla de Valledupar, punto. El ahumado es perfecto.", fecha: "2026-05-20" },
      { id: 2, usuario: "Paola R.", estrellas: 4, comentario: "Muy buena la carne, el servicio podría ser más rápido los fines de semana.", fecha: "2026-05-15" },
    ]
  },
  {
    id: 2,
    nombre: "El Desgranado Sabroso",
    categoria: "Comida típica",
    descripcion: "El desgranado más auténtico del Cesar. Maíz tierno desgranado, con hogao casero, suero costeño y chicharrón crujiente.",
    portada: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400?w=600&q=80q=60?w=600&q=80auto=format&fit=crop",
    calificacion: 4.6,
    totalResenas: 89,
    etiquetas: ["desgranado", "maíz", "comida típica", "costeño"],
    platoEstrella: { nombre: "Desgranado completo", precio: 9000 },
    platoEconomico: { nombre: "Desgranado sencillo", precio: 6000 },
    platoPremium: { nombre: "Desgranado especial con langostino", precio: 18000 },
    abierto: true,
    pais: "CO", ciudad: "Valledupar",
    sedes: [
      { id: 3, nombre: "Puesto Central", direccion: "Mercado Central, puesto 14", telefono: "3115556789", lat: 10.4648, lng: -73.2551, horario: { lunes: "06:00-13:00", martes: "06:00-13:00", miercoles: "06:00-13:00", jueves: "06:00-13:00", viernes: "06:00-14:00", sabado: "06:00-14:00", domingo: "07:00-12:00" } }
    ],
    resenas: [
      { id: 3, usuario: "Yesenia T.", estrellas: 5, comentario: "Me recuerda al que hacía mi abuela. El suero es casero de verdad.", fecha: "2026-06-01" },
      { id: 4, usuario: "Rodrigo P.", estrellas: 4, comentario: "Buenísimo el desgranado, a veces se acaban muy temprano.", fecha: "2026-05-28" },
    ]
  },
  {
    id: 3,
    nombre: "Fritos Donde la Negra",
    categoria: "Fritanga",
    descripcion: "Empanadas de pipián, carimañolas de queso, buñuelos de yuca y arepas de chócolo fritas. Todo hecho a mano desde las 5am.",
    portada: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400?w=600&q=80q=60?w=600&q=80auto=format&fit=crop",
    calificacion: 4.9,
    totalResenas: 211,
    etiquetas: ["empanadas", "carimañola", "fritanga", "buñuelos"],
    platoEstrella: { nombre: "Carimañola de queso", precio: 2500 },
    platoEconomico: { nombre: "Empanada de pipián", precio: 1500 },
    platoPremium: { nombre: "Bandeja mixta x6", precio: 14000 },
    abierto: false,
    pais: "CO", ciudad: "Valledupar",
    sedes: [
      { id: 4, nombre: "Frente al parque", direccion: "Frente al Parque Simón Bolívar, esquina", telefono: "3207778899", lat: 10.4625, lng: -73.2540, horario: { lunes: "05:00-10:00", martes: "05:00-10:00", miercoles: "05:00-10:00", jueves: "05:00-10:00", viernes: "05:00-11:00", sabado: "05:00-12:00", domingo: "cerrado" } }
    ],
    resenas: [
      { id: 5, usuario: "Marta C.", estrellas: 5, comentario: "Las carimañolas más ricas que he comido en mi vida, sin exagerar.", fecha: "2026-06-05" },
    ]
  },
  {
    id: 4,
    nombre: "Jugos Naturales El Frescor",
    categoria: "Jugos y bebidas",
    descripcion: "Más de 30 frutas frescas de la región. Nuestro corozo con limón y el mango biche con sal son los favoritos del barrio.",
    portada: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400?w=600&q=80q=60?w=600&q=80auto=format&fit=crop",
    calificacion: 4.7,
    totalResenas: 67,
    etiquetas: ["jugos", "corozo", "mango biche", "frutas naturales"],
    platoEstrella: { nombre: "Corozo con limón", precio: 4000 },
    platoEconomico: { nombre: "Limonada natural", precio: 2500 },
    platoPremium: { nombre: "Sorbete de guanábana", precio: 7000 },
    abierto: true,
    pais: "CO", ciudad: "Valledupar",
    sedes: [
      { id: 5, nombre: "Kiosko Principal", direccion: "Avenida Simón Bolívar con Calle 8, kiosko 3", telefono: "3124445566", lat: 10.4638, lng: -73.2520, horario: { lunes: "07:00-19:00", martes: "07:00-19:00", miercoles: "07:00-19:00", jueves: "07:00-19:00", viernes: "07:00-20:00", sabado: "07:00-20:00", domingo: "08:00-17:00" } }
    ],
    resenas: [
      { id: 6, usuario: "Luis A.", estrellas: 5, comentario: "El corozo con leche condensada es una experiencia espiritual.", fecha: "2026-06-03" },
      { id: 7, usuario: "Sandra V.", estrellas: 4, comentario: "Frescos y naturales de verdad, se nota que no usan concentrado.", fecha: "2026-05-30" },
    ]
  },
  {
    id: 5,
    nombre: "Arepa'e Huevo Don Beto",
    categoria: "Comida callejera",
    descripcion: "La arepa e' huevo frita más crocante del sur de Valledupar. Masa gruesa, huevo entero adentro, con hogao y ají casero al lado.",
    portada: "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=400?w=600&q=80q=60?w=600&q=80auto=format&fit=crop",
    calificacion: 4.5,
    totalResenas: 158,
    etiquetas: ["arepa e huevo", "frita", "desayuno", "callejero"],
    platoEstrella: { nombre: "Arepa e' huevo con hogao", precio: 5000 },
    platoEconomico: { nombre: "Arepa e' huevo sola", precio: 3500 },
    platoPremium: { nombre: "Arepa e' huevo con carne mechada", precio: 9000 },
    abierto: true,
    pais: "CO", ciudad: "Valledupar",
    sedes: [
      { id: 6, nombre: "Esquina de siempre", direccion: "Calle 22 con Carrera 12, barrio La Ceiba", telefono: "3016667788", lat: 10.4655, lng: -73.2575, horario: { lunes: "06:00-11:00", martes: "06:00-11:00", miercoles: "06:00-11:00", jueves: "06:00-11:00", viernes: "06:00-11:30", sabado: "06:00-13:00", domingo: "07:00-12:00" } }
    ],
    resenas: [
      { id: 8, usuario: "Jorge H.", estrellas: 5, comentario: "La masa es perfecta, bien gruesa y el huevo queda entero. Arte puro.", fecha: "2026-06-07" },
      { id: 9, usuario: "Adriana M.", estrellas: 4, comentario: "Las mejores arepas e' huevo que he probado fuera de Cartagena.", fecha: "2026-05-25" },
    ]
  },
  {
    id: 6,
    nombre: "Cevichería La Bahía",
    categoria: "Mariscos",
    descripcion: "Ceviches frescos preparados al momento. Camarón, sierra, pulpo y mixto. El leche de tigre se sirve aparte para los valientes.",
    portada: "https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=400?w=600&q=80q=60?w=600&q=80auto=format&fit=crop",
    calificacion: 4.4,
    totalResenas: 44,
    etiquetas: ["ceviche", "camarón", "mariscos", "leche de tigre"],
    platoEstrella: { nombre: "Ceviche mixto", precio: 22000 },
    platoEconomico: { nombre: "Ceviche de sierra", precio: 14000 },
    platoPremium: { nombre: "Ceviche de pulpo", precio: 32000 },
    abierto: true,
    pais: "CO", ciudad: "Valledupar",
    sedes: [
      { id: 7, nombre: "Local único", direccion: "Carrera 7 #16-30, Barrio El Centro", telefono: "3189998877", lat: 10.4619, lng: -73.2560, horario: { lunes: "cerrado", martes: "11:00-20:00", miercoles: "11:00-20:00", jueves: "11:00-20:00", viernes: "11:00-21:00", sabado: "10:00-21:00", domingo: "10:00-18:00" } }
    ],
    resenas: [
      { id: 10, usuario: "Camila O.", estrellas: 5, comentario: "El ceviche mixto está brutal. El leche de tigre es adictivo.", fecha: "2026-06-02" },
    ]
  },

  // ── México — Ciudad de México ────────────────────────────────
  {
    id: 101,
    nombre: "Tacos El Compadre",
    categoria: "Tacos y antojitos",
    descripcion: "Tacos de canasta y al pastor desde 1974. La salsa verde tatemada es receta familiar que no se vende, solo se come aquí.",
    portada: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400?w=600&q=80q=60?w=600&q=80auto=format&fit=crop",
    calificacion: 4.9,
    totalResenas: 342,
    etiquetas: ["tacos", "al pastor", "canasta", "antojitos", "salsa verde"],
    platoEstrella: { nombre: "Taco al pastor con piña", precio: 25 },
    platoEconomico: { nombre: "Taco de canasta de frijol", precio: 15 },
    platoPremium: { nombre: "Orden de suadero dorado x3", precio: 85 },
    abierto: true,
    pais: "MX", ciudad: "Ciudad de México",
    moneda: "MXN",
    sedes: [
      { id: 101, nombre: "Puesto Tepito", direccion: "Calle Libertad 22, Tepito, CDMX", telefono: "+525512345678", lat: 19.4395, lng: -99.1190, horario: { lunes: "08:00-15:00", martes: "08:00-15:00", miercoles: "08:00-15:00", jueves: "08:00-15:00", viernes: "08:00-16:00", sabado: "08:00-16:00", domingo: "08:00-14:00" } }
    ],
    resenas: [
      { id: 101, usuario: "Ricardo F.", estrellas: 5, comentario: "Los mejores tacos al pastor de la CDMX, sin discusión.", fecha: "2026-05-18" },
      { id: 102, usuario: "Daniela V.", estrellas: 5, comentario: "La salsa verde tatemada es otro nivel. Vine desde Guadalajara solo por esto.", fecha: "2026-05-10" },
    ]
  },
  {
    id: 102,
    nombre: "Pozolería La Guadalupana",
    categoria: "Caldos y sopas",
    descripcion: "Pozole rojo de cerdo con receta de Guerrero. Se cocina desde las 4am para que el caldo esté listo a las 10. Imperdible los domingos.",
    portada: "https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?w=400?w=600&q=80q=60?w=600&q=80auto=format&fit=crop",
    calificacion: 4.7,
    totalResenas: 198,
    etiquetas: ["pozole", "caldo", "cerdo", "guerrero", "domingo"],
    platoEstrella: { nombre: "Pozole rojo mediano", precio: 95 },
    platoEconomico: { nombre: "Pozole chico con tostadas", precio: 65 },
    platoPremium: { nombre: "Pozole grande con sopes", precio: 145 },
    abierto: false,
    pais: "MX", ciudad: "Ciudad de México",
    moneda: "MXN",
    sedes: [
      { id: 102, nombre: "Local Tepito", direccion: "Av. del Trabajo 110, Col. Morelos, CDMX", telefono: "+525598765432", lat: 19.4380, lng: -99.1205, horario: { lunes: "cerrado", martes: "cerrado", miercoles: "cerrado", jueves: "cerrado", viernes: "12:00-20:00", sabado: "10:00-21:00", domingo: "10:00-18:00" } }
    ],
    resenas: [
      { id: 103, usuario: "Lupita R.", estrellas: 5, comentario: "El pozole de los domingos es sagrado. No fallo nunca.", fecha: "2026-06-01" },
    ]
  },
  {
    id: 103,
    nombre: "Elotes y Esquites Doña Chuy",
    categoria: "Comida callejera",
    descripcion: "Elotes en vaso y esquites con chile, limón, mayonesa y queso cotija. Destino obligado en Xochimilco desde hace 30 años.",
    portada: "https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=400?w=600&q=80q=60?w=600&q=80auto=format&fit=crop",
    calificacion: 4.6,
    totalResenas: 77,
    etiquetas: ["elotes", "esquites", "cotija", "callejero", "xochimilco"],
    platoEstrella: { nombre: "Esquite en vaso mediano", precio: 35 },
    platoEconomico: { nombre: "Elote en palo", precio: 25 },
    platoPremium: { nombre: "Esquite grande con totopos", precio: 55 },
    abierto: true,
    pais: "MX", ciudad: "Ciudad de México",
    moneda: "MXN",
    sedes: [
      { id: 103, nombre: "Embarcadero Xochimilco", direccion: "Embarcadero Nuevo Nativitas, Xochimilco", telefono: "+525567891234", lat: 19.2652, lng: -99.1044, horario: { lunes: "10:00-19:00", martes: "10:00-19:00", miercoles: "10:00-19:00", jueves: "10:00-19:00", viernes: "10:00-20:00", sabado: "09:00-21:00", domingo: "09:00-21:00" } }
    ],
    resenas: [
      { id: 104, usuario: "Mariana P.", estrellas: 4, comentario: "Los esquites están deliciosos, aunque en fin de semana hay cola.", fecha: "2026-05-22" },
    ]
  },

  // ── Perú — Lima ──────────────────────────────────────────────
  {
    id: 201,
    nombre: "La Cevichería del Puerto",
    categoria: "Mariscos",
    descripcion: "Ceviche limeño clásico con leche de tigre preparada al momento. Tres generaciones de familia puertorriqueña en el Callao.",
    portada: "https://images.unsplash.com/photo-1637071487892-3d7cd68d7c2f?w=400?w=600&q=80q=60?w=600&q=80auto=format&fit=crop",
    calificacion: 4.9,
    totalResenas: 521,
    etiquetas: ["ceviche", "leche de tigre", "callao", "mariscos", "limeño"],
    platoEstrella: { nombre: "Ceviche mixto limeño", precio: 38 },
    platoEconomico: { nombre: "Ceviche de corvina", precio: 28 },
    platoPremium: { nombre: "Parihuela del Callao", precio: 55 },
    abierto: true,
    pais: "PE", ciudad: "Lima",
    moneda: "PEN",
    sedes: [
      { id: 201, nombre: "Local Callao", direccion: "Av. Saenz Peña 302, Callao, Lima", telefono: "+51015551234", lat: -12.0622, lng: -77.1302, horario: { lunes: "11:00-17:00", martes: "11:00-17:00", miercoles: "11:00-17:00", jueves: "11:00-17:00", viernes: "11:00-18:00", sabado: "10:00-18:00", domingo: "10:00-16:00" } }
    ],
    resenas: [
      { id: 201, usuario: "Sofía M.", estrellas: 5, comentario: "El leche de tigre aquí no tiene comparación. Vengo cada semana.", fecha: "2026-06-04" },
      { id: 202, usuario: "Andrés C.", estrellas: 5, comentario: "La parihuela caliente en un día de garúa es lo mejor del mundo.", fecha: "2026-05-29" },
    ]
  },
  {
    id: 202,
    nombre: "Anticuchos Doña Grimanesa",
    categoria: "Comida callejera",
    descripcion: "Anticuchos de corazón a la brasa, la receta más famosa de Lima. Cola que vale la pena. Tradición viva en Miraflores desde 1960.",
    portada: "https://images.unsplash.com/photo-1606851091851-e8c8c0fea6b2?w=400?w=600&q=80q=60?w=600&q=80auto=format&fit=crop",
    calificacion: 4.8,
    totalResenas: 890,
    etiquetas: ["anticuchos", "corazón", "parrilla", "miraflores", "noche"],
    platoEstrella: { nombre: "Anticucho de corazón x2", precio: 18 },
    platoEconomico: { nombre: "Rachi con papas", precio: 12 },
    platoPremium: { nombre: "Parrillada completa x4", precio: 48 },
    abierto: false,
    pais: "PE", ciudad: "Lima",
    moneda: "PEN",
    sedes: [
      { id: 202, nombre: "Puesto Miraflores", direccion: "Av. Larco con Av. Díez Canseco, Miraflores", telefono: "+51015559876", lat: -12.1231, lng: -77.0308, horario: { lunes: "cerrado", martes: "cerrado", miercoles: "18:00-23:00", jueves: "18:00-23:00", viernes: "18:00-00:00", sabado: "18:00-00:00", domingo: "18:00-23:00" } }
    ],
    resenas: [
      { id: 203, usuario: "Isabella R.", estrellas: 5, comentario: "Un ícono de Lima. La espera de media hora vale cada segundo.", fecha: "2026-05-31" },
    ]
  },

  // ── España — Madrid ──────────────────────────────────────────
  {
    id: 301,
    nombre: "Bar Pintxos Donostia",
    categoria: "Tapas y pintxos",
    descripcion: "Pintxos vascos en pleno Madrid. El de anchoa con pimiento del piquillo y el de gamba al ajillo son nuestra seña de identidad.",
    portada: "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=400?w=600&q=80q=60?w=600&q=80auto=format&fit=crop",
    calificacion: 4.7,
    totalResenas: 267,
    etiquetas: ["pintxos", "tapas", "vasco", "anchoa", "gamba", "txakoli"],
    platoEstrella: { nombre: "Pintxo de anchoa con piquillo", precio: 3.5 },
    platoEconomico: { nombre: "Pan con tomate", precio: 2.0 },
    platoPremium: { nombre: "Tabla pintxos surtidos x8", precio: 22.0 },
    abierto: true,
    pais: "ES", ciudad: "Madrid",
    moneda: "EUR",
    sedes: [
      { id: 301, nombre: "Bar Malasaña", direccion: "Calle Fuencarral 88, Malasaña, Madrid", telefono: "+34911234567", lat: 40.4273, lng: -3.7034, horario: { lunes: "12:00-00:00", martes: "12:00-00:00", miercoles: "12:00-00:00", jueves: "12:00-01:00", viernes: "12:00-02:00", sabado: "12:00-02:00", domingo: "12:00-23:00" } }
    ],
    resenas: [
      { id: 301, usuario: "Elena T.", estrellas: 5, comentario: "Lo mejor del País Vasco sin salir de Madrid. El txakoli frío y los pintxos, perfectos.", fecha: "2026-05-20" },
      { id: 302, usuario: "Miguel A.", estrellas: 4, comentario: "Los pintxos son buenos de verdad, aunque a veces se llenan demasiado.", fecha: "2026-05-14" },
    ]
  },
  {
    id: 302,
    nombre: "Bocadillería Cascorro",
    categoria: "Bocadillos y sándwiches",
    descripcion: "Bocadillos de calamares en su tinta a la madrileña, desde 1952 en el Rastro. El secreto es el aceite de oliva virgen y el pan de barra crujiente.",
    portada: "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400?w=600&q=80q=60?w=600&q=80auto=format&fit=crop",
    calificacion: 4.5,
    totalResenas: 134,
    etiquetas: ["bocadillo", "calamares", "rastro", "madrid", "tinta"],
    platoEstrella: { nombre: "Bocadillo de calamares con alioli", precio: 5.5 },
    platoEconomico: { nombre: "Bocadillo de calamares simple", precio: 4.0 },
    platoPremium: { nombre: "Ración de calamares con patatas", precio: 12.0 },
    abierto: true,
    pais: "ES", ciudad: "Madrid",
    moneda: "EUR",
    sedes: [
      { id: 302, nombre: "Local El Rastro", direccion: "Plaza de Cascorro 3, La Latina, Madrid", telefono: "+34915678901", lat: 40.4098, lng: -3.7085, horario: { lunes: "cerrado", martes: "10:00-16:00", miercoles: "10:00-16:00", jueves: "10:00-16:00", viernes: "10:00-17:00", sabado: "09:00-17:00", domingo: "09:00-15:00" } }
    ],
    resenas: [
      { id: 303, usuario: "Carmen L.", estrellas: 5, comentario: "Un clásico de Madrid. No entiendo cómo algo tan sencillo puede ser tan bueno.", fecha: "2026-06-06" },
    ]
  },

  // ── Japón — Tokio ────────────────────────────────────────────
  {
    id: 401,
    nombre: "Ramen Ichiban",
    categoria: "Ramen y noodles",
    descripcion: "Ramen de tonkotsu con caldo de hueso de cerdo cocido 18 horas. El tare de soja tostada lo prepara el chef Tanaka cada mañana.",
    portada: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400?w=600&q=80q=60?w=600&q=80auto=format&fit=crop",
    calificacion: 4.9,
    totalResenas: 1203,
    etiquetas: ["ramen", "tonkotsu", "noodles", "caldo", "huevo marinado"],
    platoEstrella: { nombre: "Tonkotsu ramen completo", precio: 1200 },
    platoEconomico: { nombre: "Shoyu ramen simple", precio: 850 },
    platoPremium: { nombre: "Ramen especial con chashu extra", precio: 1800 },
    abierto: true,
    pais: "JP", ciudad: "Tokio",
    moneda: "JPY",
    sedes: [
      { id: 401, nombre: "Local Shinjuku", direccion: "1-2-3 Kabukicho, Shinjuku-ku, Tokyo", telefono: "+81335551234", lat: 35.6938, lng: 139.7034, horario: { lunes: "11:00-23:00", martes: "11:00-23:00", miercoles: "11:00-23:00", jueves: "11:00-23:00", viernes: "11:00-00:00", sabado: "11:00-00:00", domingo: "11:00-22:00" } }
    ],
    resenas: [
      { id: 401, usuario: "Kenji W.", estrellas: 5, comentario: "The broth is incredibly rich. Queue up early — they close when the soup runs out.", fecha: "2026-05-25" },
      { id: 402, usuario: "Yuki S.", estrellas: 5, comentario: "Best tonkotsu in Shinjuku, no contest. The ajitsuke tamago is perfect.", fecha: "2026-05-18" },
    ]
  },
  {
    id: 402,
    nombre: "Takoyaki Osaka-ya",
    categoria: "Comida callejera",
    descripcion: "Takoyaki al estilo Osaka con pulpo fresco, cebollines y jengibre. Salsa especial y katsuobushi encima. Crujientes por fuera, cremosos por dentro.",
    portada: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=400?w=600&q=80q=60?w=600&q=80auto=format&fit=crop",
    calificacion: 4.7,
    totalResenas: 456,
    etiquetas: ["takoyaki", "pulpo", "osaka", "callejero", "katsuobushi"],
    platoEstrella: { nombre: "Takoyaki x8 con salsa", precio: 600 },
    platoEconomico: { nombre: "Takoyaki x4", precio: 350 },
    platoPremium: { nombre: "Takoyaki premium con mayonesa de trufas", precio: 950 },
    abierto: false,
    pais: "JP", ciudad: "Tokio",
    moneda: "JPY",
    sedes: [
      { id: 402, nombre: "Puesto Asakusa", direccion: "2-4-1 Asakusa, Taito-ku, Tokyo", telefono: "+81335559876", lat: 35.7148, lng: 139.7967, horario: { lunes: "10:00-20:00", martes: "10:00-20:00", miercoles: "cerrado", jueves: "10:00-20:00", viernes: "10:00-21:00", sabado: "09:00-21:00", domingo: "09:00-20:00" } }
    ],
    resenas: [
      { id: 403, usuario: "Hana M.", estrellas: 4, comentario: "Great takoyaki with generous octopus pieces. A little pricey but worth it.", fecha: "2026-05-30" },
    ]
  },

  // ── Italia — Roma ────────────────────────────────────────────
  {
    id: 501,
    nombre: "Trattoria da Nonna Rosa",
    categoria: "Pasta y risotto",
    descripcion: "Pasta fresca al huevo preparada cada mañana. La cacio e pepe de la nonna Rosa sigue la receta romana original: solo queso pecorino, pimienta negra y pasta.",
    portada: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400?w=600&q=80q=60?w=600&q=80auto=format&fit=crop",
    calificacion: 4.8,
    totalResenas: 389,
    etiquetas: ["pasta", "cacio e pepe", "carbonara", "amatriciana", "trattoria"],
    platoEstrella: { nombre: "Cacio e pepe della nonna", precio: 14 },
    platoEconomico: { nombre: "Spaghetti al pomodoro", precio: 9 },
    platoPremium: { nombre: "Tagliatelle al ragù bolognese", precio: 18 },
    abierto: true,
    pais: "IT", ciudad: "Roma",
    moneda: "EUR",
    sedes: [
      { id: 501, nombre: "Local Trastevere", direccion: "Vicolo del Cinque 18, Trastevere, Roma", telefono: "+390665432100", lat: 41.8895, lng: 12.4698, horario: { lunes: "12:00-15:00", martes: "12:00-15:00", miercoles: "12:00-15:00", jueves: "12:00-15:00", viernes: "12:00-15:00", sabado: "12:00-23:00", domingo: "12:00-22:00" } },
      { id: 502, nombre: "Local Prati", direccion: "Via Candia 55, Prati, Roma", telefono: "+390665439988", lat: 41.9074, lng: 12.4580, horario: { lunes: "19:00-23:00", martes: "19:00-23:00", miercoles: "19:00-23:00", jueves: "19:00-23:00", viernes: "19:00-00:00", sabado: "12:00-00:00", domingo: "cerrado" } }
    ],
    resenas: [
      { id: 501, usuario: "Francesca B.", estrellas: 5, comentario: "La vera cucina romana. La cacio e pepe è un'opera d'arte.", fecha: "2026-05-27" },
      { id: 502, usuario: "Marco V.", estrellas: 5, comentario: "Nonna Rosa's carbonara is the only carbonara. Period.", fecha: "2026-05-20" },
    ]
  },
  {
    id: 502,
    nombre: "Pizzeria Borghese",
    categoria: "Pizza",
    descripcion: "Pizza romana al taglio, fina y crujiente. Masa de 72 horas de fermentación. La margherita con burrata fresca y albahaca del huerto es la favorita del barrio.",
    portada: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400?w=600&q=80q=60?w=600&q=80auto=format&fit=crop",
    calificacion: 4.6,
    totalResenas: 221,
    etiquetas: ["pizza", "al taglio", "romana", "burrata", "margherita"],
    platoEstrella: { nombre: "Pizza margherita con burrata", precio: 11 },
    platoEconomico: { nombre: "Pizza bianca con mortadella", precio: 6 },
    platoPremium: { nombre: "Pizza al tartufo nero", precio: 19 },
    abierto: true,
    pais: "IT", ciudad: "Roma",
    moneda: "EUR",
    sedes: [
      { id: 503, nombre: "Via del Corso", direccion: "Via del Corso 210, Centro Storico, Roma", telefono: "+390661234567", lat: 41.9009, lng: 12.4790, horario: { lunes: "10:00-22:00", martes: "10:00-22:00", miercoles: "10:00-22:00", jueves: "10:00-22:00", viernes: "10:00-23:00", sabado: "10:00-23:00", domingo: "11:00-21:00" } }
    ],
    resenas: [
      { id: 503, usuario: "Giulia F.", estrellas: 5, comentario: "La pizza al taglio più buona di Roma. Croccante e leggera, paradiso.", fecha: "2026-06-02" },
    ]
  },

  // ── Estados Unidos — Nueva York ───────────────────────────────
  {
    id: 601,
    nombre: "Katz's Deli-Style Corner",
    categoria: "Deli y sándwiches",
    descripcion: "Pastrami on rye al estilo Lower East Side. Carne curada 10 días, ahumada en horno de ladrillo. El corned beef hash del desayuno agota antes del mediodía.",
    portada: "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400?w=600&q=80q=60?w=600&q=80auto=format&fit=crop",
    calificacion: 4.7,
    totalResenas: 672,
    etiquetas: ["pastrami", "deli", "rye", "corned beef", "new york"],
    platoEstrella: { nombre: "Pastrami on rye", precio: 18 },
    platoEconomico: { nombre: "Matzo ball soup", precio: 9 },
    platoPremium: { nombre: "Reuben sandwich with fries", precio: 24 },
    abierto: true,
    pais: "US", ciudad: "Nueva York",
    moneda: "USD",
    sedes: [
      { id: 601, nombre: "LES Location", direccion: "205 E Houston St, Lower East Side, New York", telefono: "+12125554321", lat: 40.7223, lng: -73.9874, horario: { lunes: "08:00-22:00", martes: "08:00-22:00", miercoles: "08:00-22:00", jueves: "08:00-22:00", viernes: "08:00-23:00", sabado: "08:00-23:00", domingo: "08:00-22:00" } }
    ],
    resenas: [
      { id: 601, usuario: "David K.", estrellas: 5, comentario: "Hands down the best pastrami in the city. Thick-cut, perfectly fatty.", fecha: "2026-05-22" },
      { id: 602, usuario: "Rachel S.", estrellas: 4, comentario: "The matzo ball soup is phenomenal. A little pricey but NYC prices.", fecha: "2026-05-15" },
    ]
  },
  {
    id: 602,
    nombre: "Brooklyn Bagel Co.",
    categoria: "Panadería y desayunos",
    descripcion: "Bagels hervidos y horneados en piedra al estilo Brooklyn original. El lox and cream cheese con cebolla roja y alcaparras es el favorito de la ciudad.",
    portada: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400?w=600&q=80q=60?w=600&q=80auto=format&fit=crop",
    calificacion: 4.5,
    totalResenas: 445,
    etiquetas: ["bagel", "lox", "cream cheese", "brooklyn", "desayuno"],
    platoEstrella: { nombre: "Lox bagel with all the fixings", precio: 14 },
    platoEconomico: { nombre: "Plain bagel with butter", precio: 3.5 },
    platoPremium: { nombre: "Nova lox platter for two", precio: 32 },
    abierto: false,
    pais: "US", ciudad: "Nueva York",
    moneda: "USD",
    sedes: [
      { id: 602, nombre: "Williamsburg Store", direccion: "388 Bedford Ave, Williamsburg, Brooklyn", telefono: "+17185556789", lat: 40.7128, lng: -73.9609, horario: { lunes: "06:00-14:00", martes: "06:00-14:00", miercoles: "06:00-14:00", jueves: "06:00-14:00", viernes: "06:00-15:00", sabado: "06:00-15:00", domingo: "07:00-13:00" } }
    ],
    resenas: [
      { id: 603, usuario: "Sarah M.", estrellas: 5, comentario: "The lox bagel is everything. They run out by 11am on weekends so get here early!", fecha: "2026-06-01" },
    ]
  },
];

// ── Catálogo de países disponibles ───────────────────────────
export const PAISES = [
  { codigo: "CO", nombre: "Colombia",       bandera: "🇨🇴", ciudades: ["Valledupar", "Bogotá", "Medellín", "Cartagena", "Cali"] },
  { codigo: "MX", nombre: "México",         bandera: "🇲🇽", ciudades: ["Ciudad de México", "Guadalajara", "Monterrey", "Oaxaca"] },
  { codigo: "PE", nombre: "Perú",           bandera: "🇵🇪", ciudades: ["Lima", "Cusco", "Arequipa", "Trujillo"] },
  { codigo: "ES", nombre: "España",         bandera: "🇪🇸", ciudades: ["Madrid", "Barcelona", "Sevilla", "Valencia"] },
  { codigo: "JP", nombre: "Japón",          bandera: "🇯🇵", ciudades: ["Tokio", "Osaka", "Kioto", "Sapporo"] },
  { codigo: "IT", nombre: "Italia",         bandera: "🇮🇹", ciudades: ["Roma", "Milán", "Florencia", "Nápoles"] },
  { codigo: "US", nombre: "Estados Unidos", bandera: "🇺🇸", ciudades: ["Nueva York", "Los Ángeles", "Chicago", "Miami"] },
];

// Mapa de símbolos de moneda para display en frontend
export const MONEDAS = {
  COP: { simbolo: "$",  nombre: "Pesos COP" },
  MXN: { simbolo: "$",  nombre: "Pesos MXN" },
  PEN: { simbolo: "S/", nombre: "Soles"     },
  EUR: { simbolo: "€",  nombre: "Euros"     },
  JPY: { simbolo: "¥",  nombre: "Yenes"     },
  USD: { simbolo: "$",  nombre: "Dólares"   },
};
