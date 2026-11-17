import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { AuditoriaList } from "./auditoria-list";
import { ApiService } from "../../core/services/api-service";
import { Auditoria } from "../../core/models/models";

describe("AuditoriaList Component", () => {
  const getMock = vi.fn();
  const apiMock = { get: getMock };

  const dummyEventos: Auditoria[] = [
    {
      id: 1,
      actor: "Admin",
      accion: "CAMBIO_PRECIO",
      entidad: "PRODUCTO",
      entidadId: 1,
      fecha: "2026-11-08T10:30:00",
      detalle: "precio: 4.50 -> 4.80; motivo=Actualización del precio de venta.",
    },
    {
      id: 2,
      actor: "Admin",
      accion: "ANULAR",
      entidad: "VENTA",
      entidadId: 8,
      fecha: "2026-11-08T10:15:00",
      detalle: "estado=REGISTRADA -> ANULADA; total=18.50",
    },
    {
      id: 3,
      actor: "Admin",
      accion: "ASIGNAR_ROL",
      entidad: "USUARIO",
      entidadId: 2,
      fecha: "2026-11-08T09:40:00",
      detalle: "roles: cajero02 asignado rol CAJERO",
    },
    {
      id: 4,
      actor: "Admin",
      accion: "DESACTIVAR",
      entidad: "PROVEEDOR",
      entidadId: 3,
      fecha: "2026-11-08T09:10:00",
      detalle: "activo=true -> false",
    },
  ];

  beforeEach(() => {
    getMock.mockClear();
    getMock.mockReturnValue(
      of({
        content: dummyEventos,
        totalElements: 4,
        totalPages: 1,
        number: 0,
        size: 20,
      })
    );

    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiMock }],
    });
  });

  it("inicia en pantalla de historial y carga los eventos de auditoría", () => {
    const comp = TestBed.runInInjectionContext(() => new AuditoriaList());
    comp.ngOnInit();

    expect(comp.vista()).toBe("historial");
    expect(getMock).toHaveBeenCalledWith("/auditoria", expect.objectContaining({ page: 0 }));
    expect(comp.page()?.content.length).toBe(4);
    expect(comp.rangoEventos()).toBe("1–4 de 4 eventos");
  });

  it("permite aplicar filtros de fecha, usuario, módulo y acción", () => {
    const comp = TestBed.runInInjectionContext(() => new AuditoriaList());
    comp.ngOnInit();

    comp.filtroDesde = "2026-11-08";
    comp.filtroHasta = "2026-11-08";
    comp.filtroUsuario = "Admin";
    comp.filtroModulo = "PRODUCTO";
    comp.filtroAccion = "CAMBIO_PRECIO";

    comp.aplicarFiltros();

    expect(getMock).toHaveBeenCalledWith(
      "/auditoria",
      expect.objectContaining({
        desde: "2026-11-08",
        hasta: "2026-11-08",
        usuario: "Admin",
        modulo: "PRODUCTO",
        accion: "CAMBIO_PRECIO",
      })
    );
  });

  it("permite limpiar los filtros y restablecer la consulta", () => {
    const comp = TestBed.runInInjectionContext(() => new AuditoriaList());
    comp.ngOnInit();

    comp.filtroDesde = "2026-11-08";
    comp.filtroModulo = "PRODUCTO";

    comp.limpiarFiltros();

    expect(comp.filtroDesde).toBe("");
    expect(comp.filtroModulo).toBe("Todos");
    expect(getMock).toHaveBeenCalledWith("/auditoria", expect.objectContaining({ page: 0 }));
  });

  it("abre la pantalla de detalle de evento y permite volver al historial", () => {
    const comp = TestBed.runInInjectionContext(() => new AuditoriaList());
    comp.ngOnInit();

    comp.verDetalle(dummyEventos[0]);
    expect(comp.vista()).toBe("detalle");
    expect(comp.eventoSeleccionado()?.id).toBe(1);
    expect(comp.formatearCodigoEvento(1)).toBe("AUD-001");
    expect(comp.cambiosRegistrados().length).toBeGreaterThan(0);
    expect(comp.motivoEvento()).toContain("Actualización del precio de venta");

    comp.volverAlHistorial();
    expect(comp.vista()).toBe("historial");
  });
});
