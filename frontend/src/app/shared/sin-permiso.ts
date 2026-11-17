import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
@Component({
  imports: [RouterLink],
  template:
    '<section class="panel"><h1>Acceso restringido</h1><p>Tu usuario no tiene permiso para esta pantalla.</p><a routerLink="/">Volver al inicio</a></section>',
})
export class SinPermiso {}
