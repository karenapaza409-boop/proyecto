import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { VentaHistorial } from "./venta-historial";
import { ApiService } from "../../core/services/api-service";
import { AuthService } from "../../core/services/auth-service";

describe("VentaHistorial Component", () => {
  const getMock = vi.fn();
  const getBlobMock = vi.fn();
  const patchMock = vi.fn();
  const apiMock = { get: getMock, getBlob: getBlobMock, patch: patchMock };

  const authMock = {
    tiene: vi.fn((role: string) => role === "ADMIN"),
    nombre: vi.fn(() => "Admin User"),
  };

  const dummyVentas = [
    {
      id: 3,
      fecha: "2026-11-08T14:30:00",
      cliente: "Ana Torres",
      actor: "Admin",
      cajero: "Admin",
      estado: "REGISTRADA",
      total: 13.5,
      detalles: [],
    },
    {
      id: 2,
      fecha: "2026-11-08T12:00:00",
      cliente: "Consumidor final",
      actor: "Admin",
      cajero: "Admin",
      estado: "REGISTRADA",
      total: 22.0,
      detalles: [],
    },
    {
      id: 1,
      fecha: "2026-11-08T10:15:00",
      cliente: "Luis Ramos",
      actor: "Admin",
      cajero: "Admin",
      estado: "ANULADA",
      total: 18.5,
      detalles: [],
    },
  ];

  beforeEach(() => {
    getMock.mockClear();
    patchMock.mockClear();
    getMock.mockReturnValue(
      of({
        content: dummyVentas,
        totalElements: 3,
        totalPages: 1,
        number: 0,
        size: 10,
      })
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: ApiService, useValue: apiMock },
        { provide: AuthService, useValue: authMock },
      ],
    });
  });

  it("carga la lista de ventas al iniciar", () => {
    const comp = TestBed.runInInjectionContext(() => new VentaHistorial());
    comp.ngOnInit();

    expect(getMock).toHaveBeenCalled();
    expect(comp.ventas().length).toBe(3);
    expect(comp.totalElementos()).toBe(3);
    expect(comp.rangoPaginacion()).toBe("1-3 de 3 ventas");
  });

  it("permite filtrar por texto, rango de fechas y estado", () => {
    const comp = TestBed.runInInjectionContext(() => new VentaHistorial());
    comp.ngOnInit();

    comp.filtroTexto = "Ana";
    comp.filtroDesde = "2026-11-08";
    comp.filtroHasta = "2026-11-08";
    comp.filtroEstado = "REGISTRADA";
    comp.buscar();

    expect(getMock).toHaveBeenCalledWith("/ventas", expect.objectContaining({
      q: "Ana",
      desde: "2026-11-08",
      hasta: "2026-11-08",
      estado: "REGISTRADA",
    }));
  });

  it("abre y cierra el modal de detalle", () => {
    const comp = TestBed.runInInjectionContext(() => new VentaHistorial());
    comp.abrirDetalle(dummyVentas[0] as any);
    expect(comp.ventaSeleccionada()).toBeTruthy();
    expect(comp.ventaSeleccionada()?.id).toBe(3);

    comp.cerrarDetalle();
    expect(comp.ventaSeleccionada()).toBeNull();
  });

  it("permite al administrador anular una venta previa confirmación y motivo", () => {
    const comp = TestBed.runInInjectionContext(() => new VentaHistorial());
    comp.ngOnInit();

    vi.spyOn(window, "prompt").mockReturnValue("Devolución por error de cobro");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    patchMock.mockReturnValue(of({ ...dummyVentas[0], estado: "ANULADA" }));

    comp.anularVenta(3);

    expect(patchMock).toHaveBeenCalledWith("/ventas/3/anular");
    vi.restoreAllMocks();
  });

  it("informa si no hay ventas para exportar sin alterar el listado", () => {
    getMock.mockReturnValue(of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 }));
    const comp = TestBed.runInInjectionContext(() => new VentaHistorial());
    comp.ngOnInit();

    expect(comp.ventas().length).toBe(0);
    comp.exportarExcel();

    expect(comp.error()).toBe("No hay ventas para exportar");
    expect(getBlobMock).not.toHaveBeenCalled();
    expect(comp.exportando()).toBe(false);
  });

  it("exporta a Excel usando exactamente los filtros aplicados", () => {
    const comp = TestBed.runInInjectionContext(() => new VentaHistorial());
    comp.ngOnInit();

    comp.filtroTexto = "Ana";
    comp.filtroDesde = "2026-11-01";
    comp.filtroHasta = "2026-11-08";
    comp.filtroEstado = "REGISTRADA";
    comp.buscar();

    const mockBlob = new Blob(["mock-excel-data"], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const mockHeaders = {
      get: (h: string) => h.toLowerCase() === "content-disposition" ? 'attachment; filename="ventas_2026-11-01_al_2026-11-08.xlsx"' : null,
    };
    getBlobMock.mockReturnValue(of({ body: mockBlob, headers: mockHeaders }));

    // Mock URL.createObjectURL and click
    const createObjectURLSpy = vi.spyOn(window.URL, "createObjectURL").mockReturnValue("blob:mock-url");
    const revokeObjectURLSpy = vi.spyOn(window.URL, "revokeObjectURL").mockImplementation(() => {});

    comp.exportarExcel();

    expect(getBlobMock).toHaveBeenCalledWith("/ventas/exportar/excel", {
      q: "Ana",
      desde: "2026-11-01",
      hasta: "2026-11-08",
      estado: "REGISTRADA",
    });
    expect(comp.exportando()).toBe(false);
    expect(comp.aviso()).toContain("Reporte Excel descargado correctamente");
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();
  });

  it("si falla la descarga muestra un mensaje de error sin alterar el listado", () => {
    const comp = TestBed.runInInjectionContext(() => new VentaHistorial());
    comp.ngOnInit();

    const ventasAntes = comp.ventas();
    getBlobMock.mockReturnValue(throwError(() => ({ status: 403, error: { detail: "Acceso no autorizado" } })));

    comp.exportarExcel();

    expect(comp.exportando()).toBe(false);
    expect(comp.error()).toBeTruthy();
    expect(comp.ventas()).toBe(ventasAntes);
    expect(comp.ventas().length).toBe(3);
  });
});
