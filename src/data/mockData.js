export const NEGOCIOS = [
  {
    id: 1,
    nombre: "La Parrilla de Don Lucho",
    categoria: "Carnes y asados",
    descripcion: "Asados a las brasas con leña de mangle, marinados 24 horas. La costilla es nuestra firma desde 1987.",
    portada: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
    calificacion: 4.8,
    totalResenas: 124,
    etiquetas: ["carne asada", "costilla", "churrasco", "parrilla"],
    platoEstrella: { nombre: "Costilla a las brasas", precio: 28000 },
    platoEconomico: { nombre: "Pinchos mixtos", precio: 12000 },
    platoPremium: { nombre: "Churrasco completo", precio: 45000 },
    abierto: true,
    sedes: [
      {
        id: 1,
        nombre: "Sede Centro",
        direccion: "Calle 15 #8-42, Centro",
        telefono: "3001234567",
        lat: 10.4631,
        lng: -73.2532,
        horario: { lunes: "11:00-22:00", martes: "11:00-22:00", miercoles: "11:00-22:00", jueves: "11:00-22:00", viernes: "11:00-23:00", sabado: "11:00-23:00", domingo: "11:00-21:00" }
      },
      {
        id: 2,
        nombre: "Sede Norte",
        direccion: "Carrera 19 #34-10, Barrio Los Almendros",
        telefono: "3009876543",
        lat: 10.4712,
        lng: -73.2498,
        horario: { lunes: "12:00-21:00", martes: "12:00-21:00", miercoles: "12:00-21:00", jueves: "12:00-21:00", viernes: "12:00-22:00", sabado: "12:00-22:00", domingo: "cerrado" }
      }
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
    portada: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80",
    calificacion: 4.6,
    totalResenas: 89,
    etiquetas: ["desgranado", "maíz", "comida típica", "costeño"],
    platoEstrella: { nombre: "Desgranado completo", precio: 9000 },
    platoEconomico: { nombre: "Desgranado sencillo", precio: 6000 },
    platoPremium: { nombre: "Desgranado especial con langostino", precio: 18000 },
    abierto: true,
    sedes: [
      {
        id: 3,
        nombre: "Puesto Central",
        direccion: "Mercado Central, puesto 14",
        telefono: "3115556789",
        lat: 10.4648,
        lng: -73.2551,
        horario: { lunes: "06:00-13:00", martes: "06:00-13:00", miercoles: "06:00-13:00", jueves: "06:00-13:00", viernes: "06:00-14:00", sabado: "06:00-14:00", domingo: "07:00-12:00" }
      }
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
    portada: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80",
    calificacion: 4.9,
    totalResenas: 211,
    etiquetas: ["empanadas", "carimañola", "fritanga", "buñuelos"],
    platoEstrella: { nombre: "Carimañola de queso", precio: 2500 },
    platoEconomico: { nombre: "Empanada de pipián", precio: 1500 },
    platoPremium: { nombre: "Bandeja mixta x6", precio: 14000 },
    abierto: false,
    sedes: [
      {
        id: 4,
        nombre: "Frente al parque",
        direccion: "Frente al Parque Simón Bolívar, esquina",
        telefono: "3207778899",
        lat: 10.4625,
        lng: -73.2540,
        horario: { lunes: "05:00-10:00", martes: "05:00-10:00", miercoles: "05:00-10:00", jueves: "05:00-10:00", viernes: "05:00-11:00", sabado: "05:00-12:00", domingo: "cerrado" }
      }
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
    portada: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80",
    calificacion: 4.7,
    totalResenas: 67,
    etiquetas: ["jugos", "corozo", "mango biche", "frutas naturales"],
    platoEstrella: { nombre: "Corozo con limón", precio: 4000 },
    platoEconomico: { nombre: "Limonada natural", precio: 2500 },
    platoPremium: { nombre: "Sorbete de guanábana", precio: 7000 },
    abierto: true,
    sedes: [
      {
        id: 5,
        nombre: "Kiosko Principal",
        direccion: "Avenida Simón Bolívar con Calle 8, kiosko 3",
        telefono: "3124445566",
        lat: 10.4638,
        lng: -73.2520,
        horario: { lunes: "07:00-19:00", martes: "07:00-19:00", miercoles: "07:00-19:00", jueves: "07:00-19:00", viernes: "07:00-20:00", sabado: "07:00-20:00", domingo: "08:00-17:00" }
      }
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
    portada: "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&q=80",
    calificacion: 4.5,
    totalResenas: 158,
    etiquetas: ["arepa e huevo", "frita", "desayuno", "callejero"],
    platoEstrella: { nombre: "Arepa e' huevo con hogao", precio: 5000 },
    platoEconomico: { nombre: "Arepa e' huevo sola", precio: 3500 },
    platoPremium: { nombre: "Arepa e' huevo con carne mechada", precio: 9000 },
    abierto: true,
    sedes: [
      {
        id: 6,
        nombre: "Esquina de siempre",
        direccion: "Calle 22 con Carrera 12, barrio La Ceiba",
        telefono: "3016667788",
        lat: 10.4655,
        lng: -73.2575,
        horario: { lunes: "06:00-11:00", martes: "06:00-11:00", miercoles: "06:00-11:00", jueves: "06:00-11:00", viernes: "06:00-11:30", sabado: "06:00-13:00", domingo: "07:00-12:00" }
      }
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
    portada: "https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=600&q=80",
    calificacion: 4.4,
    totalResenas: 44,
    etiquetas: ["ceviche", "camarón", "mariscos", "leche de tigre"],
    platoEstrella: { nombre: "Ceviche mixto", precio: 22000 },
    platoEconomico: { nombre: "Ceviche de sierra", precio: 14000 },
    platoPremium: { nombre: "Ceviche de pulpo", precio: 32000 },
    abierto: true,
    sedes: [
      {
        id: 7,
        nombre: "Local único",
        direccion: "Carrera 7 #16-30, Barrio El Centro",
        telefono: "3189998877",
        lat: 10.4619,
        lng: -73.2560,
        horario: { lunes: "cerrado", martes: "11:00-20:00", miercoles: "11:00-20:00", jueves: "11:00-20:00", viernes: "11:00-21:00", sabado: "10:00-21:00", domingo: "10:00-18:00" }
      }
    ],
    resenas: [
      { id: 10, usuario: "Camila O.", estrellas: 5, comentario: "El ceviche mixto está brutal. El leche de tigre es adictivo.", fecha: "2026-06-02" },
    ]
  }
];