import { Routes } from "@angular/router";
import { authGuard, roleGuard } from "./core/guards/auth.guard";
export const routes: Routes = [
  {
    path: "login",
    loadComponent: () => import("./features/auth/login").then((m) => m.Login),
  },
  {
    path: "auth/callback",
    loadComponent: () =>
      import("./features/auth/callback").then((m) => m.Callback),
  },
  {
    path: "",
    canActivate: [authGuard],
    loadComponent: () => import("./core/layout/layout").then((m) => m.Layout),
    children: [
      {
        path: "usuarios",
        canActivate: [roleGuard],
        data: { roles: ["ADMIN"] },
        loadComponent: () => import("./features/seguridad/usuarios").then(m => m.Usuarios),
      },
      {
        path: "",
        loadComponent: () =>
          import("./core/inicio/inicio").then((m) => m.Inicio),
      },
      {
        path: "sin-permiso",
        loadComponent: () =>
          import("./shared/sin-permiso").then((m) => m.SinPermiso),
      },
      {
        path: "categorias",
        data: { endpoint: "categorias", title: "Categorías" },
        loadComponent: () =>
          import("./features/catalogo/categorias").then((m) => m.CategoriasComponent),
      },
      {
        path: "categorias/nuevo",
        canActivate: [roleGuard],
        data: { endpoint: "categorias", title: "Categorías", roles: ["ADMIN"] },
        loadComponent: () =>
          import("./features/catalogo/categorias").then((m) => m.CategoriasComponent),
      },
      {
        path: "categorias/:id/editar",
        canActivate: [roleGuard],
        data: { endpoint: "categorias", title: "Categorías", roles: ["ADMIN"] },
        loadComponent: () =>
          import("./features/catalogo/categorias").then((m) => m.CategoriasComponent),
      },
      {
        path: "clientes",
        data: { endpoint: "clientes", title: "Clientes" },
        loadComponent: () =>
          import("./features/clientes/cliente-list").then((m) => m.ClienteList),
      },
      {
        path: "clientes/nuevo",
        canActivate: [roleGuard],
        data: { endpoint: "clientes", title: "Clientes", roles: ["ADMIN"] },
        loadComponent: () =>
          import("./features/clientes/cliente-form").then((m) => m.ClienteForm),
      },
      {
        path: "clientes/:id/editar",
        canActivate: [roleGuard],
        data: { endpoint: "clientes", title: "Clientes", roles: ["ADMIN"] },
        loadComponent: () =>
          import("./features/clientes/cliente-form").then((m) => m.ClienteForm),
      },
      {
        path: "proveedores",
        data: { endpoint: "proveedores", title: "Proveedores" },
        loadComponent: () =>
          import("./features/proveedores/proveedor-list").then((m) => m.ProveedorList),
      },
      {
        path: "proveedores/nuevo",
        canActivate: [roleGuard],
        data: {
          endpoint: "proveedores",
          title: "Proveedores",
          roles: ["ADMIN"],
        },
        loadComponent: () =>
          import("./features/proveedores/proveedor-form").then((m) => m.ProveedorForm),
      },
      {
        path: "proveedores/:id/editar",
        canActivate: [roleGuard],
        data: {
          endpoint: "proveedores",
          title: "Proveedores",
          roles: ["ADMIN"],
        },
        loadComponent: () =>
          import("./features/proveedores/proveedor-form").then((m) => m.ProveedorForm),
      },
      {
        path: "proveedores/:id",
        loadComponent: () => import("./features/proveedores/proveedor-ficha").then(m => m.ProveedorFicha),
      },
      {
        path: "productos",
        loadComponent: () =>
          import("./features/catalogo/producto-list").then(
            (m) => m.ProductoList,
          ),
      },
      {
        path: "productos/nuevo",
        canActivate: [roleGuard],
        data: { roles: ["ADMIN"] },
        loadComponent: () =>
          import("./features/catalogo/producto-form").then(
            (m) => m.ProductoForm,
          ),
      },
      {
        path: "productos/:id/editar",
        canActivate: [roleGuard],
        data: { roles: ["ADMIN"] },
        loadComponent: () =>
          import("./features/catalogo/producto-form").then(
            (m) => m.ProductoForm,
          ),
      },
      { path: 'productos/:id', loadComponent: () => import('./features/catalogo/producto-ficha').then(m => m.ProductoFicha) },
      {
        path: "ventas",
        canActivate: [roleGuard],
        data: { tipo: "ventas", roles: ["ADMIN", "VENDEDOR"] },
        loadComponent: () =>
          import("./features/ventas/venta-historial").then((m) => m.VentaHistorial),
      },
      {
        path: "ventas/nueva",
        canActivate: [roleGuard],
        data: { tipo: "ventas", roles: ["ADMIN", "VENDEDOR"] },
        loadComponent: () =>
          import("./features/ventas/venta-pos").then((m) => m.VentaPos),
      },
      {
        path: "compras",
        canActivate: [roleGuard],
        data: { tipo: "compras", roles: ["ADMIN", "SUPERVISOR", "COMPRADOR"] },
        loadComponent: () =>
          import("./shared/operacion-list").then((m) => m.OperacionList),
      },
      {
        path: "compras/nueva",
        canActivate: [roleGuard],
        data: { tipo: "compras", roles: ["ADMIN", "SUPERVISOR", "COMPRADOR"] },
        loadComponent: () =>
          import("./features/compras/compra-form").then((m) => m.CompraForm),
      },
      {
        path: "auditoria",
        canActivate: [roleGuard],
        data: { roles: ["ADMIN"] },
        loadComponent: () =>
          import("./features/auditoria/auditoria-list").then(
            (m) => m.AuditoriaList,
          ),
      },
    ],
  },
  { path: "**", redirectTo: "" },
];
