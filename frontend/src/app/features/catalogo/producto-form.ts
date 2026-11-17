import { Component, inject, signal, OnInit } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { ApiService, mensaje } from "../../core/services/api-service";
import { ProductoImagenService } from "../../core/services/producto-imagen.service";
import { Maestro, Producto } from "../../core/models/models";

@Component({
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
  styleUrls: ["./inventario.css"],
  template: `
    <a class="back-link" routerLink="/productos">← Volver a productos</a>

    <div class="page-heading">
      <div class="heading-title-group">
        <h1>{{ id ? "Editar producto" : "Registrar producto" }}</h1>
        <p class="heading-subtitle">Completa los datos de identificación y parámetros de reposición.</p>
      </div>
    </div>

    @if (error()) {
      <div class="error-box" role="alert">
        <span>{{ error() }}</span>
      </div>
    }

    <form [formGroup]="form" (ngSubmit)="guardar()">
      <!-- Bloque 1: Identificación -->
      <section class="form-card">
        <h2 class="card-title">Identificación</h2>
        <div class="grid-2-cols">
          <div class="form-group">
            <label class="form-label" for="nombre">
              Nombre del producto <span class="required">*</span>
            </label>
            <input
              id="nombre"
              class="form-control"
              formControlName="nombre"
              maxlength="150"
              placeholder="Ej.: Polo de algodón negro · Talla M"
              aria-label="Nombre"
            />
            @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
              <span class="field-error">El nombre es obligatorio (máx. 150 caracteres).</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="codigo">
              Código interno <span class="required">*</span>
            </label>
            <input
              id="codigo"
              class="form-control"
              formControlName="codigo"
              maxlength="50"
              placeholder="Ej.: POL-001"
              aria-label="Código"
            />
            @if (form.controls.codigo.touched && form.controls.codigo.invalid) {
              <span class="field-error">El código interno es obligatorio y único.</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="codigoBarras">
              Código de barras (opcional)
            </label>
            <input
              id="codigoBarras"
              class="form-control"
              formControlName="codigoBarras"
              maxlength="50"
              placeholder="Escanea o ingresa el código"
            />
            @if (form.controls.codigoBarras.touched && form.controls.codigoBarras.invalid) {
              <span class="field-error">Formato alfanumérico sin espacios.</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="categoriaId">
              Categoría <span class="required">*</span>
            </label>
            <select
              id="categoriaId"
              class="form-control"
              formControlName="categoriaId"
              aria-label="Categoría"
            >
              <option [ngValue]="0">Seleccione una categoría</option>
              @for (c of categorias(); track c.id) {
                <option [ngValue]="c.id">{{ c.nombre }}</option>
              }
            </select>
            @if (form.controls.categoriaId.touched && form.controls.categoriaId.invalid) {
              <span class="field-error">Seleccione una categoría válida.</span>
            }
          </div>
        </div>
      </section>

      <!-- Bloque 2: Venta y reposición -->
      <section class="form-card">
        <h2 class="card-title">Venta y reposición</h2>
        <div class="grid-2-cols">
          <div class="form-group">
            <label class="form-label" for="unidadVenta">
              Unidad de venta <span class="required">*</span>
            </label>
            <select id="unidadVenta" class="form-control" formControlName="unidadVenta">
              <option value="UNIDAD">Unidad</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="precio">
              Precio de venta (S/) <span class="required">*</span>
            </label>
            <input
              id="precio"
              class="form-control"
              formControlName="precio"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              aria-label="Precio de venta (S/)"
            />
            @if (form.controls.precio.touched && form.controls.precio.invalid) {
              <span class="field-error">Ingrese un precio mayor a 0 con hasta dos decimales.</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="stock">
              Stock disponible <span class="required">*</span>
            </label>
            <input
              id="stock"
              class="form-control"
              formControlName="stock"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              aria-label="Stock disponible"
            />
            @if (form.controls.stock.touched && form.controls.stock.invalid) {
              <span class="field-error">El stock disponible no puede ser negativo.</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="stockMinimo">
              Stock mínimo <span class="required">*</span>
            </label>
            <input
              id="stockMinimo"
              class="form-control"
              formControlName="stockMinimo"
              type="number"
              min="0"
              step="1"
              placeholder="6"
            />
            @if (form.controls.stockMinimo.touched && form.controls.stockMinimo.invalid) {
              <span class="field-error">El stock mínimo no puede ser negativo.</span>
            }
          </div>
        </div>

        <p class="form-info-note">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          El stock se actualiza mediante compras, ventas y ajustes registrados, o indicando aquí las existencias disponibles.
        </p>
      </section>

      <!-- Bloque 3: Imagen del producto -->
      <section class="form-card">
        <h2 class="card-title">Imagen del producto (opcional)</h2>
        <div class="product-image-upload-row">
          <div class="product-image-preview-box">
            @if (imagenPreview()) {
              <img [src]="imagenPreview()" alt="Vista previa del producto" class="product-image-preview" />
            } @else {
              <span class="product-image-placeholder">📷 Sin imagen</span>
            }
          </div>

          <div class="product-image-controls">
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <label class="btn-secondary" style="cursor: pointer;">
                📷 Subir imagen desde mi PC
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  (change)="onArchivoSeleccionado($event)"
                />
              </label>
              @if (imagenPreview()) {
                <button type="button" class="outline-btn danger-btn" (click)="quitarImagen()">
                  Quitar imagen
                </button>
              }
            </div>

            <div class="form-group" style="margin-top: 8px;">
              <label class="form-label" for="imagenUrlInput">O pega el enlace (URL) de una imagen</label>
              <input
                id="imagenUrlInput"
                class="form-control"
                type="url"
                placeholder="https://ejemplo.com/imagen-producto.png"
                [ngModel]="imagenUrlManual()"
                [ngModelOptions]="{ standalone: true }"
                (ngModelChange)="onUrlManualChange($event)"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Pie de acciones -->
      <div class="form-actions-footer">
        <a class="btn-secondary" routerLink="/productos">Cancelar</a>
        <button
          type="submit"
          class="btn-primary"
          [disabled]="busy() || loading()"
          aria-label="Guardar"
        >
          Guardar producto
        </button>
      </div>
    </form>
  `,
})
export class ProductoForm implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private imagenes = inject(ProductoImagenService);

  id = this.route.snapshot.paramMap.get("id");
  categorias = signal<Maestro[]>([]);
  error = signal("");
  busy = signal(false);
  loading = signal(true);
  imagenPreview = signal<string>("");
  imagenUrlManual = signal<string>("");

  form = this.fb.nonNullable.group({
    nombre: ["", [Validators.required, Validators.maxLength(150), Validators.pattern(/\S/)]],
    codigo: ["", [Validators.required, Validators.maxLength(50), Validators.pattern(/\S/)]],
    codigoBarras: ["", [Validators.maxLength(50), Validators.pattern(/^[A-Za-z0-9-]*$/)]],
    categoriaId: [0, [Validators.required, Validators.min(1)]],
    unidadVenta: ["UNIDAD", [Validators.required]],
    precio: [0, [Validators.required, Validators.min(0.01), Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    stock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    stockMinimo: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
  });

  ngOnInit() {
    this.api.get<Maestro[]>("/categorias").subscribe({
      next: (r) => {
        this.categorias.set(r);
        if (!this.id) this.loading.set(false);
      },
      error: (e) => this.error.set(mensaje(e)),
    });

    if (this.id) {
      this.api.get<Producto>("/productos/" + this.id).subscribe({
        next: (p) => {
          this.form.patchValue({
            nombre: p.nombre,
            codigo: p.codigo,
            codigoBarras: p.codigoBarras || "",
            categoriaId: p.categoria.id,
            unidadVenta: p.unidadVenta || "UNIDAD",
            precio: p.precio,
            stock: p.stock ?? 0,
            stockMinimo: p.stockMinimo ?? 0,
          });
          const guardada = this.imagenes.obtener(p.id, p.codigo);
          if (guardada) {
            this.imagenPreview.set(guardada);
            if (!guardada.startsWith("data:")) {
              this.imagenUrlManual.set(guardada);
            }
          }
          this.loading.set(false);
        },
        error: (e) => {
          this.error.set(mensaje(e));
          this.loading.set(false);
        },
      });
    }
  }

  guardar() {
    if (this.busy() || this.loading()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set("");

    const payload = this.form.getRawValue();
    const req = this.id
      ? this.api.put<Producto>("/productos/" + this.id, payload)
      : this.api.post<Producto>("/productos", payload);

    req.subscribe({
      next: (guardado) => {
        const prodId = guardado?.id ?? (this.id ? Number(this.id) : null);
        const cod = guardado?.codigo ?? payload.codigo;
        if (this.imagenPreview()) {
          this.imagenes.guardar(prodId, cod, this.imagenPreview());
        } else {
          this.imagenes.eliminar(prodId, cod);
        }
        this.router.navigate(["/productos"]);
      },
      error: (e) => {
        this.error.set(mensaje(e));
        this.busy.set(false);
      },
    });
  }

  async onArchivoSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await this.imagenes.procesarArchivo(file);
      this.imagenPreview.set(dataUrl);
      this.imagenUrlManual.set("");
      this.error.set("");
    } catch (e: any) {
      this.error.set(e?.message || "No se pudo procesar la imagen.");
    } finally {
      input.value = "";
    }
  }

  onUrlManualChange(url: string) {
    this.imagenUrlManual.set(url);
    this.imagenPreview.set((url || "").trim());
  }

  quitarImagen() {
    this.imagenPreview.set("");
    this.imagenUrlManual.set("");
  }
}
