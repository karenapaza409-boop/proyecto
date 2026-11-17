import { Component, inject, signal, OnInit } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth-service";
@Component({
  imports: [RouterLink],
  template: `<main class="login">
    <section class="panel">
      <h1>Completando acceso</h1>
      @if (error()) {
        <p role="alert" class="error">{{ error() }}</p>
        <a routerLink="/login">Volver a iniciar sesión</a>
      } @else {
        <p>Verificando tu sesión…</p>
      }
    </section>
  </main>`,
})
export class Callback implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  error = signal("");
  async ngOnInit() {
    try {
      const url = await this.auth.callback(
        new URLSearchParams(location.search),
      );
      await this.router.navigateByUrl(url, { replaceUrl: true });
    } catch (e) {
      this.error.set(
        e instanceof Error ? e.message : "No se pudo iniciar sesión.",
      );
    }
  }
}
