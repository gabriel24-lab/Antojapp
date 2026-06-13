
import API_URL from "./api";

// GET
export async function apiFetch(path) {
  const res  = await fetch(`${API_URL}${path}`, { credentials: "include" });
  const data = await res.json();
  if (!res.ok) return { data: null, error: data.error || "Error desconocido" };
  return { data, error: null };
}

// POST / PUT con JSON
export async function apiMutate(method, path, body) {
  const res  = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers:     { "Content-Type": "application/json" },
    body:        JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) return { data: null, error: data.error || "Error desconocido" };
  return { data, error: null };
}

// POST con FormData (para subir archivos)
export async function apiUpload(path, formData) {
  const res  = await fetch(`${API_URL}${path}`, {
    method:      "POST",
    credentials: "include",
    // Sin Content-Type para que el browser ponga el boundary correcto de multipart
    body:        formData,
  });
  const data = await res.json();
  if (!res.ok) return { data: null, error: data.error || "Error al subir archivo" };
  return { data, error: null };
}

// DELETE
export async function apiDelete(path, body = null) {
  const res = await fetch(`${API_URL}${path}`, {
    method:      "DELETE",
    credentials: "include",
    headers:     body ? { "Content-Type": "application/json" } : {},
    body:        body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) return { data: null, error: data.error || "Error desconocido" };
  return { data, error: null };
}
