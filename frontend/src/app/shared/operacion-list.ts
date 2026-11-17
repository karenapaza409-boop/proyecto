import { Component, inject, signal, OnInit } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { DatePipe, CurrencyPipe } from "@angular/common";
import { forkJoin } from "rxjs";
import { ApiService, mensaje } from "../core/services/api-service";
import { AuthService } from "../core/services/auth-service";
import { Page, Operacion, Agregado } from "../core/models/models";
@Component({
  imports: [RouterLink, DatePipe, CurrencyPipe],
  template: `<div class="page-heading">
      <div>
        <span class="eyebrow">OPERACIONES</span>
        <h1>{{ compra ? "Compras recibidas" : "Ventas" }}</h1>
        <p>
          {{
            auth.tiene("ADMIN", "SUPERVISOR")
              ? "Todas las operaciones de la tienda."
              : "Se muestran tus propias operaciones."
          }}
        </p>
      </div>
      <a class="button primary" [routerLink]="'/' + tipo + '/nueva'">{{
        compra ? "Registrar compra" : "Nueva venta"
      }}</a>
    </div>
    <form
      class="toolbar"
      (submit)="
        $event.preventDefault();
        filtrar(estado.value, desde.value, hasta.value, orden.value)
      "
    >
      <select #estado aria-label="Estado">
        <option value="">Todos los estados</option>
        <option>REGISTRADA</option>
        <option>ANULADA</option></select
      ><label>Desde<input #desde type="date" /></label
      ><label>Hasta<input #hasta type="date" /></label
      ><select #orden aria-label="Orden">
        <option value="fecha">Más recientes</option>
        <option value="total">Mayor importe</option></select
      ><button>Aplicar</button>
    </form>
    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }
    <div class="stats">
      <div class="panel">
        <small>Operaciones filtradas</small
        ><strong>{{ resumen()?.cantidad || 0 }}</strong>
      </div>
      <div class="panel">
        <small>Importe filtrado</small
        ><strong>{{ resumen()?.total || 0 | currency: "PEN" : "S/ " }}</strong>
      </div>
      <div class="panel">
        <small>Promedio</small
        ><strong>{{
          resumen()?.promedio || 0 | currency: "PEN" : "S/ "
        }}</strong>
      </div>
    </div>
    <p class="muted">
      Los totales corresponden a todos los resultados filtrados, no solo a esta
      página. Selecciona REGISTRADA para excluir anuladas.
    </p>
    <section class="panel">
      @if (loading()) {
        <p>Cargando operaciones…</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>N.º / Fecha</th>
              <th>{{ compra ? "Proveedor" : "Cliente" }}</th>
              <th>Estado</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (v of page()?.content || []; track v.id) {
              <tr>
                <td>
                  <strong>#{{ v.id }}</strong
                  ><small>{{ v.fecha | date: "dd/MM/yyyy HH:mm" }}</small>
                </td>
                <td>{{ compra ? v.proveedor : v.cliente }}</td>
                <td>
                  <span
                    class="badge"
                    [class.warning]="v.estado === 'ANULADA'"
                    >{{ v.estado }}</span
                  >
                </td>
                <td>{{ v.total | currency: "PEN" : "S/ " }}</td>
                <td>
                  <button
                    class="link"
                    (click)="detalle.set(detalle()?.id === v.id ? null : v)"
                  >
                    Detalle
                  </button>
                  @if (
                    v.estado === "REGISTRADA" &&
                    auth.tiene("ADMIN", "SUPERVISOR")
                  ) {
                    <button
                      class="link danger"
                      [disabled]="busy()"
                      (click)="anular(v)"
                    >
                      Anular
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5">No hay operaciones.</td>
              </tr>
            }
          </tbody>
        </table>
      }
      <div class="pagination">
        <button [disabled]="index === 0 || loading()" (click)="cambiar(-1)">
          Anterior</button
        ><span
          >Página {{ index + 1 }} ·
          {{ page()?.totalElements || 0 }} resultados</span
        ><button
          [disabled]="index + 1 >= (page()?.totalPages || 0) || loading()"
          (click)="cambiar(1)"
        >
          Siguiente
        </button>
      </div>
    </section>
    @if (detalle(); as v) {
      <section class="panel detail">
        @if (compra) {
          <p>Fecha de recepción: {{ v.fechaRecepcion || 'No informada' }}</p>
          <p>Comprobante: {{ v.tipoComprobante || 'No informado' }} {{ v.serie }} {{ v.numero }}</p>
          @if (v.observaciones) { <p>Observaciones: {{ v.observaciones }}</p> }
        }
        <div class="page-heading">
          <h2>Detalle #{{ v.id }}</h2>
          <button (click)="detalle.set(null)">Cerrar</button>
        </div>
        <p class="muted">Usuario: {{ v.actor }}</p>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            @for (l of v.detalles; track l.productoId) {
              <tr>
                <td>{{ l.productoNombre }}</td>
                <td>{{ l.cantidad }}</td>
                <td>{{ l.precioUnitario | currency: "PEN" : "S/ " }}</td>
                <td>{{ l.subtotal | currency: "PEN" : "S/ " }}</td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    }`,
})
export class OperacionList implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);
  tipo = this.route.snapshot.data["tipo"] as string;
  compra = this.tipo === "compras";
  page = signal<Page<Operacion> | null>(null);
  resumen = signal<Agregado | null>(null);
  detalle = signal<Operacion | null>(null);
  loading = signal(false);
  busy = signal(false);
  error = signal("");
  index = 0;
  filtros: Record<string, string | number> = {};
  ngOnInit() {
    this.cargar();
  }
  filtrar(estado: string, desde: string, hasta: string, orden: string) {
    if (desde && hasta && desde > hasta) {
      this.error.set("La fecha inicial no puede ser posterior a la final.");
      return;
    }
    this.filtros = { estado, desde, hasta, ordenarPor: orden };
    this.index = 0;
    this.cargar();
  }
  cambiar(d: number) {
    this.index += d;
    this.cargar();
  }
  cargar() {
    this.loading.set(true);
    this.error.set("");
    forkJoin({
      page: this.api.get<Page<Operacion>>("/" + this.tipo, {
        ...this.filtros,
        page: this.index,
        size: 10,
      }),
      resumen: this.api.get<Agregado>(
        "/" + this.tipo + "/resumen",
        this.filtros,
      ),
    }).subscribe({
      next: (r) => {
        this.page.set(r.page);
        this.resumen.set(r.resumen);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(mensaje(e));
        this.loading.set(false);
      },
    });
  }
  anular(v: Operacion) {
    if (!confirm("¿Anular la operación #" + v.id + " y revertir su stock?"))
      return;
    this.busy.set(true);
    this.api.patch("/" + this.tipo + "/" + v.id + "/anular").subscribe({
      next: () => {
        this.busy.set(false);
        this.detalle.set(null);
        this.cargar();
      },
      error: (e) => {
        this.error.set(mensaje(e));
        this.busy.set(false);
      },
    });
  }
}
