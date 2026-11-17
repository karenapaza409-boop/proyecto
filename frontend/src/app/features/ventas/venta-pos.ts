import { Component, inject, signal, computed, OnInit, DestroyRef } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { CommonModule, CurrencyPipe, DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Subject, of } from "rxjs";
import { distinctUntilChanged, switchMap, tap, catchError, map } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ApiService, mensaje, normalizarProductoActivo } from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";
import { ProductoImagenService } from "../../core/services/producto-imagen.service";
import { Producto, Page, Venta } from "../../core/models/models";

interface CategoriaDto {
  id: number;
  nombre: string;
  activa?: boolean;
}

export interface CartItem {
  productoId: number;
  codigo: string;
  nombre: string;
  categoriaNombre?: string;
  precio: number;
  cantidad: number;
  stock: number;
  subtotal: number;
}

interface ClienteDto {
  id: number;
  nombre: string;
  documento: string;
  nombres?: string;
  apellidos?: string;
  activo: boolean;
}

@Component({
  selector: "app-venta-pos",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="ventas-container">
      @if (error()) {
        <div class="error-banner" role="alert">
          <span>⚠️</span>
          <span>{{ error() }}</span>
        </div>
      }

      @if (vista() === 'pos') {
        <!-- ================= VISTA 01: PUNTO DE VENTA ================= -->
        <div class="page-heading">
          <div class="heading-title-group">
            <h1>Punto de venta</h1>
          </div>
          <div>
            <a routerLink="/ventas" class="btn-secondary">
              ← Ver historial de ventas
            </a>
          </div>
        </div>

        <div class="pos-layout">
          <!-- PANEL IZQUIERDO: CATÁLOGO DE PRODUCTOS -->
          <div class="pos-card pos-catalog-card">
            <!-- Buscador / Escáner -->
            <div class="pos-search-bar">
              <span class="pos-barcode-icon" aria-hidden="true">[|||||]</span>
              <input
                id="pos-search-input"
                type="text"
                class="input-control pos-search-input"
                placeholder="Busca un producto o escanea su código"
                [(ngModel)]="searchQuery"
                (input)="onSearchInput()"
                (keydown)="onSearchKeyDown($event)"
              />
            </div>

            <!-- Filtros de Categorías (Pills) -->
            <div class="pos-category-pills">
              <button
                type="button"
                class="pos-category-pill"
                [class.active]="categoriaSeleccionada() === null"
                (click)="seleccionarCategoria(null)"
              >
                Todos
              </button>
              @for (cat of categorias(); track cat.id) {
                <button
                  type="button"
                  class="pos-category-pill"
                  [class.active]="categoriaSeleccionada() === cat.id"
                  (click)="seleccionarCategoria(cat.id)"
                >
                  {{ cat.nombre }}
                </button>
              }
            </div>

            <!-- Grilla de Tarjetas de Productos (3 columnas) -->
            @if (productosPaginados().length === 0) {
              <div class="pos-empty-catalog">
                No se encontraron productos disponibles.
              </div>
            } @else {
              <div class="pos-products-grid">
                @for (p of productosPaginados(); track p.id) {
                  <div class="pos-product-card">
                    <div class="pos-product-thumb">
                      <div class="pos-thumb-actions">
                        <label
                          class="btn-thumb-action"
                          title="Subir o cambiar imagen del producto"
                        >
                          📷
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            (change)="onSubirImagenProducto($event, p)"
                          />
                        </label>
                        @if (imagenProducto(p.id, p.codigo)) {
                          <button
                            type="button"
                            class="btn-thumb-action danger"
                            title="Quitar imagen personalizada"
                            (click)="quitarImagenProducto(p)"
                          >
                            ✕
                          </button>
                        }
                      </div>

                      @if (imagenProducto(p.id, p.codigo); as customImg) {
                        <img [src]="customImg" [alt]="p.nombre" class="product-custom-img" />
                      } @else {
                        @switch (tipoIconoProducto(p.nombre, p.categoria.nombre)) {
                          @default {
                            <svg viewBox="0 0 90 100" class="product-svg">
                              <path d="M30 20 15 27 4 45 20 56 29 45v40h34V45l9 11 15-11-11-18-15-7c-4 14-26 14-31 0Z" fill="#FFF0F2" stroke="#B91C32" stroke-width="2" />
                              <text x="46" y="61" text-anchor="middle" fill="#B91C32" font-size="10" font-family="Georgia">CANTO</text>
                              
                            </svg>
                          }
                        }
                      }
                    </div>

                    <div class="pos-product-info">
                      <div class="pos-product-title">{{ p.nombre }}</div>
                      <div class="pos-product-price">S/{{ p.precio.toFixed(2) }}</div>
                      <div class="pos-product-stock">
                        @if (p.stock > 0) {
                          Stock: <span class="stock-green">{{ p.stock }}</span>
                        } @else {
                          <span class="stock-red">Sin stock</span>
                        }
                      </div>
                    </div>

                    @if (p.stock > 0 && cantidadEnCarrito(p.id) < p.stock) {
                      <button
                        type="button"
                        class="pos-btn-add"
                        (click)="agregarAlCarrito(p)"
                      >
                        🛒 Agregar
                      </button>
                    } @else {
                      <button
                        type="button"
                        class="pos-btn-add agotado"
                        disabled
                      >
                        🛒 Agotado
                      </button>
                    }
                  </div>
                }
              </div>
            }

            <!-- Paginación del catálogo -->
            @if (totalPaginasCatalogo() >= 1) {
              <div class="pos-catalog-pagination">
                <button
                  type="button"
                  class="pagination-btn"
                  [disabled]="catalogoPage() <= 1"
                  (click)="irAPaginaCatalogo(catalogoPage() - 1)"
                >
                  ‹
                </button>
                @for (pg of paginasCatalogo(); track pg) {
                  <button
                    type="button"
                    class="pagination-btn"
                    [class.active]="catalogoPage() === pg"
                    (click)="irAPaginaCatalogo(pg)"
                  >
                    {{ pg }}
                  </button>
                }
                <button
                  type="button"
                  class="pagination-btn"
                  [disabled]="catalogoPage() >= totalPaginasCatalogo()"
                  (click)="irAPaginaCatalogo(catalogoPage() + 1)"
                >
                  ›
                </button>
              </div>
            }
          </div>

          <!-- PANEL DERECHO: VENTA ACTUAL -->
          <div class="pos-card pos-cart-card">
            <div class="pos-cart-header">
              <h2 class="pos-cart-title">Venta actual</h2>
              <p class="pos-cart-subtitle">Productos seleccionados</p>
            </div>

            <div class="pos-cart-table-container">
              <table class="pos-cart-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style="text-align: right;">P. unit.</th>
                    <th style="text-align: center;">Cantidad</th>
                    <th style="text-align: right;">Subtotal</th>
                    <th style="width: 32px;"></th>
                  </tr>
                </thead>
                <tbody>
                  @if (cart().length === 0) {
                    <tr>
                      <td colspan="5" class="pos-cart-empty">
                        Selecciona productos del catálogo para agregarlos a la venta.
                      </td>
                    </tr>
                  }
                  @for (item of cart(); track item.productoId) {
                    <tr>
                      <td>
                        <div class="pos-cart-item-cell">
                          <div class="pos-mini-thumb">
                            @if (imagenProducto(item.productoId, item.codigo); as customImg) {
                              <img [src]="customImg" [alt]="item.nombre" class="pos-mini-img" />
                            } @else {
                              @switch (tipoIconoProducto(item.nombre, item.categoriaNombre)) {
                                @case ('pantalon') { 👖 }
                                @case ('casaca') { 🧥 }
                                @case ('accesorio') { 🧢 }
                                @default { 👕 }
                              }
                            }
                          </div>
                          <span class="pos-cart-item-name">{{ item.nombre }}</span>
                        </div>
                      </td>
                      <td style="text-align: right; white-space: nowrap;">
                        S/{{ item.precio.toFixed(2) }}
                      </td>
                      <td style="text-align: center;">
                        <div class="stepper">
                          <button
                            type="button"
                            class="stepper-btn"
                            (click)="disminuirItemCarrito(item)"
                            title="Disminuir"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            class="stepper-input"
                            min="1"
                            [max]="item.stock"
                            [value]="item.cantidad"
                            (change)="fijarCantidad(item.productoId, $any($event.target).value)"
                            title="Editar cantidad"
                          />
                          <button
                            type="button"
                            class="stepper-btn"
                            [disabled]="item.cantidad >= item.stock"
                            (click)="cambiarCantidad(item.productoId, 1)"
                            title="Aumentar"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td style="text-align: right; font-weight: 700; white-space: nowrap;">
                        S/{{ item.subtotal.toFixed(2) }}
                      </td>
                      <td style="text-align: center;">
                        <button
                          type="button"
                          class="btn-trash"
                          title="Quitar producto"
                          (click)="quitarDelCarrito(item.productoId)"
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="pos-cart-footer">
              <div class="pos-cart-count">
                {{ cart().length }} producto{{ cart().length === 1 ? '' : 's' }} · {{ totalUnidades() }} unidad{{ totalUnidades() === 1 ? '' : 'es' }}
              </div>

              <div class="pos-cart-total-row">
                <span class="pos-cart-total-label">Total</span>
                <span class="pos-cart-total-amount">S/{{ totalVenta().toFixed(2) }}</span>
              </div>

              <button
                type="button"
                class="btn-pos-primary"
                [disabled]="cart().length === 0"
                (click)="irACobrar()"
              >
                Ir a cobrar →
              </button>

              <button
                type="button"
                class="btn-pos-secondary"
                [disabled]="cart().length === 0"
                (click)="cancelarVenta()"
              >
                Cancelar venta
              </button>

              <div class="pos-cart-note">
                <span class="pos-note-icon">ⓘ</span>
                <span>Los datos del cliente se ingresan al cobrar.</span>
              </div>
            </div>
          </div>
        </div>

        <div class="pos-bottom-caption">Boceto propuesto · Datos de ejemplo</div>
      } @else {
        <!-- ================= VISTA 02: COBRAR VENTA ================= -->
        <div class="cobro-page-header">
          <h1>Cobrar venta</h1>
          <button type="button" class="link-volver-venta" (click)="volverAlCarrito()">
            ← Volver a nueva venta
          </button>
        </div>

        <div class="cobro-layout">
          <!-- COLUMNA IZQUIERDA: RESUMEN + DATOS DEL CLIENTE -->
          <div class="cobro-left-col">
            <!-- Tarjeta 1: Resumen de la venta -->
            <div class="pos-card">
              <h2 class="cobro-card-title">Resumen de la venta</h2>

              <table class="pos-resumen-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style="text-align: center;">Cantidad</th>
                    <th style="text-align: right;">P. unitario</th>
                    <th style="text-align: right;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of cart(); track item.productoId) {
                    <tr>
                      <td>
                        <div class="pos-resumen-item-cell">
                          <div class="pos-resumen-thumb">
                            @if (imagenProducto(item.productoId, item.codigo); as customImg) {
                              <img [src]="customImg" [alt]="item.nombre" class="pos-mini-img" />
                            } @else {
                              @switch (tipoIconoProducto(item.nombre, item.categoriaNombre)) {
                                @case ('pantalon') { 👖 }
                                @case ('casaca') { 🧥 }
                                @case ('accesorio') { 🧢 }
                                @default { 👕 }
                              }
                            }
                          </div>
                          <span class="pos-resumen-item-name">{{ item.nombre }}</span>
                        </div>
                      </td>
                      <td style="text-align: center;">{{ item.cantidad }} ×</td>
                      <td style="text-align: right;">S/{{ item.precio.toFixed(2) }}</td>
                      <td style="text-align: right; font-weight: 700;">S/{{ item.subtotal.toFixed(2) }}</td>
                    </tr>
                  }
                </tbody>
              </table>

              <div class="pos-resumen-footer">
                <span class="pos-resumen-count">
                  {{ cart().length }} producto{{ cart().length === 1 ? '' : 's' }} · {{ totalUnidades() }} unidad{{ totalUnidades() === 1 ? '' : 'es' }}
                </span>
                <div class="pos-resumen-total">
                  <span>Total:</span>
                  <strong class="pos-resumen-total-amount">S/{{ totalVenta().toFixed(2) }}</strong>
                </div>
              </div>
            </div>

            <!-- Tarjeta 2: Datos del cliente -->
            <div class="pos-card">
              <h2 class="cobro-card-title">Datos del cliente</h2>

              @if (clienteInactivoInfo(); as inactivo) {
                <div class="cliente-inactivo-banner">
                  <div class="inactivo-banner-header">
                    <span class="warning-icon">⚠️</span>
                    <strong>Cliente inactivo: {{ inactivo.nombre }} (DNI {{ inactivo.documento }})</strong>
                  </div>
                  <p class="inactivo-banner-desc">
                    El cliente está desactivado. Para asociarlo a la venta debe ser reactivado primero.
                  </p>
                  <div class="inactivo-banner-actions">
                    @if (auth.tiene('ADMIN')) {
                      <button
                        type="button"
                        class="btn-pos-primary btn-sm"
                        [disabled]="busy()"
                        (click)="reactivarClienteInactivo()"
                      >
                        ⚡ Reactivar cliente
                      </button>
                    }
                    <button
                      type="button"
                      class="btn-pos-secondary btn-sm"
                      (click)="toggleSinDatosCliente(true)"
                    >
                      Continuar como Consumidor final
                    </button>
                  </div>
                </div>
              }

              <div class="form-field">
                <label for="dni-input">DNI</label>
                <div class="input-with-spinner">
                  <input
                    id="dni-input"
                    type="text"
                    class="input-control"
                    placeholder="Ingresa el DNI (8 dígitos)"
                    maxlength="8"
                    [ngModel]="clienteDni"
                    (ngModelChange)="onDniInput($event)"
                    [disabled]="sinDatosCliente()"
                  />
                  @if (buscandoCliente()) {
                    <span class="input-spinner" title="Buscando cliente…">⏳</span>
                  }
                </div>
              </div>

              <div class="form-field">
                <label for="cliente-nombre-input">Nombres y apellidos</label>
                <input
                  id="cliente-nombre-input"
                  type="text"
                  class="input-control"
                  placeholder="Se completa si existe o puedes escribirlo si es nuevo"
                  [(ngModel)]="plantillaClienteNombre"
                  [disabled]="sinDatosCliente()"
                />
              </div>

              <p class="cliente-helper-text">
                @if (clienteId()) {
                  <span class="cliente-vinculado-badge">✓ Cliente registrado vinculado</span>
                } @else if (clienteDni.length === 8 && !buscandoCliente() && !clienteInactivoInfo()) {
                  <span>Nuevo cliente: se registrará automáticamente al confirmar la venta.</span>
                } @else {
                  <span>Si ya está registrado, se reconoce automáticamente. Si es nuevo, se guarda al confirmar.</span>
                }
              </p>

              <label class="checkbox-consumidor-final">
                <input
                  type="checkbox"
                  [checked]="sinDatosCliente()"
                  (change)="toggleSinDatosCliente($any($event.target).checked)"
                />
                <span>Continuar sin datos (Consumidor final)</span>
              </label>
            </div>
          </div>

          <!-- COLUMNA DERECHA: PAGO -->
          <div class="pos-card cobro-right-card" id="cobro-panel">
            <h2 class="cobro-card-title">Pago</h2>

            <div class="pago-total-block">
              <span class="pago-total-label">Total a pagar</span>
              <div class="pago-total-huge">S/{{ totalVenta().toFixed(2) }}</div>
            </div>

            <!-- Selector de Método de Pago con estilo Radio -->
            <div class="metodo-pago-options">
              <button
                type="button"
                class="metodo-pago-btn"
                [class.active]="metodoPago() === 'EFECTIVO'"
                (click)="seleccionarMetodoPago('EFECTIVO')"
              >
                <span class="radio-dot" [class.checked]="metodoPago() === 'EFECTIVO'"></span>
                <span>Efectivo</span>
              </button>
              <button
                type="button"
                class="metodo-pago-btn"
                [class.active]="metodoPago() === 'TARJETA'"
                (click)="seleccionarMetodoPago('TARJETA')"
              >
                <span class="radio-dot" [class.checked]="metodoPago() === 'TARJETA'"></span>
                <span>Tarjeta</span>
              </button>
              <button
                type="button"
                class="metodo-pago-btn"
                [class.active]="metodoPago() === 'YAPE'"
                (click)="seleccionarMetodoPago('YAPE')"
              >
                <span class="radio-dot" [class.checked]="metodoPago() === 'YAPE'"></span>
                <span>Yape / Plin</span>
              </button>
            </div>

            @if (metodoPago() === 'EFECTIVO') {
              <div class="efectivo-section">
                <label for="efectivo-input" class="metodo-pago-label">Efectivo recibido</label>
                <div class="efectivo-input-wrapper">
                  <span class="efectivo-currency-prefix">S/</span>
                  <input
                    id="efectivo-input"
                    type="number"
                    step="0.10"
                    min="0"
                    class="input-control input-efectivo"
                    [(ngModel)]="efectivoMonto"
                    (ngModelChange)="onEfectivoChange($event)"
                  />
                </div>

                <div class="quick-cash-chips">
                  <button type="button" class="quick-cash-chip" (click)="setEfectivo(totalVenta())">
                    Exacto
                  </button>
                  <button type="button" class="quick-cash-chip" (click)="setEfectivo(10)">
                    S/10
                  </button>
                  <button type="button" class="quick-cash-chip" (click)="setEfectivo(20)">
                    S/20
                  </button>
                  <button type="button" class="quick-cash-chip" (click)="setEfectivo(50)">
                    S/50
                  </button>
                </div>
              </div>

              <!-- Banner de Vuelto -->
              <div class="banner-vuelto" [class.insuficiente]="vuelto() < 0">
                <span class="banner-vuelto-label">
                  {{ vuelto() < 0 ? 'Faltante:' : 'Vuelto:' }}
                </span>
                <span class="banner-vuelto-amount">
                  S/{{ (vuelto() < 0 ? -vuelto() : vuelto()).toFixed(2) }}
                </span>
              </div>
            } @else {
              <div class="banner-vuelto">
                <span class="banner-vuelto-label">Vuelto:</span>
                <span class="banner-vuelto-amount">S/0.00</span>
              </div>
            }

            <div class="cobro-buttons-stack">
              <button
                type="button"
                class="btn-pos-primary"
                [disabled]="busy() || cart().length === 0 || !pagoValido()"
                (click)="confirmarVenta()"
              >
                @if (busy()) {
                  Registrando…
                } @else {
                  Confirmar venta
                }
              </button>

              <button
                type="button"
                class="btn-pos-secondary"
                (click)="volverAlCarrito()"
              >
                Volver al carrito
              </button>
            </div>

            <p class="pago-footer-note">
              Revisa los datos y el pago antes de confirmar.
            </p>
          </div>
        </div>

        <div class="pos-bottom-caption">Boceto propuesto · Datos de ejemplo</div>
      }

      <!-- ================= MODAL TICKET / VENTA EXITOSA ================= -->
      @if (ventaExitosa()) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <div class="modal-header">
              <h3 class="modal-title">✓ Venta registrada con éxito</h3>
              <button type="button" class="btn-close-modal" (click)="nuevaVenta()">✕</button>
            </div>

            <div class="modal-body">
              <div class="modal-grid-meta">
                <div class="meta-item">
                  <span class="meta-label">Comprobante</span>
                  <span class="meta-value venta-codigo">V-{{ ventaExitosa()?.id }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Fecha</span>
                  <span class="meta-value">{{ ventaExitosa()?.fecha | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Cliente</span>
                  <span class="meta-value">{{ ventaExitosa()?.cliente || 'Consumidor final' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Cajero</span>
                  <span class="meta-value">{{ ventaExitosa()?.cajero || 'Caja' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Método de pago</span>
                  <span class="meta-value">{{ metodoPago() }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Total pagado</span>
                  <span class="meta-value">{{ ventaExitosa()?.total | currency:'PEN':'symbol':'1.2-2' }}</span>
                </div>
                @if (metodoPago() === 'EFECTIVO') {
                  <div class="meta-item">
                    <span class="meta-label">Efectivo recibido</span>
                    <span class="meta-value">{{ ventaExitosa()?.efectivoRecibido | currency:'PEN':'symbol':'1.2-2' }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Vuelto entregado</span>
                    <span class="meta-value" style="color: var(--primary); font-weight: 700;">
                      {{ ventaExitosa()?.vuelto | currency:'PEN':'symbol':'1.2-2' }}
                    </span>
                  </div>
                }
              </div>

              <div class="cart-table-wrapper">
                <table class="cart-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th style="text-align: center;">Cant.</th>
                      <th style="text-align: right;">P. Unit</th>
                      <th style="text-align: right;">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of ventaExitosa()?.detalles; track item.productoId) {
                      <tr>
                        <td>{{ item.productoNombre }}</td>
                        <td style="text-align: center;">{{ item.cantidad }}</td>
                        <td style="text-align: right;">{{ item.precioUnitario | currency:'PEN':'symbol':'1.2-2' }}</td>
                        <td style="text-align: right; font-weight: 600;">{{ item.subtotal | currency:'PEN':'symbol':'1.2-2' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="imprimirTicket()">
                🖨 Imprimir comprobante
              </button>
              <button type="button" class="btn-primary" (click)="nuevaVenta()">
                + Nueva venta
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ["./ventas.css"],
})
export class VentaPos implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private imagenes = inject(ProductoImagenService);
  auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  imagenProducto(id?: number | null, codigo?: string | null): string | null {
    return this.imagenes.obtener(id, codigo);
  }

  async onSubirImagenProducto(event: Event, p: Producto) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await this.imagenes.procesarArchivo(file);
      this.imagenes.guardar(p.id, p.codigo, dataUrl);
      this.error.set("");
    } catch (e: any) {
      this.error.set(e?.message || "No se pudo cargar la imagen.");
    } finally {
      input.value = "";
    }
  }

  quitarImagenProducto(p: Producto) {
    this.imagenes.eliminar(p.id, p.codigo);
  }

  // Vista activa: 'pos' (Punto de venta) o 'cobro' (Cobrar venta)
  vista = signal<"pos" | "cobro">("pos");

  // Información del Cliente
  clienteDni = "";
  clienteNombre = "Consumidor final";
  clienteId = signal<number | null>(null);
  sinDatosCliente = signal<boolean>(false);
  buscandoCliente = signal<boolean>(false);
  clienteInactivoInfo = signal<ClienteDto | null>(null);
  private dniSubject = new Subject<string>();

  constructor() {
    this.dniSubject
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged(),
        tap(() => {
          this.buscandoCliente.set(true);
          this.clienteInactivoInfo.set(null);
        }),
        switchMap((dni) =>
          this.api.get<Page<ClienteDto>>("/clientes/buscar", { q: dni }).pipe(
            catchError(() =>
              of({
                content: [],
                totalElements: 0,
                totalPages: 0,
                size: 0,
                number: 0,
              } as Page<ClienteDto>)
            ),
            map((res) => ({ dni, res }))
          )
        )
      )
      .subscribe(({ dni, res }) => {
        this.buscandoCliente.set(false);
        // Descartar si el DNI actual cambió durante la espera
        if (this.clienteDni !== dni) return;

        const c =
          (res.content || []).find((item) => (item.documento || "").trim() === dni) ||
          (res.content && res.content.length > 0 ? res.content[0] : null);

        if (c && (c.documento || "").trim() === dni) {
          if (c.activo === false) {
            this.clienteId.set(null);
            this.clienteInactivoInfo.set(c);
            this.clienteNombre =
              c.nombres && c.apellidos ? `${c.nombres} ${c.apellidos}` : c.nombre;
          } else {
            this.clienteId.set(c.id);
            this.clienteInactivoInfo.set(null);
            this.clienteNombre =
              c.nombres && c.apellidos ? `${c.nombres} ${c.apellidos}` : c.nombre;
          }
        } else {
          this.clienteId.set(null);
          this.clienteInactivoInfo.set(null);
          if (
            !this.clienteNombre ||
            this.clienteNombre === "Consumidor final" ||
            this.clienteNombre.startsWith("Cliente DNI ")
          ) {
            this.clienteNombre = "";
          }
        }
      });
  }

  get plantillaClienteNombre(): string {
    return this.clienteNombre === "Consumidor final" ? "" : this.clienteNombre;
  }

  set plantillaClienteNombre(val: string) {
    this.clienteNombre = val.trim() ? val : "Consumidor final";
  }

  // Catálogo, categorías y filtros
  cart = signal<CartItem[]>([]);
  catalogo = signal<Producto[]>([]);
  categorias = signal<CategoriaDto[]>([]);
  categoriaSeleccionada = signal<number | null>(null);
  catalogoPage = signal<number>(1);
  readonly pageSize = 6;

  // Búsqueda / Scanner
  searchQuery = "";
  searchResults = signal<Producto[]>([]);
  private searchFilter = signal<string>("");

  productosFiltrados = computed<Producto[]>(() => {
    const lista = this.catalogo();
    const catId = this.categoriaSeleccionada();
    const term = this.searchFilter().trim().toLowerCase();

    return lista.filter((p) => {
      if (p.activo === false) return false;
      const matchCat = catId === null || p.categoria?.id === catId;
      if (!matchCat) return false;
      if (!term) return true;
      return (
        p.nombre.toLowerCase().includes(term) ||
        p.codigo.toLowerCase().includes(term) ||
        (p.codigoBarras && p.codigoBarras.toLowerCase().includes(term))
      );
    });
  });

  totalPaginasCatalogo = computed<number>(() => {
    const total = this.productosFiltrados().length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  });

  paginasCatalogo = computed<number[]>(() => {
    const total = this.totalPaginasCatalogo();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  productosPaginados = computed<Producto[]>(() => {
    const filtrados = this.productosFiltrados();
    const page = Math.min(this.catalogoPage(), this.totalPaginasCatalogo());
    const start = (page - 1) * this.pageSize;
    return filtrados.slice(start, start + this.pageSize);
  });

  ngOnInit() {
    this.cargarProductos();
    this.cargarCategorias();
  }

  cargarProductos(q = "") {
    const params: Record<string, string | number> = { size: 100 };
    if (q.trim()) params["q"] = q.trim();
    this.api.get<Page<Producto>>("/productos", params).subscribe({
      next: (res) => {
        this.catalogo.set((res.content || []).map((p) => normalizarProductoActivo(p)));
      },
      error: (e) => {
        this.error.set(mensaje(e));
      },
    });
  }

  cargarCategorias() {
    this.api.get<CategoriaDto[]>("/categorias").subscribe({
      next: (res) => {
        const activas = (res || []).filter((c) => c.activa !== false);
        this.categorias.set(activas);
      },
      error: () => {
        // Silencioso si falla carga secundaria de categorías
      },
    });
  }

  seleccionarCategoria(catId: number | null) {
    this.categoriaSeleccionada.set(catId);
    this.catalogoPage.set(1);
  }

  irAPaginaCatalogo(page: number) {
    if (page < 1 || page > this.totalPaginasCatalogo()) return;
    this.catalogoPage.set(page);
  }

  onSearchInput() {
    this.searchFilter.set(this.searchQuery);
    this.catalogoPage.set(1);
    this.searchResults.set(this.productosFiltrados().slice(0, 8));
  }

  tipoIconoProducto(nombre: string, categoriaNombre?: string): string {
    const prenda = `${nombre || ""} ${categoriaNombre || ""}`.toLowerCase();
    if (/jean|pantalon|pantalón|jogger/.test(prenda)) return "pantalon";
    if (/casaca|abrigo|chaqueta/.test(prenda)) return "casaca";
    if (/gorra|cinturon|cinturón|accesorio/.test(prenda)) return "accesorio";
    return "polo";
  }

  cantidadEnCarrito(productoId: number): number {
    return this.cart().find((item) => item.productoId === productoId)?.cantidad ?? 0;
  }

  subtotalEnCarrito(productoId: number): number {
    return this.cart().find((item) => item.productoId === productoId)?.subtotal ?? 0;
  }

  disminuirItemCarrito(item: CartItem) {
    if (item.cantidad <= 1) {
      this.quitarDelCarrito(item.productoId);
    } else {
      this.cambiarCantidad(item.productoId, -1);
    }
  }

  // Cobro
  metodoPago = signal<"EFECTIVO" | "TARJETA" | "YAPE">("EFECTIVO");
  efectivoMonto = 0;

  // Estado general
  busy = signal<boolean>(false);
  error = signal<string>("");
  ventaExitosa = signal<Venta | null>(null);

  // Totales computados
  totalVenta = computed(() => {
    return Math.round(this.cart().reduce((acc, item) => acc + item.subtotal, 0) * 100) / 100;
  });

  totalUnidades = computed(() => {
    return this.cart().reduce((acc, item) => acc + item.cantidad, 0);
  });

  vuelto = computed(() => {
    if (this.metodoPago() !== "EFECTIVO") return 0;
    const diff = this.efectivoMonto - this.totalVenta();
    return Math.round(diff * 100) / 100;
  });

  pagoValido = computed(() => {
    if (this.totalVenta() <= 0) return false;
    if (this.metodoPago() === "EFECTIVO") {
      return this.efectivoMonto >= this.totalVenta();
    }
    return true;
  });

  montosSugeridos = computed(() => {
    const total = this.totalVenta();
    if (total <= 0) return [];
    const montos: number[] = [];
    const billetes = [10, 20, 50, 100, 200];
    for (const b of billetes) {
      if (b > total && !montos.includes(b)) {
        montos.push(b);
      }
    }
    return montos.slice(0, 3);
  });

  // Métodos de Cliente
  onDniInput(val: string) {
    const limpio = (val || "").replace(/\D/g, "").slice(0, 8);
    this.clienteDni = limpio;
    this.clienteId.set(null);
    this.clienteInactivoInfo.set(null);

    if (limpio.length === 8) {
      this.dniSubject.next(limpio);
    } else {
      this.buscandoCliente.set(false);
      if (!limpio && !this.sinDatosCliente()) {
        this.setConsumidorFinal();
      }
    }
  }

  buscarClientePorDni(dni: string) {
    this.onDniInput(dni);
  }

  reactivarClienteInactivo() {
    const inactivo = this.clienteInactivoInfo();
    if (!inactivo || this.busy()) return;

    this.busy.set(true);
    this.error.set("");

    this.api.patch<ClienteDto>(`/clientes/${inactivo.id}/reactivar`).subscribe({
      next: (reactivado) => {
        this.busy.set(false);
        this.clienteId.set(reactivado.id);
        this.clienteInactivoInfo.set(null);
        this.clienteNombre =
          reactivado.nombres && reactivado.apellidos
            ? `${reactivado.nombres} ${reactivado.apellidos}`
            : reactivado.nombre;
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(mensaje(e));
      },
    });
  }

  toggleSinDatosCliente(checked: boolean) {
    this.sinDatosCliente.set(checked);
    if (checked) {
      this.setConsumidorFinal();
    }
  }

  setConsumidorFinal() {
    this.clienteDni = "";
    this.clienteNombre = "Consumidor final";
    this.clienteId.set(null);
    this.clienteInactivoInfo.set(null);
  }

  // Métodos de Productos y Carrito
  buscarProductos(q: string) {
    const term = (q || "").trim();
    this.searchFilter.set(term);
    this.catalogoPage.set(1);
    if (term.length < 1) {
      this.searchResults.set([]);
      return;
    }
    this.api.get<Page<Producto>>("/productos", { q: term, size: 8 }).subscribe({
      next: (res) => {
        this.searchResults.set(
          (res.content || [])
            .map((p) => normalizarProductoActivo(p))
            .filter((p) => p.activo !== false),
        );
      },
      error: (e) => {
        this.error.set(mensaje(e));
      },
    });
  }

  onSearchKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      const filtrados = this.productosFiltrados();
      if (filtrados.length === 1) {
        this.agregarAlCarrito(filtrados[0]);
        this.limpiarBuscador();
      } else if (filtrados.length > 1) {
        const queryTrim = this.searchQuery.trim().toLowerCase();
        const exact = filtrados.find(
          (p) =>
            (p.codigoBarras && p.codigoBarras.toLowerCase() === queryTrim) ||
            p.codigo.toLowerCase() === queryTrim
        );
        if (exact) {
          this.agregarAlCarrito(exact);
          this.limpiarBuscador();
        }
      }
    }
  }

  limpiarBuscador() {
    this.searchQuery = "";
    this.searchFilter.set("");
    this.searchResults.set([]);
  }

  fijarCantidad(productoId: number, val: any) {
    const num = parseInt(val, 10);
    const actual = this.cart();
    const index = actual.findIndex((i) => i.productoId === productoId);
    if (index < 0) return;
    const item = actual[index];
    if (isNaN(num) || num <= 0) {
      this.quitarDelCarrito(productoId);
      return;
    }
    const nuevaCant = Math.min(num, item.stock);
    if (num > item.stock) {
      this.error.set(`Stock máximo alcanzado para "${item.nombre}" (${item.stock} disponibles).`);
    } else {
      this.error.set("");
    }
    const updated = [...actual];
    updated[index] = {
      ...item,
      cantidad: nuevaCant,
      subtotal: Math.round(nuevaCant * item.precio * 100) / 100,
    };
    this.cart.set(updated);
  }

  agregarAlCarrito(producto: Producto) {
    if (producto.activo === false) {
      this.error.set(`"${producto.nombre}" está inactivo y no puede añadirse a nuevas ventas.`);
      return;
    }
    if (producto.stock <= 0) {
      this.error.set(`"${producto.nombre}" no tiene existencias disponibles.`);
      return;
    }

    this.error.set("");
    const actual = this.cart();
    const index = actual.findIndex((item) => item.productoId === producto.id);

    if (index >= 0) {
      const item = actual[index];
      if (item.cantidad >= item.stock) {
        this.error.set(`Stock máximo alcanzado para "${producto.nombre}".`);
        return;
      }
      const updated = [...actual];
      const nuevaCantidad = item.cantidad + 1;
      updated[index] = {
        ...item,
        cantidad: nuevaCantidad,
        subtotal: Math.round(nuevaCantidad * item.precio * 100) / 100,
      };
      this.cart.set(updated);
    } else {
      if (actual.length >= 100) {
        this.error.set("Máximo 100 productos diferentes por venta.");
        return;
      }
      this.cart.set([
        ...actual,
        {
          productoId: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          categoriaNombre: producto.categoria?.nombre,
          precio: producto.precio,
          cantidad: 1,
          stock: producto.stock,
          subtotal: producto.precio,
        },
      ]);
    }

    // Limpiar búsqueda si se escaneó código
    if (this.searchQuery.trim()) {
      this.searchQuery = "";
      this.searchFilter.set("");
      this.searchResults.set([]);
    }

    // Actualizar efectivo sugerido
    if (this.metodoPago() === "EFECTIVO" && this.efectivoMonto < this.totalVenta()) {
      this.efectivoMonto = this.totalVenta();
    }
  }

  cambiarCantidad(productoId: number, delta: number) {
    const actual = this.cart();
    const index = actual.findIndex((item) => item.productoId === productoId);
    if (index < 0) return;

    const item = actual[index];
    const nuevaCantidad = item.cantidad + delta;

    if (nuevaCantidad < 1 || nuevaCantidad > item.stock) return;

    const updated = [...actual];
    updated[index] = {
      ...item,
      cantidad: nuevaCantidad,
      subtotal: Math.round(nuevaCantidad * item.precio * 100) / 100,
    };
    this.cart.set(updated);

    if (this.metodoPago() === "EFECTIVO" && this.efectivoMonto < this.totalVenta()) {
      this.efectivoMonto = this.totalVenta();
    }
  }

  quitarDelCarrito(productoId: number) {
    this.cart.set(this.cart().filter((item) => item.productoId !== productoId));
    if (this.metodoPago() === "EFECTIVO" && this.efectivoMonto < this.totalVenta()) {
      this.efectivoMonto = this.totalVenta();
    }
  }

  cancelarVenta() {
    this.cart.set([]);
    this.setConsumidorFinal();
    this.sinDatosCliente.set(false);
    this.efectivoMonto = 0;
    this.error.set("");
    this.vista.set("pos");
  }

  irACobrar() {
    if (this.cart().length === 0) return;
    if (this.efectivoMonto < this.totalVenta()) {
      this.efectivoMonto = this.totalVenta();
    }
    this.vista.set("cobro");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  volverAlCarrito() {
    this.vista.set("pos");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Métodos de Cobro
  seleccionarMetodoPago(metodo: "EFECTIVO" | "TARJETA" | "YAPE") {
    this.metodoPago.set(metodo);
    this.efectivoMonto = this.totalVenta();
  }

  setEfectivo(monto: number) {
    this.efectivoMonto = Math.round(monto * 100) / 100;
  }

  onEfectivoChange(val: number) {
    this.efectivoMonto = Number(val) || 0;
  }

  confirmarVenta() {
    if (this.busy() || this.cart().length === 0 || !this.pagoValido()) return;

    if (this.clienteInactivoInfo()) {
      this.error.set(
        "El cliente ingresado está inactivo. Debe reactivarlo o marcar 'Continuar sin datos (Consumidor final)'."
      );
      return;
    }

    this.busy.set(true);
    this.error.set("");

    const total = this.totalVenta();
    const efectivoFinal =
      this.metodoPago() === "EFECTIVO"
        ? Number(this.efectivoMonto.toFixed(2))
        : Number(total.toFixed(2));

    const lineas = this.cart().map((item) => ({
      productoId: item.productoId,
      cantidad: item.cantidad,
      precioEsperado: item.precio,
    }));

    const dniLimpio = (this.clienteDni || "").trim();
    const nombreLimpio = (this.clienteNombre || "").trim();

    const body = {
      clienteId: this.clienteId(),
      clienteDocumento: this.sinDatosCliente() ? null : (dniLimpio || null),
      clienteTipoDocumento: "DNI",
      clienteNombre: this.sinDatosCliente() ? null : (nombreLimpio || null),
      detalles: lineas,
      claveOperacion: crypto.randomUUID(),
      efectivoRecibido: efectivoFinal,
    };

    this.api.post<Venta>("/ventas", body).subscribe({
      next: (ventaCreada) => {
        this.busy.set(false);
        this.ventaExitosa.set(ventaCreada);
        this.cargarProductos();
      },
      error: (e) => {
        this.busy.set(false);
        if (e.error?.codigo === "CLIENTE_INACTIVO") {
          this.clienteInactivoInfo.set({
            id: e.error.clienteId,
            nombre: e.error.clienteNombre,
            documento: e.error.clienteDocumento,
            activo: false,
          });
        }
        this.error.set(mensaje(e));
      },
    });
  }

  imprimirTicket() {
    window.print();
  }

  nuevaVenta() {
    this.ventaExitosa.set(null);
    this.cart.set([]);
    this.setConsumidorFinal();
    this.sinDatosCliente.set(false);
    this.clienteInactivoInfo.set(null);
    this.efectivoMonto = 0;
    this.error.set("");
    this.metodoPago.set("EFECTIVO");
    this.vista.set("pos");
    setTimeout(() => {
      const searchInput = document.getElementById("pos-search-input");
      searchInput?.focus();
    }, 50);
  }
}
