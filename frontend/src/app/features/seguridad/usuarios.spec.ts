import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { Usuarios } from "./usuarios";
import { ApiService } from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";

describe("Usuarios Component", () => {
  const getMock = vi.fn();
  const postMock = vi.fn();
  const putMock = vi.fn();
  const apiMock = { get: getMock, post: postMock, put: putMock };

  const authMock = {
    tiene: vi.fn((role: string) => role === "ADMIN"),
    nombre: vi.fn(() => "Admin User"),
  };

  const dummyUsuarios = [
    {
      id: "u1",
      username: "ana.torres",
      enabled: true,
      roles: ["VENDEDOR"],
      firstName: "Ana",
      lastName: "Torres",
      email: "ana@example.com",
    },
    {
      id: "u2",
      username: "luis.ramos",
      enabled: true,
      roles: ["COMPRADOR"],
      firstName: "Luis",
      lastName: "Ramos",
      email: "luis@example.com",
    },
    {
      id: "u3",
      username: "carlos.perez",
      enabled: true,
      roles: ["VENDEDOR", "COMPRADOR"],
      firstName: "Carlos",
      lastName: "Pérez",
      email: "carlos@example.com",
    },
    {
      id: "u4",
      username: "maria.flores",
      enabled: false,
      roles: ["VENDEDOR"],
      firstName: "María",
      lastName: "Flores",
      email: "maria@example.com",
    },
  ];

  beforeEach(() => {
    getMock.mockClear();
    postMock.mockClear();
    putMock.mockClear();

    getMock.mockReturnValue(of(dummyUsuarios));
    postMock.mockReturnValue(of({}));
    putMock.mockReturnValue(of({}));

    TestBed.configureTestingModule({
      providers: [
        { provide: ApiService, useValue: apiMock },
        { provide: AuthService, useValue: authMock },
      ],
    });
  });

  it("inicia en vista de lista y carga el listado de usuarios", () => {
    const comp = TestBed.runInInjectionContext(() => new Usuarios());
    comp.ngOnInit();

    expect(comp.vista()).toBe("lista");
    expect(getMock).toHaveBeenCalledWith("/usuarios", expect.objectContaining({ first: 0, max: 20 }));
    expect(comp.usuarios().length).toBe(4);
    expect(comp.usuariosFiltrados().length).toBe(4);
  });

  it("cambia entre vista de lista y formulario de creación", () => {
    const comp = TestBed.runInInjectionContext(() => new Usuarios());
    comp.ngOnInit();

    comp.abrirFormularioCrear();
    expect(comp.vista()).toBe("formulario");
    expect(comp.usuarioEditando).toBeNull();

    comp.volverALista();
    expect(comp.vista()).toBe("lista");
  });

  it("filtra usuarios por estado activo e inactivo", () => {
    const comp = TestBed.runInInjectionContext(() => new Usuarios());
    comp.ngOnInit();

    comp.filtroEstado = "true";
    expect(comp.usuariosFiltrados().length).toBe(3);

    comp.filtroEstado = "false";
    expect(comp.usuariosFiltrados().length).toBe(1);
    expect(comp.usuariosFiltrados()[0].username).toBe("maria.flores");
  });

  it("formatea roles a Cajero, Almacenero y Administrador excluyendo supervisor", () => {
    const comp = TestBed.runInInjectionContext(() => new Usuarios());
    expect(comp.formatearRol("VENDEDOR")).toBe("Cajero");
    expect(comp.formatearRol("COMPRADOR")).toBe("Almacenero");
    expect(comp.formatearRol("ADMIN")).toBe("Administrador");
  });

  it("permite seleccionar un usuario para edición abriendo la vista de formulario", () => {
    const comp = TestBed.runInInjectionContext(() => new Usuarios());
    comp.seleccionarEditar({
      id: "u5",
      username: "test.user",
      enabled: true,
      roles: ["VENDEDOR", "SUPERVISOR"],
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
    });

    expect(comp.vista()).toBe("formulario");
    expect(comp.usuarioEditando?.username).toBe("test.user");
    expect(comp.rolesSeleccionados).toEqual(["VENDEDOR"]);
  });

  it("crea un nuevo usuario con roles y retorna a la lista al guardar", () => {
    const comp = TestBed.runInInjectionContext(() => new Usuarios());
    comp.abrirFormularioCrear();
    comp.nombres = "Carlos";
    comp.apellidos = "Pérez";
    comp.username = "carlos.perez";
    comp.email = "carlos@example.com";
    comp.password = "ContraseñaSegura123!";
    comp.rolesSeleccionados = ["VENDEDOR", "COMPRADOR"];
    comp.enabled = true;
    comp.solicitarCambio = true;

    comp.guardar();

    expect(postMock).toHaveBeenCalledWith("/usuarios", {
      username: "carlos.perez",
      password: "ContraseñaSegura123!",
      enabled: true,
      roles: ["VENDEDOR", "COMPRADOR"],
      firstName: "Carlos",
      lastName: "Pérez",
      email: "carlos@example.com",
      temporaryPassword: true,
    });
    expect(comp.vista()).toBe("lista");
  });

  it("permite alternar el estado activo/inactivo con confirmación", () => {
    const comp = TestBed.runInInjectionContext(() => new Usuarios());
    vi.spyOn(window, "confirm").mockReturnValue(true);

    comp.toggleEstado(dummyUsuarios[0]);

    expect(putMock).toHaveBeenCalledWith(
      "/usuarios/u1",
      expect.objectContaining({ enabled: false })
    );
    vi.restoreAllMocks();
  });
});
