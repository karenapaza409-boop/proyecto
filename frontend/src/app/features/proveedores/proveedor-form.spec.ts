import { TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of, Subject, throwError } from "rxjs";
import { ApiService } from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";
import { ProveedorForm } from "./proveedor-form";
import { Proveedor } from "./proveedor-model";
const proveedor: Proveedor = { id: 7, tipoDocumento: "DNI", documento: "00000000", nombre: "Proveedor ficticio", nombreComercial: null, personaContacto: null, telefono: null, correo: null, direccion: null, activo: true };
describe("Formulario propio de proveedores", () => {
  let api: { post: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };
  let id: string | null;
  beforeEach(() => {
    id = null;
    api = { post: vi.fn(), put: vi.fn(), get: vi.fn(() => of(proveedor)) };
    TestBed.configureTestingModule({ providers: [
      { provide: ApiService, useValue: api }, { provide: AuthService, useValue: { tiene: () => true } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => id } } } },
    ] });
  });
  function form() { const f = TestBed.runInInjectionContext(() => new ProveedorForm()); f.ngOnInit(); return f; }
  function completar(f: ProveedorForm) { f.form.patchValue({ tipoDocumento: "DNI", documento: "00000000", nombre: "Proveedor ficticio" }); }
  it("oculta errores hasta interactuar o intentar guardar y adapta DNI/RUC", () => {
    const f = form(); expect(f.fieldError("nombre")).toBe(""); expect(f.fieldError("documento")).toBe("");
    f.form.controls.nombre.markAsTouched(); expect(f.fieldError("nombre")).toContain("Ingrese");
    f.guardar(); expect(f.fieldError("tipoDocumento")).toContain("Seleccione"); expect(api.post).not.toHaveBeenCalled();
    completar(f); expect(f.form.valid).toBe(true);
    f.form.controls.tipoDocumento.setValue("RUC"); expect(f.fieldError("documento")).toContain("11");
    f.form.controls.documento.setValue("00000000000"); expect(f.form.valid).toBe(true);
  });
  it("admite contacto vacío y evita envíos repetidos mientras guarda", () => {
    const f = form(); completar(f); const pending = new Subject<Proveedor>(); api.post.mockReturnValue(pending);
    f.guardar(); f.guardar(); expect(api.post).toHaveBeenCalledTimes(1); expect(f.busy()).toBe(true);
    pending.next(proveedor); expect(f.saved()?.id).toBe(7); expect(f.busy()).toBe(false);
  });
  it("conserva datos tras un error y permite abrir el duplicado", () => {
    const f = form(); completar(f); f.form.controls.telefono.setValue("+51 999 000 000");
    const before = f.form.getRawValue();
    api.post.mockReturnValue(throwError(() => ({ status: 409, error: { detail: "Ya existe el proveedor", duplicadoId: 7, errors: { documento: "Documento duplicado" } } })));
    f.guardar(); expect(f.form.getRawValue()).toEqual(before); expect(f.duplicateId()).toBe(7);
    expect(f.fieldError("documento")).toBe("Documento duplicado"); expect(f.busy()).toBe(false);
    f.form.controls.personaContacto.setValue("Otro contacto ficticio");
    expect(f.duplicateId()).toBe(7); expect(f.fieldError("documento")).toBe("Documento duplicado");
    f.form.controls.documento.setValue("00000001"); expect(f.duplicateId()).toBeNull();
  });
  it("valida correo y teléfono opcionales con mensajes específicos", () => {
    const f = form(); completar(f); f.form.controls.correo.setValue("incorrecto"); f.form.controls.telefono.setValue("abc");
    f.guardar(); expect(f.fieldError("correo")).toContain("correo válido"); expect(f.fieldError("telefono")).toContain("números");
    expect(api.post).not.toHaveBeenCalled();
  });
  it("edita un registro antiguo sin adivinar su tipo de documento", () => {
    id = "7"; api.get.mockReturnValue(of({ ...proveedor, tipoDocumento: null, personaContacto: "Persona ficticia" }));
    const f = form(); expect(f.form.controls.tipoDocumento.value).toBe(""); expect(f.legacy()).toBe(true);
    f.guardar(); expect(api.put).not.toHaveBeenCalled();
    f.form.controls.tipoDocumento.setValue("DNI"); api.put.mockReturnValue(of(proveedor)); f.guardar();
    expect(api.put).toHaveBeenCalledWith("/proveedores/7", expect.objectContaining({ tipoDocumento: "DNI", personaContacto: "Persona ficticia" }));
  });
});
