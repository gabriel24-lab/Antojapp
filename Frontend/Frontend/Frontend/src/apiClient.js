// Helper para hacer llamadas autenticadas al backend
// Devuelve { data, error } en lugar de lanzar excepciones

import API_URL from "./api";

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders(esFormData = false) {
  const h = { Authorization: `Bearer ${getToken()}` };
  if (!esFormData) h["Content-Type"] = "application/json";
  return h;
}

// GET
export async function apiFetch(path) {
  const res  = await fetch(`${API_URL}${path}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) return { data: null, error: data.error || "Error desconocido" };
  return { data, error: null };
}

// POST / PUT con JSON
export async function apiMutate(method, path, body) {
  const res  = await fetch(`${API_URL}${path}`, {
    method,
    headers: authHeaders(),
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) return { data: null, error: data.error || "Error desconocido" };
  return { data, error: null };
}

// POST con FormData (para subir archivos)
export async function apiUpload(path, formData) {
  const res  = await fetch(`${API_URL}${path}`, {
    method:  "POST",
    headers: authHeaders(true),   // sin Content-Type para que el browser ponga el boundary
    body:    formData,
  });
  const data = await res.json();
  if (!res.ok) return { data: null, error: data.error || "Error al subir archivo" };
  return { data, error: null };
}

// DELETE
export async function apiDelete(path, body = null) {
  const res = await fetch(`${API_URL}${path}`, {
    method:  "DELETE",
    headers: authHeaders(),
    body:    body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) return { data: null, error: data.error || "Error desconocido" };
  return { data, error: null };
}
