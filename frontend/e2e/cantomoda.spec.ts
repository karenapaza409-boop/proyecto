import { expect, test } from "@playwright/test";

// Run only against the local classroom environment: creates real records.
// This test does not mock the API or the identity provider.
test("Keycloak → compra → venta → anulación → auditoría", async ({ page }) => {
  const password = process.env["E2E_PASSWORD"];
  if (!password) throw new Error("Defina E2E_PASSWORD en el proceso; no se incluye una contraseña predeterminada.");
  const key = String(Date.now());
  const producto = "Polo E2E " + key;
  const categoria = "Categoría E2E " + key;
  const proveedor = "Proveedor E2E " + key;
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto("/login");
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await page.locator("#username").fill(process.env["E2E_USER"] || "admin");
  await page
    .locator("#password")
    .fill(password);
  await page.locator("#kc-login").click();
  await expect(page.getByRole("heading", { name: /Bienvenido/ })).toBeVisible();

  await page.goto("/categorias/nuevo");
  await page.getByLabel("Nombre", { exact: true }).fill(categoria);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: categoria, exact: true }),
  ).toBeVisible();

  await page.goto("/productos/nuevo");
  await page.getByLabel("Código", { exact: true }).fill("E2E-" + key);
  await page.getByLabel("Nombre", { exact: true }).fill(producto);
  await page
    .getByLabel("Categoría", { exact: true })
    .selectOption({ label: categoria });
  await page.getByLabel("Precio de venta (S/)").fill("2.50");
  await page.getByRole("button", { name: "Guardar producto", exact: true }).click();
  await expect(page).toHaveURL(/\/productos$/);

  await page.goto("/proveedores/nuevo");
  await page.getByLabel("Tipo de documento *", { exact: true }).selectOption("RUC");
  await page.getByLabel("Razón social o nombre del proveedor *", { exact: true }).fill(proveedor);
  await page.getByLabel("Número de documento *", { exact: true }).fill(key.slice(-11));
  await page.getByRole("button", { name: "Guardar proveedor", exact: true }).click();
  await page.getByRole("link", { name: "Volver al listado", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: proveedor, exact: true }),
  ).toBeVisible();

  await page.goto("/compras/nueva");
  await page.getByLabel("Buscar proveedor activo", { exact: true }).fill(proveedor);
  await page
    .getByLabel("Proveedor", { exact: true })
    .selectOption({ label: proveedor });
  await page
    .getByPlaceholder("Nombre o código", { exact: true })
    .fill(producto);
  await page.getByRole("button", { name: new RegExp(producto) }).click();
  await page
    .getByRole("spinbutton", { name: "Cantidad", exact: true })
    .fill("10");
  await page
    .getByRole("spinbutton", { name: "Precio unitario", exact: true })
    .fill("1.20");
  await page
    .getByRole("button", { name: "Confirmar compra", exact: true })
    .click();
  await expect(page).toHaveURL(/\/compras$/);

  await page.goto("/ventas/nueva");
  await page
    .getByPlaceholder("Nombre o código", { exact: true })
    .fill(producto);
  await page.getByRole("button", { name: new RegExp(producto) }).click();
  await page
    .getByRole("spinbutton", { name: "Cantidad", exact: true })
    .fill("2");
  await page
    .getByRole("button", { name: "Confirmar venta", exact: true })
    .click();
  await expect(page).toHaveURL(/\/ventas$/);
  const fila = page.locator("tbody tr").first();
  await expect(fila).toContainText("REGISTRADA");
  await fila.getByRole("button", { name: "Detalle", exact: true }).click();
  await expect(page.locator(".detail")).toContainText(producto);
  await fila.getByRole("button", { name: "Anular", exact: true }).click();
  await expect(page.locator("tbody tr").first()).toContainText("ANULADA");

  await page.goto("/productos");
  await page.getByRole("textbox", { name: "Buscar productos" }).fill(producto);
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.locator("tbody tr").first().locator(".badge")).toHaveText(
    "10",
  );
  await page.goto("/auditoria");
  await expect(page.locator("tbody")).toContainText("ANULAR");
  await expect(page.locator("tbody")).toContainText("CREAR");
});
