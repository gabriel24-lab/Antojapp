// ─────────────────────────────────────────────────────────────────────────────
// Categorías de comida por país — AntojApp
// Iconos exclusivamente de lucide-react (sin emojis)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cada categoría tiene:
 *  - nombre   : string  → texto visible y valor usado en filtros/backend
 *  - icon     : string  → clave del mapa AppIcon (o nombre directo de Lucide)
 *
 * Los iconos marcados con (lucide-directo) aún no están en AppIcon;
 * se añaden en la exportación ICONOS_EXTRA para que AppIcon los registre.
 */

// ── Global (sin país seleccionado) ───────────────────────────────────────────
export const CATEGORIAS_GLOBALES = [
  { nombre: "Hamburguesas",    icon: "hamburger" },
  { nombre: "Pizza",           icon: "pizza" },
  { nombre: "Mariscos",        icon: "shrimp" },
  { nombre: "Carnes",          icon: "beef" },
  { nombre: "Pollo",           icon: "drumstick" },
  { nombre: "Sushi",           icon: "fish" },
  { nombre: "Ensaladas",       icon: "salad" },
  { nombre: "Sopas y caldos",  icon: "soup" },
  { nombre: "Desayunos",       icon: "eggFried" },
  { nombre: "Postres",         icon: "iceCreamCone" },
  { nombre: "Bebidas",         icon: "cupSoda" },
  { nombre: "Panadería",       icon: "croissant" },
  { nombre: "Sándwiches",      icon: "sandwich" },
  { nombre: "Vegetariano",     icon: "leafyGreen" },
  { nombre: "Comida rápida",   icon: "forkKnife" },
];

// ── Colombia 🇨🇴 ─────────────────────────────────────────────────────────────
const CATEGORIAS_CO = [
  { nombre: "Carnes y asados", icon: "beef" },
  { nombre: "Arepas",          icon: "wheat" },
  { nombre: "Fritanga",        icon: "flame" },
  { nombre: "Sopas y sancocho",icon: "soup" },
  { nombre: "Mariscos",        icon: "shrimp" },
  { nombre: "Tamales",         icon: "cookingPot" },
  { nombre: "Desayunos",       icon: "eggFried" },
  { nombre: "Jugos naturales", icon: "citrus" },
  { nombre: "Postres y dulces",icon: "candy" },
  { nombre: "Comida típica",   icon: "utensils" },
  { nombre: "Comida callejera",icon: "forkKnife" },
  { nombre: "Café y bebidas",  icon: "coffee" },
  { nombre: "Panadería",       icon: "croissant" },
  { nombre: "Vegetariano",     icon: "leafyGreen" },
];

// ── México 🇲🇽 ────────────────────────────────────────────────────────────────
const CATEGORIAS_MX = [
  { nombre: "Tacos",            icon: "wheat" },
  { nombre: "Mariscos",         icon: "shrimp" },
  { nombre: "Sopas y caldos",   icon: "soup" },
  { nombre: "Tamales",          icon: "cookingPot" },
  { nombre: "Carnes",           icon: "beef" },
  { nombre: "Desayunos",        icon: "eggFried" },
  { nombre: "Antojitos",        icon: "forkKnife" },
  { nombre: "Postres y dulces", icon: "iceCreamCone" },
  { nombre: "Café y bebidas",   icon: "coffee" },
  { nombre: "Panadería",        icon: "croissant" },
  { nombre: "Comida típica",    icon: "utensils" },
  { nombre: "Vegetariano",      icon: "leafyGreen" },
];

// ── Perú 🇵🇪 ──────────────────────────────────────────────────────────────────
const CATEGORIAS_PE = [
  { nombre: "Ceviche",          icon: "fish" },
  { nombre: "Pollo a la brasa", icon: "drumstick" },
  { nombre: "Carnes",           icon: "beef" },
  { nombre: "Sopas criollas",   icon: "soup" },
  { nombre: "Mariscos",         icon: "shrimp" },
  { nombre: "Chifa",            icon: "forkKnife" },
  { nombre: "Desayunos",        icon: "eggFried" },
  { nombre: "Postres y dulces", icon: "iceCreamCone" },
  { nombre: "Café y bebidas",   icon: "coffee" },
  { nombre: "Comida típica",    icon: "utensils" },
  { nombre: "Panadería",        icon: "croissant" },
  { nombre: "Vegetariano",      icon: "leafyGreen" },
];

