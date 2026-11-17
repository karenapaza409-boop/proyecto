import { TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { of, Subject } from "rxjs";
import { OperacionForm } from "./operacion-form";
import { ApiService } from "../core/services/api-service";
describe("Formulario de venta", () => {
  const post = vi.fn(() => of({ id: 1 }));
  const api = { get: () => of([]), post };
  beforeEach(() => {
    post.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: ApiService, useValue: api },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { tipo: "ventas" } } },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
  });
  it("envía producto/cantidad sin aceptar precio, total ni vendedor del cliente", () => {
    const form = TestBed.runInInjectionContext(() => new OperacionForm());
    form.ngOnInit();
    form.agregar({
      id: 1,
      codigo: "A",
      nombre: "Polo",
      categoria: { id: 1, nombre: "Casacas" },
      precio: 2.5,
      stock: 10,
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    form.guardar();
    expect(post).toHaveBeenCalledWith("/ventas", {
      clienteId: null,
      detalles: [{ productoId: 1, cantidad: 1 }],
    });
    vi.restoreAllMocks();
  });
  it("impide guardar sin líneas y evita productos duplicados", () => {
    const f = TestBed.runInInjectionContext(() => new OperacionForm());
    f.guardar();
    expect(post).not.toHaveBeenCalled();
    const p = {
      id: 1,
      codigo: "A",
      nombre: "Polo",
      categoria: { id: 1, nombre: "Casacas" },
      precio: 2.5,
      stock: 10,
    };
    f.agregar(p);
    f.agregar(p);
    expect(f.detalles.length).toBe(1);
    expect(f.error()).toContain("ya está agregado");
  });
  it("envía varias líneas, recalcula al quitar y evita doble envío", () => {
    const f = TestBed.runInInjectionContext(() => new OperacionForm());
    f.ngOnInit();
    const p = { id: 1, codigo: "A", nombre: "Polo", categoria: { id: 1, nombre: "Casacas" }, precio: 2.5, stock: 10 };
    f.agregar(p); f.agregar({ ...p, id: 2, nombre: "Jean", precio: 4 });
    f.detalles.at(0).get("cantidad")!.setValue(2);
    expect(f.total()).toBe(9);
    f.quitar(1); expect(f.total()).toBe(5);
    f.agregar({ ...p, id: 2, nombre: "Jean", precio: 4 });
    post.mockReturnValueOnce(new Subject() as any);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    f.guardar(); f.guardar();
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith("/ventas", { clienteId: null, detalles: [{ productoId: 1, cantidad: 2 }, { productoId: 2, cantidad: 1 }] });
    vi.restoreAllMocks();
  });
});
