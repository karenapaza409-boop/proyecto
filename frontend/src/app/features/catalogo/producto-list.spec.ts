import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";
import { ApiService } from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";
import { ProductoList } from "./producto-list";
import { Producto } from "../../core/models/models";

describe("Catálogo de productos e inventario", () => {
  let api: {
    get: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
  };
  const mockCategorias = [{ id: 1, nombre: "Polos" }, { id: 2, nombre: "Pantalones" }];
  const mockProductos: Producto[] = [
    { id: 1, codigo: "POL-001", nombre: "Polo de algodon negro - Talla M", categoria: { id: 1, nombre: "Polos" }, precio: 4.5, stock: 25, stockMinimo: 6, unidadVenta: "UNIDAD", activo: true },
    { id: 2, codigo: "PAN-001", nombre: "Jean azul clasico - Talla 32", categoria: { id: 2, nombre: "Pantalones" }, precio: 4.5, stock: 5, stockMinimo: 6, unidadVenta: "UNIDAD", activo: true },
    { id: 3, codigo: "CAS-001", nombre: "Casaca denim - Talla L", categoria: { id: 2, nombre: "Pantalones" }, precio: 8.0, stock: 0, stockMinimo: 6, unidadVenta: "UNIDAD", activo: true },
  ];

  beforeEach(() => {
    api = {
      get: vi.fn((url: string) => {
        if (url === "/categorias") return of(mockCategorias);
        if (url === "/productos") {
          return of({
            content: mockProductos,
            number: 0,
            size: 10,
            totalElements: 3,
            totalPages: 1,
          });
        }
        return of({});
      }),
      delete: vi.fn(() => of(undefined)),
      put: vi.fn(() => of({ ...mockProductos[0], activo: false })),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: { tiene: () => true } },
      ],
    });
  });

  afterEach(() => {
    localStorage.removeItem("mm_productos_inactivos");
    vi.restoreAllMocks();
  });

  it("calcula correctamente los indicadores: Disponible y Stock bajo, y no muestra 'Sin stock'", () => {
    const fixture = TestBed.createComponent(ProductoList);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain("Polo de algodon negro - Talla M");
    expect(el.textContent).toContain("Jean azul clasico - Talla 32");
    expect(el.textContent).toContain("Casaca denim - Talla L");

    // Indicadores según reglas
    expect(el.textContent).toContain("Disponible");
    expect(el.textContent).toContain("Stock bajo");
    expect(el.textContent).not.toContain("Sin stock");

    // Botones de acción: contiene Eliminar y no contiene Ver ficha
    expect(el.textContent).toContain("Eliminar");
    expect(el.textContent).not.toContain("Ver ficha");
  });

  it("no convierte un fallo de API en lista vacía y permite reintentar", () => {
    api.get.mockImplementation((url: string) => {
      if (url === "/categorias") return of(mockCategorias);
      if (url === "/productos") {
        return throwError(() => ({ status: 500, error: { detail: "Error del servidor al listar" } }));
      }
      return of({});
    });

    const fixture = TestBed.createComponent(ProductoList);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[role="alert"]')).not.toBeNull();
    expect(el.textContent).toContain("Error del servidor al listar");
    expect(el.textContent).not.toContain("No hay productos que coincidan");
    expect(el.querySelector("table")).toBeNull();

    // Reintentar
    api.get.mockImplementation((url: string) => {
      if (url === "/categorias") return of(mockCategorias);
      if (url === "/productos") {
        return of({
          content: mockProductos,
          number: 0,
          size: 10,
          totalElements: 3,
          totalPages: 1,
        });
      }
      return of({});
    });

    const reintentarBtn = [...el.querySelectorAll("button")].find((b) => b.textContent?.includes("Reintentar"));
    expect(reintentarBtn).toBeDefined();
    reintentarBtn?.click();
    fixture.detectChanges();

    expect(el.querySelector("table")).not.toBeNull();
    expect(el.textContent).toContain("Polo de algodon negro - Talla M");
  });

  it("elimina normalmente tanto productos sin operaciones como productos con historial sin mostrar errores", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const fixture = TestBed.createComponent(ProductoList);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;

    // Caso 1: Producto sin operaciones se elimina directamente
    comp.eliminar(mockProductos[2]);
    expect(api.delete).toHaveBeenCalledWith("/productos/3");

    // Caso 2: Producto con historial en ventas/compras se retira de la lista normalmente sin mostrar alerta roja
    api.delete.mockReturnValueOnce(
      throwError(() => ({
        status: 409,
        error: {
          detail: "Código duplicado o registro relacionado con otras operaciones.",
        },
      })),
    );
    comp.eliminar(mockProductos[0]);
    fixture.detectChanges();

    expect(comp.error()).toBe("");
    expect(el.textContent).toContain("eliminado correctamente");
    expect(el.querySelector("table")?.textContent).not.toContain("Polo de algodon negro - Talla M");
  });
});
