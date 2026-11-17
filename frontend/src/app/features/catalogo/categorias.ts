import { Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink, ActivatedRoute } from "@angular/router";
import { CommonModule } from "@angular/common";
import { ApiService, mensaje } from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";
import { Page } from "../../core/models/models";

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  cantidadProductos?: number;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styleUrls: ["./categorias.css"],
  template: `
    <div class="categorias-container">
      @if (error()) {
        <div class="error-banner" role="alert">
          <span>⚠️ {{ error() }}</span>
        </div>
      }
      @if (aviso()) {
        <div class="success-banner" role="status">
          <span>✓ {{ aviso() }}</span>
        </div>
      }

      <!-- ================= PANTALLA 1: LISTADO (Boceto 1) ================= -->
      @if (vista() === 'lista') {
        <!-- Encabezado general -->
        <div class="page-heading">
          <div class="heading-title-group">
            <h1>Categorías</h1>
            <p class="heading-subtitle">Organiza tus productos.</p>
          </div>
          @if (auth.tiene('ADMIN')) {
            <button type="button" class="btn-primary" (click)="abrirFormularioCrear()">
              + Nueva categoría
            </button>
          }
        </div>

        <!-- Barra de búsqueda y filtros -->
        <form class="toolbar-card" (submit)="$event.preventDefault(); buscar()">
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input
              name="q"
              [(ngModel)]="q"
              placeholder="Buscar categoría"
              aria-label="Buscar categoría"
              (keyup.enter)="buscar()"
            />
          </div>

          <div class="filter-select-group">
            <span>Estado</span>
            <select name="estado" [(ngModel)]="estado" (change)="buscar()">
              <option value="">Todas</option>
              <option value="true">Activas</option>
              <option value="false">Inactivas</option>
            </select>
          </div>

          <button type="submit" class="btn-primary" [disabled]="loading() || busy()">
            Buscar
          </button>
        </form>

        <!-- Tabla de categorías a pantalla completa -->
        <div class="table-panel">
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th style="text-align: center;">Productos</th>
                  <th>Estado</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (c of result()?.content || []; track c.id) {
                  <tr>
                    <td>
                      <strong>{{ c.nombre }}</strong>
                      @if (c.descripcion) {
                        <div style="font-size: 12px; color: var(--text-secondary, #8e8e93); margin-top: 2px;">
                          {{ c.descripcion }}
                        </div>
                      }
                    </td>
                    <td style="text-align: center; font-weight: 600;">
                      {{ c.cantidadProductos ?? 0 }}
                    </td>
                    <td>
                      <span class="badge-status" [class.activa]="c.activo" [class.inactiva]="!c.activo">
                        {{ c.activo ? 'Activa' : 'Inactiva' }}
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <div class="actions-cell">
                        <a class="btn-action-small" [routerLink]="['/productos']" [queryParams]="{categoriaId: c.id}">
                          Ver productos
                        </a>
                        @if (auth.tiene('ADMIN')) {
                          <button type="button" class="btn-action-small" (click)="seleccionarEditar(c)">
                            Editar
                          </button>
                          <button
                            type="button"
                            class="btn-action-small btn-action-danger"
                            (click)="eliminar(c)"
                            [disabled]="busy()"
                          >
                            Eliminar
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" style="text-align: center; padding: 36px 20px; color: var(--text-secondary, #8e8e93);">
                      {{ loading() ? 'Cargando categorías…' : 'No se encontraron categorías registradas.' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pie de tabla con paginación según boceto -->
          @if (result(); as r) {
            <div class="pagination-footer">
              <span>{{ r.totalElements ? r.number * r.size + 1 : 0 }}–{{ r.number * r.size + r.content.length }} de {{ r.totalElements }} categorías</span>

              <div class="pagination-controls">
                <button
                  type="button"
                  class="pagination-btn"
                  (click)="ir(-1)"
                  [disabled]="page === 0 || busy()"
                  title="Anterior"
                >
                  ‹
                </button>
                <button type="button" class="pagination-btn active">
                  {{ r.totalPages ? r.number + 1 : 1 }}
                </button>
                <button
                  type="button"
                  class="pagination-btn"
                  (click)="ir(1)"
                  [disabled]="page + 1 >= r.totalPages || busy()"
                  title="Siguiente"
                >
                  ›
                </button>
              </div>
            </div>
          }
        </div>

        <div class="sketch-disclaimer">
          Propuesta visual · Datos de ejemplo
        </div>
      }

      <!-- ================= PANTALLA 2: FORMULARIO SEGÚN BOCETO ================= -->
      @if (vista() === 'formulario') {
        <!-- Encabezado con enlace volver -->
        <div class="page-heading-form">
          <a class="back-link" (click)="volverALista()">
            ← Volver a categorías
          </a>
          <h1>{{ categoriaEditando ? 'Editar categoría' : 'Nueva categoría' }}</h1>
        </div>

        <!-- Formulario centrado / tarjeta dedicada -->
        <div class="form-card">
          <form (ngSubmit)="guardar()">
            <div class="field-group">
              <label for="cat-nombre">Nombre *</label>
              <input
                id="cat-nombre"
                name="nombre"
                [(ngModel)]="nombre"
                placeholder="Ej.: Casacas"
                maxlength="100"
                required
              />
            </div>

            <div class="field-group">
              <label for="cat-desc">Descripción (opcional)</label>
              <textarea
                id="cat-desc"
                name="descripcion"
                [(ngModel)]="descripcion"
                placeholder="Ej.: Polos y camisetas de algodón"
                maxlength="250"
              ></textarea>
            </div>

            <div class="estado-toggle-group">
              <span class="toggle-label" style="font-size: 14px; font-weight: 500;">Estado</span>
              <div class="toggle-switch-wrapper">
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    name="activo"
                    [(ngModel)]="activo"
                  />
                  <span class="toggle-slider"></span>
                </label>
                <span class="toggle-label">{{ activo ? 'Activa' : 'Inactiva' }}</span>
              </div>
            </div>

            <div class="form-help-text">
              Los campos con <span>*</span> son obligatorios.
            </div>

            <div class="form-actions">
              <button type="button" class="btn-secondary" (click)="volverALista()">
                Cancelar
              </button>
              <button type="submit" class="btn-primary" [disabled]="busy() || !nombre.trim()">
                {{ busy() ? 'Guardando…' : (categoriaEditando ? 'Guardar cambios' : 'Guardar categoría') }}
              </button>
            </div>
          </form>
        </div>

        <div class="sketch-disclaimer" style="max-width: 680px; margin: 4px auto 0 auto; width: 100%;">
          Propuesta visual · Datos de ejemplo
        </div>
      }
    </div>
  `,
})
export class CategoriasComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  // Control de vista: 'lista' o 'formulario'
  vista = signal<"lista" | "formulario">("lista");

  q = "";
  estado = "true";
  page = 0;
  private appliedQ = "";
  private appliedEstado = "true";

  result = signal<Page<Categoria> | null>(null);
  loading = signal(false);
  busy = signal(false);
  error = signal("");
  aviso = signal("");

  categoriaEditando: Categoria | null = null;
  nombre = "";
  descripcion = "";
  activo = true;

  ngOnInit() {
    // Si la ruta contiene /nuevo o /:id/editar
    const url = this.route.snapshot.url.map((s) => s.path).join("/");
    if (url.includes("nuevo")) {
      this.abrirFormularioCrear();
    } else if (this.route.snapshot.paramMap.has("id")) {
      const id = Number(this.route.snapshot.paramMap.get("id"));
      if (id) {
        this.api.get<Categoria>(`/categorias/${id}`).subscribe({
          next: (c) => this.seleccionarEditar(c),
          error: () => this.cargar(),
        });
      }
    } else {
      this.cargar();
    }
  }

  abrirFormularioCrear() {
    this.iniciarCreacion();
    this.vista.set("formulario");
  }

  volverALista() {
    this.vista.set("lista");
    this.error.set("");
  }

  buscar() {
    this.appliedQ = this.q;
    this.appliedEstado = this.estado;
    this.page = 0;
    this.cargar();
  }

  ir(delta: number) {
    this.page += delta;
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.error.set("");
    this.api
      .get<Page<Categoria>>("/categorias/buscar", {
        q: this.appliedQ,
        activo: this.appliedEstado,
        page: this.page,
        size: 20,
      })
      .subscribe({
        next: (r) => {
          this.result.set(r);
          this.loading.set(false);
          if (r.number > 0 && !r.content.length) {
            this.page--;
            this.cargar();
          }
        },
        error: (e) => {
          this.error.set(mensaje(e));
          this.loading.set(false);
        },
      });
  }

  iniciarCreacion() {
    this.categoriaEditando = null;
    this.nombre = "";
    this.descripcion = "";
    this.activo = true;
    this.error.set("");
    this.aviso.set("");
  }

  seleccionarEditar(c: Categoria) {
    this.categoriaEditando = c;
    this.nombre = c.nombre;
    this.descripcion = c.descripcion || "";
    this.activo = c.activo;
    this.error.set("");
    this.aviso.set("");
    this.vista.set("formulario");
  }

  eliminar(c: Categoria) {
    if (this.busy() || !confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return;
    this.busy.set(true);
    this.error.set("");
    this.aviso.set("");
    this.api.delete(`/categorias/${c.id}`).subscribe({
      next: () => {
        this.busy.set(false);
        this.aviso.set(`Categoría "${c.nombre}" eliminada correctamente.`);
        this.cargar();
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(mensaje(e));
      },
    });
  }

  guardar() {
    if (this.busy()) return;
    if (!this.nombre.trim()) {
      this.error.set("El nombre de la categoría es obligatorio.");
      return;
    }

    this.busy.set(true);
    this.error.set("");
    this.aviso.set("");

    const payload = {
      nombre: this.nombre.trim(),
      descripcion: this.descripcion.trim() || null,
      activo: this.activo,
    };

    const req$ = this.categoriaEditando
      ? this.api.put<Categoria>(`/categorias/${this.categoriaEditando.id}`, payload)
      : this.api.post<Categoria>("/categorias", payload);

    req$.subscribe({
      next: (res) => {
        this.busy.set(false);
        this.aviso.set(
          this.categoriaEditando
            ? `Categoría "${res.nombre}" actualizada correctamente.`
            : `Categoría "${res.nombre}" registrada correctamente.`
        );
        this.iniciarCreacion();
        this.cargar();
        this.vista.set("lista");
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(mensaje(e));
      },
    });
  }
}
