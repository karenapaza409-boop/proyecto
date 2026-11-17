import { TestBed } from "@angular/core/testing";
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AuthService } from "../services/auth-service";
import { authInterceptor } from "./auth-interceptor";

describe("Interceptor de autenticación", () => {
  const url = "http://localhost:8080/api/v1/productos";
  const auth = {
    token: vi.fn(() => "token-local"),
    vigente: vi.fn(async () => true),
    refresh: vi.fn(async () => true),
    limpiar: vi.fn(),
  };
  const router = { url: "/productos", navigate: vi.fn(async () => true) };
  let http: HttpClient;
  let controller: HttpTestingController;
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });
  afterEach(() => controller.verify());

  it("renueva una sola vez ante 401 y reintenta con Bearer", async () => {
    const result = firstValueFrom(http.get(url));
    await tick();
    controller
      .expectOne(url)
      .flush({}, { status: 401, statusText: "Unauthorized" });
    await tick();
    const retry = controller.expectOne(url);
    expect(retry.request.headers.get("Authorization")).toBe(
      "Bearer token-local",
    );
    expect(retry.request.headers.has("X-Trace-ID")).toBe(true);
    retry.flush({ content: [] });
    await result;
    expect(auth.refresh).toHaveBeenCalledTimes(1);
    expect(auth.limpiar).not.toHaveBeenCalled();
  });

  it("un 403 no renueva ni cierra la sesión", async () => {
    const result = firstValueFrom(http.get(url)).catch((error) => error);
    await tick();
    controller
      .expectOne(url)
      .flush({}, { status: 403, statusText: "Forbidden" });
    expect((await result).status).toBe(403);
    expect(auth.refresh).not.toHaveBeenCalled();
    expect(auth.limpiar).not.toHaveBeenCalled();
  });

  it("otro 401 tras renovar cierra sesión sin bucle", async () => {
    const result = firstValueFrom(http.get(url)).catch((error) => error);
    await tick();
    controller
      .expectOne(url)
      .flush({}, { status: 401, statusText: "Unauthorized" });
    await tick();
    controller
      .expectOne(url)
      .flush({}, { status: 401, statusText: "Unauthorized" });
    expect((await result).status).toBe(401);
    expect(auth.refresh).toHaveBeenCalledTimes(1);
    expect(auth.limpiar).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalled();
  });
});
