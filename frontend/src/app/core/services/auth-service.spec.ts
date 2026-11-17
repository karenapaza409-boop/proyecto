import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { AuthService } from "./auth-service";
function token(exp: number) {
  return (
    "x." +
    btoa(
      JSON.stringify({
        sub: "user",
        exp,
        realm_access: { roles: ["VENDEDOR"] },
      }),
    ) +
    ".x"
  );
}
describe("Sesión Keycloak", () => {
  let auth: AuthService, http: HttpTestingController;
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem(
      "cantomoda.session",
      JSON.stringify({ access_token: token(1), refresh_token: "refresh" }),
    );
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });
  it("comparte una sola renovación entre peticiones concurrentes", async () => {
    const a = auth.refresh(),
      b = auth.refresh();
    expect(a).toBe(b);
    const r = http.expectOne((x) => x.url.endsWith("/token"));
    expect(r.request.body).toContain("grant_type=refresh_token");
    r.flush({
      access_token: token(Date.now() / 1000 + 300),
      refresh_token: "nuevo",
    });
    expect(await a).toBe(true);
    expect(await b).toBe(true);
    expect(auth.tiene("VENDEDOR")).toBe(true);
  });
  it("limpia la sesión cuando el proveedor rechaza la renovación", async () => {
    const p = auth.refresh();
    http
      .expectOne((x) => x.url.endsWith("/token"))
      .flush({}, { status: 400, statusText: "Bad Request" });
    expect(await p).toBe(false);
    expect(auth.token()).toBeNull();
    expect(sessionStorage.getItem("cantomoda.session")).toBeNull();
  });
});
