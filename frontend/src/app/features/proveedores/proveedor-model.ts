import { Page, Operacion } from "../../core/models/models";
export interface Proveedor {
  id: number; nombre: string; documento: string; tipoDocumento: "DNI" | "RUC" | null;
  nombreComercial: string | null; personaContacto: string | null; telefono: string | null;
  correo: string | null; direccion: string | null; activo: boolean;
}
export interface ProveedorHistorial { compras: Page<Operacion>; ultimaCompra: string | null; }
