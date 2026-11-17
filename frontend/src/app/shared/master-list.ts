import { Component, inject, signal, OnInit } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { ApiService, mensaje } from "../core/services/api-service";
import { AuthService } from "../core/services/auth-service";
import { Maestro } from "../core/models/models";
@Component({
  imports: [RouterLink],
  template: `<div class="page-heading">
      <div>
        <span class="eyebrow">DATOS MAESTROS</span>
        <h1>{{ title }}</h1>
      </div>
      @if (auth.tiene("ADMIN")) {
        <a class="button primary" [routerLink]="['/' + endpoint, 'nuevo']"
          >Nuevo registro</a
        >
      }
    </div>
    @if (error()) {
      <p role="alert" class="error">{{ error() }}</p>
    }
    <section class="panel">
      @if (loading()) {
        <p>Cargando…</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              @if (endpoint !== "categorias") {
                <th>Documento</th>
              }
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.id) {
              <tr>
                <td>{{ row.nombre }}</td>
                @if (endpoint !== "categorias") {
                  <td>{{ row.documento }}</td>
                }
                <td>
                  @if (auth.tiene("ADMIN")) {
                    <a [routerLink]="['/' + endpoint, row.id, 'editar']"
                      >Editar</a
                    ><button
                      class="danger link"
                      [disabled]="busy()"
                      (click)="eliminar(row)"
                    >
                      Eliminar
                    </button>
                  } @else {
                    <span>Consulta</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="3">No hay registros.</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>`,
})
export class MasterList implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  auth = inject(AuthService);
  endpoint = this.route.snapshot.data["endpoint"] as string;
  title = this.route.snapshot.data["title"] as string;
  rows = signal<Maestro[]>([]);
  loading = signal(false);
  busy = signal(false);
  error = signal("");
  ngOnInit() {
    this.cargar();
  }
  cargar() {
    this.loading.set(true);
    this.api.get<Maestro[]>("/" + this.endpoint).subscribe({
      next: (r) => {
        this.rows.set(r);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(mensaje(e));
        this.loading.set(false);
      },
    });
  }
  eliminar(row: Maestro) {
    if (!confirm("¿Eliminar " + row.nombre + "?")) return;
    this.busy.set(true);
    this.api.delete("/" + this.endpoint + "/" + row.id).subscribe({
      next: () => {
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
