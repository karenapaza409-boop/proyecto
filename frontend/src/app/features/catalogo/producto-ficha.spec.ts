import { TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of, throwError } from "rxjs";
import { ApiService } from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";
import { ProductoFicha } from "./producto-ficha";
import { Producto } from "../../core/models/models";

describe("Ficha del producto, movimientos y ajustes", () => {
  let api: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };
  const mockProducto: Producto = {
    id: 1,
    codigo: "POL-001",
    nombre: "Polo de algodon negro - Talla M",
    categoria: { id: 1, nombre: "Polos" },
    precio: 4.5,
    stock: 25,
    stockMinimo: 6,
    unidadVenta: "UNIDAD",
  };

  const mockMovimientos = {
    content: [
      { id: 1, fecha: "2026-11-08T08:00:00", tipo: "SALDO_INICIAL", referencia: "MIG-06", entrada: 25, salida: 0, saldo: 25, actor: "SISTEMA_MIGRACION", motivo: "Apertura" },
    ],
    number: 0,
    size: 15,
    totalElements: 1,
    totalPages: 1,
  };

  beforeEach(() => {
    window.confirm = vi.fn(() => true);
    api = {
      get: vi.fn((url: string) => {
        if (url === "/productos/1") return of(mockProducto);
        if (url === "/productos/1/movimientos") return of(mockMovimientos);
        return of({});
      }),
      post: vi.fn(() => of({ ...mockProducto, stock: 24 })),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: { tiene: () => true } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => "1" } } } },
      ],
    });
  });

  function createComponent() {
    const f = TestBed.runInInjectionContext(() => new ProductoFicha());
    f.ngOnInit();
    return f;
  }

  it("carga la ficha y sus movimientos iniciales", () => {
    const f = createComponent();
    expect(f.p()?.nombre).toBe("Polo de algodon negro - Talla M");
    expect(f.movimientos()?.content.length).toBe(1);
    expect(f.movimientos()?.content[0].tipo).toBe("SALDO_INICIAL");
  });

  it("calcula diferencia en conteo físico y envía ajuste con stockEsperado", () => {
    const f = createComponent();
    f.abrirModal("CONTEO");

    expect(f.stockEsperado).toBe(25);
    expect(f.modalTipo()).toBe("CONTEO");

    // Conteo de 23 unidades (diferencia de -2)
    f.ajusteForm.controls.cantidad.setValue(23);
    f.ajusteForm.controls.motivo.setValue("Conteo físico verificado");
    expect(f.calcularDiferencia()).toBe(-2);

    f.confirmarAjuste();
    expect(api.post).toHaveBeenCalledWith("/productos/1/ajustes", {
      tipo: "CONTEO",
      cantidad: 23,
      stockEsperado: 25,
      motivo: "Conteo físico verificado",
    });
    expect(f.p()?.stock).toBe(24);
  });

  it("detecta conflicto de concurrencia cuando el stock cambió durante el conteo", () => {
    const f = createComponent();
    f.abrirModal("CONTEO");
    f.ajusteForm.controls.cantidad.setValue(20);
    f.ajusteForm.controls.motivo.setValue("Conteo físico");

    api.post.mockReturnValue(throwError(() => ({
      status: 409,
      error: { detail: "El stock cambió. Actualice la ficha y revise el ajuste antes de confirmar." },
    })));

    f.confirmarAjuste();
    expect(f.error()).toContain("El stock cambió");
    expect(f.busy()).toBe(false);
  });
});
