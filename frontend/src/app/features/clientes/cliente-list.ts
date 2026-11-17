import { Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { ApiService, mensaje } from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";
import { Page } from "../../core/models/models";
import { Cliente } from "./cliente-model";

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  styleUrls: ["./clientes.css"],
  template: `
    <div class="page-heading">
      <div class="heading-title-group">
        <h1>Clientes</h1>
        <p class="heading-subtitle">Gestiona tus clientes y ventas identificadas.</p>
      </div>
      @if (auth.tiene('ADMIN')) {
        <a class="btn-primary" routerLink="/clientes/nuevo">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Registrar cliente
        </a>
      }
    </div>

    <!-- Banner informativo según boceto -->
    <div class="info-banner">
      <svg class="info-banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <span>Para una venta rápida sin identificar cliente, utiliza <strong>Público general</strong> desde Ventas.</span>
    </div>

    <!-- Barra de búsqueda y filtros -->
    <form class="toolbar-card" (submit)="$event.preventDefault(); buscar()">
      <div class="search-input-wrapper">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          name="q"
          [(ngModel)]="q"
          placeholder="Buscar por nombre o documento"
          aria-label="Buscar clientes"
        />
      </div>

      <div class="filter-select-wrapper">
        <select name="estado" [(ngModel)]="estado" aria-label="Filtrar por estado">
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      <button type="submit" class="btn-primary" [disabled]="loading() || busy()">Buscar</button>
      <button type="button" class="btn-link" (click)="limpiar()" [disabled]="loading() || busy()">Limpiar</button>
    </form>

    @if (error()) {
      <div class="error-banner" role="alert">
        <p>{{ error() }}</p>
        <button type="button" class="btn-secondary" (click)="cargar()" [disabled]="loading()">Reintentar</button>
      </div>
    }

    <!-- Panel de tabla -->
    <section class="panel">
      @if (loading()) {
        <p style="padding: 24px; text-align: center;" role="status">Cargando clientes…</p>
      } @else if (!error()) {
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Documento</th>
                <th>Contacto</th>
                <th style="text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (c of result()?.content || []; track c.id) {
                <tr>
                  <td class="cell-cliente">
                    <strong>{{ c.nombre }}</strong>
                  </td>
                  <td class="cell-doc">
                    {{ c.tipoDocumento || 'Sin clasificar' }} {{ c.documento }}
                  </td>
                  <td class="cell-contacto">
                    {{ c.telefono || (c.correo ? c.correo : 'No registrado') }}
                  </td>
                  <td style="text-align: right;">
                    <div class="actions-cell" style="justify-content: flex-end;">
                      @if (auth.tiene('ADMIN')) {
                        <a class="btn-action" [routerLink]="['/clientes', c.id, 'editar']">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          Editar
                        </a>
                        <button type="button" class="btn-action btn-action-danger" (click)="eliminar(c)" [disabled]="busy()">
                          Eliminar
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="empty-cell">No se encontraron clientes registrados con los filtros aplicados.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (result(); as r) {
          <div class="pagination-footer">
            <span>{{ r.totalElements ? r.number * r.size + 1 : 0 }}–{{ r.number * r.size + r.content.length }} de {{ r.totalElements }} clientes</span>
            <div class="pagination-controls">
              <button class="btn-secondary" (click)="ir(-1)" [disabled]="page === 0 || busy()">Anterior</button>
              <span class="page-badge">{{ r.totalPages ? r.number + 1 : 0 }}</span>
              <button class="btn-secondary" (click)="ir(1)" [disabled]="page + 1 >= r.totalPages || busy()">Siguiente</button>
            </div>
          </div>
        }
      }
    </section>
  `,
})
export class ClienteList implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  q = "";
  estado = "";
  page = 0;
  private appliedQ = "";
  private appliedEstado = "";

  result = signal<Page<Cliente> | null>(null);
  loading = signal(false);
  busy = signal(false);
  error = signal("");

  ngOnInit() {
    this.cargar();
  }

  buscar() {
    this.appliedQ = this.q;
    this.appliedEstado = this.estado;
    this.page = 0;
    this.cargar();
  }

  limpiar() {
    this.q = "";
    this.estado = "";
    this.buscar();
  }

  ir(delta: number) {
    this.page += delta;
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.error.set("");
    this.api.get<Page<Cliente>>("/clientes/buscar", {
      q: this.appliedQ,
      activo: this.appliedEstado,
      page: this.page,
      size: 20
    }).subscribe({
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

  eliminar(c: Cliente) {
    if (this.busy() || !confirm(`¿Eliminar el cliente ${c.nombre}?`)) return;
    this.busy.set(true);
    this.error.set("");
    this.api.delete(`/clientes/${c.id}`).subscribe({
      next: () => {
        this.busy.set(false);
        this.cargar();
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(mensaje(e));
      },
    });
  }
}
