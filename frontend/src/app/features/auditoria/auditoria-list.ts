import { Component, inject, signal, OnInit } from "@angular/core";
import { DatePipe, CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { ApiService, mensaje } from "../../core/services/api-service";
import { Page, Auditoria } from "../../core/models/models";

interface CambioFila {
  campo: string;
  antes: string;
  despues: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  styleUrls: ["./auditoria.css"],
  template: `
    <div class="auditoria-container">
      @if (error()) {
        <div class="error-banner" role="alert">
          <span>⚠️ {{ error() }}</span>
        </div>
      }

      <!-- ================= PANTALLA 1: HISTORIAL DE ACTIVIDAD (BOCETO 1) ================= -->
      @if (vista() === 'historial') {
        <div>
          <div class="step-badge">01 · Historial de actividad</div>
          <div class="page-heading">
            <h1>Auditoría</h1>
            <p>Consulta quién realizó cada cambio y cuándo.</p>
          </div>
        </div>

        <!-- Tarjeta de Filtros -->
        <div class="filtros-card">
          <!-- Fila 1 de Filtros: Desde, Hasta, Usuario -->
          <div class="filtros-row-1">
            <div class="filtro-item">
              <label for="filtro-desde">Desde</label>
              <input
                id="filtro-desde"
                type="date"
                class="filtro-input"
                [(ngModel)]="filtroDesde"
              />
            </div>

            <div class="filtro-item">
              <label for="filtro-hasta">Hasta</label>
              <input
                id="filtro-hasta"
                type="date"
                class="filtro-input"
                [(ngModel)]="filtroHasta"
              />
            </div>

            <div class="filtro-item">
              <label for="filtro-usuario">Usuario</label>
              <select
                id="filtro-usuario"
                class="filtro-select"
                [(ngModel)]="filtroUsuario"
              >
                <option value="Todos">Todos</option>
                <option value="Admin">Admin</option>
                <option value="cajero01">cajero01</option>
                <option value="cajero02">cajero02</option>
                <option value="almacen01">almacen01</option>
              </select>
            </div>
          </div>

          <!-- Fila 2 de Filtros: Módulo, Acción, Botones -->
          <div class="filtros-row-2">
            <div class="filtro-item">
              <label for="filtro-modulo">Módulo</label>
              <select
                id="filtro-modulo"
                class="filtro-select"
                [(ngModel)]="filtroModulo"
              >
                <option value="Todos">Todos</option>
                <option value="PRODUCTO">Productos</option>
                <option value="VENTA">Ventas</option>
                <option value="COMPRA">Compras</option>
                <option value="USUARIO">Usuarios</option>
                <option value="PROVEEDOR">Proveedores</option>
                <option value="CLIENTE">Clientes</option>
              </select>
            </div>

            <div class="filtro-item">
              <label for="filtro-accion">Acción</label>
              <select
                id="filtro-accion"
                class="filtro-select"
                [(ngModel)]="filtroAccion"
              >
                <option value="Todas">Todas</option>
                <option value="CAMBIO_PRECIO">Cambio de precio</option>
                <option value="ANULAR">Anulación</option>
                <option value="ASIGNAR_ROL">Asignación de rol</option>
                <option value="DESACTIVAR">Desactivación</option>
                <option value="CREAR">Creación</option>
              </select>
            </div>

            <div class="filtro-botones">
              <button
                type="button"
                class="btn-primary"
                (click)="aplicarFiltros()"
                [disabled]="loading()"
              >
                🔍 Aplicar
              </button>
              <button
                type="button"
                class="btn-link-clean"
                (click)="limpiarFiltros()"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        <!-- Tabla del Historial a Pantalla Completa -->
        <div class="table-panel">
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Usuario</th>
                  <th>Módulo</th>
                  <th>Acción</th>
                  <th>Referencia</th>
                  <th style="text-align: right;">Detalle</th>
                </tr>
              </thead>
              <tbody>
                @for (r of page()?.content || []; track r.id) {
                  <tr>
                    <td class="td-fecha">{{ r.fecha | date:'dd/MM HH:mm' }}</td>
                    <td>{{ r.actor }}</td>
                    <td>{{ formatearModulo(r.entidad) }}</td>
                    <td>{{ formatearAccion(r.accion, r.detalle) }}</td>
                    <td>
                      <span class="td-referencia">{{ formatearReferencia(r) }}</span>
                    </td>
                    <td style="text-align: right;">
                      <button
                        type="button"
                        class="link-ver-detalle"
                        (click)="verDetalle(r)"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" style="text-align: center; padding: 36px 20px; color: var(--text-secondary, #8e8e93);">
                      {{ loading() ? 'Cargando eventos de auditoría…' : 'No se encontraron eventos con los filtros aplicados.' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pie de tabla con conteo y paginación según boceto -->
          <div class="table-footer">
            <span>{{ rangoEventos() }}</span>
            <div class="pagination-controls">
              <button
                type="button"
                class="pagination-btn"
                [disabled]="index === 0 || loading()"
                (click)="cambiar(-1)"
                title="Página anterior"
              >
                ‹
              </button>
              <button
                type="button"
                class="pagination-btn"
                [disabled]="index + 1 >= (page()?.totalPages || 0) || loading()"
                (click)="cambiar(1)"
                title="Página siguiente"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        <div class="info-permisos">
          <span>🔒</span>
          <span>Solo consulta · Acceso según permisos</span>
        </div>

        <div class="sketch-disclaimer">
          Propuesta visual · Datos ficticios
        </div>
      }

      <!-- ================= PANTALLA 2: DETALLE DEL EVENTO (BOCETO 2) ================= -->
      @if (vista() === 'detalle' && eventoSeleccionado()) {
        <div class="detalle-container">
          <a class="back-link" (click)="volverAlHistorial()">
            ← Volver al historial
          </a>

          <div class="detalle-heading">
            <h1>Detalle del evento</h1>
            <p>{{ formatearAccion(eventoSeleccionado()!.accion, eventoSeleccionado()!.detalle) }}</p>
          </div>

          <!-- Tarjeta 1: Meta Información del Evento -->
          <div class="card-meta-info">
            <span class="meta-label">Evento</span>
            <span class="meta-value highlight">{{ formatearCodigoEvento(eventoSeleccionado()!.id) }}</span>

            <span class="meta-label">Usuario</span>
            <span class="meta-value">{{ eventoSeleccionado()!.actor }}</span>

            <span class="meta-label">Fecha</span>
            <span class="meta-value">{{ eventoSeleccionado()!.fecha | date:'dd/MM/yyyy · HH:mm' }}</span>

            <span class="meta-label">Módulo</span>
            <span class="meta-value">{{ formatearModulo(eventoSeleccionado()!.entidad) }}</span>

            <span class="meta-label">{{ etiquetaEntidad(eventoSeleccionado()!.entidad) }}</span>
            <span class="meta-value">{{ nombreEntidad(eventoSeleccionado()!) }}</span>

            <span class="meta-label">Código</span>
            <span class="meta-value highlight">{{ formatearReferencia(eventoSeleccionado()!) }}</span>
          </div>

          <!-- Tarjeta 2: Cambios Registrados -->
          <div class="section-card">
            <h2 class="section-title">Cambios registrados</h2>
            <div class="card-cambios">
              <table style="width: 100%;">
                <thead>
                  <tr>
                    <th>Campo</th>
                    <th>Antes</th>
                    <th>Después</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of cambiosRegistrados(); track c.campo) {
                    <tr>
                      <td style="font-weight: 500;">{{ c.campo }}</td>
                      <td>{{ c.antes }}</td>
                      <td class="valor-despues">{{ c.despues }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Tarjeta 3: Motivo -->
          <div class="section-card">
            <h2 class="section-title">Motivo</h2>
            <div class="card-motivo">
              {{ motivoEvento() }}
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="detalle-actions">
            <button
              type="button"
              class="btn-secondary"
              (click)="volverAlHistorial()"
            >
              ← Volver al historial
            </button>

            @if (obtenerRutaEntidad(eventoSeleccionado()!); as ruta) {
              <a [routerLink]="ruta" class="btn-primary">
                ↗ {{ etiquetaBotonVer(eventoSeleccionado()!.entidad) }}
              </a>
            }
          </div>

          <div class="info-permisos">
            <span>🔒</span>
            <span>Este registro no se puede editar desde esta pantalla.</span>
          </div>

          <div class="sketch-disclaimer">
            Propuesta visual · Datos ficticios
          </div>
        </div>
      }
    </div>
  `,
})
export class AuditoriaList implements OnInit {
  private api = inject(ApiService);

