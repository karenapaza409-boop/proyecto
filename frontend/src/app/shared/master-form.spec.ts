import { TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { MasterForm } from "./master-form";
import { ApiService } from "../core/services/api-service";
describe("Consulta DNI y registro manual", () => {
  const post = vi.fn();
  beforeEach(() => {
    post.mockReset();
    TestBed.configureTestingModule({ providers: [
      { provide: ApiService, useValue: { post } },
      { provide: Router, useValue: { navigate: vi.fn() } },
      { provide: ActivatedRoute, useValue: { snapshot: { data: { endpoint: "clientes", title: "Clientes" }, paramMap: { get: () => null } } } },
    ] });
  });
  it("conserva el nombre manual y permite guardarlo cuando no hay proveedor", () => {
    const f = TestBed.runInInjectionContext(() => new MasterForm());
    f.ngOnInit();
    f.form.setValue({ documento: "00000000", nombre: "Persona ficticia" });
    post.mockReturnValueOnce(throwError(() => ({ status: 503, error: { detail: "Ingrese manualmente" } })));
    f.consultarDni();
    expect(f.form.controls.nombre.value).toBe("Persona ficticia");
    expect(f.consultando()).toBe(false);
    post.mockReturnValueOnce(of({ id: 1 }));
    f.guardar();
    expect(post).toHaveBeenLastCalledWith("/clientes", { documento: "00000000", nombre: "Persona ficticia" });
  });
  it("rellena nombres y apellidos de la respuesta del adaptador", () => {
    const f = TestBed.runInInjectionContext(() => new MasterForm());
    f.form.controls.documento.setValue("00000000");
    post.mockReturnValue(of({ nombres: "Persona", apellidoPaterno: "Ficticia", apellidoMaterno: "Prueba" }));
    f.consultarDni();
    expect(f.form.controls.nombre.value).toBe("Persona Ficticia Prueba");
  });
});
