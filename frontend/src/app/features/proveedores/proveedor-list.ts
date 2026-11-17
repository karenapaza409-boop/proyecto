import { Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { ApiService, mensaje } from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";
import { Page } from "../../core/models/models";
import { Proveedor } from "./proveedor-model";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styleUrls: ["./proveedores.css"],
  template: `
    <div class="proveedores-container">
      @if (error()) {
        <div class="error-banner" role="alert">
          <span>⚠️ {{ error() }}</span>
          <button type="button" class="btn-action-small" (click)="cargar()" [disabled]="loading()">Reintentar listado</button>
        </div>
      }
      @if (notice()) {
        <div class="success-banner" role="status">
          <span>✓ {{ notice() }}</span>
        </div>
      }

      <!-- Encabezado general -->
      <div class="page-heading">
        <div class="heading-title-group">
          <h1>Proveedores</h1>
          <p class="heading-subtitle">Gestiona tus contactos y compras</p>
        </div>
        @if (auth.tiene('ADMIN')) {
          <a class="btn-primary" routerLink="/proveedores/nuevo">
            <span class="btn-icon">＋</span> Registrar proveedor
          </a>
        }
      </div>

      <!-- Barra de filtros -->
      <form class="toolbar-card" (submit)="$event.preventDefault(); buscar()">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input
            name="q"
            aria-label="Buscar proveedor"
            [(ngModel)]="q"
            maxlength="150"
            placeholder="Buscar por nombre o documento"
            (keyup.enter)="buscar()"
          />
        </div>

        <div class="filter-select-group">
          <span>Estado</span>
          <select name="estado" aria-label="Estado" [(ngModel)]="estado" (change)="buscar()">
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        <button type="submit" class="btn-primary" [disabled]="loading() || busy()">
          Buscar
        </button>
      </form>

      <!-- Tabla de proveedores -->
      @if (loading()) {
        <div class="loading-state" role="status" aria-busy="true">
          <div class="spinner"></div>
          <span>Cargando proveedores…</span>
        </div>
      } @else if (!error()) {
        <div class="table-panel">
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>PROVEEDOR</th>
                  <th>DOCUMENTO</th>
                  <th>CONTACTO</th>
                  <th>ESTADO</th>
                  <th style="text-align: right;">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                @for (p of result()?.content || []; track p.id) {
                  <tr>
                    <td>
                      <div class="primary-text">{{ p.nombre }}</div>
                      @if (p.nombreComercial) {
                        <div class="secondary-text">{{ p.nombreComercial }}</div>
                      }
                    </td>
                    <td>
                      <div class="primary-text">{{ p.documento }}</div>
                      <div class="secondary-text">{{ p.tipoDocumento || 'Sin clasificar' }}</div>
                    </td>
                    <td>
                      <div class="primary-text">{{ p.telefono || 'Sin registrar' }}</div>
                      @if (p.personaContacto) {
                        <div class="secondary-text">{{ p.personaContacto }}</div>
                      }
                    </td>
                    <td>
                      <span class="badge-status" [class.activa]="p.activo" [class.inactiva]="!p.activo">
                        {{ p.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td>
                      <div class="actions-cell">
                        <a class="btn-action-small" [routerLink]="['/proveedores', p.id]">
                          Ver ficha
                        </a>
                        @if (auth.tiene('ADMIN')) {
                          <a class="btn-action-small" [routerLink]="['/proveedores', p.id, 'editar']">
                            Editar
                          </a>
                          <button
                            type="button"
                            class="btn-action-small btn-action-danger"
                            [disabled]="busy()"
                            (click)="eliminar(p)"
                          >
                            Eliminar
                          </button>
                          <details class="row-menu">
                            <summary class="btn-action-small btn-action-more" [attr.aria-label]="'Más acciones para ' + p.nombre">
                              ⋮
                            </summary>
                            <div class="row-menu-content">
                              <a [routerLink]="['/proveedores', p.id, 'editar']">Editar proveedor</a>
                              <button type="button" [disabled]="busy()" (click)="cambiarEstado(p)">
                                {{ p.activo ? 'Desactivar' : 'Activar' }}
                              </button>
                            </div>
                          </details>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="empty">No hay proveedores con estos filtros.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (result(); as r) {
            <div class="pagination-footer">
              <span class="pagination-info">
                {{ r.totalElements ? r.number * r.size + 1 : 0 }}–{{ r.number * r.size + r.content.length }} de {{ r.totalElements }} proveedores
              </span>
              <div class="pagination-controls">
                <button
                  type="button"
                  class="btn-page-nav"
                  (click)="ir(-1)"
                  [disabled]="page === 0 || busy()"
                  aria-label="Página anterior"
                >
                  ‹
                </button>
                <span class="page-number-active" aria-current="page">{{ r.totalPages ? r.number + 1 : 0 }}</span>
                <button
                  type="button"
                  class="btn-page-nav"
                  (click)="ir(1)"
                  [disabled]="page + 1 >= r.totalPages || busy()"
                  aria-label="Página siguiente"
                >
                  ›
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ProveedorList implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);
  q = "";
  estado = "";
  page = 0;
  private appliedQ = "";
  private appliedEstado = "";
  result = signal<Page<Proveedor> | null>(null);
  loading = signal(false);
  busy = signal(false);
  error = signal("");
  notice = signal("");

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
    this.notice.set("");
    this.buscar();
  }

  ir(delta: number) {
    this.page += delta;
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.error.set("");
    this.api
      .get<Page<Proveedor>>("/proveedores/buscar", {
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

  cambiarEstado(p: Proveedor) {
    if (
      this.busy() ||
      !confirm(
        (p.activo ? "¿Desactivar " : "¿Activar ") +
          p.nombre +
          "? Las compras históricas se conservarán."
      )
    )
      return;
    this.busy.set(true);
    this.error.set("");
    this.notice.set("");
    this.api
      .put<Proveedor>("/proveedores/" + p.id + "/estado", { activo: !p.activo })
      .subscribe({
        next: (r) => {
          this.notice.set(
            "Proveedor " +
              (r.activo ? "activado." : "desactivado. Su historial se conserva.")
          );
          this.busy.set(false);
          this.cargar();
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
    this.notice.set("");
    this.api.delete("/proveedores/" + p.id).subscribe({
      next: () => {
        this.notice.set(`Proveedor "${p.nombre}" eliminado correctamente.`);
        this.busy.set(false);
        this.cargar();
      },
      error: (e) => {
        this.error.set(mensaje(e));
        this.busy.set(false);
      },
    });
  }
}