  // Control de vista: 'historial' o 'detalle'
  vista = signal<"historial" | "detalle">("historial");
  eventoSeleccionado = signal<Auditoria | null>(null);

  page = signal<Page<Auditoria> | null>(null);
  error = signal("");
  loading = signal(false);
  index = 0;

  // Filtros
  filtroDesde = "";
  filtroHasta = "";
  filtroUsuario = "Todos";
  filtroModulo = "Todos";
  filtroAccion = "Todas";

  ngOnInit() {
    this.cargar();
  }

  cambiar(d: number) {
    this.index += d;
    this.cargar();
  }

  aplicarFiltros() {
    this.index = 0;
    this.cargar();
  }

  limpiarFiltros() {
    this.filtroDesde = "";
    this.filtroHasta = "";
    this.filtroUsuario = "Todos";
    this.filtroModulo = "Todos";
    this.filtroAccion = "Todas";
    this.index = 0;
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.error.set("");

    const params: Record<string, string | number | undefined> = {
      page: this.index,
      size: 20,
    };

    if (this.filtroDesde) params["desde"] = this.filtroDesde;
    if (this.filtroHasta) params["hasta"] = this.filtroHasta;
    if (this.filtroUsuario && this.filtroUsuario !== "Todos") params["usuario"] = this.filtroUsuario;
    if (this.filtroModulo && this.filtroModulo !== "Todos") params["modulo"] = this.filtroModulo;
    if (this.filtroAccion && this.filtroAccion !== "Todas") params["accion"] = this.filtroAccion;

    this.api.get<Page<Auditoria>>("/auditoria", params).subscribe({
      next: (r) => {
        this.page.set(r);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(mensaje(e));
        this.loading.set(false);
      },
    });
  }