// ── España 🇪🇸 ────────────────────────────────────────────────────────────────
const CATEGORIAS_ES = [
  { nombre: "Paella y arroces", icon: "cookingPot" },
  { nombre: "Tapas y pinchos",  icon: "forkKnife" },
  { nombre: "Jamón y embutidos",icon: "ham" },
  { nombre: "Pescados",         icon: "fish" },
  { nombre: "Mariscos",         icon: "shrimp" },
  { nombre: "Bocadillos",       icon: "sandwich" },
  { nombre: "Desayunos",        icon: "eggFried" },
  { nombre: "Postres y dulces", icon: "candy" },
  { nombre: "Vinos y bodegas",  icon: "wine" },
  { nombre: "Pizza y pasta",    icon: "pizza" },
  { nombre: "Cocidos y potajes",icon: "soup" },
  { nombre: "Vegetariano",      icon: "leafyGreen" },
];

// ── Japón 🇯🇵 ─────────────────────────────────────────────────────────────────
const CATEGORIAS_JP = [
  { nombre: "Sushi y sashimi",  icon: "fish" },
  { nombre: "Ramen",            icon: "soup" },
  { nombre: "Tempura",          icon: "flame" },
  { nombre: "Bento y donburi",  icon: "cookingPot" },
  { nombre: "Gyoza y onigiri",  icon: "wheat" },
  { nombre: "Yakitori",         icon: "drumstick" },
  { nombre: "Curry japonés",    icon: "forkKnife" },
  { nombre: "Postres wagashi",  icon: "iceCreamCone" },
  { nombre: "Café y matcha",    icon: "coffee" },
  { nombre: "Ensaladas y tofu", icon: "salad" },
  { nombre: "Hot pot",          icon: "soup" },
  { nombre: "Mariscos",         icon: "shrimp" },
];

// ── Italia 🇮🇹 ────────────────────────────────────────────────────────────────
const CATEGORIAS_IT = [
  { nombre: "Pizza",            icon: "pizza" },
  { nombre: "Pastas",           icon: "forkKnife" },
  { nombre: "Risotto",          icon: "cookingPot" },
  { nombre: "Carnes",           icon: "beef" },
  { nombre: "Pescados",         icon: "fish" },
  { nombre: "Mariscos",         icon: "shrimp" },
  { nombre: "Desayunos",        icon: "croissant" },
  { nombre: "Gelato y postres", icon: "iceCreamCone" },
  { nombre: "Café y espresso",  icon: "coffee" },
  { nombre: "Antipasti",        icon: "salad" },
  { nombre: "Vinos",            icon: "wine" },
  { nombre: "Panini",           icon: "sandwich" },
];

// ── Estados Unidos 🇺🇸 ───────────────────────────────────────────────────────
const CATEGORIAS_US = [
  { nombre: "Burgers y BBQ",   icon: "hamburger" },
  { nombre: "Pizza",           icon: "pizza" },
  { nombre: "Tex-Mex",         icon: "flame" },
  { nombre: "Fried Chicken",   icon: "drumstick" },
  { nombre: "Brunch",          icon: "eggFried" },
  { nombre: "Mariscos",        icon: "shrimp" },
  { nombre: "Sándwiches",      icon: "sandwich" },
  { nombre: "Postres y donuts",icon: "donut" },
  { nombre: "Café y bebidas",  icon: "coffee" },
  { nombre: "Ensaladas",       icon: "salad" },
  { nombre: "Sushi fusion",    icon: "fish" },
  { nombre: "Carnes",          icon: "beef" },
];

// ── Mapa principal ────────────────────────────────────────────────────────────
export const CATEGORIAS_POR_PAIS = {
  CO: CATEGORIAS_CO,
  MX: CATEGORIAS_MX,
  PE: CATEGORIAS_PE,
  ES: CATEGORIAS_ES,
  JP: CATEGORIAS_JP,
  IT: CATEGORIAS_IT,
  US: CATEGORIAS_US,
};

/**
 * Devuelve las categorías para el iso2 dado.
 * Si no hay país o no está en el mapa, retorna las globales.
 */
export function getCategoriasPorPais(iso2) {
  if (!iso2) return CATEGORIAS_GLOBALES;
  return CATEGORIAS_POR_PAIS[iso2] ?? CATEGORIAS_GLOBALES;
}

/**
 * Lista unificada (sin duplicados de nombre) de TODAS las categorías
 * de todos los países + globales. Útil para el FormularioNegocio.
 */
export const TODAS_LAS_CATEGORIAS = (() => {
  const vistas = new Set();
  const resultado = [];
  const todas = [
    ...CATEGORIAS_GLOBALES,
    ...CATEGORIAS_CO,
    ...CATEGORIAS_MX,
    ...CATEGORIAS_PE,
    ...CATEGORIAS_ES,
    ...CATEGORIAS_JP,
    ...CATEGORIAS_IT,
    ...CATEGORIAS_US,
  ];
  for (const cat of todas) {
    if (!vistas.has(cat.nombre)) {
      vistas.add(cat.nombre);
      resultado.push(cat);
    }
  }
  return resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
})();
