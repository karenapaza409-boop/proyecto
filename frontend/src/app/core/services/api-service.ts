import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { tap } from "rxjs";
@Injectable({ providedIn: "root" })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl + "/api/v1";
  private revision = 0;
  get<T>(
    path: string,
    params: Record<string, string | number | undefined> = {},
  ) {
    let p = new HttpParams();
    // A successful write invalidates the short-lived category cache in this SPA.
    if (path === "/categorias") p = p.set("revision", this.revision);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") p = p.set(k, String(v));
    });
    return this.http.get<T>(this.base + path, { params: p });
  }
  getBlob(
    path: string,
    params: Record<string, string | number | undefined> = {},
  ) {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") p = p.set(k, String(v));
    });
    return this.http.get(this.base + path, {
      params: p,
      responseType: "blob",
      observe: "response",
    });
  }
  post<T>(path: string, body: unknown) {
    return this.http
      .post<T>(this.base + path, body)
      .pipe(tap(() => this.revision++));
  }
  put<T>(path: string, body: unknown) {
    return this.http
      .put<T>(this.base + path, body)
      .pipe(tap(() => this.revision++));
  }
  patch<T>(path: string) {
    return this.http
      .patch<T>(this.base + path, {})
      .pipe(tap(() => this.revision++));
  }
  delete(path: string) {
    return this.http
      .delete<void>(this.base + path)
      .pipe(tap(() => this.revision++));
  }
}
export function mensaje(error: any): string {
  return (
    error?.error?.detail ||
    (error?.status === 403
      ? "No tiene permiso para esta operación."
      : error?.status === 0
        ? "No se pudo conectar con el backend."
        : "No se pudo completar la operación.")
  );
}

const KEY_INACTIVOS = "mm_productos_inactivos";

export function obtenerProductosInactivosLocales(): Set<number> {
  try {
    const raw = localStorage.getItem(KEY_INACTIVOS);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.map(Number)) : new Set();
  } catch {
    return new Set();
  }
}

export function guardarEstadoProductoLocal(id: number, activo: boolean): void {
  try {
    const set = obtenerProductosInactivosLocales();
    if (activo) {
      set.delete(Number(id));
    } else {
      set.add(Number(id));
    }
    localStorage.setItem(KEY_INACTIVOS, JSON.stringify([...set]));
  } catch {
    // ignore storage errors
  }
}

export function normalizarProductoActivo<T extends { id: number; activo?: boolean }>(p: T): T {
  const inactivos = obtenerProductosInactivosLocales();
  if (p.activo === false || inactivos.has(Number(p.id))) {
    return { ...p, activo: false };
  }
  return { ...p, activo: true };
}