  verDetalle(r: Auditoria) {
    this.eventoSeleccionado.set(r);
    this.vista.set("detalle");
  }

  volverAlHistorial() {
    this.vista.set("historial");
  }

  rangoEventos(): string {
    const p = this.page();
    if (!p || !p.totalElements) return "0 de 0 eventos";
    const inicio = p.number * p.size + 1;
    const fin = p.number * p.size + p.content.length;
    return `${inicio}–${fin} de ${p.totalElements} eventos`;
  }

  // Métodos de formateo para el boceto
  formatearCodigoEvento(id: number): string {
    return "AUD-" + String(id).padStart(3, "0");
  }

  formatearModulo(entidad: string): string {
    const e = (entidad || "").toUpperCase();
    switch (e) {
      case "PRODUCTO":
        return "Productos";
      case "VENTA":
        return "Ventas";
      case "COMPRA":
        return "Compras";
      case "USUARIO":
        return "Usuarios";
      case "PROVEEDOR":
        return "Proveedores";
      case "CLIENTE":
        return "Clientes";
      case "CATEGORIA":
        return "Categorías";
      default:
        return entidad;
    }
  }

  formatearAccion(accion: string, detalle: string): string {
    const a = (accion || "").toUpperCase();
    const d = (detalle || "").toLowerCase();

    if (d.includes("precio") || a.includes("PRECIO")) return "Cambio de precio";
    if (a.includes("ANULAR") || d.includes("anulad")) return "Anulación";
    if (d.includes("rol") || a.includes("ROL")) return "Asignación de rol";
    if (d.includes("desactiv") || a.includes("DESACTIVAR")) return "Desactivación";
    if (a.includes("CREAR") || d.includes("cread")) return "Creación";
    if (a.includes("AJUSTE") || d.includes("ajuste")) return "Ajuste de existencias";
    return accion;
  }

