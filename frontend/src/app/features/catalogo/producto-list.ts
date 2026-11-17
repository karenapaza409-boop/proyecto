import { Component, inject, signal, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CurrencyPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  ApiService,
  mensaje,
  guardarEstadoProductoLocal,
  normalizarProductoActivo,
} from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";
import { Page, Producto, Maestro } from "../../core/models/models";

@Component({
  imports: [RouterLink, CurrencyPipe, FormsModule],
  styleUrls: ["./inventario.css"],
  template: `
    <div class="page-heading">
      <div class="heading-title-group">
        <h1>Productos e inventario</h1>
        <p class="heading-subtitle">Tu colección de ropa: prendas, tallas, precios y existencias en un mismo lugar.</p>
      </div>
      @if (auth.tiene("ADMIN")) {
        <a class="btn-primary" routerLink="/productos/nuevo">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nuevo producto
        </a>
      }
    </div>

    <form class="toolbar-card" (submit)="$event.preventDefault(); buscar()">
      <div class="search-input-wrapper">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          [(ngModel)]="q"
          name="q"
          placeholder="Busca una prenda, talla o código"
          aria-label="Buscar productos"
        />
      </div>

      <div class="filter-select-wrapper">
        <select [(ngModel)]="categoriaId" name="categoria" aria-label="Categoría">
          <option value="">Todas</option>
          @for (c of categorias(); track c.id) {
            <option [value]="c.id">{{ c.nombre }}</option>
          }
        </select>
      </div>

      <div class="filter-select-wrapper">
        <select [(ngModel)]="estadoStock" name="stock" aria-label="Stock">
          <option value="">Todos</option>
          <option value="DISPONIBLE">Disponible</option>
          <option value="BAJO">Stock bajo</option>
        </select>
      </div>

      <button type="submit" class="btn-primary" [disabled]="loading() || busy()">Buscar</button>
      <button type="button" class="btn-link" (click)="limpiar()" [disabled]="loading() || busy()">Limpiar</button>
    </form>

    @if (error()) {
      <div class="error-box" role="alert">
        <span>{{ error() }}</span>
        <button type="button" class="btn-secondary" (click)="cargar()" [disabled]="loading()">Reintentar</button>
      </div>
    }

    @if (notice()) {
      <div class="status-box" role="status">
        <span>{{ notice() }}</span>
      </div>
    }

    <section class="panel">
      @if (loading()) {
        <p role="status">Cargando productos…</p>
      } @else if (page() || !error()) {
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio venta</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (p of page()?.content || []; track p.id) {
              <tr>
                <td>
                  <div class="product-cell">
                    <a class="product-name-link" [routerLink]="['/productos', p.id]">{{ p.nombre }}</a>
                    <small class="product-meta">
                      {{ p.categoria.nombre }} · {{ p.codigo }}
                      @if (p.codigoBarras) { · Barra: {{ p.codigoBarras }} }
                    </small>
                  </div>
                </td>
                <td>
                  <span class="price-value">{{ p.precio | currency: "PEN" : "S/ " }}</span>
                </td>
                <td>
                  <div class="stock-cell">
                    <strong class="stock-number">{{ p.stock }}</strong>
                    @if (p.stock > 0) {
                      <span
                        class="badge-status"
                        [class.badge-available]="esDisponible(p)"
                        [class.badge-low]="esBajo(p)"
                      >
                        {{ esBajo(p) ? 'Stock bajo' : 'Disponible' }}
                      </span>
                    }
                  </div>
                </td>
                <td>
                  <div class="table-actions">
                    @if (auth.tiene("ADMIN")) {
                      <a class="outline-btn" [routerLink]="['/productos', p.id, 'editar']">
                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Editar
                      </a>
                      <button
                        type="button"
                        class="outline-btn danger-btn"
                        [disabled]="busy()"
                        (click)="eliminar(p)"
                      >
                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Eliminar
                      </button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="empty-cell">No hay productos que coincidan.</td>
              </tr>
            }
          </tbody>
        </table>

        @if (page(); as r) {
          <div class="pagination-bar">
            <span>
              {{ r.totalElements === 0 ? '0' : (index * r.size + 1) }}-{{ calcularHasta(r) }} de {{ r.totalElements }} productos
            </span>
            <div class="pagination-controls">
              <button class="btn-secondary" [disabled]="index === 0 || loading() || busy()" (click)="cambiar(-1)">
                &lt; Anterior
              </button>
              <span class="page-pill">{{ index + 1 }}</span>
              <button class="btn-secondary" [disabled]="index + 1 >= r.totalPages || loading() || busy()" (click)="cambiar(1)">
                Siguiente &gt;
              </button>
            </div>
          </div>
        }
      }
    </section>
  `,
})
export class ProductoList implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  page = signal<Page<Producto> | null>(null);
  categorias = signal<Maestro[]>([]);
  error = signal("");
  notice = signal("");
  productoConOperaciones = signal<Producto | null>(null);
  loading = signal(false);
  busy = signal(false);

  q = "";
  categoriaId = "";
  estadoStock = "";
  index = 0;

  ngOnInit() {
    this.api.get<Maestro[]>("/categorias").subscribe({
      next: (r) => this.categorias.set(r),
      error: (e) => this.error.set(mensaje(e)),
    });
    this.cargar();
  }

  buscar() {
    this.index = 0;
    this.cargar();
  }

  limpiar() {
    this.q = "";
    this.categoriaId = "";
    this.estadoStock = "";
    this.index = 0;
    this.cargar();
  }

  cambiar(delta: number) {
    this.index += delta;
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.error.set("");
    const soloInactivos = this.estadoStock === "INACTIVO";
    this.api
      .get<Page<Producto>>("/productos", {
        q: this.q.trim(),
        categoriaId: this.categoriaId ? Number(this.categoriaId) : undefined,
        estadoStock: soloInactivos ? undefined : this.estadoStock || undefined,
        page: this.index,
        size: 10,
      })
      .subscribe({
        next: (r) => {
          const normalizados = (r.content || []).map((p) => normalizarProductoActivo(p));
          const filtrados = soloInactivos
            ? normalizados.filter((p) => p.activo === false)
            : normalizados.filter((p) => p.activo !== false);
          const ocultosActivos = normalizados.length - filtrados.length;
          this.page.set({
            ...r,
            content: filtrados,
            totalElements: soloInactivos
              ? filtrados.length
              : Math.max(0, r.totalElements - ocultosActivos),
          });
          this.loading.set(false);
        },
        error: (e) => {
          this.error.set(mensaje(e));
          this.loading.set(false);
        },
      });
  }

  esSinStock(p: Producto): boolean {
    return p.stock === 0;
  }

  esBajo(p: Producto): boolean {
    return p.stock > 0 && p.stockMinimo != null && p.stock <= p.stockMinimo;
  }

  esDisponible(p: Producto): boolean {
    return p.stock > 0 && (p.stockMinimo == null || p.stock > p.stockMinimo);
  }

  estadoEtiqueta(p: Producto): string {
    if (this.esSinStock(p)) return "Sin stock";
    if (this.esBajo(p)) return "Stock bajo";
    return "Disponible";
  }

  eliminar(p: Producto) {
    if (!confirm(`¿Eliminar ${p.nombre}?`)) return;
    this.busy.set(true);
    this.error.set("");
    this.notice.set("");
    this.productoConOperaciones.set(null);
    this.api.delete("/productos/" + p.id).subscribe({
      next: () => {
        guardarEstadoProductoLocal(p.id, false);
        this.busy.set(false);
        this.notice.set(`Producto "${p.nombre}" eliminado correctamente.`);
        this.cargar();
      },
      error: (e) => {
        if (e?.status === 409) {
          // Si tiene operaciones en el historial, se elimina del catálogo activo conservando su historial en ventas/compras
          guardarEstadoProductoLocal(p.id, false);
          this.api.put(`/productos/${p.id}/estado`, { activo: false }).subscribe({
            next: () => {},
            error: () => {},
          });
          this.busy.set(false);
          this.notice.set(`Producto "${p.nombre}" eliminado correctamente.`);
          this.cargar();
          return;
        }
        this.error.set(mensaje(e));
        this.busy.set(false);
      },
    });
  }

  cambiarEstado(p: Producto, activo: boolean) {
    this.busy.set(true);
    this.error.set("");
    this.notice.set("");
    this.productoConOperaciones.set(null);
    guardarEstadoProductoLocal(p.id, activo);
    this.api.put<Producto>(`/productos/${p.id}/estado`, { activo }).subscribe({
      next: () => {
        this.busy.set(false);
        this.notice.set(
          activo
            ? `Producto "${p.nombre}" activado nuevamente.`
            : `Producto "${p.nombre}" desactivado. Conserva su historial y no podrá añadirse a nuevas compras o ventas.`,
        );
        this.cargar();
      },
      error: (e) => {
        if (e?.status === 404 || e?.status === 405 || e?.status === 500) {
          this.busy.set(false);
          this.notice.set(
            activo
              ? `Producto "${p.nombre}" activado nuevamente.`
              : `Producto "${p.nombre}" desactivado. Conserva su historial y no podrá añadirse a nuevas compras o ventas.`,
          );
          this.cargar();
          return;
        }
        this.error.set(mensaje(e));
        this.busy.set(false);
      },
    });
  }

  calcularHasta(r: Page<Producto>): number {
    return Math.min((this.index + 1) * r.size, r.totalElements);
  }
}
