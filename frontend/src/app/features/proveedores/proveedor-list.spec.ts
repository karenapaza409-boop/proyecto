import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";
import { ApiService } from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";
import { ProveedorList } from "./proveedor-list";

describe("Listado de proveedores ante una consulta fallida", () => {
  it("no presenta un fallo como lista vacía y permite volver a consultar", () => {
    const get = vi.fn().mockReturnValue(throwError(() => ({ status: 400, error: { detail: "No se pudo consultar el listado" } })));
    TestBed.configureTestingModule({ providers: [provideRouter([]),
      { provide: ApiService, useValue: { get } },
      { provide: AuthService, useValue: { tiene: () => true } },
    ] });
    const fixture = TestBed.createComponent(ProveedorList); fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain("No se pudo consultar el listado");
    expect(el.textContent).not.toContain("No hay proveedores con estos filtros");
    expect(el.querySelector("table")).toBeNull();
    get.mockReturnValue(of({ content: [{ id: 1, nombre: "Proveedor ficticio conservado", documento: "00000000", tipoDocumento: "DNI", activo: true }], number: 0, size: 20, totalElements: 1, totalPages: 1 }));
    [...el.querySelectorAll("button")].find(b => b.textContent?.includes("Reintentar listado"))!.click();
    fixture.detectChanges();
    expect(get).toHaveBeenCalledTimes(2);
    expect(el.textContent).toContain("Proveedor ficticio conservado");
    expect(el.querySelector('[role="alert"]')).toBeNull();
  });
});