  formatearReferencia(r: Auditoria): string {
    const e = (r.entidad || "").toUpperCase();
    switch (e) {
      case "PRODUCTO":
        return "LAC-" + String(r.entidadId).padStart(3, "0");
      case "VENTA":
        return "V-" + String(r.entidadId).padStart(3, "0");
      case "PROVEEDOR":
        return "PR-" + String(r.entidadId).padStart(3, "0");
      case "COMPRA":
        return "COM-" + String(r.entidadId).padStart(3, "0");
      case "CLIENTE":
        return "CLI-" + String(r.entidadId).padStart(3, "0");
      case "USUARIO":
        return "cajero02";
      default:
        return "#" + r.entidadId;
    }
  }

  etiquetaEntidad(entidad: string): string {
    const e = (entidad || "").toUpperCase();
    switch (e) {
      case "PRODUCTO":
        return "Producto";
      case "VENTA":
        return "Comprobante";
      case "PROVEEDOR":
        return "Proveedor";
      case "CLIENTE":
        return "Cliente";
      case "USUARIO":
        return "Cuenta";
      default:
        return "Registro";
    }
  }

  nombreEntidad(r: Auditoria): string {
    const e = (r.entidad || "").toUpperCase();
    switch (e) {
      case "PRODUCTO":
        return "Prenda # " + r.entidadId;
      case "VENTA":
        return "Venta en caja # " + r.entidadId;
      case "PROVEEDOR":
        return "Proveedor de ropa";
      case "CLIENTE":
        return "Ana Torres";
      case "USUARIO":
        return "Carlos Pérez";
      default:
        return "Registro #" + r.entidadId;
    }
  }

  cambiosRegistrados(): CambioFila[] {
    const ev = this.eventoSeleccionado();
    if (!ev) return [];
    const d = ev.detalle || "";

    if (d.includes("->")) {
      const partes = d.split(";");
      const filas: CambioFila[] = [];
      for (const p of partes) {
        if (p.includes("->")) {
          const [izq, der] = p.split("->");
          const campoNombre = izq.includes("=") ? izq.split("=")[0].trim() : "Campo";
          const antes = izq.includes("=") ? izq.split("=")[1].trim() : izq.trim();
          filas.push({
            campo: this.formatearNombreCampo(campoNombre),
            antes,
            despues: der.trim(),
          });
        }
      }
      if (filas.length > 0) return filas;
    }

    // Caso de cambio de precio según boceto
    if (d.toLowerCase().includes("precio")) {
      return [
        { campo: "Precio de venta", antes: "S/4.50", despues: "S/4.80" },
      ];
    }

    // Por defecto mostrar el campo y detalle
    return [
      { campo: "Estado / Detalle", antes: "Anterior", despues: d || "Actualizado" },
    ];
  }

  formatearNombreCampo(campo: string): string {
    switch (campo.toLowerCase()) {
      case "estado":
        return "Estado de operación";
      case "precio":
        return "Precio de venta";
      case "total":
        return "Monto total";
      default:
        return campo;
    }
  }

  motivoEvento(): string {
    const ev = this.eventoSeleccionado();
    if (!ev) return "";
    const d = ev.detalle || "";
    if (d.toLowerCase().includes("motivo=")) {
      return d.split("motivo=")[1].split(";")[0].trim();
    }
    if (d.toLowerCase().includes("precio")) {
      return "Actualización del precio de venta.";
    }
    if (d.toLowerCase().includes("anulad")) {
      return "Anulación de la operación comercial y restitución de existencias.";
    }
    return d || "Registro generado por acción del sistema.";
  }

  obtenerRutaEntidad(r: Auditoria): string[] | null {
    const e = (r.entidad || "").toUpperCase();
    switch (e) {
      case "PRODUCTO":
        return ["/productos", String(r.entidadId)];
      case "VENTA":
        return ["/ventas"];
      case "PROVEEDOR":
        return ["/proveedores", String(r.entidadId)];
      case "COMPRA":
        return ["/compras"];
      case "USUARIO":
        return ["/usuarios"];
      case "CLIENTE":
        return ["/clientes"];
      default:
        return null;
    }
  }

  etiquetaBotonVer(entidad: string): string {
    const e = (entidad || "").toUpperCase();
    switch (e) {
      case "PRODUCTO":
        return "Ver producto";
      case "VENTA":
        return "Ver venta";
      case "PROVEEDOR":
        return "Ver proveedor";
      case "USUARIO":
        return "Ver usuario";
      default:
        return "Ver registro";
    }
  }
}
