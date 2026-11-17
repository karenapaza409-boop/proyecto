import { Page } from "../../core/models/models";

export interface Cliente {
  id: number;
  nombre: string;
  documento: string;
  tipoDocumento: string | null;
  nombres?: string | null;
  apellidos?: string | null;
  telefono: string | null;
  correo: string | null;
  activo: boolean;
}

export interface ClienteRequest {
  nombres?: string;
  apellidos?: string;
  nombre: string;
  documento: string;
  tipoDocumento: string;
  telefono?: string | null;
  correo?: string | null;
}
