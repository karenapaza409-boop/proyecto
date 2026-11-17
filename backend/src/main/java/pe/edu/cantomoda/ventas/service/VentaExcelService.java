package pe.edu.cantomoda.ventas.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import pe.edu.cantomoda.ventas.entity.DetalleVenta;
import pe.edu.cantomoda.ventas.entity.Venta;

@Service
public class VentaExcelService {

  private static final DateTimeFormatter FORMATO_FECHA_HORA =
      DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

  public byte[] generarExcel(
      List<Venta> ventas,
      String filtroEstado,
      LocalDate filtroDesde,
      LocalDate filtroHasta,
      String filtroActor,
      String filtroQ,
      Map<Long, String> codigosPorProducto) {

    try (Workbook workbook = new XSSFWorkbook();
        ByteArrayOutputStream out = new ByteArrayOutputStream()) {

      CreationHelper helper = workbook.getCreationHelper();

      // Formatos de datos
      short formatCurrency = helper.createDataFormat().getFormat("\"S/\" #,##0.00");
      short formatDate = helper.createDataFormat().getFormat("yyyy-mm-dd hh:mm");
      short formatQty = helper.createDataFormat().getFormat("#,##0");
      short formatText = helper.createDataFormat().getFormat("@");

      // Fuentes
      Font fontTitle = workbook.createFont();
      fontTitle.setBold(true);
      fontTitle.setFontHeightInPoints((short) 13);
      fontTitle.setFontName("Calibri");

      Font fontHeader = workbook.createFont();
      fontHeader.setBold(true);
      fontHeader.setColor(IndexedColors.WHITE.getIndex());
      fontHeader.setFontName("Calibri");
      fontHeader.setFontHeightInPoints((short) 10);

      Font fontBold = workbook.createFont();
      fontBold.setBold(true);
      fontBold.setFontName("Calibri");
      fontBold.setFontHeightInPoints((short) 10);

      Font fontRegular = workbook.createFont();
      fontRegular.setFontName("Calibri");
      fontRegular.setFontHeightInPoints((short) 10);

      Font fontGreen = workbook.createFont();
      fontGreen.setBold(true);
      fontGreen.setColor(IndexedColors.DARK_GREEN.getIndex());
      fontGreen.setFontName("Calibri");
      fontGreen.setFontHeightInPoints((short) 10);

      Font fontRed = workbook.createFont();
      fontRed.setBold(true);
      fontRed.setColor(IndexedColors.DARK_RED.getIndex());
      fontRed.setFontName("Calibri");
      fontRed.setFontHeightInPoints((short) 10);

      // Estilos
      CellStyle styleTitle = workbook.createCellStyle();
      styleTitle.setFont(fontTitle);

      CellStyle styleHeader = workbook.createCellStyle();
      styleHeader.setFont(fontHeader);
      styleHeader.setFillForegroundColor(IndexedColors.GREY_80_PERCENT.getIndex());
      styleHeader.setFillPattern(FillPatternType.SOLID_FOREGROUND);
      styleHeader.setAlignment(HorizontalAlignment.LEFT);
      styleHeader.setVerticalAlignment(VerticalAlignment.CENTER);
      aplicarBordes(styleHeader);

      CellStyle styleHeaderRight = workbook.createCellStyle();
      styleHeaderRight.cloneStyleFrom(styleHeader);
      styleHeaderRight.setAlignment(HorizontalAlignment.RIGHT);

      CellStyle styleHeaderCenter = workbook.createCellStyle();
      styleHeaderCenter.cloneStyleFrom(styleHeader);
      styleHeaderCenter.setAlignment(HorizontalAlignment.CENTER);

      CellStyle styleMetaLabel = workbook.createCellStyle();
      styleMetaLabel.setFont(fontBold);

      CellStyle styleMetaValue = workbook.createCellStyle();
      styleMetaValue.setFont(fontRegular);

      CellStyle styleText = workbook.createCellStyle();
      styleText.setFont(fontRegular);
      styleText.setDataFormat(formatText);
      aplicarBordes(styleText);

      CellStyle styleTextCenter = workbook.createCellStyle();
      styleTextCenter.setFont(fontRegular);
      styleTextCenter.setAlignment(HorizontalAlignment.CENTER);
      aplicarBordes(styleTextCenter);

      CellStyle styleDate = workbook.createCellStyle();
      styleDate.setFont(fontRegular);
      styleDate.setDataFormat(formatDate);
      styleDate.setAlignment(HorizontalAlignment.CENTER);
      aplicarBordes(styleDate);

      CellStyle styleCurrency = workbook.createCellStyle();
      styleCurrency.setFont(fontRegular);
      styleCurrency.setDataFormat(formatCurrency);
      styleCurrency.setAlignment(HorizontalAlignment.RIGHT);
      aplicarBordes(styleCurrency);

      CellStyle styleQty = workbook.createCellStyle();
      styleQty.setFont(fontRegular);
      styleQty.setDataFormat(formatQty);
      styleQty.setAlignment(HorizontalAlignment.RIGHT);
      aplicarBordes(styleQty);

      CellStyle styleBadgeRegistrada = workbook.createCellStyle();
      styleBadgeRegistrada.setFont(fontGreen);
      styleBadgeRegistrada.setAlignment(HorizontalAlignment.CENTER);
      aplicarBordes(styleBadgeRegistrada);

      CellStyle styleBadgeAnulada = workbook.createCellStyle();
      styleBadgeAnulada.setFont(fontRed);
      styleBadgeAnulada.setAlignment(HorizontalAlignment.CENTER);
      aplicarBordes(styleBadgeAnulada);

      // Calcular totales separados (sin mezclar vigentes con anuladas)
      int cantRegistradas = 0;
      int cantAnuladas = 0;
      BigDecimal totalRegistradas = BigDecimal.ZERO;
      BigDecimal totalAnuladas = BigDecimal.ZERO;

      for (Venta v : ventas) {
        if ("REGISTRADA".equalsIgnoreCase(v.getEstado())) {
          cantRegistradas++;
          totalRegistradas = totalRegistradas.add(v.getTotal() != null ? v.getTotal() : BigDecimal.ZERO);
        } else {
          cantAnuladas++;
          totalAnuladas = totalAnuladas.add(v.getTotal() != null ? v.getTotal() : BigDecimal.ZERO);
        }
      }

      // ==================== HOJA 1: VENTAS ====================
      Sheet sheetVentas = workbook.createSheet("Ventas");

      // Fila 0: Título
      Row r0 = sheetVentas.createRow(0);
      Cell c0 = r0.createCell(0);
      c0.setCellValue("HISTORIAL DE VENTAS - CANTO MODA");
      c0.setCellStyle(styleTitle);

      // Fila 1: Fecha de generación
      Row r1 = sheetVentas.createRow(1);
      Cell c1a = r1.createCell(0);
      c1a.setCellValue("Fecha y hora de generación:");
      c1a.setCellStyle(styleMetaLabel);
      Cell c1b = r1.createCell(1);
      c1b.setCellValue(LocalDateTime.now().format(FORMATO_FECHA_HORA));
      c1b.setCellStyle(styleMetaValue);

      // Fila 2: Filtros aplicados
      Row r2 = sheetVentas.createRow(2);
      Cell c2a = r2.createCell(0);
      c2a.setCellValue("Filtros aplicados:");
      c2a.setCellStyle(styleMetaLabel);

      String periodo = (filtroDesde != null ? filtroDesde.toString() : "Inicio")
          + " hasta " + (filtroHasta != null ? filtroHasta.toString() : "Hoy");
      String estadoDesc = (filtroEstado != null && !filtroEstado.isBlank()) ? filtroEstado : "Todas";
      String textoDesc = (filtroQ != null && !filtroQ.isBlank()) ? filtroQ.trim() : "Sin filtro";
      String cajeroDesc = (filtroActor != null && !filtroActor.isBlank()) ? filtroActor : "Todos";

      Cell c2b = r2.createCell(1);
      c2b.setCellValue("Período: " + periodo + " | Estado: " + estadoDesc + " | Búsqueda: " + textoDesc + " | Usuario: " + cajeroDesc);
      c2b.setCellStyle(styleMetaValue);

      // Fila 4 y 5: Resumen de totales separados
      Row r4 = sheetVentas.createRow(4);
      Cell c4a = r4.createCell(0);
      c4a.setCellValue("Ventas Registradas:");
      c4a.setCellStyle(styleMetaLabel);
      Cell c4b = r4.createCell(1);
      c4b.setCellValue(cantRegistradas + " operaciones");
      c4b.setCellStyle(styleMetaValue);
      Cell c4c = r4.createCell(2);
      c4c.setCellValue("Monto Total Vigente:");
      c4c.setCellStyle(styleMetaLabel);
      Cell c4d = r4.createCell(3);
      c4d.setCellValue(totalRegistradas.doubleValue());
      c4d.setCellStyle(styleCurrency);

      Row r5 = sheetVentas.createRow(5);
      Cell c5a = r5.createCell(0);
      c5a.setCellValue("Ventas Anuladas:");
      c5a.setCellStyle(styleMetaLabel);
      Cell c5b = r5.createCell(1);
      c5b.setCellValue(cantAnuladas + " operaciones (no sumadas al total vigente)");
      c5b.setCellStyle(styleMetaValue);
      Cell c5c = r5.createCell(2);
      c5c.setCellValue("Monto Anulado:");
      c5c.setCellStyle(styleMetaLabel);
      Cell c5d = r5.createCell(3);
      c5d.setCellValue(totalAnuladas.doubleValue());
      c5d.setCellStyle(styleCurrency);

      // Fila 7: Encabezados de tabla de Ventas
      int headerRowVentasIndex = 7;
      Row headerVentas = sheetVentas.createRow(headerRowVentasIndex);
      String[] titulosVentas = {
        "Número", "Fecha y hora", "Cliente", "Cajero", "Método de pago", "Estado", "Total"
      };

      for (int i = 0; i < titulosVentas.length; i++) {
        Cell ch = headerVentas.createCell(i);
        ch.setCellValue(titulosVentas[i]);
        if (i == 0 || i == 5) {
          ch.setCellStyle(styleHeaderCenter);
        } else if (i == 6) {
          ch.setCellStyle(styleHeaderRight);
        } else {
          ch.setCellStyle(styleHeader);
        }
      }

      // Filas de datos de Ventas
      int rowIdx = headerRowVentasIndex + 1;
      for (Venta v : ventas) {
        Row row = sheetVentas.createRow(rowIdx++);

        // Col 0: Número
        Cell cellNum = row.createCell(0);
        cellNum.setCellValue("V-" + String.format("%03d", v.getId()));
        cellNum.setCellStyle(styleTextCenter);

        // Col 1: Fecha y hora
        Cell cellFecha = row.createCell(1);
        if (v.getFecha() != null) {
          cellFecha.setCellValue(v.getFecha());
          cellFecha.setCellStyle(styleDate);
        } else {
          cellFecha.setCellValue("-");
          cellFecha.setCellStyle(styleTextCenter);
        }

        // Col 2: Cliente
        Cell cellCliente = row.createCell(2);
        String clienteNom = v.getCliente() != null ? v.getCliente().getNombre() : "Consumidor final";
        cellCliente.setCellValue(sanitizarTexto(clienteNom));
        cellCliente.setCellStyle(styleText);

        // Col 3: Cajero
        Cell cellCajero = row.createCell(3);
        String cajero = v.getCajeroNombre() != null && !v.getCajeroNombre().isBlank()
            ? v.getCajeroNombre()
            : (v.getActor() != null ? v.getActor() : "Caja");
        cellCajero.setCellValue(sanitizarTexto(cajero));
        cellCajero.setCellStyle(styleText);

        // Col 4: Método de pago
        Cell cellMetodo = row.createCell(4);
        cellMetodo.setCellValue("Efectivo");
        cellMetodo.setCellStyle(styleText);

        // Col 5: Estado
        Cell cellEstado = row.createCell(5);
        boolean esRegistrada = "REGISTRADA".equalsIgnoreCase(v.getEstado());
        cellEstado.setCellValue(esRegistrada ? "REGISTRADA" : "ANULADA");
        cellEstado.setCellStyle(esRegistrada ? styleBadgeRegistrada : styleBadgeAnulada);

        // Col 6: Total
        Cell cellTotal = row.createCell(6);
        cellTotal.setCellValue(v.getTotal() != null ? v.getTotal().doubleValue() : 0.0);
        cellTotal.setCellStyle(styleCurrency);
      }

      // Congelar paneles en Ventas (para fijar encabezados)
      sheetVentas.createFreezePane(0, headerRowVentasIndex + 1);

      // Anchos de columna en Ventas
      sheetVentas.setColumnWidth(0, 14 * 256);
      sheetVentas.setColumnWidth(1, 20 * 256);
      sheetVentas.setColumnWidth(2, 32 * 256);
      sheetVentas.setColumnWidth(3, 24 * 256);
      sheetVentas.setColumnWidth(4, 18 * 256);
      sheetVentas.setColumnWidth(5, 16 * 256);
      sheetVentas.setColumnWidth(6, 16 * 256);

      // ==================== HOJA 2: DETALLE ====================
      Sheet sheetDetalle = workbook.createSheet("Detalle");

      // Fila 0: Título
      Row rd0 = sheetDetalle.createRow(0);
      Cell cd0 = rd0.createCell(0);
      cd0.setCellValue("DETALLE DE LÍNEAS VENDIDAS - CANTO MODA");
      cd0.setCellStyle(styleTitle);

      // Fila 1: Fecha de generación
      Row rd1 = sheetDetalle.createRow(1);
      Cell cd1a = rd1.createCell(0);
      cd1a.setCellValue("Fecha y hora de generación:");
      cd1a.setCellStyle(styleMetaLabel);
      Cell cd1b = rd1.createCell(1);
      cd1b.setCellValue(LocalDateTime.now().format(FORMATO_FECHA_HORA));
      cd1b.setCellStyle(styleMetaValue);

      // Fila 3: Encabezados de tabla de Detalle
      int headerRowDetalleIndex = 3;
      Row headerDetalle = sheetDetalle.createRow(headerRowDetalleIndex);
      String[] titulosDetalle = {
        "Número de venta", "Código de producto", "Producto", "Cantidad", "Precio unitario", "Subtotal"
      };

      for (int i = 0; i < titulosDetalle.length; i++) {
        Cell ch = headerDetalle.createCell(i);
        ch.setCellValue(titulosDetalle[i]);
        if (i == 0 || i == 1) {
          ch.setCellStyle(styleHeaderCenter);
        } else if (i >= 3) {
          ch.setCellStyle(styleHeaderRight);
        } else {
          ch.setCellStyle(styleHeader);
        }
      }

      // Filas de datos de Detalle
      int rowDetIdx = headerRowDetalleIndex + 1;
      for (Venta v : ventas) {
        String numVenta = "V-" + String.format("%03d", v.getId());
        for (DetalleVenta d : v.getDetalles()) {
          Row row = sheetDetalle.createRow(rowDetIdx++);

          // Col 0: Número de venta
          Cell cVenta = row.createCell(0);
          cVenta.setCellValue(numVenta);
          cVenta.setCellStyle(styleTextCenter);

          // Col 1: Código de producto (como texto para preservar ceros a la izquierda)
          Cell cCod = row.createCell(1);
          String codigoProd = codigosPorProducto != null && codigosPorProducto.containsKey(d.getProductoId())
              ? codigosPorProducto.get(d.getProductoId())
              : String.format("PROD-%04d", d.getProductoId());
          cCod.setCellValue(sanitizarTexto(codigoProd));
          cCod.setCellStyle(styleTextCenter);

          // Col 2: Producto
          Cell cProd = row.createCell(2);
          cProd.setCellValue(sanitizarTexto(d.getProductoNombre()));
          cProd.setCellStyle(styleText);

          // Col 3: Cantidad
          Cell cCant = row.createCell(3);
          cCant.setCellValue(d.getCantidad() != null ? d.getCantidad() : 0);
          cCant.setCellStyle(styleQty);

          // Col 4: Precio unitario
          Cell cPre = row.createCell(4);
          cPre.setCellValue(d.getPrecioUnitario() != null ? d.getPrecioUnitario().doubleValue() : 0.0);
          cPre.setCellStyle(styleCurrency);

          // Col 5: Subtotal
          Cell cSub = row.createCell(5);
          cSub.setCellValue(d.getSubtotal() != null ? d.getSubtotal().doubleValue() : 0.0);
          cSub.setCellStyle(styleCurrency);
        }
      }

      // Congelar paneles en Detalle
      sheetDetalle.createFreezePane(0, headerRowDetalleIndex + 1);

      // Anchos de columna en Detalle
      sheetDetalle.setColumnWidth(0, 18 * 256);
      sheetDetalle.setColumnWidth(1, 20 * 256);
      sheetDetalle.setColumnWidth(2, 36 * 256);
      sheetDetalle.setColumnWidth(3, 14 * 256);
      sheetDetalle.setColumnWidth(4, 18 * 256);
      sheetDetalle.setColumnWidth(5, 18 * 256);

      workbook.write(out);
      return out.toByteArray();

    } catch (IOException e) {
      throw new RuntimeException("Error al generar el archivo Excel de ventas", e);
    }
  }

  /**
   * Sanitiza cadenas de texto ingresadas por usuarios para prevenir CSV/Excel formula injection.
   */
  private String sanitizarTexto(String valor) {
    if (valor == null) return "";
    String limpio = valor.trim();
    if (limpio.startsWith("=") || limpio.startsWith("+") || limpio.startsWith("-") || limpio.startsWith("@")) {
      return "'" + limpio;
    }
    return limpio;
  }

  private void aplicarBordes(CellStyle style) {
    style.setBorderTop(BorderStyle.THIN);
    style.setTopBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
    style.setBorderBottom(BorderStyle.THIN);
    style.setBottomBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
    style.setBorderLeft(BorderStyle.THIN);
    style.setLeftBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
    style.setBorderRight(BorderStyle.THIN);
    style.setRightBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
  }
}
