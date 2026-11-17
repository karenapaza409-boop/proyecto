import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { CurrencyPipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { OperacionForm } from "../../shared/operacion-form";
import { AuthService } from "../../core/services/auth-service";
import { Maestro, Producto } from "../../core/models/models";
import { mensaje, normalizarProductoActivo } from "../../core/services/api-service";

function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function generarUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

@Component({
  imports: [ReactiveFormsModule, CurrencyPipe, RouterLink],
  styleUrls: ["./compra-form.css"],
  template: `
    <div class="nueva-compra-page">
      <!-- Encabezado principal -->
      <div class="compra-header">
        <div class="compra-title-block">
          <div class="compra-header-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              <line x1="12" y1="9" x2="12" y2="15"></line>
              <line x1="9" y1="12" x2="15" y2="12"></line>
            </svg>
          </div>
          <div>
            <h1>Nueva compra</h1>
            <p class="compra-subtitle">Registra la mercadería que recibes del proveedor.</p>
          </div>
        </div>
        <a class="btn-volver-compras" routerLink="/compras">← Volver a compras</a>
      </div>

      <form class="compra-form-stack" [formGroup]="form" (submit)="$event.preventDefault()">
        <!-- Tarjeta 1: Proveedor, Fecha y Documento -->
        <section class="compra-top-card">
          <div class="top-fields-grid">
            <!-- Proveedor -->
            <div class="top-field">
              <label for="proveedorSelect">Proveedor <span class="req">*</span></label>
              <div class="proveedor-combo">
                <div class="proveedor-select-wrap">
                  <svg class="field-prefix-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <select
                    id="proveedorSelect"
                    formControlName="tercero"
                    aria-label="Proveedor"
                    (change)="recordarProveedor()"
                  >
                    <option [ngValue]="0">Seleccione un proveedor activo</option>
                    @for (p of parties(); track p.id) {
                      <option [ngValue]="p.id">
                        {{ p.nombre }}{{ p.documento ? ' · ' + p.documento : '' }}
                      </option>
                    }
                  </select>
                </div>
                <input
                  #supplier
                  class="proveedor-filter-input"
                  placeholder="Filtrar proveedor por nombre o RUC/DNI"
                  aria-label="Buscar proveedor activo"
                  (input)="buscarProveedores(supplier.value)"
                  (keydown.enter)="$event.preventDefault()"
                />
              </div>
              @if (proveedoresLoading()) {
                <small class="muted" role="status">Buscando proveedores…</small>
              }
              @if (proveedorPage + 1 < proveedorTotalPages) {
                <button
                  type="button"
                  class="link-inline"
                  (click)="buscarProveedores(proveedorQuery, true)"
                  [disabled]="proveedoresLoading()"
                >
                  Cargar más proveedores
                </button>
              }
              @if (intentado() && form.controls.tercero.invalid) {
                <small class="field-error">Seleccione un proveedor activo.</small>
              }
            </div>

            <!-- Fecha -->
            <div class="top-field" [formGroup]="datos">
              <label for="fechaRecepcionInput">Fecha <span class="req">*</span></label>
              <input
                id="fechaRecepcionInput"
                type="date"
                formControlName="fechaRecepcion"
                [max]="fechaHoy"
                aria-label="Fecha de recepción"
                (keydown.enter)="$event.preventDefault()"
              />
              @if (intentado() && datos.controls.fechaRecepcion.invalid) {
                <small class="field-error">Ingrese una fecha válida que no sea futura.</small>
              }
            </div>

            <!-- Documento (opcional) -->
            <div class="top-field" [formGroup]="datos">
              <label for="documentoInput">Documento <span class="opt">(opcional)</span></label>
              <input
                id="documentoInput"
                formControlName="documento"
                maxlength="40"
                placeholder="Número del comprobante"
                aria-label="Documento"
                (keydown.enter)="$event.preventDefault()"
              />
              @if (intentado() && datos.hasError('comprobante')) {
                <small class="field-error">Complete tipo, serie y número, o deje los tres vacíos.</small>
              }
            </div>
          </div>
        </section>

        <!-- Barra de búsqueda de productos + botón "+ Producto nuevo" -->
        <section class="compra-search-card">
          <div class="search-bar-row">
            <div class="product-search-input-wrap">
              <svg class="search-prefix-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                #search
                placeholder="Escanea un código o busca un producto"
                aria-label="Agregar producto"
                (input)="onBuscarInput(search.value)"
                (keydown.enter)="onEnterBusqueda($event, search)"
              />
            </div>
            <button
              type="button"
              class="btn-producto-nuevo"
              (click)="insertarDesdeBuscador(search)"
              [disabled]="busy()"
            >
              + Producto nuevo
            </button>
          </div>

          @if (productos().length > 0) {
            <div class="search-results-dropdown" role="listbox">
              @for (p of productos(); track p.id) {
                <button
                  type="button"
                  class="search-result-item"
                  (click)="seleccionarProductoCatalogo(p, search)"
                  [disabled]="busy()"
                >
                  <div class="result-main">
                    <strong>{{ p.nombre }}</strong>
                    <span class="result-code">{{ p.codigo }}@if (p.codigoBarras) { · {{ p.codigoBarras }} } · {{ p.categoria.nombre }}</span>
                  </div>
                  <div class="result-meta">
                    <span>Venta: {{ p.precio | currency: "PEN" : "S/ " }}</span>
                    <span class="result-stock">Stock: {{ p.stock }}</span>
                  </div>
                </button>
              }
            </div>
          }
        </section>

        <!-- Tarjeta principal: Productos de la compra -->
        <section class="compra-items-card">
          <h2>Productos de la compra</h2>

          <div class="inline-new-banner">
            <span class="info-circle-icon" aria-hidden="true">i</span>
            <span>
              ¿No existe el producto?
              <button
                type="button"
                class="link-inline-add"
                (click)="insertarDesdeBuscador(search)"
                [disabled]="busy()"
              >
                Añádelo aquí
              </button>
              sin salir de la compra.
            </span>
          </div>

          @if (conflictoProducto(); as existente) {
            <div class="conflict-product-banner" role="alert">
              <div class="conflict-text">
                <strong>Código ya registrado:</strong>
                <span>
                  El código "{{ conflictoCodigo() }}" pertenece al producto existente
                  <strong>{{ existente.nombre }}</strong> ({{ existente.codigo }}).
                </span>
              </div>
              <button
                type="button"
                class="btn-primary btn-usar-existente"
                (click)="reemplazarFilaConProductoExistente(existente)"
              >
                Seleccionar "{{ existente.nombre }}" sin perder la compra
              </button>
            </div>
          }

          @if (error()) {
            <p class="error" role="alert">{{ error() }}</p>
          }

          <div class="compra-table-wrapper" formArrayName="detalles">
            <table class="compra-items-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Cantidad</th>
                  <th>Costo unitario</th>
                  <th>Precio de venta</th>
                  <th>Subtotal</th>
                  <th style="width: 44px;"></th>
                </tr>
              </thead>
              <tbody>
                @for (line of detalles.controls; track line; let i = $index) {
                  @if (line.get("esNuevo")?.value) {
                    <!-- Fila editable de Producto Nuevo -->
                    <tr [formGroupName]="i" class="fila-nuevo">
                      <td class="col-producto">
                        <div class="cell-producto-layout">
                          <div class="prod-thumb nuevo-thumb" aria-hidden="true">⚡</div>
                          <div class="nuevo-prod-fields">
                            <span class="badge-nuevo">Nuevo</span>
                            <input
                              formControlName="nombre"
                              maxlength="150"
                              placeholder="Nombre del producto"
                              aria-label="Nombre del producto nuevo"
                              (keydown.enter)="onEnterEnFila($event)"
                            />
                            <div class="nuevo-meta-line">
                              <span>Unidad: Unidad · Código interno automático ({{ obtenerCodigoPreview(line, i) }})</span>
                              @if (line.get("codigoBarras")?.value) {
                                <span class="barcode-tag">· Barras: {{ line.get("codigoBarras")?.value }}</span>
                              }
                            </div>
                            @if (line.get("nombre")?.invalid && (line.get("nombre")?.touched || intentado())) {
                              <small class="field-error">Ingrese el nombre del producto.</small>
                            }
                          </div>
                        </div>
                      </td>

                      <td class="col-categoria">
                        <select
                          formControlName="categoriaId"
                          aria-label="Categoría"
                          (keydown.enter)="onEnterEnFila($event)"
                        >
                          <option [ngValue]="0">Categoría...</option>
                          @for (cat of categorias(); track cat.id) {
                            <option [ngValue]="cat.id">{{ cat.nombre }}</option>
                          }
                        </select>
                        @if (line.get("categoriaId")?.invalid && (line.get("categoriaId")?.touched || intentado())) {
                          <small class="field-error">Seleccione categoría.</small>
                        }
                      </td>

                      <td class="col-cantidad">
                        <input
                          aria-label="Cantidad"
                          type="number"
                          formControlName="cantidad"
                          min="1"
                          max="100000"
                          step="1"
                          (keydown.enter)="onEnterEnFila($event)"
                        />
                        @if (line.get("cantidad")?.invalid && (line.get("cantidad")?.touched || intentado())) {
                          <small class="field-error">Entero 1–100000.</small>
                        }
                      </td>

                      <td class="col-costo">
                        <div class="currency-field">
                          <span class="currency-prefix">S/</span>
                          <input
                            aria-label="Precio unitario"
                            type="number"
                            formControlName="precioUnitario"
                            min="0.01"
                            step="0.01"
                            (keydown.enter)="onEnterEnFila($event)"
                          />
                        </div>
                        @if (line.get("precioUnitario")?.invalid && (line.get("precioUnitario")?.touched || intentado())) {
                          <small class="field-error">Costo &gt; 0.</small>
                        }
                      </td>

                      <td class="col-precio-venta">
                        <div class="currency-field">
                          <span class="currency-prefix">S/</span>
                          <input
                            aria-label="Precio de venta"
                            type="number"
                            formControlName="precioVenta"
                            min="0.01"
                            step="0.01"
                            (keydown.enter)="onEnterEnFila($event)"
                          />
                        </div>
                        @if (line.get("precioVenta")?.invalid && (line.get("precioVenta")?.touched || intentado())) {
                          <small class="field-error">Precio &gt; 0.</small>
                        }
                      </td>

                      <td class="col-subtotal">
                        <strong class="subtotal-amount">{{ subtotal(i) | currency: "PEN" : "S/ " }}</strong>
                      </td>

                      <td class="col-acciones">
                        <button
                          type="button"
                          class="btn-remove-row"
                          (click)="quitar(i)"
                          [disabled]="busy()"
                          [attr.aria-label]="'Quitar ' + (line.get('nombre')?.value || 'producto nuevo')"
                          title="Quitar fila"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                            <path d="M10 11v6"></path>
                            <path d="M14 11v6"></path>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  } @else {
                    <!-- Fila de Producto Existente -->
                    <tr [formGroupName]="i" class="fila-existente">
                      <td class="col-producto">
                        <div class="cell-producto-layout">
                          <div class="prod-thumb" aria-hidden="true">🍾</div>
                          <div class="existing-prod-info">
                            <strong class="existing-prod-name">{{ line.get("nombre")?.value }}</strong>
                            <span class="existing-prod-code">
                              {{ line.get("codigo")?.value || "CAT" }}
                              @if (line.get("codigoBarras")?.value) {
                                · {{ line.get("codigoBarras")?.value }}
                              }
                            </span>
                          </div>
                        </div>
                      </td>

                      <td class="col-categoria">
                        <span class="existing-cat-name">{{ line.get("categoriaNombre")?.value || "General" }}</span>
                      </td>

                      <td class="col-cantidad">
                        <input
                          aria-label="Cantidad"
                          type="number"
                          formControlName="cantidad"
                          min="1"
                          max="100000"
                          step="1"
                          (keydown.enter)="onEnterEnFila($event)"
                        />
                        @if (line.get("cantidad")?.invalid && (line.get("cantidad")?.touched || intentado())) {
                          <small class="field-error">Entero entre 1 y 100000.</small>
                        }
                      </td>

                      <td class="col-costo">
                        <div class="currency-field">
                          <span class="currency-prefix">S/</span>
                          <input
                            aria-label="Precio unitario"
                            type="number"
                            formControlName="precioUnitario"
                            min="0.01"
                            step="0.01"
                            (keydown.enter)="onEnterEnFila($event)"
                          />
                        </div>
                        @if (line.get("precioUnitario")?.invalid && (line.get("precioUnitario")?.touched || intentado())) {
                          <small class="field-error">Costo positivo, máximo 2 decimales.</small>
                        }
                      </td>

                      <td class="col-precio-venta">
                        <span class="ref-price-value" title="Precio de venta actual de referencia">
                          {{ line.get("precioReferencia")?.value | currency: "PEN" : "S/ " }}
                        </span>
                      </td>

                      <td class="col-subtotal">
                        <strong class="subtotal-amount">{{ subtotal(i) | currency: "PEN" : "S/ " }}</strong>
                      </td>

                      <td class="col-acciones">
                        <button
                          type="button"
                          class="btn-remove-row"
                          (click)="quitar(i)"
                          [disabled]="busy()"
                          [attr.aria-label]="'Quitar ' + line.get('nombre')?.value"
                          title="Quitar fila"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                            <path d="M10 11v6"></path>
                            <path d="M14 11v6"></path>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  }
                } @empty {
                  <tr>
                    <td colspan="7" class="empty-table-msg">
                      Busca un producto existente o pulsa "+ Producto nuevo" para registrar mercadería.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Botón "+ Añadir otra fila" y ayuda de teclado -->
          <div class="add-row-toolbar">
            <button
              type="button"
              class="btn-add-row"
              (click)="agregarProductoNuevo()"
              [disabled]="busy()"
            >
              + Añadir otra fila
            </button>
            <span class="keyboard-hint">Tab: siguiente campo · Enter: añadir</span>
          </div>

          <!-- Resumen de cantidades y Total -->
          <div class="compra-summary-bar">
            <div class="summary-counts">
              <strong>{{ detalles.length }} productos · {{ unidades() }} unidades</strong>
            </div>
            <div class="summary-total">
              <span class="summary-total-label">Total</span>
              <strong class="summary-total-amount">{{ total() | currency: "PEN" : "S/ " }}</strong>
            </div>
          </div>

          <!-- Barra inferior de confirmación -->
          <div class="compra-confirm-footer">
            <div class="confirm-notice">
              <span class="confirm-check-circle" aria-hidden="true">✓</span>
              <div class="confirm-notice-text">
                <strong>Al confirmar se crean los productos nuevos y se registra el ingreso de stock.</strong>
                <span>Si cancelas, no se guardan los productos nuevos.</span>
              </div>
            </div>
            <div class="confirm-actions">
              <button
                type="button"
                class="btn-secondary"
                (click)="cancelar()"
                [disabled]="busy()"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn-primary confirm-submit-btn"
                (click)="guardar()"
                [disabled]="busy() || !ready()"
              >
                {{ busy() ? "Guardando compra…" : "Confirmar compra" }}
              </button>
            </div>
          </div>
        </section>
      </form>
    </div>
  `,
})
export class CompraForm extends OperacionForm implements OnInit {
  private builder = inject(FormBuilder);
  private auth = inject(AuthService, { optional: true });

  fechaHoy = hoy();
  intentado = signal(false);
  categorias = signal<Maestro[]>([]);
  conflictoProducto = signal<Producto | null>(null);
  conflictoCodigo = signal<string>("");
  private claveOperacionActual = generarUuid();

  datos = this.builder.nonNullable.group(
    {
      fechaRecepcion: [
        this.fechaHoy,
        [
          Validators.required,
          (c: any) =>
            /^\d{4}-\d{2}-\d{2}$/.test(c.value) && c.value <= hoy()
              ? null
              : { fecha: true },
        ],
      ],
      documento: ["", [Validators.maxLength(40)]],
      tipoComprobante: [""],
      serie: ["", [Validators.maxLength(20), Validators.pattern(/^[A-Za-z0-9-]*$/)]],
      numero: ["", [Validators.maxLength(20), Validators.pattern(/^[0-9]*$/)]],
      observaciones: ["", Validators.maxLength(1000)],
    },
    {
      validators: (g) => {
        const v = g.getRawValue();
        const filled = [v.tipoComprobante, v.serie, v.numero].filter(
          (s: string) => !!s?.trim(),
        ).length;
        return filled === 0 || filled === 3 ? null : { comprobante: true };
      },
    },
  );

  unidades = computed(() => {
    this.values();
    return this.detalles.controls.reduce(
      (sum, c) => sum + (Number(c.get("cantidad")?.value) || 0),
      0,
    );
  });

  override ngOnInit() {
    super.ngOnInit();
    this.api.get<Maestro[]>("/categorias").subscribe({
      next: (cats) => this.categorias.set(cats || []),
      error: () => {},
    });
  }

  seleccionado() {
    return this.parties().find(
      (p) => p.id === Number(this.form.controls.tercero.value),
    );
  }

  puedeCrearProductos(): boolean {
    return !this.auth || this.auth.tiene("ADMIN");
  }

  onBuscarInput(valor: string) {
    this.conflictoProducto.set(null);
    this.buscar(valor);
  }

  onEnterBusqueda(event: Event, inputEl: HTMLInputElement) {
    event.preventDefault();
    event.stopPropagation();
    const q = (inputEl.value || "").trim();
    if (!q) return;

    const lista = this.productos();
    const exacto = lista.find(
      (p) =>
        p.codigo.toLowerCase() === q.toLowerCase() ||
        (p.codigoBarras && p.codigoBarras.toLowerCase() === q.toLowerCase()),
    );
    if (exacto) {
      this.seleccionarProductoCatalogo(exacto, inputEl);
      return;
    }
    if (lista.length === 1) {
      this.seleccionarProductoCatalogo(lista[0], inputEl);
      return;
    }
    this.api.get<{ content: Producto[] }>("/productos", { q, size: 10 }).subscribe({
      next: (r) => {
        const normalizados = (r?.content || []).map((p) => normalizarProductoActivo(p));
        const items = normalizados.filter((p) => p.activo !== false);
        const inactivoExacto = normalizados.find(
          (p) =>
            p.activo === false &&
            (p.codigo.toLowerCase() === q.toLowerCase() ||
              (p.codigoBarras && p.codigoBarras.toLowerCase() === q.toLowerCase())),
        );
        if (inactivoExacto) {
          this.error.set(
            `El producto "${inactivoExacto.nombre}" está inactivo y no puede añadirse a nuevas compras.`,
          );
          return;
        }
        const match = items.find(
          (p) =>
            p.codigo.toLowerCase() === q.toLowerCase() ||
            (p.codigoBarras && p.codigoBarras.toLowerCase() === q.toLowerCase()),
        );
        if (match) {
          this.seleccionarProductoCatalogo(match, inputEl);
        } else if (items.length === 1) {
          this.seleccionarProductoCatalogo(items[0], inputEl);
        } else {
          this.productos.set(items);
        }
      },
      error: (e) => this.error.set(mensaje(e)),
    });
  }

  seleccionarProductoCatalogo(p: Producto, inputEl?: HTMLInputElement) {
    this.agregar(p);
    this.productos.set([]);
    if (inputEl) {
      inputEl.value = "";
    }
  }

  insertarDesdeBuscador(inputEl?: HTMLInputElement) {
    const texto = (inputEl?.value || "").trim();
    if (texto) {
      const coincidencia = this.productos().find(
        (p) =>
          p.codigo.toLowerCase() === texto.toLowerCase() ||
          (p.codigoBarras && p.codigoBarras.toLowerCase() === texto.toLowerCase()),
      );
      if (coincidencia) {
        this.conflictoCodigo.set(texto);
        this.conflictoProducto.set(coincidencia);
        this.error.set(
          `El código "${texto}" ya pertenece al producto "${coincidencia.nombre}". Puede seleccionarlo sin perder la compra.`,
        );
        return;
      }
    }
    const esCodigoBarras = /^[0-9]{6,50}$/.test(texto) || (/^[A-Za-z0-9-]{4,50}$/.test(texto) && /\d/.test(texto) && !/\s/.test(texto));
    this.agregarProductoNuevo({
      nombre: esCodigoBarras ? "" : texto,
      codigoBarras: esCodigoBarras ? texto : "",
    });
    this.productos.set([]);
    if (inputEl) {
      inputEl.value = "";
    }
  }

  agregarProductoNuevo(inicial?: {
    nombre?: string;
    categoriaId?: number;
    cantidad?: number;
    precioUnitario?: number;
    precioVenta?: number;
    codigo?: string;
    codigoBarras?: string;
  }) {
    if (!this.puedeCrearProductos()) {
      this.error.set(
        "No tiene permisos para crear productos nuevos desde compras. Solicite acceso de Administrador.",
      );
      return;
    }
    if (this.detalles.length >= 100) {
      this.error.set("Máximo 100 productos por operación.");
      return;
    }
    this.error.set("");
    this.conflictoProducto.set(null);
    const catDefault =
      inicial?.categoriaId ?? (this.categorias()[0]?.id || 0);

    this.detalles.push(
      this.fb.nonNullable.group({
        esNuevo: [true],
        productoId: [0],
        codigo: [
          inicial?.codigo || "",
          [Validators.maxLength(50)],
        ],
        codigoBarras: [
          inicial?.codigoBarras || "",
          [Validators.maxLength(50), Validators.pattern(/^[A-Za-z0-9-]*$/)],
        ],
        nombre: [
          inicial?.nombre || "",
          [Validators.required, Validators.maxLength(150), Validators.pattern(/\S/)],
        ],
        categoriaId: [
          catDefault,
          [Validators.required, Validators.min(1)],
        ],
        categoriaNombre: [""],
        unidadVenta: ["UNIDAD"],
        precioReferencia: [0],
        cantidad: [
          inicial?.cantidad ?? 1,
          [
            Validators.required,
            Validators.min(1),
            Validators.max(100000),
            Validators.pattern(/^\d+$/),
          ],
        ],
        precioUnitario: [
          inicial?.precioUnitario ?? 1,
          [
            Validators.required,
            Validators.min(0.01),
            Validators.pattern(/^\d+(\.\d{1,2})?$/),
          ],
        ],
        precioVenta: [
          inicial?.precioVenta ?? 1,
          [
            Validators.required,
            Validators.min(0.01),
            Validators.pattern(/^\d+(\.\d{1,2})?$/),
          ],
        ],
      }),
    );
  }

  obtenerCodigoPreview(line: AbstractControl, index: number): string {
    const manual = String(line.get("codigo")?.value || "").trim();
    if (manual) return manual;
    const catId = Number(line.get("categoriaId")?.value);
    const cat = this.categorias().find((c) => c.id === catId);
    const limpio = (cat?.nombre || "PRD")
      .normalize("NFD")
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase();
    const prefijo = (limpio + "PRD").substring(0, 3);
    return `${prefijo}-AUTO`;
  }

  onEnterEnFila(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.agregarProductoNuevo();
  }

  reemplazarFilaConProductoExistente(existente: Producto) {
    const codigoConflictivo = this.conflictoCodigo().toLowerCase();
    const idx = this.detalles.controls.findIndex((c) => {
      if (!c.get("esNuevo")?.value) return false;
      const cod = String(c.get("codigo")?.value || "").trim().toLowerCase();
      const bar = String(c.get("codigoBarras")?.value || "").trim().toLowerCase();
      return (
        (codigoConflictivo && (cod === codigoConflictivo || bar === codigoConflictivo)) ||
        cod === existente.codigo.toLowerCase() ||
        (!!existente.codigoBarras && bar === existente.codigoBarras.toLowerCase())
      );
    });

    const targetIndex =
      idx >= 0
        ? idx
        : this.detalles.controls.findIndex((c) => !!c.get("esNuevo")?.value);

    const cantidadPrevia =
      targetIndex >= 0
        ? Number(this.detalles.at(targetIndex).get("cantidad")?.value) || 1
        : 1;
    const costoPrevio =
      targetIndex >= 0
        ? Number(this.detalles.at(targetIndex).get("precioUnitario")?.value) || existente.precio
        : existente.precio;

    if (targetIndex >= 0) {
      this.detalles.removeAt(targetIndex);
    }

    const yaExisteIdx = this.detalles.controls.findIndex(
      (c) => !c.get("esNuevo")?.value && c.get("productoId")?.value === existente.id,
    );
    if (yaExisteIdx >= 0) {
      const actual = Number(this.detalles.at(yaExisteIdx).get("cantidad")?.value) || 0;
      this.detalles.at(yaExisteIdx).get("cantidad")?.setValue(actual + cantidadPrevia);
      this.detalles.at(yaExisteIdx).get("precioUnitario")?.setValue(costoPrevio);
    } else {
      this.agregar(existente);
      const nuevoCtrl = this.detalles.at(this.detalles.length - 1);
      nuevoCtrl.get("cantidad")?.setValue(cantidadPrevia);
      nuevoCtrl.get("precioUnitario")?.setValue(costoPrevio);
    }

    this.conflictoProducto.set(null);
    this.conflictoCodigo.set("");
    this.error.set("");
    this.claveOperacionActual = generarUuid();
  }

  cancelar() {
    this.detalles.clear();
    this.conflictoProducto.set(null);
    this.error.set("");
    this.router.navigate(["/compras"]);
  }

  override guardar() {
    if (this.busy()) return;
    this.intentado.set(true);
    this.conflictoProducto.set(null);
    if (this.datos.invalid) {
      this.datos.markAllAsTouched();
      this.error.set("Revise fecha y datos del comprobante.");
      return;
    }
    super.guardar();
  }

  protected override confirmarOperacion(): boolean {
    return true;
  }

  protected override onGuardarError(e: any) {
    this.busy.set(false);
    const prodExistente = e?.error?.productoExistente as Producto | undefined;
    if (prodExistente && prodExistente.id) {
      this.conflictoProducto.set(prodExistente);
      this.conflictoCodigo.set(e?.error?.codigoConflictivo || prodExistente.codigo);
    }
    this.error.set(mensaje(e));
    this.claveOperacionActual = generarUuid();
  }

  protected override datosCompra() {
    const v = this.datos.getRawValue();
    let tipoComprobante = v.tipoComprobante || null;
    let serie = v.serie.trim() || null;
    let numero = v.numero.trim() || null;
    let observaciones = v.observaciones.trim() || null;

    const doc = (v.documento || "").trim();
    if (!tipoComprobante && !serie && !numero && doc) {
      const matchSerieNum = /^([A-Za-z0-9]{1,20})-(\d{1,20})$/.exec(doc);
      if (matchSerieNum) {
        const pref = matchSerieNum[1].toUpperCase();
        tipoComprobante = pref.startsWith("F")
          ? "FACTURA"
          : pref.startsWith("B")
            ? "BOLETA"
            : "OTRO";
        serie = pref;
        numero = matchSerieNum[2];
      } else if (/^\d{1,20}$/.test(doc)) {
        tipoComprobante = "OTRO";
        serie = "DOC";
        numero = doc;
      } else {
        observaciones = observaciones ? `${observaciones} | Doc: ${doc}` : `Doc: ${doc}`;
      }
    }

    return {
      fechaRecepcion: v.fechaRecepcion,
      tipoComprobante,
      serie,
      numero,
      observaciones,
      claveOperacion: this.claveOperacionActual,
    };
  }
}
