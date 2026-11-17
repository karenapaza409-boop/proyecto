import { Injectable, signal } from "@angular/core";

const STORAGE_KEY = "cantomoda_producto_imagenes_v1";

@Injectable({ providedIn: "root" })
export class ProductoImagenService {
  private mapa = signal<Record<string, string>>(this.cargarDesdeStorage());

  private cargarDesdeStorage(): Record<string, string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private persistir(nuevoMapa: Record<string, string>) {
    this.mapa.set(nuevoMapa);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevoMapa));
    } catch {
      // Ignorar si localStorage alcanza límite en entornos restringidos
    }
  }

  obtener(id?: number | null, codigo?: string | null): string | null {
    const actual = this.mapa();
    if (id != null && actual[`id:${id}`]) {
      return actual[`id:${id}`];
    }
    if (codigo && actual[`code:${codigo.trim().toUpperCase()}`]) {
      return actual[`code:${codigo.trim().toUpperCase()}`];
    }
    return null;
  }

  guardar(id: number | null | undefined, codigo: string | null | undefined, imagenUrl: string) {
    const limpio = (imagenUrl || "").trim();
    if (!limpio) {
      this.eliminar(id, codigo);
      return;
    }
    const copia = { ...this.mapa() };
    if (id != null) {
      copia[`id:${id}`] = limpio;
    }
    if (codigo && codigo.trim()) {
      copia[`code:${codigo.trim().toUpperCase()}`] = limpio;
    }
    this.persistir(copia);
  }

  eliminar(id?: number | null, codigo?: string | null) {
    const copia = { ...this.mapa() };
    if (id != null) {
      delete copia[`id:${id}`];
    }
    if (codigo && codigo.trim()) {
      delete copia[`code:${codigo.trim().toUpperCase()}`];
    }
    this.persistir(copia);
  }

  procesarArchivo(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("Selecciona un archivo de imagen válido (PNG, JPG, WEBP)."));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."));
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onerror = () => resolve(dataUrl);
        img.onload = () => {
          const maxDim = 360;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          try {
            resolve(canvas.toDataURL("image/webp", 0.88));
          } catch {
            resolve(canvas.toDataURL("image/png"));
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }
}
