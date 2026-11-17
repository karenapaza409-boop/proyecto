import { Component, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ApiService, mensaje } from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";
import { Proveedor } from "./proveedor-model";

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  styleUrls: ["./proveedores.css"],
  template: `
    <div class="proveedores-container">
      <div class="page-heading-form">
        <a class="back-link" routerLink="/proveedores">
          <span aria-hidden="true">←</span> Volver a proveedores
        </a>
        <h1>{{ id ? 'Editar proveedor' : 'Registrar proveedor' }}</h1>
        <p class="heading-subtitle">Completa los datos de identificación. El contacto es opcional.</p>
      </div>

      @if (saved(); as p) {
        <div class="panel-card success-card" role="status">
          <h2>✓ Proveedor {{ id ? 'actualizado' : 'registrado' }}</h2>
          <p class="success-desc">{{ p.nombre }} se guardó correctamente.</p>
          <div class="actions-cell-start">
            <a class="btn-secondary" routerLink="/proveedores">Volver al listado</a>
            <a class="btn-secondary" [routerLink]="['/proveedores', p.id]">Ver proveedor</a>
            @if (p.activo && auth.tiene('ADMIN', 'COMPRADOR')) {
              <a class="btn-primary" routerLink="/compras/nueva" [queryParams]="{proveedorId: p.id}">Registrar compra</a>
            }
          </div>
        </div>
      } @else if (loading()) {
        <div class="loading-state" aria-busy="true">
          <div class="spinner"></div>
          <span>Cargando proveedor…</span>
        </div>
      } @else if (loadFailed()) {
        <div class="error-banner" role="alert">
          <span>⚠️ {{ error() }}</span>
          <div class="actions-cell-start" style="margin-top: 10px;">
            <button type="button" class="btn-action-small" (click)="cargar()">Volver a intentar</button>
            <a class="btn-action-small" routerLink="/proveedores">Volver al listado</a>
          </div>
        </div>
      } @else {
        <form class="form-card-container" [formGroup]="form" (ngSubmit)="guardar()" novalidate [attr.aria-busy]="busy()">
          @if (legacy()) {
            <div class="warning-banner">
              <span>⚠️ Este registro no tiene tipo de documento clasificado. Selecciónalo según el documento real.</span>
            </div>
          }

          <fieldset class="form-section-card" [disabled]="busy()">
            <legend class="section-title">Identificación</legend>
            <div class="form-grid">
              <div class="form-field">
                <label for="tipoDocumento">
                  <span>Tipo de documento <span class="required">*</span></span>
                </label>
                <select
                  id="tipoDocumento"
                  formControlName="tipoDocumento"
                  aria-required="true"
                  [attr.aria-invalid]="!!fieldError('tipoDocumento')"
                >
                  <option value="">Seleccione un tipo</option>
                  <option value="RUC">RUC</option>
                  <option value="DNI">DNI</option>
                </select>
                <span class="field-hint">Se admiten RUC y DNI. No se realizan consultas externas.</span>
                @if (fieldError('tipoDocumento'); as msg) {
                  <span class="field-error">{{ msg }}</span>
                }
              </div>

              <div class="form-field">
                <label for="documento">
                  <span>Número de documento <span class="required">*</span></span>
                </label>
                <input
                  id="documento"
                  formControlName="documento"
                  inputmode="numeric"
                  aria-required="true"
                  [maxlength]="form.controls.tipoDocumento.value === 'DNI' ? 8 : form.controls.tipoDocumento.value === 'RUC' ? 11 : 20"
                  [placeholder]="form.controls.tipoDocumento.value === 'DNI' ? 'Ej.: 12345678' : 'Ej.: 20123456789'"
                  [attr.aria-invalid]="!!fieldError('documento')"
                />
                <span class="field-hint">
                  {{ form.controls.tipoDocumento.value === 'DNI' ? '8 dígitos, sin espacios ni guiones.' : form.controls.tipoDocumento.value === 'RUC' ? '11 dígitos, sin espacios ni guiones.' : 'DNI de 8 dígitos o RUC de 11 dígitos.' }}
                </span>
                @if (fieldError('documento'); as msg) {
                  <span class="field-error">{{ msg }}</span>
                }
              </div>

              <div class="form-field wide">
                <label for="nombre">
                  <span>{{ form.controls.tipoDocumento.value === 'DNI' ? 'Nombre y apellidos del proveedor' : 'Razón social o nombre del proveedor' }} <span class="required">*</span></span>
                </label>
                <input
                  id="nombre"
                  formControlName="nombre"
                  maxlength="150"
                  autocomplete="organization"
                  placeholder="Ej.: Distribuidora del Valle S.A.C."
                  aria-required="true"
                  [attr.aria-invalid]="!!fieldError('nombre')"
                />
                <span class="field-hint">Escribe el nombre que identifica al proveedor en sus documentos.</span>
                @if (fieldError('nombre'); as msg) {
                  <span class="field-error">{{ msg }}</span>
                }
              </div>

              <div class="form-field wide">
                <label for="nombreComercial">
                  <span>Nombre comercial (opcional)</span>
                </label>
                <input
                  id="nombreComercial"
                  formControlName="nombreComercial"
                  maxlength="150"
                  placeholder="Ej.: Distribuciones del Valle"
                  [attr.aria-invalid]="!!fieldError('nombreComercial')"
                />
                @if (fieldError('nombreComercial'); as msg) {
                  <span class="field-error">{{ msg }}</span>
                }
              </div>
            </div>
          </fieldset>

          <fieldset class="form-section-card" [disabled]="busy()">
            <legend class="section-title">Contacto <span class="section-subtitle">· Opcional</span></legend>
            <div class="form-grid">
              @for (f of contactFields; track f.key) {
                <div class="form-field">
                  <label [for]="f.key">
                    <span>{{ f.label }} (opcional)</span>
                  </label>
                  <input
                    [id]="f.key"
                    [formControlName]="f.key"
                    [type]="f.type"
                    [maxlength]="f.max"
                    [placeholder]="f.example"
                    [attr.autocomplete]="f.autocomplete"
                    [attr.aria-invalid]="!!fieldError(f.key)"
                  />
                  @if (fieldError(f.key); as msg) {
                    <span class="field-error">{{ msg }}</span>
                  }
                </div>
              }
            </div>
          </fieldset>

          @if (error()) {
            <div class="error-banner" role="alert">
              <span>⚠️ {{ error() }}</span>
            </div>
          }

          @if (duplicateId(); as duplicate) {
            @if (auth.tiene('ADMIN')) {
              <div class="warning-banner">
                <a [routerLink]="['/proveedores', duplicate]" class="link-inline">Abrir proveedor existente</a>
              </div>
            }
          }

          <div class="form-footer-card">
            <span class="help-text"><span class="required">*</span> Campos obligatorios</span>
            <div class="actions-group">
              <a class="btn-secondary" routerLink="/proveedores">Cancelar</a>
              <button type="submit" class="btn-primary" [disabled]="busy()">
                {{ busy() ? 'Guardando proveedor…' : 'Guardar proveedor' }}
              </button>
            </div>
          </div>
        </form>
      }
    </div>
  `,
})
export class ProveedorForm implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  auth = inject(AuthService);
  id = this.route.snapshot.paramMap.get("id");
  loading = signal(false);
  loadFailed = signal(false);
  busy = signal(false);
  legacy = signal(false);
  error = signal("");
  duplicateId = signal<number | null>(null);
  saved = signal<Proveedor | null>(null);
  serverErrors = signal<Record<string, string>>({});
  submitted = false;

  form = this.fb.nonNullable.group({
    tipoDocumento: ["", [Validators.required, Validators.pattern(/^(DNI|RUC)$/)]],
    documento: ["", [Validators.required]],
    nombre: ["", [Validators.required, Validators.maxLength(150), Validators.pattern(/\S/)]],
    nombreComercial: ["", Validators.maxLength(150)],
    personaContacto: ["", Validators.maxLength(150)],
    telefono: ["", [Validators.maxLength(30), Validators.pattern(/^(?:\s*|\+?[0-9][0-9 () .-]{5,29})$/)]],
    correo: ["", [Validators.email, Validators.maxLength(254)]],
    direccion: ["", Validators.maxLength(250)],
  });

  contactFields = [
    { key: "personaContacto", label: "Persona de contacto", type: "text", max: 150, example: "Ej.: Ana Pérez", autocomplete: "name" },
    { key: "telefono", label: "Teléfono", type: "tel", max: 30, example: "Ej.: +51 987 654 321", autocomplete: "tel" },
    { key: "correo", label: "Correo electrónico", type: "email", max: 254, example: "Ej.: contacto@empresa.pe", autocomplete: "email" },
    { key: "direccion", label: "Dirección", type: "text", max: 250, example: "Ej.: Av. Los Olivos 120, Lima", autocomplete: "street-address" },
  ];

  ngOnInit() {
    this.form.controls.tipoDocumento.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.documentValidator());
    this.form.controls.documento.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.duplicateId()) this.duplicateId.set(null);
      });
    if (this.id) this.cargar();
  }

  documentValidator() {
    const t = this.form.controls.tipoDocumento.value;
    const docCtrl = this.form.controls.documento;
    docCtrl.clearValidators();
    if (t === "DNI") {
      docCtrl.setValidators([Validators.required, Validators.pattern(/^[0-9]{8}$/)]);
    } else if (t === "RUC") {
      docCtrl.setValidators([Validators.required, Validators.pattern(/^[0-9]{11}$/)]);
    } else {
      docCtrl.setValidators([Validators.required]);
    }
    docCtrl.updateValueAndValidity();
  }

  fieldError(field: string): string {
    if (this.serverErrors()[field]) return this.serverErrors()[field];
    const c = this.form.get(field);
    if (!c || (!c.touched && !this.submitted)) return "";
    if (c.errors?.["required"]) {
      if (field === "tipoDocumento") return "Seleccione el tipo de documento.";
      if (field === "documento") return "Ingrese el número de documento.";
      if (field === "nombre") return "Ingrese la razón social o nombre.";
    }
    if (c.errors?.["pattern"]) {
      if (field === "documento") {
        return this.form.controls.tipoDocumento.value === "DNI"
          ? "El DNI debe tener 8 dígitos numéricos."
          : "El RUC debe tener 11 dígitos numéricos.";
      }
      if (field === "telefono") return "El teléfono solo puede contener números, espacios y los signos + - ( ).";
    }
    if (c.errors?.["email"]) return "Ingrese un correo válido.";
    if (c.errors?.["maxlength"]) return "Ha superado el número máximo de caracteres.";
    return "";
  }

  cargar() {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.error.set("");
    this.api.get<Proveedor>("/proveedores/" + this.id).subscribe({
      next: (p) => {
        this.form.patchValue({
          tipoDocumento: p.tipoDocumento || "",
          documento: p.documento,
          nombre: p.nombre,
          nombreComercial: p.nombreComercial || "",
          personaContacto: p.personaContacto || "",
          telefono: p.telefono || "",
          correo: p.correo || "",
          direccion: p.direccion || "",
        });
        if (!p.tipoDocumento) this.legacy.set(true);
        this.loading.set(false);
      },
      error: (e) => {
        this.loadFailed.set(true);
        this.error.set(mensaje(e));
        this.loading.set(false);
      },
    });
  }

  guardar() {
    this.submitted = true;
    this.serverErrors.set({});
    this.error.set("");
    this.duplicateId.set(null);
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    const data = this.form.getRawValue();
    const req = this.id
      ? this.api.put<Proveedor>("/proveedores/" + this.id, data)
      : this.api.post<Proveedor>("/proveedores", data);

    req.subscribe({
      next: (res) => {
        this.saved.set(res);
        this.busy.set(false);
      },
      error: (e) => {
        this.busy.set(false);
        if (e.status === 409 && e.error?.duplicadoId) {
          this.duplicateId.set(e.error.duplicadoId);
        }
        if (e.error?.errors) {
          this.serverErrors.set(e.error.errors);
        }
        this.error.set(mensaje(e));
      },
    });
  }
}
