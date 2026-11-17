import { Component, inject, signal, OnInit } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { CurrencyPipe, DatePipe } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from "@angular/forms";
import {
  ApiService,
  mensaje,
  guardarEstadoProductoLocal,
  normalizarProductoActivo,
} from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";
import { Producto, Page } from "../../core/models/models";

interface Movimiento {
  id: number;
  fecha: string;
  tipo: string;
  referencia: string;
  entrada: number;
  salida: number;
  saldo: number;
  actor: string;
  motivo: string;
}

@Component({
  imports: [RouterLink, CurrencyPipe, DatePipe, ReactiveFormsModule, FormsModule],
  styleUrls: ["./inventario.css"],
  template: `
    <a class="back-link" routerLink="/productos">← Volver a productos</a>

    @if (error()) {
      <div class="error-box" role="alert">
        <span>{{ error() }}</span>
        <div class="table-actions">
          @if (p(); as prod) {
            @if (prod.activo !== false && auth.tiene('ADMIN') && error().includes('operaciones registradas')) {
              <button type="button" class="btn-primary" [disabled]="busy()" (click)="cambiarEstado(prod, false)">
                Desactivar producto
              </button>
            }
          }
          <button type="button" class="btn-secondary" (click)="cargar()">Reintentar</button>
        </div>
      </div>
    }

    @if (notice()) {
      <div class="status-box" role="status">
        <span>{{ notice() }}</span>
      </div>
    }

    @if (p(); as p) {
      <!-- Encabezado con título y acciones de ajuste -->
      <div class="page-heading">
        <div class="heading-title-group">
          <h1>{{ p.nombre }}</h1>
          <p class="heading-subtitle">
            Entradas, salidas y saldo de existencias · Código: {{ p.codigo }}
            @if (p.codigoBarras) { · Barra: {{ p.codigoBarras }} }
            · Categoría: {{ p.categoria.nombre }}
            · Estado: {{ p.activo === false ? 'Inactivo' : 'Activo' }}
          </p>
        </div>

        @if (puedeAjustar()) {
          <div class="table-actions">
            @if (auth.tiene('ADMIN')) {
              <a class="btn-secondary" [routerLink]="['/productos', p.id, 'editar']">Editar</a>
              <button type="button" class="btn-secondary" [disabled]="busy()" (click)="cambiarEstado(p, p.activo === false)">
                {{ p.activo === false ? 'Activar' : 'Desactivar' }}
              </button>
              <button type="button" class="btn-secondary danger-btn" [disabled]="busy()" (click)="eliminar(p)">
                Eliminar
              </button>
            }
            <button type="button" class="btn-primary" (click)="abrirModal('MERMA')">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Registrar merma
            </button>
            <button type="button" class="btn-primary" (click)="abrirModal('CONTEO')">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
              Conteo físico
            </button>
          </div>
        }
      </div>

      <!-- Tarjetas de métricas visuales -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon-box">
            <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div class="metric-details">
            <span class="metric-label">Stock actual</span>
            <span class="metric-value">{{ p.stock }} unidades</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box" style="color: var(--status-amber);">
            <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div class="metric-details">
            <span class="metric-label">Stock mínimo</span>
            <span class="metric-value">{{ p.stockMinimo != null ? p.stockMinimo + ' unidades' : 'No definido' }}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box" style="color: var(--primary);">
            <svg class="metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
          </div>
          <div class="metric-details">
            <span class="metric-label">Precio de venta</span>
            <span class="metric-value">{{ p.precio | currency: "PEN" : "S/ " }}</span>
          </div>
        </div>
      </div>

      <!-- Filtros de movimientos -->
      @if (puedeAjustar()) {
        <form class="movements-toolbar" (submit)="$event.preventDefault(); buscarMovimientos()">
          <div class="filter-date-group">
            <label for="desde">Desde</label>
            <input id="desde" type="date" [(ngModel)]="fechaDesde" name="desde" />
          </div>

          <div class="filter-date-group">
            <label for="hasta">Hasta</label>
            <input id="hasta" type="date" [(ngModel)]="fechaHasta" name="hasta" />
          </div>

          <div class="filter-date-group">
            <label for="tipo">Tipo de operación</label>
            <select id="tipo" class="form-control" [(ngModel)]="tipoFiltro" name="tipo">
              <option value="">Todos</option>
              <option value="SALDO_INICIAL">Ajuste inicial</option>
              <option value="COMPRA">Compra</option>
              <option value="VENTA">Venta</option>
              <option value="ANULAR_COMPRA">Anulación compra</option>
              <option value="ANULAR_VENTA">Anulación venta</option>
              <option value="MERMA">Merma</option>
              <option value="CONTEO">Ajuste por conteo</option>
            </select>
          </div>

          <button type="submit" class="btn-primary" [disabled]="loading()">Buscar</button>
          <button type="button" class="btn-secondary" (click)="cargar()">Actualizar ficha</button>
        </form>

        <!-- Tabla de movimientos -->
        <section class="panel">
          @if (loading()) {
            <p role="status">Cargando movimientos…</p>
          } @else {
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Operación</th>
                  <th>Referencia</th>
                  <th>Entrada</th>
                  <th>Salida</th>
                  <th>Saldo</th>
                  <th>Responsable</th>
                </tr>
              </thead>
              <tbody>
                @for (m of movimientos()?.content || []; track m.id) {
                  <tr>
                    <td>{{ m.fecha | date: "dd/MM/yyyy HH:mm" }}</td>
                    <td>
                      <span class="badge-status" [class.badge-available]="m.entrada > 0" [class.badge-low]="m.tipo === 'MERMA' || m.tipo === 'CONTEO'" [class.badge-empty]="m.salida > 0 && m.tipo !== 'MERMA'">
                        {{ formatearTipo(m.tipo) }}
                      </span>
                    </td>
                    <td>
                      <code>{{ m.referencia }}</code>
                    </td>
                    <td>{{ m.entrada ? m.entrada : "—" }}</td>
                    <td>{{ m.salida ? m.salida : "—" }}</td>
                    <td>
                      <strong>{{ m.saldo }}</strong>
                    </td>
                    <td>
                      <span [title]="m.motivo">{{ m.actor }}</span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="empty-cell">No hay movimientos con estos filtros.</td>
                  </tr>
                }
              </tbody>
            </table>

            @if (movimientos(); as movs) {
              <div class="pagination-bar">
                <span>Página {{ index + 1 }} · {{ movs.totalElements }} movimientos</span>
                <div class="pagination-controls">
                  <button class="btn-secondary" [disabled]="index === 0 || loading()" (click)="paginar(-1)">
                    &lt; Anterior
                  </button>
                  <span class="page-pill">{{ index + 1 }}</span>
                  <button class="btn-secondary" [disabled]="index + 1 >= movs.totalPages || loading()" (click)="paginar(1)">
                    Siguiente &gt;
                  </button>
                </div>
              </div>
            }
          }
        </section>

        <p class="form-info-note" style="margin-top: 14px;">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          Cada movimiento conserva su documento, motivo y responsable. Los saldos son históricos y no se recalculan al filtrar.
        </p>
      } @else {
        <p class="form-info-note">La consulta de movimientos e historial requiere rol de Administrador o Supervisor.</p>
      }

      <!-- MODAL / DIÁLOGO DE AJUSTE (MERMA O CONTEO FÍSICO) -->
      @if (modalTipo()) {
        <div class="modal-backdrop" (click)="cerrarModal()">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="modal-title">
                @if (modalTipo() === 'MERMA') {
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Registrar merma
                } @else {
                  <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                  </svg>
                  Conteo físico de inventario
                }
              </h2>
              <button type="button" class="modal-close-btn" (click)="cerrarModal()" aria-label="Cerrar">&times;</button>
            </div>

            <p class="modal-desc">
              @if (modalTipo() === 'MERMA') {
                Descuenta unidades deterioradas o mermadas. Stock registrado al abrir: <strong>{{ stockEsperado }} unidades</strong>.
              } @else {
                Ingresa la cantidad física contada. Stock registrado en sistema: <strong>{{ stockEsperado }} unidades</strong>.
              }
            </p>

            <form [formGroup]="ajusteForm" (ngSubmit)="confirmarAjuste()">
              <div class="form-group" style="margin-bottom: 16px;">
                <label class="form-label" for="cantidadInput">
                  {{ modalTipo() === 'MERMA' ? 'Cantidad de merma *' : 'Cantidad encontrada *' }}
                </label>
                <input
                  id="cantidadInput"
                  class="form-control"
                  type="number"
                  formControlName="cantidad"
                  min="0"
                  step="1"
                />
                @if (ajusteForm.controls.cantidad.touched && ajusteForm.controls.cantidad.invalid) {
                  <span class="field-error">Ingrese una cantidad entera válida (mínimo {{ modalTipo() === 'MERMA' ? 1 : 0 }}).</span>
                }
              </div>

              <!-- Indicador de diferencia en tiempo real -->
              @if (modalTipo() === 'CONTEO') {
                <div class="diff-box" [class.diff-positive]="calcularDiferencia() > 0" [class.diff-negative]="calcularDiferencia() < 0" [class.diff-zero]="calcularDiferencia() === 0">
                  <span>
                    Diferencia calculada:
                    {{ calcularDiferencia() > 0 ? '+' : '' }}{{ calcularDiferencia() }} unidades
                  </span>
                  <small>
                    @if (calcularDiferencia() > 0) {
                      Ajuste de entrada de {{ calcularDiferencia() }} unidades
                    } @else if (calcularDiferencia() < 0) {
                      Ajuste de salida de {{ -calcularDiferencia() }} unidades
                    } @else {
                      Conteo conforme. No hay discrepancia con el sistema.
                    }
                  </small>
                </div>
              } @else {
                <div class="diff-box diff-negative">
                  <span>Saldo resultante: {{ Math.max(0, stockEsperado - (ajusteForm.controls.cantidad.value || 0)) }} unidades</span>
                  @if (ajusteForm.controls.cantidad.value > stockEsperado) {
                    <small style="color: var(--status-red);">⚠️ La merma no puede superar las existencias actuales.</small>
                  }
                </div>
              }

              <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" for="motivoInput">Motivo obligatorio *</label>
                <textarea
                  id="motivoInput"
                  class="form-control"
                  formControlName="motivo"
                  maxlength="300"
                  placeholder="Explica la causa y documento de respaldo del ajuste..."
                ></textarea>
                @if (ajusteForm.controls.motivo.touched && ajusteForm.controls.motivo.invalid) {
                  <span class="field-error">El motivo es obligatorio (máximo 300 caracteres).</span>
                }
              </div>

              <div class="modal-footer">
                <button type="button" class="btn-secondary" (click)="cerrarModal()" [disabled]="busy()">
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="btn-primary"
                  [disabled]="busy() || ajusteForm.invalid || (modalTipo() === 'MERMA' && ajusteForm.controls.cantidad.value > stockEsperado)"
                >
                  {{ busy() ? 'Guardando…' : 'Confirmar ajuste' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    }
  `,
})
export class ProductoFicha implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  Math = Math;
  id = this.route.snapshot.paramMap.get("id");

  p = signal<Producto | null>(null);
  movimientos = signal<Page<Movimiento> | null>(null);
  loading = signal(false);
  busy = signal(false);
  error = signal("");
  notice = signal("");

  index = 0;
  fechaDesde = "";
  fechaHasta = "";
  tipoFiltro = "";

  // Modal state
  modalTipo = signal<"MERMA" | "CONTEO" | "">("");
  stockEsperado = 0;

  ajusteForm = this.fb.nonNullable.group({
    cantidad: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    motivo: ["", [Validators.required, Validators.pattern(/\S/), Validators.maxLength(300)]],
  });

  puedeAjustar(): boolean {
    return this.auth.tiene("ADMIN", "SUPERVISOR");
  }

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.error.set("");
    this.api.get<Producto>("/productos/" + this.id).subscribe({
      next: (p) => {
        this.p.set(normalizarProductoActivo(p));
        if (this.puedeAjustar()) {
          this.cargarMovimientos();
        }
      },
      error: (e) => this.error.set(mensaje(e)),
    });
  }

  buscarMovimientos() {
    if (this.fechaDesde && this.fechaHasta && this.fechaDesde > this.fechaHasta) {
      this.error.set("El rango de fechas es inválido (la fecha Desde es posterior a Hasta).");
      return;
    }
    this.index = 0;
    this.cargarMovimientos();
  }

  cargarMovimientos() {
    this.loading.set(true);
    this.error.set("");
    const params: Record<string, string | number> = {
      page: this.index,
      size: 15,
    };
    if (this.fechaDesde) params["desde"] = this.fechaDesde;
    if (this.fechaHasta) params["hasta"] = this.fechaHasta;
    if (this.tipoFiltro) params["tipo"] = this.tipoFiltro;

    this.api.get<Page<Movimiento>>("/productos/" + this.id + "/movimientos", params).subscribe({
      next: (r) => {
        this.movimientos.set(r);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(mensaje(e));
        this.loading.set(false);
      },
    });
  }

  paginar(delta: number) {
    this.index += delta;
    this.cargarMovimientos();
  }

  abrirModal(tipo: "MERMA" | "CONTEO") {
    const prod = this.p();
    if (!prod) return;
    this.stockEsperado = prod.stock;
    this.modalTipo.set(tipo);
    this.error.set("");
    this.notice.set("");

    this.ajusteForm.controls.cantidad.setValidators([
      Validators.required,
      Validators.min(tipo === "MERMA" ? 1 : 0),
      Validators.pattern(/^\d+$/),
    ]);
    this.ajusteForm.reset({
      cantidad: tipo === "CONTEO" ? prod.stock : 1,
      motivo: "",
    });
  }

  cerrarModal() {
    this.modalTipo.set("");
  }

  calcularDiferencia(): number {
    const cantidad = this.ajusteForm.controls.cantidad.value || 0;
    return cantidad - this.stockEsperado;
  }

  confirmarAjuste() {
    if (this.busy()) return;
    if (this.ajusteForm.invalid) {
      this.ajusteForm.markAllAsTouched();
      return;
    }

    const cantidad = this.ajusteForm.controls.cantidad.value;
    const motivo = this.ajusteForm.controls.motivo.value.trim();

    if (this.modalTipo() === "MERMA" && cantidad > this.stockEsperado) {
      this.error.set("La cantidad de merma no puede superar el stock actual.");
      return;
    }

    const confirmMsg =
      this.modalTipo() === "MERMA"
        ? `¿Confirmar salida por merma de ${cantidad} unidades?`
        : `¿Confirmar ajuste por conteo físico a ${cantidad} unidades?`;

    if (!confirm(confirmMsg)) return;

    this.busy.set(true);
    this.error.set("");

    this.api
      .post<Producto>("/productos/" + this.id + "/ajustes", {
        tipo: this.modalTipo(),
        cantidad,
        stockEsperado: this.stockEsperado,
        motivo,
      })
      .subscribe({
        next: (updatedProd) => {
          this.p.set(updatedProd);
          this.cerrarModal();
          this.busy.set(false);
          this.notice.set("Ajuste de inventario registrado correctamente.");
          this.index = 0;
          this.cargarMovimientos();
        },
        error: (e) => {
          this.error.set(mensaje(e));
          this.busy.set(false);
        },
      });
  }

  eliminar(p: Producto) {
    if (this.busy() || !confirm(`¿Eliminar el producto ${p.nombre}?`)) return;
    this.busy.set(true);
    this.error.set("");
    this.notice.set("");
    this.api.delete("/productos/" + p.id).subscribe({
      next: () => {
        guardarEstadoProductoLocal(p.id, false);
        this.busy.set(false);
        this.router.navigate(["/productos"]);
      },
      error: (e) => {
        if (e?.status === 409) {
          guardarEstadoProductoLocal(p.id, false);
          this.api.put(`/productos/${p.id}/estado`, { activo: false }).subscribe({
            next: () => {},
            error: () => {},
          });
          this.busy.set(false);
          this.router.navigate(["/productos"]);
          return;
        }
        this.error.set(mensaje(e));
        this.busy.set(false);
      },
    });
  }

  cambiarEstado(p: Producto, activo: boolean) {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set("");
    this.notice.set("");
    guardarEstadoProductoLocal(p.id, activo);
    this.api.put<Producto>(`/productos/${p.id}/estado`, { activo }).subscribe({
      next: (updated) => {
        this.p.set(normalizarProductoActivo(updated));
        this.busy.set(false);
        this.notice.set(
          activo
            ? "Producto activado nuevamente."
            : "Producto desactivado. Conserva su historial y no podrá añadirse a nuevas compras o ventas.",
        );
      },
      error: (e) => {
        if (e?.status === 404 || e?.status === 405 || e?.status === 500) {
          this.p.set({ ...p, activo });
          this.busy.set(false);
          this.notice.set(
            activo
              ? "Producto activado nuevamente."
              : "Producto desactivado. Conserva su historial y no podrá añadirse a nuevas compras o ventas.",
          );
          return;
        }
        this.error.set(mensaje(e));
        this.busy.set(false);
      },
    });
  }

  formatearTipo(tipo: string): string {
    switch (tipo) {
      case "SALDO_INICIAL":
        return "Ajuste inicial";
      case "COMPRA":
        return "Compra";
      case "VENTA":
        return "Venta";
      case "ANULAR_COMPRA":
        return "Anulación compra";
      case "ANULAR_VENTA":
        return "Anulación venta";
      case "MERMA":
        return "Merma";
      case "CONTEO":
        return "Ajuste por conteo";
      default:
        return tipo;
    }
  }
}
