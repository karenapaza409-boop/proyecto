import { Component, inject, OnInit, signal } from "@angular/core";
import { DatePipe, CurrencyPipe, CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { ApiService, mensaje } from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";
import { Proveedor, ProveedorHistorial } from "./proveedor-model";

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, CurrencyPipe],
  styleUrls: ["./proveedores.css"],
  template: `
    <div class="proveedores-container">
      <div class="page-heading-form">
        <a class="back-link" routerLink="/proveedores">
          <span aria-hidden="true">←</span> Volver a proveedores
        </a>
        <div class="heading-title-group">
          <h1>{{ proveedor()?.nombre || 'Proveedor' }}</h1>
          <p class="heading-subtitle">Ficha detallada del proveedor y compras asociadas</p>
        </div>
      </div>

      @if (error()) {
        <div class="error-banner" role="alert">
          <span>⚠️ {{ error() }}</span>
          <button type="button" class="btn-action-small" (click)="cargar()">Volver a intentar</button>
        </div>
      }
      @if (notice()) {
        <div class="success-banner" role="status">
          <span>✓ {{ notice() }}</span>
        </div>
      }

      @if (loading()) {
        <div class="loading-state" role="status">
          <div class="spinner"></div>
          <span>Cargando proveedor…</span>
        </div>
      } @else if (proveedor(); as p) {
        <!-- Tarjeta de datos generales -->
        <div class="panel-card">
          <div class="panel-header-row">
            <h2>Datos generales y de contacto</h2>
            <span class="badge-status" [class.activa]="p.activo" [class.inactiva]="!p.activo">
              {{ p.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </div>

          <div class="facts-grid">
            <div class="fact-item">
              <span class="fact-label">Tipo de documento</span>
              <span class="fact-value">{{ p.tipoDocumento || 'Sin clasificar (registro anterior)' }}</span>
            </div>
            <div class="fact-item">
              <span class="fact-label">Número de documento</span>
              <span class="fact-value">{{ p.documento }}</span>
            </div>
            <div class="fact-item">
              <span class="fact-label">Razón social o nombre</span>
              <span class="fact-value">{{ p.nombre }}</span>
            </div>
            <div class="fact-item">
              <span class="fact-label">Nombre comercial</span>
              <span class="fact-value">{{ p.nombreComercial || 'Sin registrar' }}</span>
            </div>
            <div class="fact-item">
              <span class="fact-label">Persona de contacto</span>
              <span class="fact-value">{{ p.personaContacto || 'Sin registrar' }}</span>
            </div>
            <div class="fact-item">
              <span class="fact-label">Teléfono</span>
              <span class="fact-value">{{ p.telefono || 'Sin registrar' }}</span>
            </div>
            <div class="fact-item">
              <span class="fact-label">Correo electrónico</span>
              <span class="fact-value">{{ p.correo || 'Sin registrar' }}</span>
            </div>
            <div class="fact-item">
              <span class="fact-label">Dirección</span>
              <span class="fact-value">{{ p.direccion || 'Sin registrar' }}</span>
            </div>
          </div>

          @if (!p.activo) {
            <div class="warning-banner" style="margin-top: 16px;">
              <span>ℹ️ Este proveedor conserva su historial y no está disponible para nuevas compras.</span>
            </div>
          }

          <div class="actions-cell-start" style="margin-top: 20px;">
            @if (auth.tiene('ADMIN')) {
              <a class="btn-secondary" [routerLink]="['/proveedores', p.id, 'editar']">Editar proveedor</a>
              <button type="button" class="btn-action-small" [disabled]="busy()" (click)="cambiarEstado(p)">
                {{ p.activo ? 'Desactivar proveedor' : 'Activar proveedor' }}
              </button>
              <button type="button" class="btn-action-small btn-action-danger" [disabled]="busy()" (click)="eliminar(p)">
                Eliminar proveedor
              </button>
            }
            @if (p.activo && puedeComprar()) {
              <a class="btn-primary" routerLink="/compras/nueva" [queryParams]="{proveedorId: p.id}">
                Nueva compra
              </a>
            }
          </div>
        </div>

        <!-- Tarjeta de historial de compras -->
        @if (puedeComprar()) {
          <div class="panel-card" style="margin-top: 20px;">
            <div class="panel-header-row">
              <h2>Historial de compras</h2>
            </div>
            @if (auth.tiene('COMPRADOR') && !auth.tiene('ADMIN')) {
              <p class="help-text">Solo se muestran tus compras, de acuerdo con tus permisos.</p>
            }
            @if (historyError()) {
              <div class="error-banner" role="alert">
                <span>⚠️ {{ historyError() }}</span>
                <button type="button" class="btn-action-small" (click)="cargarHistorial()">Reintentar historial</button>
              </div>
            }
            @if (historyLoading()) {
              <div class="loading-state" role="status">
                <div class="spinner"></div>
                <span>Cargando compras…</span>
              </div>
            } @else if (historial(); as h) {
              <p class="secondary-text" style="margin-bottom: 12px;">
                Última compra: {{ h.ultimaCompra ? (h.ultimaCompra | date:'dd/MM/yyyy HH:mm') : 'Sin compras registradas' }}.
              </p>

              <div class="table-panel">
                <div class="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>COMPRA</th>
                        <th>FECHA</th>
                        <th>ESTADO</th>
                        <th>TOTAL</th>
                        <th style="text-align: right;">DETALLE</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (c of h.compras.content; track c.id) {
                        <tr>
                          <td><strong>#{{ c.id }}</strong></td>
                          <td>{{ c.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                          <td>
                            <span class="badge-status" [class.activa]="c.estado === 'REGISTRADA'" [class.inactiva]="c.estado !== 'REGISTRADA'">
                              {{ c.estado }}
                            </span>
                          </td>
                          <td><strong>{{ c.total | currency:'PEN':'S/ ' }}</strong></td>
                          <td style="text-align: right;">
                            <details class="row-menu" style="display: inline-block;">
                              <summary class="btn-action-small">Ver productos</summary>
                              <div class="row-menu-content" style="min-width: 260px; text-align: left;">
                                <ul style="list-style: none; margin: 0; padding: 4px 8px; font-size: 12px; display: flex; flex-direction: column; gap: 6px;">
                                  @for (d of c.detalles; track d.productoId) {
                                    <li>{{ d.productoNombre }} · {{ d.cantidad }} × {{ d.precioUnitario | currency:'PEN':'S/ ' }} = <strong>{{ d.subtotal | currency:'PEN':'S/ ' }}</strong></li>
                                  }
                                </ul>
                              </div>
                            </details>
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="5" class="empty">No hay compras registradas para este proveedor.</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <div class="pagination-footer">
                  <span class="pagination-info">
                    {{ h.compras.totalElements }} compras · Página {{ h.compras.totalPages ? page + 1 : 0 }} de {{ h.compras.totalPages }}
                  </span>
                  <div class="pagination-controls">
                    <button type="button" class="btn-page-nav" (click)="ir(-1)" [disabled]="page === 0" aria-label="Página anterior">
                      ‹
                    </button>
                    <span class="page-number-active">{{ h.compras.totalPages ? page + 1 : 0 }}</span>
                    <button type="button" class="btn-page-nav" (click)="ir(1)" [disabled]="page + 1 >= h.compras.totalPages" aria-label="Página siguiente">
                      ›
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
})
export class ProveedorFicha implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  auth = inject(AuthService);
  id = this.route.snapshot.paramMap.get("id");
  page = 0;
  proveedor = signal<Proveedor | null>(null);
  historial = signal<ProveedorHistorial | null>(null);
  loading = signal(false);
  busy = signal(false);
  historyLoading = signal(false);
  error = signal("");
  historyError = signal("");
  notice = signal("");

  puedeComprar() {
    return this.auth.tiene("ADMIN", "COMPRADOR");
  }

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.error.set("");
    this.api.get<Proveedor>("/proveedores/" + this.id).subscribe({
      next: (p) => {
        this.proveedor.set(p);
        this.loading.set(false);
        if (this.puedeComprar()) this.cargarHistorial();
      },
      error: (e) => {
        this.proveedor.set(null);
        this.error.set(mensaje(e));
        this.loading.set(false);
      },
    });
  }

  cargarHistorial() {
    this.historyLoading.set(true);
    this.historyError.set("");
    this.api
      .get<ProveedorHistorial>("/proveedores/" + this.id + "/historial", {
        page: this.page,
        size: 10,
      })
      .subscribe({
        next: (h) => {
          this.historial.set(h);
          this.historyLoading.set(false);
        },
        error: (e) => {
          this.historial.set(null);
          this.historyError.set(mensaje(e));
          this.historyLoading.set(false);
        },
      });
  }

  ir(delta: number) {
    this.page += delta;
    this.cargarHistorial();
  }

  cambiarEstado(p: Proveedor) {
    if (
      this.busy() ||
      !confirm(
        (p.activo ? "¿Desactivar " : "¿Activar ") +
          p.nombre +
          "? Su historial se conservará."
      )
    )
      return;
    this.busy.set(true);
    this.error.set("");
    this.api
      .put<Proveedor>("/proveedores/" + p.id + "/estado", { activo: !p.activo })
      .subscribe({
        next: (r) => {
          this.proveedor.set(r);
          this.notice.set(
            "Proveedor " +
              (r.activo ? "activado." : "desactivado. Su historial se conserva.")
          );
          this.busy.set(false);
        },
        error: (e) => {
          this.error.set(mensaje(e));
          this.busy.set(false);
        },
      });
  }

  eliminar(p: Proveedor) {
    if (this.busy() || !confirm(`¿Eliminar el proveedor "${p.nombre}"?`)) return;
    this.busy.set(true);
    this.error.set("");
    this.api.delete("/proveedores/" + p.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.router.navigate(["/proveedores"]);
      },
      error: (e) => {
        this.error.set(mensaje(e));
        this.busy.set(false);
      },
    });
  }
}
