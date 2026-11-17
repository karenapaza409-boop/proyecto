import { Component, inject, signal, computed, OnInit } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { CurrencyPipe } from "@angular/common";
import {
  FormBuilder,
  FormArray,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { toSignal } from "@angular/core/rxjs-interop";
import { ApiService, mensaje, normalizarProductoActivo } from "../core/services/api-service";
import { Maestro, Producto, Page } from "../core/models/models";
@Component({
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  template: `<div class="page-heading">
      <div>
        <span class="eyebrow">{{
          compra ? "ABASTECIMIENTO" : "ATENCIÓN EN CAJA"
        }}</span>
        <h1>{{ compra ? "Registrar compra recibida" : "Nueva venta" }}</h1>
        <p>
          {{
            compra
              ? "Registra productos que ya llegaron a la tienda."
              : "Los precios y existencias se verifican al confirmar."
          }}
        </p>
      </div>
    </div>
    <form class="panel" [formGroup]="form" (ngSubmit)="guardar()">
      @if (compra) {
        <label>Buscar proveedor activo<input #proveedorSearch placeholder="Nombre comercial, razón social o documento"
          (input)="buscarProveedores(proveedorSearch.value)" /></label>
        @if (proveedoresLoading()) { <p role="status" class="muted">Buscando proveedores…</p> }
      }
      <label
        >{{ compra ? "Proveedor" : "Cliente (opcional)"
        }}<select formControlName="tercero" [attr.aria-label]="compra ? 'Proveedor' : null" (change)="recordarProveedor()">
          <option [ngValue]="0">
            {{ compra ? "Seleccione proveedor" : "Público general" }}
          </option>
          @for (p of parties(); track p.id) {
            <option [ngValue]="p.id">{{ p.nombre }}{{ compra && p.documento ? ' · ' + p.documento : '' }}</option>
          }
        </select></label
      >
      @if (compra) {
        <p class="muted">Solo se pueden registrar compras nuevas con proveedores activos.</p>
        @if (proveedorPage + 1 < proveedorTotalPages) {
          <button type="button" [disabled]="proveedoresLoading()" (click)="buscarProveedores(proveedorQuery, true)">Cargar más proveedores</button>
        }
      }
      <div class="product-search">
        <label
          >Agregar producto<input
            #search
            placeholder="Nombre o código"
            (input)="buscar(search.value)"
        /></label>
        <div class="search-results">
          @for (p of productos(); track p.id) {
            <button type="button" (click)="agregar(p)">
              <strong>{{ p.nombre }}</strong
              ><span
                >{{ p.precio | currency: "PEN" : "S/ " }} · Stock
                {{ p.stock }}</span
              >
            </button>
          } @empty {
            <p class="muted">Busca productos del catálogo.</p>
          }
        </div>
      </div>
      <div formArrayName="detalles">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>{{ compra ? "Costo unitario" : "Precio unitario" }}</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (line of detalles.controls; track line; let i = $index) {
              <tr [formGroupName]="i">
                <td>{{ line.get("nombre")?.value }}</td>
                <td>
                  <input
                    aria-label="Cantidad"
                    type="number"
                    min="1"
                    max="100000"
                    step="1"
                    formControlName="cantidad"
                  />
                </td>
                <td>
                  <input
                    aria-label="Precio unitario"
                    type="number"
                    min="0.01"
                    step="0.01"
                    formControlName="precioUnitario"
                    [readonly]="!compra"
                  />
                </td>
                <td>{{ subtotal(i) | currency: "PEN" : "S/ " }}</td>
                <td>
                  <button type="button" class="link danger" (click)="quitar(i)">
                    Quitar
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5">Agrega al menos un producto.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="total">
        Total <strong>{{ total() | currency: "PEN" : "S/ " }}</strong>
      </div>
      @if (error()) {
        <p role="alert" class="error">{{ error() }}</p>
      }
      <div class="actions">
        <a class="button" [routerLink]="'/' + tipo">Cancelar</a
        ><button class="primary" [disabled]="busy() || !ready()">
          {{
            busy() ? "Guardando…" : "Confirmar " + (compra ? "compra" : "venta")
          }}
        </button>
      </div>
    </form>`,
})
export class OperacionForm implements OnInit {
  protected api = inject(ApiService);
  protected route = inject(ActivatedRoute);
  protected router = inject(Router);
  protected fb = inject(FormBuilder);
  tipo = this.route.snapshot.data["tipo"] as string;
  compra = this.tipo === "compras";
  parties = signal<Maestro[]>([]);
  productos = signal<Producto[]>([]);
  busy = signal(false);
  ready = signal(false);
  error = signal("");
  private searchVersion = 0;
  proveedoresLoading = signal(false);
  proveedorPage = 0; proveedorTotalPages = 0; proveedorQuery = "";
  private proveedorVersion = 0;
  private proveedorSeleccionado: Maestro | null = null;
  form = this.fb.nonNullable.group({
    tercero: [0],
    detalles: this.fb.array<FormGroup>(
      [],
      [Validators.required, Validators.minLength(1)],
    ),
  });
  values = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  total = computed(() => {
    this.values();
    return (
      this.detalles.controls.reduce(
        (sum, _, i) => sum + Math.round(this.subtotal(i) * 100),
        0,
      ) / 100
    );
  });
  get detalles() {
    return this.form.controls.detalles;
  }
  ngOnInit() {
    if (this.compra) {
      this.form.controls.tercero.setValidators([Validators.min(1)]);
      this.form.controls.tercero.updateValueAndValidity();
      this.buscarProveedores("", false, true);
      return;
    }
    this.api
      .get<Maestro[]>(this.compra ? "/proveedores" : "/clientes")
      .subscribe({
        next: (r) => {
          this.parties.set(r);
          this.ready.set(true);
        },
        error: (e) => this.error.set(mensaje(e)),
      });
  }
  recordarProveedor() {
    if (this.compra) this.proveedorSeleccionado = this.parties().find(p => p.id === Number(this.form.controls.tercero.value)) || null;
  }
  buscarProveedores(q: string, append = false, inicial = false) {
    const version = ++this.proveedorVersion;
    const page = append ? this.proveedorPage + 1 : 0;
    this.proveedorQuery = q; this.proveedoresLoading.set(true);
    this.api.get<Page<Maestro>>("/proveedores/buscar", { q, activo: "true", page, size: 20 }).subscribe({
      next: r => {
        if (version !== this.proveedorVersion) return;
        const values = append ? [...this.parties(), ...r.content] : [...r.content];
        if (this.proveedorSeleccionado) values.unshift(this.proveedorSeleccionado);
        this.parties.set([...new Map(values.map(p => [p.id, p])).values()]);
        this.proveedorPage = r.number; this.proveedorTotalPages = r.totalPages; this.proveedoresLoading.set(false);
        const param = inicial ? this.route.snapshot.queryParamMap?.get("proveedorId") : null;
        if (!param) { this.ready.set(true); return; }
        const id = Number(param);
        if (!Number.isSafeInteger(id) || id <= 0) { this.error.set("El proveedor seleccionado no es válido. Seleccione un proveedor activo."); this.ready.set(true); return; }
        this.api.get<Maestro & { activo: boolean }>("/proveedores/" + id).subscribe({
          next: p => {
            if (p.activo) {
              this.proveedorSeleccionado = p;
              this.parties.set([p, ...this.parties().filter(x => x.id !== p.id)]);
              this.form.controls.tercero.setValue(p.id);
            } else this.error.set("El proveedor está inactivo. Seleccione otro proveedor para la nueva compra.");
            this.ready.set(true);
          }, error: e => { this.error.set(mensaje(e)); this.ready.set(true); },
        });
      }, error: e => {
        if (version !== this.proveedorVersion) return;
        this.error.set(mensaje(e)); this.proveedoresLoading.set(false);
      },
    });
  }
  buscar(q: string) {
    const version = ++this.searchVersion;
    if (q.trim().length < 1) {
      this.productos.set([]);
      return;
    }
    this.api.get<Page<Producto>>("/productos", { q, size: 10 }).subscribe({
      next: (r) => {
        if (version === this.searchVersion) {
          this.productos.set(
            (r.content || [])
              .map((p) => normalizarProductoActivo(p))
              .filter((p) => p.activo !== false),
          );
        }
      },
      error: (e) => this.error.set(mensaje(e)),
    });
  }
  agregar(p: Producto) {
    const prod = normalizarProductoActivo(p);
    if (prod.activo === false) {
      this.error.set("El producto está inactivo y no puede añadirse a nuevas compras o ventas.");
      return;
    }
    if (
      this.detalles.controls.some(
        (c) => !c.get("esNuevo")?.value && c.get("productoId")?.value === p.id,
      )
    ) {
      this.error.set("El producto ya está agregado. Ajusta su cantidad.");
      return;
    }
    if (this.detalles.length >= 100) {
      this.error.set("Máximo 100 productos por operación.");
      return;
    }
    this.error.set("");
    this.detalles.push(
      this.fb.nonNullable.group({
        esNuevo: [false],
        productoId: [p.id],
        codigo: [p.codigo || ""],
        codigoBarras: [p.codigoBarras || ""],
        nombre: [p.nombre],
        categoriaId: [p.categoria?.id || 0],
        categoriaNombre: [p.categoria?.nombre || ""],
        unidadVenta: [p.unidadVenta || "UNIDAD"],
        precioReferencia: [p.precio],
        precioVenta: [p.precio],
        cantidad: [
          1,
          [
            Validators.required,
            Validators.min(1),
            Validators.max(100000),
            Validators.pattern(/^\d+$/),
          ],
        ],
        precioUnitario: [
          p.precio,
          [
            Validators.required,
            Validators.min(0.01),
            Validators.pattern(/^\d+(\.\d{1,2})?$/),
          ],
        ],
      }),
    );
  }
  quitar(i: number) {
    this.detalles.removeAt(i);
  }
  subtotal(i: number) {
    const ctrl = this.detalles.at(i);
    if (!ctrl) return 0;
    const value = ctrl.getRawValue();
    return (
      Math.round(
        (Number(value["cantidad"]) || 0) *
          (Number(value["precioUnitario"]) || 0) *
          100,
      ) / 100
    );
  }
  guardar() {
    if (this.busy() || !this.ready()) return;
    this.error.set("");
    if (this.form.invalid || !this.detalles.length) {
      this.form.markAllAsTouched();
      this.error.set(
        "Agrega productos y revisa proveedor, cantidades y precios.",
      );
      return;
    }
    if (!this.confirmarOperacion()) return;
    const lineas = this.construirLineasPayload();
    const tercero = Number(this.form.controls.tercero.value) || null;
    const body = this.compra
      ? { proveedorId: tercero, detalles: lineas, ...this.datosCompra() }
      : { clienteId: tercero, detalles: lineas };
    this.busy.set(true);
    this.api.post("/" + this.tipo, body).subscribe({
      next: () => this.router.navigate(["/" + this.tipo]),
      error: (e) => {
        this.onGuardarError(e);
      },
    });
  }
  protected confirmarOperacion(): boolean {
    return confirm(
      "Confirmar " +
        (this.compra ? "compra recibida" : "venta") +
        " por S/ " +
        this.total().toFixed(2) +
        "?",
    );
  }
  protected construirLineasPayload(): any[] {
    return this.detalles.controls.map((c) => {
      const x = c.getRawValue();
      if (this.compra) {
        if (x["esNuevo"]) {
          const cod = String(x["codigo"] || "").trim();
          const bar = String(x["codigoBarras"] || "").trim();
          return {
            cantidad: Number(x["cantidad"]),
            precioUnitario: Number(x["precioUnitario"]),
            nuevoProducto: {
              nombre: String(x["nombre"] || "").trim(),
              categoriaId: Number(x["categoriaId"]),
              precioVenta: Number(x["precioVenta"]),
              ...(cod ? { codigo: cod } : {}),
              ...(bar ? { codigoBarras: bar } : {}),
              unidadVenta: "UNIDAD",
            },
          };
        }
        return {
          productoId: x["productoId"],
          cantidad: Number(x["cantidad"]),
          precioUnitario: Number(x["precioUnitario"]),
        };
      }
      return { productoId: x["productoId"], cantidad: Number(x["cantidad"]) };
    });
  }
  protected onGuardarError(e: any) {
    this.error.set(mensaje(e));
    this.busy.set(false);
  }
  protected datosCompra(): object { return {}; }
}
