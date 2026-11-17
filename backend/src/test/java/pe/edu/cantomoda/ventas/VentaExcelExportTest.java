package pe.edu.cantomoda.ventas;

import static org.junit.jupiter.api.Assertions.*;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import pe.edu.cantomoda.ventas.entity.Cliente;
import pe.edu.cantomoda.ventas.entity.DetalleVenta;
import pe.edu.cantomoda.ventas.entity.Venta;
import pe.edu.cantomoda.ventas.service.VentaExcelService;

class VentaExcelExportTest {

  private final VentaExcelService excelService = new VentaExcelService();

  @Test
  @DisplayName("Genera un XLSX auténtico con dos hojas, totales separados y detalle coherente")
  void generaExcelCorrectamente() throws IOException {
    // Venta 1: Registrada
    Venta v1 = new Venta();
    v1.setId(1L);
    v1.setFecha(LocalDateTime.of(2026, 11, 8, 10, 30));
    v1.setActor("cajero01");
    v1.setCajeroNombre("Ana Torres");
    v1.setEstado("REGISTRADA");
    v1.setTotal(new BigDecimal("13.50"));
    v1.setEfectivoRecibido(new BigDecimal("20.00"));
    v1.setVuelto(new BigDecimal("6.50"));

    Cliente c1 = new Cliente();
    c1.setNombre("Carlos Mendoza");
    v1.setCliente(c1);

    DetalleVenta d1 = new DetalleVenta();
    d1.setId(101L);
    d1.setProductoId(10L);
    d1.setProductoNombre("Polo de algodon negro - Talla M");
    d1.setCantidad(2);
    d1.setPrecioUnitario(new BigDecimal("4.50"));
    d1.setSubtotal(new BigDecimal("9.00"));
    v1.agregar(d1);

    DetalleVenta d2 = new DetalleVenta();
    d2.setId(102L);
    d2.setProductoId(11L);
    d2.setProductoNombre("Jean azul clasico - Talla 32");
    d2.setCantidad(1);
    d2.setPrecioUnitario(new BigDecimal("4.50"));
    d2.setSubtotal(new BigDecimal("4.50"));
    v1.agregar(d2);

    // Venta 2: Anulada
    Venta v2 = new Venta();
    v2.setId(2L);
    v2.setFecha(LocalDateTime.of(2026, 11, 8, 11, 15));
    v2.setActor("cajero02");
    v2.setCajeroNombre("Luis Ramos");
    v2.setEstado("ANULADA");
    v2.setTotal(new BigDecimal("25.00"));

    DetalleVenta d3 = new DetalleVenta();
    d3.setId(103L);
    d3.setProductoId(12L);
    d3.setProductoNombre("Casaca denim - Talla L");
    d3.setCantidad(2);
    d3.setPrecioUnitario(new BigDecimal("12.50"));
    d3.setSubtotal(new BigDecimal("25.00"));
    v2.agregar(d3);

    Map<Long, String> codigos = Map.of(
        10L, "POL-001",
        11L, "ARR-002",
        12L, "ACE-003"
    );

    byte[] excelBytes = excelService.generarExcel(
        List.of(v1, v2),
        "Todas",
        LocalDate.of(2026, 11, 1),
        LocalDate.of(2026, 11, 8),
        null,
        null,
        codigos
    );

    assertNotNull(excelBytes);
    assertTrue(excelBytes.length > 0);

    // Verificación 1: El archivo abre correctamente como XSSFWorkbook
    try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(excelBytes))) {
      assertEquals(2, wb.getNumberOfSheets());
      assertEquals("Ventas", wb.getSheetName(0));
      assertEquals("Detalle", wb.getSheetName(1));

      // Verificación 2: Hoja Ventas
      Sheet sheetVentas = wb.getSheet("Ventas");
      assertNotNull(sheetVentas);

      // Metadatos y filtros
      Row rowFiltros = sheetVentas.getRow(2);
      assertTrue(rowFiltros.getCell(1).getStringCellValue().contains("2026-11-01 hasta 2026-11-08"));

      // Totales separados (Fila 4 y 5)
      Row rowReg = sheetVentas.getRow(4);
      assertTrue(rowReg.getCell(0).getStringCellValue().contains("Ventas Registradas"));
      assertTrue(rowReg.getCell(1).getStringCellValue().contains("1 operaciones"));
      assertEquals(13.50, rowReg.getCell(3).getNumericCellValue(), 0.001);

      Row rowAnul = sheetVentas.getRow(5);
      assertTrue(rowAnul.getCell(0).getStringCellValue().contains("Ventas Anuladas"));
      assertTrue(rowAnul.getCell(1).getStringCellValue().contains("1 operaciones"));
      assertEquals(25.00, rowAnul.getCell(3).getNumericCellValue(), 0.001);

      // Filas de datos
      Row rowV1 = sheetVentas.getRow(8); // Primera venta
      assertEquals("V-001", rowV1.getCell(0).getStringCellValue());
      assertEquals("Carlos Mendoza", rowV1.getCell(2).getStringCellValue());
      assertEquals("Ana Torres", rowV1.getCell(3).getStringCellValue());
      assertEquals("Efectivo", rowV1.getCell(4).getStringCellValue());
      assertEquals("REGISTRADA", rowV1.getCell(5).getStringCellValue());
      assertEquals(13.50, rowV1.getCell(6).getNumericCellValue(), 0.001);

      Row rowV2 = sheetVentas.getRow(9); // Segunda venta (anulada)
      assertEquals("V-002", rowV2.getCell(0).getStringCellValue());
      assertEquals("Consumidor final", rowV2.getCell(2).getStringCellValue());
      assertEquals("ANULADA", rowV2.getCell(5).getStringCellValue());
      assertEquals(25.00, rowV2.getCell(6).getNumericCellValue(), 0.001);

      // Verificación 3: Hoja Detalle
      Sheet sheetDetalle = wb.getSheet("Detalle");
      assertNotNull(sheetDetalle);

      // Filas de detalle: 3 líneas vendidas en total (2 de V1 + 1 de V2)
      Row dRow1 = sheetDetalle.getRow(4);
      assertEquals("V-001", dRow1.getCell(0).getStringCellValue());
      assertEquals("POL-001", dRow1.getCell(1).getStringCellValue());
      assertEquals("Polo de algodon negro - Talla M", dRow1.getCell(2).getStringCellValue());
      assertEquals(2, (int) dRow1.getCell(3).getNumericCellValue());
      assertEquals(4.50, dRow1.getCell(4).getNumericCellValue(), 0.001);
      assertEquals(9.00, dRow1.getCell(5).getNumericCellValue(), 0.001);

      Row dRow2 = sheetDetalle.getRow(5);
      assertEquals("V-001", dRow2.getCell(0).getStringCellValue());
      assertEquals("ARR-002", dRow2.getCell(1).getStringCellValue());

      Row dRow3 = sheetDetalle.getRow(6);
      assertEquals("V-002", dRow3.getCell(0).getStringCellValue());
      assertEquals("ACE-003", dRow3.getCell(1).getStringCellValue());
      assertEquals(25.00, dRow3.getCell(5).getNumericCellValue(), 0.001);
    }
  }

  @Test
  @DisplayName("Sanitiza fórmulas maliciosas para evitar Excel Injection")
  void sanitizaFormulasMaliciosas() throws IOException {
    Venta v = new Venta();
    v.setId(99L);
    v.setFecha(LocalDateTime.now());
    v.setActor("cajero");
    v.setEstado("REGISTRADA");
    v.setTotal(new BigDecimal("10.00"));

    Cliente c = new Cliente();
    c.setNombre("=cmd|'/C calc'!A0");
    v.setCliente(c);

    DetalleVenta d = new DetalleVenta();
    d.setProductoId(1L);
    d.setProductoNombre("+2+5");
    d.setCantidad(1);
    d.setPrecioUnitario(new BigDecimal("10.00"));
    d.setSubtotal(new BigDecimal("10.00"));
    v.agregar(d);

    byte[] bytes = excelService.generarExcel(List.of(v), null, null, null, null, null, Map.of(1L, "-001"));

    try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
      Sheet sVentas = wb.getSheet("Ventas");
      String clienteVal = sVentas.getRow(8).getCell(2).getStringCellValue();
      assertTrue(clienteVal.startsWith("'="), "Debe anteponer apóstrofe para neutralizar fórmula");

      Sheet sDetalle = wb.getSheet("Detalle");
      String prodVal = sDetalle.getRow(4).getCell(2).getStringCellValue();
      assertTrue(prodVal.startsWith("'+"), "Debe anteponer apóstrofe para neutralizar fórmula");

      String codVal = sDetalle.getRow(4).getCell(1).getStringCellValue();
      assertTrue(codVal.startsWith("'-"), "Debe anteponer apóstrofe para neutralizar fórmula");
    }
  }
}
