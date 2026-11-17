export interface Page<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
export interface Maestro {
  id: number;
  nombre: string;
  documento?: string;
}
export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  categoria: Maestro;
  precio: number;
  stock: number;
  codigoBarras?: string | null;
  unidadVenta?: string | null;
  stockMinimo?: number | null;
  activo?: boolean;
}
export interface Linea {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}
export interface Operacion {
  id: number;
  clienteId?: number;
  proveedorId?: number;
  cliente?: string;
  proveedor?: string;
  fecha: string;
  actor: string;
  estado: string;
  total: number;
  detalles: Linea[];
  fechaRecepcion?: string | null;
  tipoComprobante?: string | null;
  serie?: string | null;
  numero?: string | null;
  observaciones?: string | null;
}
export interface Agregado {
  cantidad: number;
  total: number;
  promedio: number;
}
export interface Auditoria {
  id: number;
  actor: string;
  accion: string;
  entidad: string;
  entidadId: number;
  fecha: string;
  detalle: string;
}

export interface VentaLinea {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Venta {
  id: number;
  clienteId?: number | null;
  cliente?: string;
  fecha: string;
  actor: string;
  estado: string;
  total: number;
  detalles: VentaLinea[];
  metodoPago?: string | null;
  efectivoRecibido?: number | null;
  vuelto?: number | null;
  cajero?: string | null;
}
