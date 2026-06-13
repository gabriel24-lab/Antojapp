import { createContext, useContext, useState, useCallback } from "react";

const UbicacionContext = createContext(null);

export function UbicacionProvider({ children }) {
  // pais: { iso2: "CO", nombre: "Colombia" } | null
  const [pais,         setPais]         = useState(null);
  const [departamento, setDepartamento] = useState(null); // string | null
  const [ciudad,       setCiudad]       = useState(null); // string | null

  // Acepta el mismo shape que onCambiarUbicacion usaba antes:
  // { iso2, nombre, pais?, departamento, ciudad }
  const cambiarUbicacion = useCallback(({ iso2, nombre, pais: paisAlt, departamento: dept, ciudad: ciu }) => {
    const iso  = iso2 || paisAlt || null;
    const nom  = nombre || null;
    setPais(iso ? { iso2: iso, nombre: nom } : null);
    setDepartamento(dept || null);
    setCiudad(ciu || null);
  }, []);

  const limpiarUbicacion = useCallback(() => {
    setPais(null);
    setDepartamento(null);
    setCiudad(null);
  }, []);

  return (
    <UbicacionContext.Provider value={{
      pais,
      departamento,
      ciudad,
      cambiarUbicacion,
      limpiarUbicacion,
    }}>
      {children}
    </UbicacionContext.Provider>
  );
}

export function useUbicacionContext() {
  return useContext(UbicacionContext);
}
