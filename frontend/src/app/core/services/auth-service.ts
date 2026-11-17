import { inject, Injectable, computed, signal } from "@angular/core";
import { HttpBackend, HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { environment } from "../../../environments/environment";
interface Tokens {
  access_token: string;
  refresh_token: string;
  id_token?: string;
}
interface Claims {
  sub: string;
  exp: number;
  name?: string;
  preferred_username?: string;
  nonce?: string;
  realm_access?: { roles: string[] };
}
export function claims(token: string): Claims {
  const raw = token.split(".")[1];
  if (!raw) throw new Error("Token inválido");
  return JSON.parse(
    new TextDecoder().decode(
      Uint8Array.from(atob(raw.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
        c.charCodeAt(0),
      ),
    ),
  ) as Claims;
}
@Injectable({ providedIn: "root" })
export class AuthService {
  private http = new HttpClient(inject(HttpBackend));
  private key = "cantomoda.session";
  private pending: Promise<boolean> | null = null;
  private session = signal<Tokens | null>(this.restore());
  readonly usuario = computed(() => {
    try {
      return this.session() ? claims(this.session()!.access_token) : null;
    } catch {
      return null;
    }
  });
  readonly nombre = computed(
    () =>
      this.usuario()?.name || this.usuario()?.preferred_username || "Usuario",
  );
  readonly roles = computed(() => this.usuario()?.realm_access?.roles || []);
  token() {
    return this.session()?.access_token || null;
  }
  tiene(...roles: string[]) {
    return roles.some((r) => this.roles().includes(r));
  }
  private restore(): Tokens | null {
    try {
      const s = JSON.parse(sessionStorage.getItem(this.key) || "null");
      return s?.access_token && s?.refresh_token ? s : null;
    } catch {
      return null;
    }
  }
  private save(t: Tokens) {
    this.session.set(t);
    sessionStorage.setItem(this.key, JSON.stringify(t));
  }
  limpiar() {
    this.session.set(null);
    sessionStorage.removeItem(this.key);
  }
  private random() {
    return btoa(
      String.fromCharCode(...crypto.getRandomValues(new Uint8Array(48))),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }
  async login(returnUrl = "/") {
    const verifier = this.random(),
      state = this.random(),
      nonce = this.random();
    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(verifier),
    );
    const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    sessionStorage.setItem(
      "cantomoda.pkce",
      JSON.stringify({
        verifier,
        state,
        nonce,
        returnUrl:
          returnUrl.startsWith("/") && !returnUrl.startsWith("//")
            ? returnUrl
            : "/",
      }),
    );
    const q = new URLSearchParams({
      client_id: environment.clientId,
      redirect_uri: location.origin + "/auth/callback",
      response_type: "code",
      scope: "openid profile email",
      state,
      nonce,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    location.assign(environment.issuer + "/protocol/openid-connect/auth?" + q);
  }
  async callback(params: URLSearchParams) {
    const stored = sessionStorage.getItem("cantomoda.pkce");
    sessionStorage.removeItem("cantomoda.pkce");
    if (!stored)
      throw new Error("No existe una solicitud de inicio de sesión.");
    const pkce = JSON.parse(stored);
    if (
      params.get("error") ||
      params.get("state") !== pkce.state ||
      !params.get("code")
    )
      throw new Error(
        "El inicio de sesión fue rechazado o su estado no coincide.",
      );
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: environment.clientId,
      redirect_uri: location.origin + "/auth/callback",
      code: params.get("code")!,
      code_verifier: pkce.verifier,
    });
    const tokens = await firstValueFrom(
      this.http.post<Tokens>(
        environment.issuer + "/protocol/openid-connect/token",
        body.toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
      ),
    );
    if (!tokens.id_token || claims(tokens.id_token).nonce !== pkce.nonce)
      throw new Error(
        "La respuesta de identidad no corresponde a la solicitud.",
      );
    this.save(tokens);
    return pkce.returnUrl as string;
  }
  async vigente() {
    try {
      if (this.token() && claims(this.token()!).exp > Date.now() / 1000 + 20)
        return true;
    } catch {
      this.limpiar();
    }
    return this.refresh();
  }
  refresh(): Promise<boolean> {
    if (this.pending) return this.pending;
    const s = this.session();
    if (!s) return Promise.resolve(false);
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: environment.clientId,
      refresh_token: s.refresh_token,
    });
    this.pending = firstValueFrom(
      this.http.post<Tokens>(
        environment.issuer + "/protocol/openid-connect/token",
        body.toString(),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
      ),
    )
      .then((t) => {
        this.save({ ...t, id_token: t.id_token || s.id_token });
        return true;
      })
      .catch(() => {
        this.limpiar();
        return false;
      })
      .finally(() => {
        this.pending = null;
      });
    return this.pending;
  }
  logout() {
    const id = this.session()?.id_token;
    this.limpiar();
    const q = new URLSearchParams({
      client_id: environment.clientId,
      post_logout_redirect_uri: location.origin + "/login",
    });
    if (id) q.set("id_token_hint", id);
    location.assign(
      environment.issuer + "/protocol/openid-connect/logout?" + q,
    );
  }
}
