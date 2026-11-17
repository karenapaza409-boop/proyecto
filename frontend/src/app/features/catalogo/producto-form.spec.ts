import { TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { ApiService } from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";
import { ProductoForm } from "./producto-form";
import { Producto } from "../../core/models/models";

describe("Formulario de producto", () => {
  let api: { post: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let id: string | null;

  const mockProducto: Producto = {
    id: 10,
    codigo: "PRD-010",
    nombre: "Atún en conserva",
    categoria: { id: 1, nombre: "Pantalones" },
    precio: 6.5,
    stock: 15,
    codigoBarras: "000123456789",
    unidadVenta: "UNIDAD",
    stockMinimo: 5,
  };

  beforeEach(() => {
    id = null;
    api = {
      post: vi.fn(() => of(mockProducto)),
      put: vi.fn(() => of(mockProducto)),
      get: vi.fn((url: string) => {
        if (url === "/categorias") return of([{ id: 1, nombre: "Pantalones" }]);
        if (url.startsWith("/productos/")) return of(mockProducto);
        return of({});
      }),
    };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: ApiService, useValue: api },
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: { tiene: () => true } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => id } } } },
      ],
    });
  });

  function createComponent() {
    const f = TestBed.runInInjectionContext(() => new ProductoForm());
    f.ngOnInit();
    return f;
  }

  it("valida campos obligatorios y formato de precio", () => {
    const f = createComponent();
    expect(f.form.valid).toBe(false);

    f.form.patchValue({
      nombre: "Polo de algodon",
      codigo: "POL-001",
      categoriaId: 1,
      precio: 4.5,
      stockMinimo: 6,
      codigoBarras: "00123456",
    });

    expect(f.form.valid).toBe(true);
    f.guardar();

    expect(api.post).toHaveBeenCalledWith("/productos", expect.objectContaining({
      nombre: "Polo de algodon",
      codigo: "POL-001",
      codigoBarras: "00123456", // Conserva ceros iniciales
      precio: 4.5,
      stockMinimo: 6,
      unidadVenta: "UNIDAD",
    }));
  });

  it("al editar carga los datos incluido el stock disponible", () => {
    id = "10";
    const f = createComponent();

    expect(f.form.controls.nombre.value).toBe("Atún en conserva");
    expect(f.form.controls.codigo.value).toBe("PRD-010");
    expect(f.form.controls.codigoBarras.value).toBe("000123456789");
    expect(f.form.controls.stock.value).toBe(15);

    f.guardar();
    expect(api.put).toHaveBeenCalledWith("/productos/10", expect.objectContaining({
      stock: 15,
    }));
  });
});
