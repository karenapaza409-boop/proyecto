import { Component, inject, signal, computed, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CommonModule, CurrencyPipe, DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService, mensaje } from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";
import { Page, Venta } from "../../core/models/models";

@Component({
  selector: "app-venta-historial",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="ventas-container">
      <!-- Encabezado -->
      <div class="page-heading">
        <div class="heading-title-group">
          <div class="step-badge">03. Historial de ventas</div>
          <h1>Ventas</h1>
          <p class="heading-subtitle">Consulta el registro de transacciones, reimprime comprobantes y gestiona anulaciones.</p>
        </div>
        <div>
          <a routerLink="/ventas/nueva" class="btn-primary">
            + Nueva venta
          </a>
        </div>
      </div>

      @if (error()) {
        <div class="error-banner" role="alert">
          <span>⚠️</span>
          <span>{{ error() }}</span>
        </div>
      }
      @if (aviso()) {
        <div class="success-banner" role="status">
          <span>✓</span>
          <span>{{ aviso() }}</span>
        </div>
      }

      <!-- Barra de Filtros -->
      <div class="filtros-toolbar">
        <div class="filtro-busqueda">
          <span class="filtro-busqueda-icon">🔍</span>
          <input
            type="text"
            class="input-control filtro-busqueda-input"
            placeholder="Buscar por número o cliente"
            [(ngModel)]="filtroTexto"
            (keyup.enter)="buscar()"
          />
        </div>

        <div class="filtro-fecha-group">
          <span>Desde</span>
          <input
            type="date"
            class="input-control"
            [(ngModel)]="filtroDesde"
            (change)="buscar()"
          />
        </div>

        <div class="filtro-fecha-group">
          <span>Hasta</span>
          <input
            type="date"
            class="input-control"
            [(ngModel)]="filtroHasta"
            (change)="buscar()"
          />
        </div>

        <div class="filtro-fecha-group">
          <span>Estado</span>
          <select
            class="input-control filtro-select"
            [(ngModel)]="filtroEstado"
            (change)="buscar()"
          >
            <option value="">Todas</option>
            <option value="REGISTRADA">Registrada</option>
            <option value="ANULADA">Anulada</option>
          </select>
        </div>

        <button type="button" class="btn-primary" (click)="buscar()" [disabled]="cargando()">
          @if (cargando()) { ⏳ } @else { 🔍 Buscar }
        </button>

        <button
          type="button"
          class="btn-exportar"
          (click)="exportarExcel()"
          [disabled]="exportando() || cargando()"
          title="Exportar listado a Excel"
        >
          @if (exportando()) { ⏳ Exportando… } @else { 📊 Exportar Excel }
        </button>
      </div>

      <!-- Tabla de Ventas -->
      <div class="table-card">
        <table class="ventas-table">
          <thead>
            <tr>
              <th>Venta</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Cajero</th>
              <th>Estado</th>
              <th style="text-align: right;">Total</th>
              <th style="text-align: center;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @if (cargando() && ventas().length === 0) {
              <tr>
                <td colspan="7" style="text-align: center; padding: 36px 14px; color: var(--text-muted, #7a7a80);">
                  Cargando ventas…
                </td>
              </tr>
            } @else if (ventas().length === 0) {
              <tr>
                <td colspan="7" style="text-align: center; padding: 36px 14px; color: var(--text-muted, #7a7a80);">
                  No se encontraron ventas con los filtros aplicados.
                </td>
              </tr>
            }
            @for (v of ventas(); track v.id) {
              <tr>
                <td>
                  <span class="venta-codigo">V-{{ formatearCodigo(v.id) }}</span>
                </td>
                <td>{{ v.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ v.cliente || 'Consumidor final' }}</td>
                <td>{{ v.cajero || v.actor || 'Caja' }}</td>
                <td>
                  @if (v.estado === 'REGISTRADA') {
                    <span class="badge-estado registrada">✓ Registrada</span>
                  } @else {
                    <span class="badge-estado anulada">✕ Anulada</span>
                  }
                </td>
                <td style="text-align: right;">
                  <span class="venta-total">{{ v.total | currency:'PEN':'symbol':'1.2-2' }}</span>
                </td>
                <td style="text-align: center;">
                  <button
                    type="button"
                    class="btn-ver-detalle"
                    (click)="abrirDetalle(v)"
                  >
                    👁 Ver detalle
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Pie con aviso y Paginación -->
        <div class="historial-footer">
          <div class="info-anulacion">
            <span>ℹ️</span>
            <span>Las anulaciones requieren permiso y motivo.</span>
          </div>

          <div class="pagination">
            <span class="pagination-label">
              {{ rangoPaginacion() }}
            </span>
            <div class="pagination-controls">
              <button
                type="button"
                class="pagination-btn"
                [disabled]="paginaActual() === 0 || cargando()"
                (click)="irPagina(paginaActual() - 1)"
                title="Página anterior"
              >
                ‹
              </button>
              <button type="button" class="pagination-btn active">
                {{ paginaActual() + 1 }}
              </button>
              <button
                type="button"
                class="pagination-btn"
                [disabled]="paginaActual() + 1 >= totalPaginas() || cargando()"
                (click)="irPagina(paginaActual() + 1)"
                title="Página siguiente"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= MODAL DETALLE DE VENTA ================= -->
      @if (ventaSeleccionada()) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <div class="modal-header">
              <h3 class="modal-title">
                Detalle de Venta V-{{ formatearCodigo(ventaSeleccionada()!.id) }}
              </h3>
              <button type="button" class="btn-close-modal" (click)="cerrarDetalle()">✕</button>
            </div>

            <div class="modal-body">
              <div class="modal-grid-meta">
                <div class="meta-item">
                  <span class="meta-label">Comprobante</span>
                  <span class="meta-value venta-codigo">V-{{ formatearCodigo(ventaSeleccionada()!.id) }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Fecha y Hora</span>
                  <span class="meta-value">{{ ventaSeleccionada()!.fecha | date:'dd/MM/yyyy HH:mm:ss' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Cliente</span>
                  <span class="meta-value">{{ ventaSeleccionada()!.cliente || 'Consumidor final' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Cajero responsable</span>
                  <span class="meta-value">{{ ventaSeleccionada()!.cajero || ventaSeleccionada()!.actor }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Estado</span>
                  <div>
                    @if (ventaSeleccionada()!.estado === 'REGISTRADA') {
                      <span class="badge-estado registrada">✓ Registrada</span>
                    } @else {
                      <span class="badge-estado anulada">✕ Anulada</span>
                    }
                  </div>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Método de pago</span>
                  <span class="meta-value">{{ ventaSeleccionada()!.metodoPago || 'EFECTIVO' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Total</span>
                  <span class="meta-value" style="font-size: 16px; color: var(--primary);">
                    {{ ventaSeleccionada()!.total | currency:'PEN':'symbol':'1.2-2' }}
                  </span>
                </div>
                @if (ventaSeleccionada()!.efectivoRecibido) {
                  <div class="meta-item">
                    <span class="meta-label">Efectivo recibido / Vuelto</span>
                    <span class="meta-value">
                      {{ ventaSeleccionada()!.efectivoRecibido | currency:'PEN':'symbol':'1.2-2' }}
                      / Vuelto: {{ ventaSeleccionada()!.vuelto | currency:'PEN':'symbol':'1.2-2' }}
                    </span>
                  </div>
                }
              </div>

              <!-- Lista de ítems de la venta -->
              <div class="cart-table-wrapper">
                <table class="cart-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th style="text-align: center;">Cantidad</th>
                      <th style="text-align: right;">Precio Unit.</th>
                      <th style="text-align: right;">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (linea of ventaSeleccionada()!.detalles; track linea.productoId) {
                      <tr>
                        <td>
                          <div class="cart-product-cell">
                            <div class="cart-product-icon">📦</div>
                            <span class="cart-product-name">{{ linea.productoNombre }}</span>
                          </div>
                        </td>
                        <td style="text-align: center; font-weight: 600;">{{ linea.cantidad }}</td>
                        <td style="text-align: right;">
                          {{ linea.precioUnitario | currency:'PEN':'symbol':'1.2-2' }}
                        </td>
                        <td style="text-align: right; font-weight: 700; color: var(--text-primary);">
                          {{ linea.subtotal | currency:'PEN':'symbol':'1.2-2' }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div class="modal-footer">
              <div>
                @if (esAdmin() && ventaSeleccionada()!.estado === 'REGISTRADA') {
                  <button
                    type="button"
                    class="btn-danger"
                    [disabled]="anulando()"
                    (click)="anularVenta(ventaSeleccionada()!.id)"
                  >
                    @if (anulando()) { ⏳ Anulando… } @else { ✕ Anular venta }
                  </button>
                }
              </div>

              <div style="display: flex; gap: 8px;">
                <button type="button" class="btn-secondary" (click)="imprimirComprobante()">
                  🖨 Imprimir
                </button>
                <button type="button" class="btn-primary" (click)="cerrarDetalle()">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ["./ventas.css"],
})
export class VentaHistorial implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  // Filtros
  filtroTexto = "";
  filtroDesde = "";
  filtroHasta = "";
  filtroEstado = "";

  // Datos
  ventas = signal<Venta[]>([]);
  totalElementos = signal<number>(0);
  totalPaginas = signal<number>(1);
  paginaActual = signal<number>(0);
  tamanoPagina = 10;

  // Estados UI
  cargando = signal<boolean>(false);
  exportando = signal<boolean>(false);
  anulando = signal<boolean>(false);
  error = signal<string>("");
  aviso = signal<string>("");
  ventaSeleccionada = signal<Venta | null>(null);

  private filtrosAplicados: { q?: string; desde?: string; hasta?: string; estado?: string } = {};

  // Rol admin para anulación (sin rol supervisor)
  esAdmin = computed(() => this.auth.tiene("ADMIN"));

  rangoPaginacion = computed(() => {
    const total = this.totalElementos();
    if (total === 0) return "0 de 0 ventas";
    const inicio = this.paginaActual() * this.tamanoPagina + 1;
    const fin = Math.min((this.paginaActual() + 1) * this.tamanoPagina, total);
    return `${inicio}-${fin} de ${total} ventas`;
  });

  ngOnInit() {
    this.cargarVentas();
  }

  cargarVentas() {
    this.cargando.set(true);
    this.error.set("");
    this.aviso.set("");

    const q = this.filtroTexto.trim();
    const params: Record<string, any> = {
      page: this.paginaActual(),
      size: this.tamanoPagina,
      ordenarPor: "fecha",
      direccion: "DESC",
    };

    if (q) params["q"] = q;
    if (this.filtroDesde) params["desde"] = this.filtroDesde;
    if (this.filtroHasta) params["hasta"] = this.filtroHasta;
    if (this.filtroEstado) params["estado"] = this.filtroEstado;

    this.filtrosAplicados = {
      q: q || undefined,
      desde: this.filtroDesde || undefined,
      hasta: this.filtroHasta || undefined,
      estado: this.filtroEstado || undefined,
    };

    this.api.get<Page<Venta>>("/ventas", params).subscribe({
      next: (res) => {
        this.cargando.set(false);
        this.ventas.set(res.content || []);
        this.totalElementos.set(res.totalElements || 0);
        this.totalPaginas.set(res.totalPages || 1);
      },
      error: (e) => {
        this.cargando.set(false);
        this.error.set(mensaje(e));
      },
    });
  }

  exportarExcel() {
    if (this.exportando()) return;

    if (this.totalElementos() === 0 || this.ventas().length === 0) {
      this.error.set("No hay ventas para exportar");
      return;
    }

    this.exportando.set(true);
    this.error.set("");
    this.aviso.set("");

    const params: Record<string, string | number | undefined> = {};
    if (this.filtrosAplicados.q) params["q"] = this.filtrosAplicados.q;
    if (this.filtrosAplicados.desde) params["desde"] = this.filtrosAplicados.desde;
    if (this.filtrosAplicados.hasta) params["hasta"] = this.filtrosAplicados.hasta;
    if (this.filtrosAplicados.estado) params["estado"] = this.filtrosAplicados.estado;

    this.api.getBlob("/ventas/exportar/excel", params).subscribe({
      next: (res) => {
        this.exportando.set(false);
        const body = res.body;
        if (!body || body.size === 0) {
          this.error.set("No hay ventas para exportar");
          return;
        }

        const disposition = res.headers.get("content-disposition");
        let filename = "";
        if (disposition && disposition.includes("filename=")) {
          const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
          if (match && match[1]) filename = decodeURIComponent(match[1]);
        }
        if (!filename) {
          filename = "ventas";
          if (this.filtrosAplicados.desde && this.filtrosAplicados.hasta) {
            filename += `_${this.filtrosAplicados.desde}_al_${this.filtrosAplicados.hasta}`;
          } else if (this.filtrosAplicados.desde) {
            filename += `_desde_${this.filtrosAplicados.desde}`;
          } else if (this.filtrosAplicados.hasta) {
            filename += `_hasta_${this.filtrosAplicados.hasta}`;
          } else {
            filename += `_historico_${new Date().toISOString().slice(0, 10)}`;
          }
          filename += ".xlsx";
        }

        const blob = new Blob([body], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.aviso.set("Reporte Excel descargado correctamente: " + filename);
      },
      error: async (err) => {
        this.exportando.set(false);
        let errorMsg = "No se pudo exportar el historial de ventas.";
        if (err.error instanceof Blob) {
          try {
            const text = await err.error.text();
            const parsed = JSON.parse(text);
            if (parsed.detail) errorMsg = parsed.detail;
          } catch {
            // usar fallback
          }
        } else if (err.status === 403) {
          errorMsg = "No tiene permiso para exportar el historial de ventas.";
        } else {
          errorMsg = mensaje(err);
        }
        this.error.set(errorMsg);
      },
    });
  }

  buscar() {
    this.paginaActual.set(0);
    this.cargarVentas();
  }

  irPagina(page: number) {
    if (page >= 0 && page < this.totalPaginas()) {
      this.paginaActual.set(page);
      this.cargarVentas();
    }
  }

  abrirDetalle(v: Venta) {
    this.ventaSeleccionada.set(v);
  }

  cerrarDetalle() {
    this.ventaSeleccionada.set(null);
  }

  anularVenta(id: number) {
    if (!this.esAdmin()) {
      this.error.set("Solo un administrador puede anular ventas.");
      return;
    }

    const motivo = prompt("Ingrese el motivo de anulación de la venta:");
    if (motivo === null) return;
    if (!motivo.trim()) {
      alert("El motivo de anulación es obligatorio.");
      return;
    }

    if (!confirm(`¿Está seguro de anular la venta V-${this.formatearCodigo(id)}?`)) return;

    this.anulando.set(true);
    this.api.patch<Venta>(`/ventas/${id}/anular`).subscribe({
      next: (actualizada) => {
        this.anulando.set(false);
        this.ventaSeleccionada.set(actualizada);
        this.cargarVentas();
      },
      error: (e) => {
        this.anulando.set(false);
        alert("Error al anular venta: " + mensaje(e));
      },
    });
  }

  imprimirComprobante() {
    window.print();
  }

  formatearCodigo(id: number): string {
    return String(id).padStart(3, "0");
  }
}
