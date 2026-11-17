import { TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { CategoriasComponent } from "./categorias";
import { ApiService } from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";

describe("CategoriasComponent", () => {
  const getMock = vi.fn();
  const postMock = vi.fn();
  const putMock = vi.fn();
  const deleteMock = vi.fn();
  const apiMock = { get: getMock, post: postMock, put: putMock, delete: deleteMock };

  const authMock = {
    tiene: vi.fn((role: string) => role === "ADMIN"),
  };

  const dummyCategorias = [
    { id: 1, nombre: "Polos", descripcion: "Polos de algodon y camisetas", activo: true, cantidadProductos: 8 },
    { id: 2, nombre: "Casacas", descripcion: "Casacas y prendas de abrigo", activo: true, cantidadProductos: 12 },
    { id: 3, nombre: "Pantalones", descripcion: null, activo: true, cantidadProductos: 18 },
    { id: 4, nombre: "Abrigos", descripcion: null, activo: true, cantidadProductos: 6 },
  ];

  beforeEach(() => {
    getMock.mockClear();
    postMock.mockClear();
    putMock.mockClear();
    deleteMock.mockClear();

    getMock.mockReturnValue(
      of({
        content: dummyCategorias,
        totalElements: 4,
        totalPages: 1,
        number: 0,
        size: 20,
      })
    );
    postMock.mockReturnValue(of({ id: 5, nombre: "Accesorios", activo: true }));
    putMock.mockReturnValue(of({ id: 1, nombre: "Polos", activo: false }));
    deleteMock.mockReturnValue(of(void 0));

    TestBed.configureTestingModule({
      providers: [
        { provide: ApiService, useValue: apiMock },
        { provide: AuthService, useValue: authMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              url: [{ path: "categorias" }],
              paramMap: new Map(),
            },
          },
        },
      ],
    });
  });

  it("inicia en vista de lista y carga las categorías", () => {
    const comp = TestBed.runInInjectionContext(() => new CategoriasComponent());
    comp.ngOnInit();

    expect(comp.vista()).toBe("lista");
    expect(getMock).toHaveBeenCalledWith("/categorias/buscar", expect.objectContaining({ page: 0 }));
    expect(comp.result()?.content.length).toBe(4);
  });

  it("permite navegar entre la vista de lista y el formulario de creación", () => {
    const comp = TestBed.runInInjectionContext(() => new CategoriasComponent());
    comp.ngOnInit();

    comp.abrirFormularioCrear();
    expect(comp.vista()).toBe("formulario");
    expect(comp.categoriaEditando).toBeNull();

    comp.volverALista();
    expect(comp.vista()).toBe("lista");
  });

  it("permite seleccionar una categoría para editarla en la vista de formulario", () => {
    const comp = TestBed.runInInjectionContext(() => new CategoriasComponent());
    comp.ngOnInit();

    comp.seleccionarEditar(dummyCategorias[0]);
    expect(comp.vista()).toBe("formulario");
    expect(comp.categoriaEditando?.nombre).toBe("Polos");
    expect(comp.nombre).toBe("Polos");
  });

  it("guarda una nueva categoría y regresa a la vista de lista", () => {
    const comp = TestBed.runInInjectionContext(() => new CategoriasComponent());
    comp.abrirFormularioCrear();
    comp.nombre = "Accesorios";
    comp.descripcion = "Gorras y cinturones";
    comp.activo = true;

    comp.guardar();

    expect(postMock).toHaveBeenCalledWith("/categorias", {
      nombre: "Accesorios",
      descripcion: "Gorras y cinturones",
      activo: true,
    });
    expect(comp.vista()).toBe("lista");
  });

  it("permite eliminar una categoría con confirmación", () => {
    const comp = TestBed.runInInjectionContext(() => new CategoriasComponent());
    vi.spyOn(window, "confirm").mockReturnValue(true);

    comp.eliminar(dummyCategorias[0]);

    expect(deleteMock).toHaveBeenCalledWith("/categorias/1");
    vi.restoreAllMocks();
  });
});
