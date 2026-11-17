import { Component, inject, signal, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ApiService, mensaje } from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";

interface Usuario {
  id: string;
  username: string;
  enabled: boolean;
  roles: string[];
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ["./usuarios.css"],
  template: `
    <div class="usuarios-container">
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

      <!-- ================= PANTALLA 1: LISTADO DE USUARIOS (Boceto 1) ================= -->
      @if (vista() === 'lista') {
        <!-- Encabezado general -->
        <div class="page-heading">
          <div class="heading-title-group">
            <h1>Usuarios y roles</h1>
          </div>
          <button type="button" class="btn-primary" (click)="abrirFormularioCrear()">
            + Registrar nueva cuenta
          </button>
        </div>

        <!-- Barra de filtros -->
        <div class="toolbar-card">
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input
              name="filtroBusqueda"
              [(ngModel)]="filtroBusqueda"
              placeholder="Buscar por nombre o usuario"
              (keyup.enter)="buscar()"
            />
          </div>

          <div class="filter-select-group">
            <span>Estado</span>
            <select name="filtroEstado" [(ngModel)]="filtroEstado" (change)="buscar()">
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          <button type="button" class="btn-primary" (click)="buscar()" [disabled]="busy()">
            Buscar
          </button>
        </div>

        <!-- Tabla de usuarios a pantalla completa -->
        <div class="table-panel">
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Usuario</th>
                  <th>Roles</th>
                  <th>Estado</th>
                  <th style="text-align: right;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (u of usuariosFiltrados(); track u.id) {
                  <tr>
                    <td>
                      <strong>{{ obtenerNombreCompleto(u) }}</strong>
                    </td>
                    <td>
                      <span class="username-code">{{ u.username }}</span>
                    </td>
                    <td>
                      <div class="roles-badges">
                        @for (r of u.roles; track r) {
                          @if (r !== 'SUPERVISOR') {
                            <span
                              class="badge-rol"
                              [class.almacenero]="r === 'COMPRADOR'"
                              [class.admin]="r === 'ADMIN'"
                            >
                              {{ formatearRol(r) }}
                            </span>
                          }
                        }
                      </div>
                    </td>
                    <td>
                      <span
                        class="badge-status"
                        [class.activo]="u.enabled"
                        [class.inactivo]="!u.enabled"
                      >
                        {{ u.enabled ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td style="text-align: right;">
                      <div class="actions-cell">
                        <button
                          type="button"
                          class="btn-action-small"
                          (click)="seleccionarEditar(u)"
                          title="Editar usuario"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          class="btn-action-small btn-action-danger"
                          (click)="eliminar(u)"
                          [disabled]="busy()"
                          title="Eliminar usuario"
                        >
                          Eliminar
                        </button>
                        <button
                          type="button"
                          class="btn-action-small btn-action-more"
                          (click)="toggleEstado(u)"
                          [title]="u.enabled ? 'Desactivar cuenta' : 'Activar cuenta'"
                        >
                          ···
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" style="text-align: center; padding: 36px 20px; color: var(--text-secondary, #8e8e93);">
                      {{ busy() ? 'Cargando usuarios…' : 'No se encontraron usuarios con los filtros aplicados.' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pie de tabla: aviso y paginación según boceto -->
          <div class="pagination-footer">
            <span>ⓘ Desactivar conserva las operaciones anteriores.</span>

            <div class="pagination-controls">
              <span class="pagination-label">{{ rangoPaginacion() }}</span>
              <div class="pagination-btn-group">
                <button
                  type="button"
                  class="pagination-btn"
                  (click)="pagina(-1)"
                  [disabled]="busy() || first === 0"
                  title="Anterior"
                >
                  ‹
                </button>
                <button type="button" class="pagination-btn active">
                  {{ Math.floor(first / 20) + 1 }}
                </button>
                <button
                  type="button"
                  class="pagination-btn"
                  (click)="pagina(1)"
                  [disabled]="busy() || usuarios().length < 20"
                  title="Siguiente"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ================= PANTALLA 2: FORMULARIO CREAR / EDITAR (Boceto 2) ================= -->
      @if (vista() === 'formulario') {
        <!-- Encabezado con enlace para volver -->
        <div class="page-heading-form">
          <h1>{{ usuarioEditando ? 'Editar cuenta' : 'Crear cuenta' }}</h1>
          <a class="back-link" (click)="volverALista()">
            ← Volver a usuarios
          </a>
        </div>

        <!-- Formulario a pantalla completa -->
        <div class="form-card">
          <form (ngSubmit)="guardar()">
            <!-- Fila 1: Nombres y Apellidos -->
            <div class="form-grid-2">
              <div class="field-group">
                <label>Nombres *</label>
                <input
                  name="nombres"
                  [(ngModel)]="nombres"
                  placeholder="Carlos"
                  required
                />
              </div>
              <div class="field-group">
                <label>Apellidos *</label>
                <input
                  name="apellidos"
                  [(ngModel)]="apellidos"
                  placeholder="Pérez"
                  required
                />
              </div>
            </div>

            <!-- Fila 2: Usuario y Correo -->
            <div class="form-grid-2">
              <div class="field-group">
                <label>Usuario *</label>
                <input
                  name="username"
                  [(ngModel)]="username"
                  placeholder="carlos.perez"
                  [disabled]="!!usuarioEditando"
                  required
                  pattern="[a-zA-Z0-9._-]{3,80}"
                />
              </div>
              <div class="field-group">
                <label>Correo *</label>
                <input
                  name="email"
                  type="email"
                  [(ngModel)]="email"
                  placeholder="carlos@example.com"
                />
              </div>
            </div>

            <!-- Fila 3: Acceso inicial -->
            @if (!usuarioEditando) {
              <div class="acceso-inicial-grid">
                <div class="field-group">
                  <label>Contraseña temporal *</label>
                  <input
                    name="password"
                    type="password"
                    [(ngModel)]="password"
                    required
                    minlength="12"
                    maxlength="128"
                    placeholder="••••••••••"
                    autocomplete="new-password"
                  />
                </div>
                <label class="checkbox-row" style="margin-bottom: 10px;">
                  <input
                    name="solicitarCambio"
                    type="checkbox"
                    [(ngModel)]="solicitarCambio"
                  />
                  <span>Solicitar cambio al iniciar sesión</span>
                </label>
              </div>
            }

            <!-- Sección: Roles -->
            <div class="roles-selector-group">
              <span class="form-subtitle">Roles</span>
              <p class="roles-sublabel">Puedes seleccionar varios roles.</p>
              <div class="roles-grid">
                <label class="checkbox-row">
                  <input
                    type="checkbox"
                    [checked]="rolesSeleccionados.includes('VENDEDOR')"
                    (change)="alternarRol('VENDEDOR')"
                  />
                  <span>Cajero</span>
                </label>
                <label class="checkbox-row">
                  <input
                    type="checkbox"
                    [checked]="rolesSeleccionados.includes('COMPRADOR')"
                    (change)="alternarRol('COMPRADOR')"
                  />
                  <span>Almacenero</span>
                </label>
                <label class="checkbox-row">
                  <input
                    type="checkbox"
                    [checked]="rolesSeleccionados.includes('ADMIN')"
                    (change)="alternarRol('ADMIN')"
                  />
                  <span>Administrador</span>
                </label>
              </div>
            </div>

            <!-- Sección: Estado -->
            <div class="estado-toggle-group">
              <span class="form-subtitle">Estado</span>
              <div class="toggle-switch-wrapper">
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    name="enabled"
                    [(ngModel)]="enabled"
                  />
                  <span class="toggle-slider"></span>
                </label>
                <span class="toggle-label">{{ enabled ? 'Activa' : 'Inactiva' }}</span>
              </div>
            </div>

            <!-- Banner: Roles seleccionados -->
            <div class="selected-roles-info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>{{ obtenerResumenRoles() }}</span>
            </div>

            <!-- Botones de Acción -->
            <div class="form-actions">
              <button
                type="button"
                class="btn-secondary"
                (click)="volverALista()"
              >
                Cancelar
              </button>
              <button type="submit" class="btn-primary" [disabled]="busy()">
                {{ busy() ? 'Guardando…' : (usuarioEditando ? 'Actualizar cuenta' : 'Crear cuenta') }}
              </button>
            </div>
          </form>
        </div>

        <!-- ================= SECCIÓN INFORMATIVA: QUÉ PERMITE CADA ROL ================= -->
        <section class="roles-guide-section">
          <h3>Qué permite cada rol</h3>
          <p class="guide-subtitle">Propuesta de permisos para revisar.</p>

          <div class="roles-cards-grid">
            <!-- Cajero -->
            <div class="role-info-card">
              <div class="role-header">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
                <h4>Cajero</h4>
              </div>
              <ul>
                <li>Registrar ventas</li>
                <li>Operar su turno de caja</li>
                <li>Consultar productos</li>
              </ul>
            </div>

            <!-- Almacenero -->
            <div class="role-info-card">
              <div class="role-header">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
                <h4>Almacenero</h4>
              </div>
              <ul>
                <li>Consultar inventario</li>
                <li>Registrar movimientos autorizados</li>
                <li>Realizar conteos</li>
              </ul>
            </div>

            <!-- Administrador -->
            <div class="role-info-card">
              <div class="role-header">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <h4>Administrador</h4>
              </div>
              <ul>
                <li>Gestionar cuentas</li>
                <li>Asignar roles</li>
                <li>Configurar el sistema</li>
              </ul>
            </div>
          </div>
        </section>

        <div class="sketch-disclaimer">
          Propuesta visual · Datos ficticios
        </div>
      }
    </div>
  `,
})
export class Usuarios implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);
  protected readonly Math = Math;

  // Estado de vista: 'lista' o 'formulario'
  vista = signal<"lista" | "formulario">("lista");

  usuarios = signal<Usuario[]>([]);
  busy = signal(false);
  error = signal("");
  aviso = signal("");

  filtroBusqueda = "";
  filtroEstado = "";
  first = 0;

  // Campos de formulario
  usuarioEditando: Usuario | null = null;
  nombres = "";
  apellidos = "";
  username = "";
  email = "";
  password = "";
  solicitarCambio = true;
  enabled = true;
  rolesSeleccionados: string[] = ["VENDEDOR"];

  ngOnInit() {
    this.cargar();
  }

  abrirFormularioCrear() {
    this.usuarioEditando = null;
    this.nombres = "";
    this.apellidos = "";
    this.username = "";
    this.email = "";
    this.password = "";
    this.solicitarCambio = true;
    this.enabled = true;
    this.rolesSeleccionados = ["VENDEDOR"];
    this.error.set("");
    this.aviso.set("");
    this.vista.set("formulario");
  }

  volverALista() {
    this.vista.set("lista");
    this.error.set("");
  }

  seleccionarEditar(u: Usuario) {
    this.usuarioEditando = u;
    this.nombres = u.firstName || "";
    this.apellidos = u.lastName || "";
    this.username = u.username;
    this.email = u.email || "";
    this.password = "";
    this.enabled = u.enabled;
    // Excluimos supervisor por requerimiento
    this.rolesSeleccionados = (u.roles || []).filter((r) => r !== "SUPERVISOR");
    this.error.set("");
    this.aviso.set("");
    this.vista.set("formulario");
  }

  toggleEstado(u: Usuario) {
    if (this.busy()) return;
    const nuevoEstado = !u.enabled;
    const accion = nuevoEstado ? "activar" : "desactivar";
    if (!confirm(`¿Está seguro de ${accion} la cuenta de ${u.username}?`)) return;

    this.busy.set(true);
    this.api
      .put(`/usuarios/${encodeURIComponent(u.id)}`, {
        enabled: nuevoEstado,
        roles: u.roles,
        firstName: u.firstName || null,
        lastName: u.lastName || null,
        email: u.email || null,
      })
      .subscribe({
        next: () => {
          this.aviso.set(`Cuenta ${u.username} ${nuevoEstado ? "activada" : "desactivada"} correctamente.`);
          this.busy.set(false);
          this.cargar();
        },
        error: (e) => {
          this.error.set(mensaje(e));
          this.busy.set(false);
        },
      });
  }

  eliminar(u: Usuario) {
    if (this.busy() || !confirm(`¿Eliminar la cuenta de ${u.username}?`)) return;
    this.busy.set(true);
    this.error.set("");
    this.aviso.set("");
    this.api.delete(`/usuarios/${encodeURIComponent(u.id)}`).subscribe({
      next: () => {
        this.aviso.set(`Cuenta ${u.username} eliminada correctamente.`);
        this.busy.set(false);
        this.cargar();
      },
      error: (e) => {
        this.error.set(mensaje(e));
        this.busy.set(false);
      },
    });
  }

  alternarRol(rol: string) {
    const idx = this.rolesSeleccionados.indexOf(rol);
    if (idx >= 0) {
      this.rolesSeleccionados.splice(idx, 1);
    } else {
      this.rolesSeleccionados.push(rol);
    }
  }

  obtenerResumenRoles(): string {
    if (!this.rolesSeleccionados.length) return "Ningún rol seleccionado.";
    const nombres = this.rolesSeleccionados.map((r) => this.formatearRol(r));
    return `Roles seleccionados: ${nombres.join(" y ")}.`;
  }

  formatearRol(rol: string): string {
    switch (rol) {
      case "VENDEDOR":
        return "Cajero";
      case "COMPRADOR":
        return "Almacenero";
      case "ADMIN":
        return "Administrador";
      default:
        return rol;
    }
  }

  obtenerNombreCompleto(u: Usuario): string {
    const completo = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    return completo || u.username;
  }

  usuariosFiltrados(): Usuario[] {
    let list = this.usuarios();
    if (this.filtroEstado === "true") {
      list = list.filter((u) => u.enabled);
    } else if (this.filtroEstado === "false") {
      list = list.filter((u) => !u.enabled);
    }
    return list;
  }

  rangoPaginacion(): string {
    const total = this.usuariosFiltrados().length;
    if (total === 0) return "0 de 0";
    const inicio = this.first + 1;
    const fin = this.first + total;
    return `${inicio} – ${fin} de ${fin}`;
  }

  buscar() {
    this.first = 0;
    this.cargar();
  }

  pagina(delta: number) {
    this.first = Math.max(0, this.first + delta * 20);
    this.cargar();
  }

  cargar() {
    this.busy.set(true);
    this.error.set("");
    this.api
      .get<Usuario[]>("/usuarios", {
        first: this.first,
        max: 20,
        q: this.filtroBusqueda.trim() || undefined,
      })
      .subscribe({
        next: (u) => {
          this.usuarios.set(u);
          this.busy.set(false);
        },
        error: (e) => {
          this.error.set(mensaje(e));
          this.busy.set(false);
        },
      });
  }

  guardar() {
    if (this.busy()) return;

    if (!this.rolesSeleccionados.length) {
      this.error.set("Seleccione al menos un rol para la cuenta.");
      return;
    }

    this.busy.set(true);
    this.error.set("");
    this.aviso.set("");

    if (this.usuarioEditando) {
      // Actualizar cuenta existente
      this.api
        .put(`/usuarios/${encodeURIComponent(this.usuarioEditando.id)}`, {
          enabled: this.enabled,
          roles: this.rolesSeleccionados,
          firstName: this.nombres.trim() || null,
          lastName: this.apellidos.trim() || null,
          email: this.email.trim() || null,
        })
        .subscribe({
          next: () => {
            this.aviso.set("Cuenta actualizada correctamente.");
            this.busy.set(false);
            this.cargar();
            this.vista.set("lista");
          },
          error: (e) => {
            this.error.set(mensaje(e));
            this.busy.set(false);
          },
        });
    } else {
      // Crear nueva cuenta
      if (!this.username.trim() || !this.password) {
        this.error.set("Nombre de usuario y contraseña requeridos.");
        this.busy.set(false);
        return;
      }
      this.api
        .post("/usuarios", {
          username: this.username.trim(),
          password: this.password,
          enabled: this.enabled,
          roles: this.rolesSeleccionados,
          firstName: this.nombres.trim() || null,
          lastName: this.apellidos.trim() || null,
          email: this.email.trim() || null,
          temporaryPassword: this.solicitarCambio,
        })
        .subscribe({
          next: () => {
            this.aviso.set("Cuenta creada exitosamente con sus roles asignados.");
            this.busy.set(false);
            this.cargar();
            this.vista.set("lista");
          },
          error: (e) => {
            this.password = "";
            this.error.set(mensaje(e));
            this.busy.set(false);
          },
        });
    }
  }
}
