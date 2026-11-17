import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthService } from "../services/auth-service";
@Component({
  imports: [RouterLink],
  template: `<div class="page-heading">
      <div>
        <span class="eyebrow">CANTO MODA · GESTIÓN DE TIENDA</span>
        <h1>Bienvenido, {{ auth.nombre() }}</h1>
        <p>Cada prenda cuenta. Organiza tu tienda y acompaña cada venta.</p>
      </div>
    </div>
    <section class="fashion-hero"><div class="fashion-hero-copy"><span class="fashion-kicker">ROPA CON IDENTIDAD</span><h2>Estilo que se vive<br />en Canto.</h2><p>Polos, jeans y casacas. Tu colección, lista para encontrar su próximo look.</p><a class="fashion-cta" routerLink="/productos">Explorar prendas <span aria-hidden="true">↗</span></a></div><div class="fashion-art" aria-hidden="true"><span class="fashion-art-label">CANTO<br />MODA</span><svg viewBox="0 0 260 240" fill="none"><path d="M99 40 63 54 30 99 65 123 83 100v104h99V100l18 23 35-24-33-45-36-14c-6 25-60 25-67 0Z" fill="#FDE8EC" stroke="#FFFFFF" stroke-width="3"/><path d="M99 40c8 27 59 27 67 0M84 100V71m98 29V71" stroke="#B91C32" stroke-width="3"/><text x="132" y="139" text-anchor="middle" fill="#B91C32" font-size="21" font-family="Georgia" letter-spacing="5">CANTO</text><text x="132" y="158" text-anchor="middle" fill="#B91C32" font-size="9" letter-spacing="4">MODA LOCAL</text></svg><span class="fashion-art-caption">BÁSICOS CON CARÁCTER</span></div></section><div class="cards">
      <a class="panel feature-card" routerLink="/productos"
        ><span>01 · CATÁLOGO</span>
        <h2>Tu colección</h2>
        <p>Consulta prendas, tallas, precios y existencias disponibles.</p></a
      >
      @if (auth.tiene("ADMIN", "SUPERVISOR", "VENDEDOR")) {
        <a class="panel feature-card" routerLink="/ventas"
          ><span>02 · VENTAS</span>
          <h2>Atiende una venta</h2>
          <p>Arma el próximo look de tus clientes y registra cada venta.</p></a
        >
      }
      @if (auth.tiene("ADMIN", "SUPERVISOR", "COMPRADOR")) {
        <a class="panel feature-card" routerLink="/compras"
          ><span>03 · COMPRAS</span>
          <h2>Renueva tu colección</h2>
          <p>
            Recibe nuevas prendas y mantén tu colección al día.
          </p></a
        >
      }
    </div>`,
})
export class Inicio {
  auth = inject(AuthService);
}
