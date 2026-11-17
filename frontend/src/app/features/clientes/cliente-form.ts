import { Component, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ApiService, mensaje } from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";
import { Cliente } from "./cliente-model";

interface PersonaDni {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrls: ["./clientes.css"],
  template: `
    <div style="margin-bottom: 20px;">
      <a class="back-link" routerLink="/clientes">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Volver a clientes
      </a>
      <div class="heading-title-group">
        <h1>{{ id ? 'Editar cliente' : 'Registrar cliente' }}</h1>
        <p class="heading-subtitle">Completa los datos de identificación. El contacto es opcional.</p>
      </div>
    </div>

    @if (saved(); as c) {
      <section class="panel" style="padding: 24px; border-color: var(--status-green);">
        <h2 style="color: var(--status-green); margin-top: 0;">Cliente {{ id ? 'actualizado' : 'registrado' }}</h2>
        <p>{{ c.nombre }} se guardó correctamente.</p>
        <div style="margin-top: 16px;">
          <a class="btn-primary" routerLink="/clientes">Volver al listado</a>
        </div>
      </section>
    } @else if (loading()) {
      <section class="panel" style="padding: 30px; text-align: center;"><p role="status">Cargando datos del cliente…</p></section>
    } @else if (loadFailed()) {
      <section class="panel" style="padding: 24px;">
        <p class="error-banner">{{ error() }}</p>
        <button class="btn-primary" (click)="cargar()">Volver a intentar</button>
        <a class="btn-secondary" style="margin-left: 10px;" routerLink="/clientes">Volver al listado</a>
      </section>
    } @else {
      <form class="form-container" [formGroup]="form" (ngSubmit)="guardar()" novalidate>
        <!-- Identificación -->
        <fieldset class="form-section" [disabled]="busy()">
          <legend>Identificación</legend>
          <div class="field-grid">
            <div class="field-group">
              <label for="tipoDocumento">Tipo de documento *</label>
              <select id="tipoDocumento" formControlName="tipoDocumento">
                <option value="DNI">DNI</option>
              </select>
            </div>

            <div class="field-group">
              <label for="documento">Número de documento *</label>
              <div class="doc-input-wrapper">
                <input
                  id="documento"
                  formControlName="documento"
                  inputmode="numeric"
                  maxlength="8"
                  placeholder="Ingresa el DNI"
                />
                @if (!saved()) {
                  <button
                    type="button"
                    class="btn-secondary"
                    (click)="consultarDni()"
                    [disabled]="consultandoDni() || busy() || form.controls.documento.invalid"
                  >
                    {{ consultandoDni() ? 'Consultando…' : 'Consultar' }}
                  </button>
                }
              </div>
              <span class="field-hint">Consulta disponible con un proveedor configurado. Puedes ingresar los datos manualmente.</span>
              @if (fieldError('documento'); as msg) {
                <span class="field-error-msg">{{ msg }}</span>
              }
            </div>

            <div class="field-group">
              <label for="nombres">Nombres *</label>
              <input
                id="nombres"
                formControlName="nombres"
                maxlength="75"
                placeholder="Ingresa los nombres"
              />
              @if (fieldError('nombres'); as msg) {
                <span class="field-error-msg">{{ msg }}</span>
              }
            </div>

            <div class="field-group">
              <label for="apellidos">Apellidos *</label>
              <input
                id="apellidos"
                formControlName="apellidos"
                maxlength="75"
                placeholder="Ingresa los apellidos"
              />
              @if (fieldError('apellidos'); as msg) {
                <span class="field-error-msg">{{ msg }}</span>
              }
            </div>
          </div>
        </fieldset>

        <!-- Contacto -->
        <fieldset class="form-section" [disabled]="busy()">
          <legend>Contacto <span class="optional-tag">· Opcional</span></legend>
          <div class="field-grid">
            <div class="field-group">
              <label for="telefono">Teléfono (opcional)</label>
              <input
                id="telefono"
                formControlName="telefono"
                type="tel"
                maxlength="30"
                placeholder="Ingresa el teléfono"
              />
              @if (fieldError('telefono'); as msg) {
                <span class="field-error-msg">{{ msg }}</span>
              }
            </div>

            <div class="field-group">
              <label for="correo">Correo (opcional)</label>
              <input
                id="correo"
                formControlName="correo"
                type="email"
                maxlength="254"
                placeholder="Ingresa el correo"
              />
              @if (fieldError('correo'); as msg) {
                <span class="field-error-msg">{{ msg }}</span>
              }
            </div>
          </div>
        </fieldset>

        @if (legacyNombre()) { <p class="field-hint">Nombre anterior conservado: {{ legacyNombre() }}. Complete nombres y apellidos según los datos reales; no los separamos automáticamente.</p> }

        @if (dniInfo()) {
          <p class="field-hint" style="color: var(--accent-blue);">{{ dniInfo() }}</p>
        }

        @if (error()) {
          <div class="error-banner" role="alert">
            <p style="margin: 0;">{{ error() }}</p>
          </div>
        }

        @if (duplicateId(); as duplicate) {
          @if (auth.tiene('ADMIN')) {
            <div>
              <a class="btn-secondary" [routerLink]="['/clientes', duplicate, 'editar']">
                Editar cliente existente con este documento
              </a>
            </div>
          }
        }

        <div class="form-footer-actions">
          <span class="field-hint"><span style="color: var(--status-red);">*</span> Campos obligatorios</span>
          <div class="btn-group">
            <a class="btn-secondary" routerLink="/clientes">Cancelar</a>
            <button class="btn-primary" [disabled]="busy()">
              {{ busy() ? 'Guardando cliente…' : 'Guardar cliente' }}
            </button>
          </div>
        </div>
      </form>
    }
  `,
})
export class ClienteForm implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  auth = inject(AuthService);

  id: number | null = null;
  loading = signal(false);
  loadFailed = signal(false);
  busy = signal(false);
  consultandoDni = signal(false);
  error = signal("");
  dniInfo = signal("");
  duplicateId = signal<number | null>(null);
  saved = signal<Cliente | null>(null);
  legacyNombre = signal("");
  serverErrors = signal<Record<string,string>>({});

  form = this.fb.nonNullable.group({
    tipoDocumento: ["DNI", [Validators.required]],
    documento: ["", [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
    nombres: ["", [Validators.required, Validators.maxLength(75), Validators.pattern(/\S/)]],
    apellidos: ["", [Validators.required, Validators.maxLength(75), Validators.pattern(/\S/)]],
    telefono: ["", [Validators.maxLength(30), Validators.pattern(/^(?:\s*|\+?[0-9][0-9 () .-]{5,29})$/)]],
    correo: ["", [Validators.email, Validators.maxLength(254)]],
  });

  ngOnInit() {
    let anteriores = this.form.getRawValue();
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const actuales=this.form.getRawValue();const errores={...this.serverErrors()};
      for(const key of Object.keys(actuales) as (keyof typeof actuales)[]) if(actuales[key]!==anteriores[key]) delete errores[key];
      this.serverErrors.set(errores);anteriores=actuales;
    });
    const param = this.route.snapshot.paramMap.get("id");
    if (param) {
      this.id = Number(param);
      this.cargar();
    }

    this.form.controls.documento.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.duplicateId.set(null);
        this.serverErrors.set({}); this.dniInfo.set("");
      });
  }

  cargar() {
    if (!this.id) return;
    this.loading.set(true);
    this.loadFailed.set(false);
    this.error.set("");
    this.api.get<Cliente>(`/clientes/${this.id}`).subscribe({
      next: (c) => {
        const nombres = c.nombres || "";
        const apellidos = c.apellidos || "";
        this.legacyNombre.set(!c.nombres || !c.apellidos ? c.nombre : "");

        this.form.patchValue({
          tipoDocumento: c.tipoDocumento || "DNI",
          documento: c.documento,
          nombres: nombres,
          apellidos: apellidos,
          telefono: c.telefono || "",
          correo: c.correo || "",
        });
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(mensaje(e));
        this.loading.set(false);
        this.loadFailed.set(true);
      },
    });
  }

  consultarDni() {
    if(this.busy() || this.consultandoDni() || this.saved()) return;
    const dni = this.form.controls.documento.value.trim();
    const previo = this.form.getRawValue();
    if (!/^[0-9]{8}$/.test(dni)) return;

    this.consultandoDni.set(true);
    this.error.set("");
    this.dniInfo.set("");

    this.api.post<PersonaDni>("/clientes/consulta-dni", { dni }).subscribe({
      next: (res) => {
        if (res && res.nombres && !this.saved() && !this.busy() && this.form.controls.documento.value.trim() === dni
            && this.form.controls.nombres.value === previo.nombres && this.form.controls.apellidos.value === previo.apellidos) {
          this.form.patchValue({
            nombres: res.nombres,
            apellidos: `${res.apellidoPaterno || ""} ${res.apellidoMaterno || ""}`.trim(),
          });
          this.dniInfo.set("Datos obtenidos de la consulta DNI.");
        }
        this.consultandoDni.set(false);
      },
      error: () => {
        this.consultandoDni.set(false);
        if(this.form.controls.documento.value.trim() === dni) this.dniInfo.set("Consulta de DNI no disponible. Puedes ingresar nombres y apellidos manualmente.");
      },
    });
  }

  fieldError(name: string): string | null {
    const c = this.form.get(name);
    if(this.serverErrors()[name]) return this.serverErrors()[name];
    if (!c || !c.touched || !c.errors) return null;
    if (c.errors["required"]) return "Este campo es obligatorio.";
    if (c.errors["pattern"]) {
      if (name === "documento") return "El DNI debe tener exactamente 8 dígitos.";
      if (name === "telefono") return "Ingrese un número de teléfono válido.";
    }
    if (c.errors["email"]) return "Ingrese un formato de correo válido.";
    if (c.errors["maxlength"]) return `Máximo ${c.errors['maxlength'].requiredLength} caracteres.`;
    return "Valor no válido.";
  }

  guardar() {
    if(this.busy() || this.loading() || this.saved()) return;
    this.serverErrors.set({});
    const raw = this.form.getRawValue();
    for(const key of Object.keys(raw) as (keyof typeof raw)[]) this.form.controls[key].setValue(raw[key].trim(),{emitEvent:false});
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.busy()) return;

    this.busy.set(true);
    this.error.set("");
    this.duplicateId.set(null);

    const val = this.form.getRawValue();
    const nombreCompleto = `${val.nombres.trim()} ${val.apellidos.trim()}`.trim();
    if(nombreCompleto.length>150){this.busy.set(false);this.error.set('Nombres y apellidos juntos admiten hasta 150 caracteres.');return;}

    const payload = {
      nombre: nombreCompleto,
      nombres: val.nombres.trim(), apellidos: val.apellidos.trim(),
      documento: val.documento.trim(),
      tipoDocumento: val.tipoDocumento,
      telefono: val.telefono.trim() || null,
      correo: val.correo.trim() || null,
    };

    const req$ = this.id
      ? this.api.put<Cliente>(`/clientes/${this.id}`, payload)
      : this.api.post<Cliente>("/clientes", payload);

    req$.subscribe({
      next: (res) => {
        this.busy.set(false);
        this.saved.set(res);
      },
      error: (e) => {
        this.busy.set(false);
        this.serverErrors.set(e.error?.errors || {});
        if (e.status === 409 && e.error?.duplicadoId) {
          this.duplicateId.set(e.error.duplicadoId);
        }
        this.error.set(mensaje(e));
        if(e.status===409 && !this.duplicateId()) this.api.get<Cliente|null>('/clientes/duplicado',{tipoDocumento:val.tipoDocumento,documento:val.documento,excluirId:this.id||undefined}).subscribe({next:c=>{if(c && this.form.controls.documento.value.trim()===val.documento)this.duplicateId.set(c.id);},error:()=>{}});
      },
    });
  }
}
