import { TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { ApiService } from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";
import { CompraForm } from "../compras/compra-form";
import { OperacionForm } from "../../shared/operacion-form";
describe("Compra desde la ficha del proveedor", () => {
  const proveedor = { id: 7, nombre: "Proveedor ficticio", documento: "00000000", activo: true };
  let activo: boolean;
  let post: ReturnType<typeof vi.fn>;
  let get: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    activo = true;
    get = vi.fn((path: string) =>
      path === "/proveedores/7"
        ? of({ ...proveedor, activo })
        : path === "/categorias"
          ? of([{ id: 10, nombre: "Casacas" }])
          : of({ content: [], number: 0, totalPages: 0, totalElements: 0, size: 20 })
    );
    post = vi.fn(() => of({ id: 1 }));
    TestBed.configureTestingModule({ providers: [
      { provide: ApiService, useValue: { get, post } },
      { provide: AuthService, useValue: { tiene: () => true } },
      { provide: Router, useValue: { navigate: vi.fn() } },
      { provide: ActivatedRoute, useValue: { snapshot: { data: { tipo: "compras" }, queryParamMap: { get: () => "7" } } } },
    ] });
  });
  function form() { const f = TestBed.runInInjectionContext(() => new OperacionForm()); f.ngOnInit(); return f; }
  function compraForm() { const c = TestBed.runInInjectionContext(() => new CompraForm()); c.ngOnInit(); return c; }
  function producto(f: OperacionForm) { f.agregar({ id: 1, codigo: "TEST", nombre: "Producto ficticio", precio: 2, stock: 0, categoria: { id: 1, nombre: "Prueba" } }); }
  afterEach(() => vi.restoreAllMocks());
  it("preselecciona por ID aunque esté fuera de la página y registra la compra", () => {
    const f = form(); expect(f.form.controls.tercero.value).toBe(7); expect(f.parties()[0].id).toBe(7);
    expect(get).toHaveBeenCalledWith("/proveedores/buscar", expect.objectContaining({ activo: "true", page: 0 }));
    producto(f); vi.spyOn(window, "confirm").mockReturnValue(true); f.guardar();
    expect(post).toHaveBeenCalledWith("/compras", { proveedorId: 7, detalles: [{ productoId: 1, cantidad: 1, precioUnitario: 2 }] });
  });
  it("no preselecciona proveedores inactivos ni permite comprar sin elegir uno activo", () => {
    activo = false; const f = form(); expect(f.form.controls.tercero.value).toBe(0);
    expect(f.error()).toContain("inactivo"); producto(f); f.guardar(); expect(post).not.toHaveBeenCalled();
  });
  it("conserva el carrito si el backend informa que el proveedor fue desactivado", () => {
    const f = form(); producto(f); vi.spyOn(window, "confirm").mockReturnValue(true);
    post.mockReturnValue(throwError(() => ({ status: 409, error: { detail: "Proveedor inactivo" } })));
    f.guardar(); expect(f.detalles.length).toBe(1); expect(f.form.controls.tercero.value).toBe(7);
    expect(f.error()).toContain("inactivo"); expect(f.busy()).toBe(false);
  });
  it("combina productos existentes y filas nuevas editables en CompraForm, conserva código de barras y resuelve duplicados sin perder la compra", () => {
    const c = compraForm();
    c.seleccionarProductoCatalogo({ id: 5, codigo: "CAS-002", nombre: "Art. existente", precio: 6.5, stock: 10, categoria: { id: 10, nombre: "Casacas" } });
    c.detalles.at(0).patchValue({ cantidad: 24, precioUnitario: 5.0 });

    const fakeInput = { value: "7751234567890" } as HTMLInputElement;
    c.insertarDesdeBuscador(fakeInput);
    expect(c.detalles.length).toBe(2);
    expect(c.detalles.at(1).get("esNuevo")?.value).toBe(true);
    expect(c.detalles.at(1).get("codigoBarras")?.value).toBe("7751234567890");
    expect(c.detalles.at(1).get("unidadVenta")?.value).toBe("UNIDAD");

    c.detalles.at(1).patchValue({
      nombre: "Art. nuevo prueba",
      categoriaId: 10,
      cantidad: 12,
      precioUnitario: 4.5,
      precioVenta: 7.0,
    });
    expect(c.total()).toBe(174);
    expect(c.unidades()).toBe(36);

    // Simular conflicto de código duplicado devuelto por backend (409 con productoExistente)
    const existenteConflicto = { id: 99, codigo: "CAS-099", nombre: "Art. ya registrado", precio: 7.5, stock: 4, categoria: { id: 10, nombre: "Casacas" } };
    post.mockReturnValueOnce(throwError(() => ({
      status: 409,
      error: { detail: "Ya existe un producto con el código de barras '7751234567890'.", productoExistente: existenteConflicto, codigoConflictivo: "7751234567890" },
    })));
    c.guardar();
    expect(c.conflictoProducto()?.id).toBe(99);
    expect(c.detalles.length).toBe(2);

    // Seleccionar el producto existente reemplaza la fila nueva conservando cantidad y costo unitario
    c.reemplazarFilaConProductoExistente(existenteConflicto);
    expect(c.conflictoProducto()).toBeNull();
    expect(c.detalles.at(1).get("esNuevo")?.value).toBe(false);
    expect(c.detalles.at(1).get("productoId")?.value).toBe(99);
    expect(c.detalles.at(1).get("cantidad")?.value).toBe(12);
    expect(c.detalles.at(1).get("precioUnitario")?.value).toBe(4.5);
  });
});
