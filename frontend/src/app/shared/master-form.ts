import { Component, inject, signal, OnInit } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ApiService, mensaje } from "../core/services/api-service";
import { Maestro } from "../core/models/models";
@Component({
  imports: [ReactiveFormsModule, RouterLink],
  template: `<div class="page-heading">
      <div>
        <span class="eyebrow">DATOS MAESTROS</span>
        <h1>{{ id ? "Editar" : "Nuevo" }} · {{ title }}</h1>
      </div>
    </div>
    <form class="panel form-panel" [formGroup]="form" (ngSubmit)="guardar()">
      <label
        >Nombre<input
          formControlName="nombre"
          maxlength="100"
          autocomplete="organization"
      /></label>
      @if (endpoint !== "categorias") {
        <label
          >Documento<input formControlName="documento" maxlength="20"
        /></label>
      }
      @if (endpoint === "clientes") {
        <button type="button" (click)="consultarDni()" [disabled]="consultando()">Consultar DNI</button>
        <p class="muted">También puede ingresar nombres y apellidos manualmente.</p>
      }
      @if (form.invalid && form.touched) {
        <p class="error">Complete los campos obligatorios.</p>
      }
      @if (error()) {
        <p role="alert" class="error">{{ error() }}</p>
      }
      <div class="actions">
        <a class="button" [routerLink]="'/' + endpoint">Cancelar</a
        ><button class="primary" [disabled]="busy() || loading()">
          Guardar
        </button>
      </div>
    </form>`,
})
export class MasterForm implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  endpoint = this.route.snapshot.data["endpoint"] as string;
  title = this.route.snapshot.data["title"] as string;
  id = this.route.snapshot.paramMap.get("id");
  busy = signal(false);
  loading = signal(false);
  error = signal("");
  consultando = signal(false);
  consultarDni() {
    const dni = this.form.controls.documento.value.trim();
    if (!/^[0-9]{8}$/.test(dni)) {
      this.error.set("Para consultar ingrese un DNI de 8 dígitos.");
      return;
    }
    this.consultando.set(true);
    this.error.set("");
    this.api.post<{ nombres: string; apellidoPaterno: string; apellidoMaterno: string }>(
      "/clientes/consulta-dni", { dni },
    ).subscribe({
      next: (p) => {
        if (this.form.controls.documento.value.trim() === dni)
          this.form.controls.nombre.setValue([p.nombres, p.apellidoPaterno, p.apellidoMaterno].filter(Boolean).join(" "));
        this.consultando.set(false);
      },
      error: (e) => { this.error.set(mensaje(e)); this.consultando.set(false); },
    });
  }
  form = this.fb.nonNullable.group({
    nombre: ["", [Validators.required, Validators.maxLength(100)]],
    documento: [""],
  });
  ngOnInit() {
    if (this.endpoint !== "categorias")
      this.form.controls.documento.setValidators([
        Validators.required,
        Validators.maxLength(20),
      ]);
    if (this.id) {
      this.loading.set(true);
      this.api.get<Maestro>("/" + this.endpoint + "/" + this.id).subscribe({
        next: (r) => {
          this.form.patchValue({
            nombre: r.nombre,
            documento: r.documento || "",
          });
          this.loading.set(false);
        },
        error: (e) => this.error.set(mensaje(e)),
      });
    }
  }
  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    const path = "/" + this.endpoint;
    const req = this.id
      ? this.api.put(path + "/" + this.id, this.form.getRawValue())
      : this.api.post(path, this.form.getRawValue());
    req.subscribe({
      next: () => this.router.navigate(["/" + this.endpoint]),
      error: (e) => {
        this.error.set(mensaje(e));
        this.busy.set(false);
      },
    });
  }
}
