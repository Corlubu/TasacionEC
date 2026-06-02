import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "../main";
import { db } from "~/server/db";
import { s3Client, minioBaseUrl } from "~/server/minio";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import jwt from "jsonwebtoken";
import { env } from "~/server/env";
import crypto from "crypto";
import { chromium } from "playwright";

async function getUserIdFromToken(token: string): Promise<number> {
  try {
    const verified = jwt.verify(token, env.JWT_SECRET);
    const parsed = z.object({ userId: z.number() }).parse(verified);
    return parsed.userId;
  } catch (error) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  }
}

async function generatePDFFromHTML(html: string): Promise<Buffer> {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // 🚨 MAGIA APLICADA: Obligamos al navegador a esperar a que las fuentes web terminen de descargar
    await page.evaluate(() => document.fonts.ready);

    // Le damos 1 segundo de respiro extra para que renderice las imágenes pesadas
    await page.waitForTimeout(1000);

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
      displayHeaderFooter: false,
      preferCSSPageSize: false,
    });

    await browser.close();

    return Buffer.from(pdfBuffer);
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error("Error generating PDF with Playwright:", error);
    throw error;
  }
}

function generateReportHTML(report: any, property: any): string {
  const currentDate = new Date();
  const reportTimestamp = currentDate.toISOString();
  const formattedDate = currentDate.toLocaleDateString("es-EC", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/Guayaquil",
  });

  // 🚨 MAGIA APLICADA: Diccionarios de traducción
  const translateType: Record<string, string> = {
    HOUSE: "Casa",
    APARTMENT: "Apartamento",
    COMMERCIAL: "Local Comercial",
    LAND: "Terreno",
    INDUSTRIAL: "Industrial",
  };
  const translateRegime: Record<string, string> = {
    PRIVATE: "Privada",
    PUBLIC: "Pública",
    COMMUNAL: "Comunal",
    HORIZONTAL_PROPERTY: "Propiedad Horizontal",
  };
  const translateLevel: Record<string, string> = {
    HIGH: "Alto",
    MEDIUM_HIGH: "Medio Alto",
    MEDIUM: "Medio",
    MEDIUM_LOW: "Medio Bajo",
    LOW: "Bajo",
  };
  const translateObject: Record<string, string> = {
    MARKET_VALUE: "Valor Justo de Mercado",
    LIQUIDATION_VALUE: "Valor de Liquidación",
    RESCUE_VALUE: "Valor de Rescate",
    SCRAP_VALUE: "Valor de Desecho",
  };
  const translateStatus: Record<string, string> = {
    DRAFT: "Borrador",
    COMPLETED: "Finalizado",
  };
  const translateDepMethod: Record<string, string> = {
    STRAIGHT_LINE: "Línea Recta",
    ROSS_HEIDECK: "Ross-Heideck",
    KUFNER: "Kufner",
  };

  const tipoPropiedad = translateType[property.type] || property.type || "N/A";
  const regimen =
    translateRegime[property.propertyRegime] ||
    property.propertyRegime ||
    "N/A";
  const nivelSocio =
    translateLevel[property.socioeconomicLevel] ||
    property.socioeconomicLevel ||
    "N/A";
  const objetoAvaluo =
    translateObject[report.valuationObject] || report.valuationObject || "N/A";
  const estadoReporte =
    translateStatus[report.status] || report.status || "N/A";
  const metodoDep =
    translateDepMethod[report.depreciationMethod] ||
    report.depreciationMethod ||
    "N/A";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="document-hash" content="${report.documentHash}">
  <meta name="generation-timestamp" content="${reportTimestamp}">
  <title>Reporte de Valoración - ${property.address}</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    @page {
      size: A4;
      margin: 20mm 15mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      /* Usamos la fuente inyectada Inter como principal */
      font-family: 'Inter', 'Helvetica', 'Arial', sans-serif;
      margin: 0;
      padding: 20px;
      line-height: 1.6;
      color: #1a1a1a;
      font-size: 11pt;
      background: white;
    }

    h1 {
      color: #1e3a8a;
      text-align: center;
      font-size: 22pt;
      margin-bottom: 8px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    h2 {
      color: #1e3a8a;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 8px;
      margin-top: 25px;
      margin-bottom: 15px;
      font-size: 16pt;
      font-weight: 600;
    }

    h3 {
      color: #1e40af;
      font-size: 13pt;
      margin-top: 18px;
      margin-bottom: 10px;
      font-weight: 600;
    }

    h4 {
      color: #1e40af;
      font-size: 11pt;
      margin-top: 15px;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .header {
      text-align: center;
      margin-bottom: 35px;
      border-bottom: 4px solid #3b82f6;
      padding-bottom: 20px;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      padding: 25px;
      margin: -20px -20px 35px -20px;
    }

    .header .subtitle {
      font-size: 10pt;
      color: #475569;
      margin-top: 6px;
      font-weight: 500;
    }

    .header .logo {
      font-size: 28pt;
      font-weight: 800;
      color: #1e3a8a;
      margin-bottom: 5px;
      letter-spacing: -1px;
    }

    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }

    .value-box {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      padding: 18px;
      border-radius: 10px;
      margin: 12px 0;
      border-left: 5px solid #3b82f6;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .value-label {
      font-weight: 600;
      color: #1e40af;
      font-size: 11pt;
      margin-bottom: 6px;
    }

    .value-amount {
      font-size: 24pt;
      color: #2563eb;
      font-weight: 700;
      margin-top: 4px;
      letter-spacing: -0.5px;
    }

    .final-value-box {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      border-left: 5px solid #16a34a;
      padding: 22px;
      margin: 18px 0;
    }

    .final-value-amount {
      color: #15803d;
      font-size: 28pt;
      font-weight: 700;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0;
      font-size: 10pt;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    th, td {
      border: 1px solid #e2e8f0;
      padding: 12px 14px;
      text-align: left;
    }

    th {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 9pt;
      letter-spacing: 0.5px;
    }

    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    tr:hover {
      background-color: #f1f5f9;
    }

    .glossary-item {
      margin-bottom: 16px;
      padding-left: 15px;
      border-left: 3px solid #e2e8f0;
    }

    .glossary-term {
      font-weight: 600;
      color: #1e40af;
      font-size: 11pt;
      margin-bottom: 4px;
    }

    .limiting-condition {
      margin-bottom: 10px;
      padding-left: 20px;
      position: relative;
    }

    .limiting-condition:before {
      content: "•";
      position: absolute;
      left: 8px;
      color: #3b82f6;
      font-weight: bold;
      font-size: 14pt;
    }

    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 9pt;
      color: #64748b;
      border-top: 3px solid #e2e8f0;
      padding-top: 20px;
      page-break-inside: avoid;
    }

    .metadata {
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      font-size: 9pt;
      margin-top: 15px;
      font-family: 'Courier New', monospace;
      border: 1px solid #e2e8f0;
    }

    .metadata div {
      margin: 4px 0;
    }

    .warning-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #f59e0b;
      border-radius: 8px;
      padding: 16px;
      margin: 18px 0;
      box-shadow: 0 2px 4px rgba(245, 158, 11, 0.1);
    }

    .warning-box strong {
      color: #92400e;
      font-size: 11pt;
    }

    p {
      text-align: justify;
      margin-bottom: 10px;
      line-height: 1.7;
    }

    .page-break {
      page-break-after: always;
    }

    .highlight-box {
      background: #fef9e7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin: 12px 0;
      border-radius: 4px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 15px 0;
    }

    .info-card {
      background: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }

    .info-card-label {
      font-size: 9pt;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      font-weight: 600;
    }

    .info-card-value {
      font-size: 13pt;
      color: #1e293b;
      font-weight: 600;
    }

    .photo-gallery {
      margin-top: 30px;
      page-break-inside: avoid;
    }

    .photo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    }

    .photo-item {
      page-break-inside: avoid;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .photo-item img {
      width: 100%;
      height: 280px;
      object-fit: cover;
      display: block;
    }

    .photo-info {
      padding: 12px;
      background: #f8fafc;
    }

    .photo-category {
      font-weight: 600;
      color: #1e40af;
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .photo-caption {
      font-size: 9pt;
      color: #64748b;
      line-height: 1.4;
    }

    .no-photos-message {
      text-align: center;
      padding: 40px;
      background: #f8fafc;
      border-radius: 8px;
      color: #64748b;
      font-style: italic;
    }

    .mb-4 {
      margin-bottom: 16px;
    }

    .mt-4 {
      margin-top: 16px;
    }

    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .page-break {
        page-break-after: always;
      }

      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">TasaciónEC</div>
    <h1>REPORTE DE VALORACIÓN INMOBILIARIA</h1>
    <div class="subtitle"><strong>Sistema de Avalúo Automatizado</strong></div>
    <div class="subtitle">Conforme a las Normativas de la Superintendencia de Bancos y Seguros (SBS) de Ecuador</div>
    <div class="subtitle" style="margin-top: 12px; font-size: 11pt; color: #1e40af;"><strong>Fecha de Emisión:</strong> ${formattedDate}</div>
  </div>

  <div class="section">
    <h2>1. INFORMACIÓN DE LA PROPIEDAD</h2>
    <table>
      <tr><th>Campo</th><th>Valor</th></tr>
      <tr><td><strong>Dirección</strong></td><td>${property.address}</td></tr>
      <tr><td><strong>Ciudad</strong></td><td>${property.city}, ${property.state}</td></tr>
      <tr><td><strong>Tipo de Propiedad</strong></td><td>${tipoPropiedad}</td></tr>
      <tr><td><strong>Coordenadas GPS</strong></td><td>Lat: ${property.latitude}, Lng: ${property.longitude}</td></tr>
      <tr><td><strong>Área del Terreno</strong></td><td>${property.landArea || "N/A"} m²</td></tr>
      <tr><td><strong>Área Construida</strong></td><td>${property.builtArea || "N/A"} m²</td></tr>
      ${property.bedrooms ? `<tr><td><strong>Dormitorios</strong></td><td>${property.bedrooms}</td></tr>` : ""}
      ${property.bathrooms ? `<tr><td><strong>Baños</strong></td><td>${property.bathrooms}</td></tr>` : ""}
      ${property.yearBuilt ? `<tr><td><strong>Año de Construcción</strong></td><td>${property.yearBuilt}</td></tr>` : ""}
      ${property.inspectionDate ? `<tr><td><strong>Fecha de Inspección</strong></td><td>${new Date(property.inspectionDate).toLocaleDateString("es-EC")}</td></tr>` : ""}
    </table>
  </div>

  ${
    property.propertyRegime
      ? `<div class="section">
    <h2>1.1 INFORMACIÓN DE CUMPLIMIENTO SBS</h2>
    <table>
      <tr><th>Campo</th><th>Valor</th></tr>
      <tr><td><strong>Régimen de Propiedad</strong></td><td>${regimen}</td></tr>
      ${property.inspectionDate ? `<tr><td><strong>Fecha de Inspección Física</strong></td><td>${new Date(property.inspectionDate).toLocaleDateString("es-EC")}</td></tr>` : ""}
      ${property.personPresentAtInspection ? `<tr><td><strong>Persona Presente en Inspección</strong></td><td>${property.personPresentAtInspection}</td></tr>` : ""}
      ${property.socioeconomicLevel ? `<tr><td><strong>Nivel Socioeconómico del Sector</strong></td><td>${nivelSocio}</td></tr>` : ""}
      ${property.saturationIndex ? `<tr><td><strong>Índice de Saturación</strong></td><td>${property.saturationIndex}%</td></tr>` : ""}
      ${property.cos ? `<tr><td><strong>COS (Coef. Ocupación Suelo)</strong></td><td>${property.cos}</td></tr>` : ""}
      ${property.cus ? `<tr><td><strong>CUS (Coef. Utilización Suelo)</strong></td><td>${property.cus}</td></tr>` : ""}
      ${property.numberOfFacades ? `<tr><td><strong>Número de Fachadas</strong></td><td>${property.numberOfFacades}</td></tr>` : ""}
      ${property.type === "APARTMENT" && property.aliquotPercentage ? `<tr><td><strong>Alícuota (Propiedad Horizontal)</strong></td><td>${property.aliquotPercentage}%</td></tr>` : ""}
      ${property.rentableUnits ? `<tr><td><strong>Unidades Arrendables</strong></td><td>${property.rentableUnits}</td></tr>` : ""}
      ${property.hasMaintenanceLogs !== null ? `<tr><td><strong>Registros de Mantenimiento</strong></td><td>${property.hasMaintenanceLogs ? "Sí" : "No"}</td></tr>` : ""}
    </table>
    ${
      property.panoramicCharacteristics
        ? `
    <div class="mt-4">
      <h4>Características Panorámicas:</h4>
      <p style="font-size: 10pt; color: #374151;">${property.panoramicCharacteristics}</p>
    </div>
    `
        : ""
    }
    ${
      property.easementsAndRestrictions
        ? `
    <div class="mt-4">
      <h4>Servidumbres y Restricciones:</h4>
      <p style="font-size: 10pt; color: #374151;">${property.easementsAndRestrictions}</p>
    </div>
    `
        : ""
    }
  </div>`
      : ""
  }

  <div class="section">
    <h2>2. VALORACIÓN${report.valuationObject ? ` - ${objetoAvaluo}` : ""}</h2>
    ${
      report.valuationObject
        ? `
    <div class="highlight-box mb-4">
      <p><strong>Objeto del Avalúo:</strong> ${objetoAvaluo}</p>
    </div>
    `
        : ""
    }
    <div class="info-grid">
      <div class="value-box">
        <div class="value-label">Valor de Mercado</div>
        <div style="font-size: 9pt; color: #64748b; margin-bottom: 6px;">Método de Homologación</div>
        <div class="value-amount">$${Math.round(report.marketValue || 0).toLocaleString("es-EC")}</div>
      </div>
      <div class="value-box">
        <div class="value-label">Valor de Costo</div>
        <div style="font-size: 9pt; color: #64748b; margin-bottom: 6px;">Método de Reemplazo</div>
        <div class="value-amount">$${Math.round(report.costValue || 0).toLocaleString("es-EC")}</div>
      </div>
    </div>
    ${
      report.incomeValue
        ? `
    <div class="value-box">
      <div class="value-label">Valor de Renta</div>
      <div style="font-size: 9pt; color: #64748b; margin-bottom: 6px;">Método de Capitalización</div>
      <div class="value-amount">$${Math.round(report.incomeValue).toLocaleString("es-EC")}</div>
    </div>
    `
        : ""
    }
    <div class="final-value-box">
      <div class="value-label" style="color: #15803d; font-size: 13pt;">VALOR FINAL AVALUADO</div>
      <div class="final-value-amount">$${Math.round(report.finalValue || 0).toLocaleString("es-EC")}</div>
    </div>
  </div>

  <div class="section">
    <h2>3. GLOSARIO DE TÉRMINOS Y DEFINICIONES DE VALOR</h2>

    <div class="glossary-item">
      <div class="glossary-term">Valor de Mercado:</div>
      <p>El precio más probable por el cual una propiedad se intercambiaría entre un comprador y un vendedor dispuestos, ambos razonablemente informados, actuando sin presión y en condiciones normales de mercado.</p>
    </div>

    <div class="glossary-item">
      <div class="glossary-term">Valor de Reposición o Costo:</div>
      <p>El costo de construir una réplica exacta de la propiedad a precios actuales, menos la depreciación acumulada, más el valor del terreno.</p>
    </div>

    <div class="glossary-item">
      <div class="glossary-term">Valor de Capitalización de Rentas:</div>
      <p>El valor presente de los ingresos futuros que la propiedad puede generar, calculado mediante la aplicación de una tasa de capitalización al ingreso neto operativo.</p>
    </div>

    <div class="glossary-item">
      <div class="glossary-term">Valor de Liquidación:</div>
      <p>El precio que se espera obtener en una venta forzada o bajo presión de tiempo, generalmente inferior al valor de mercado.</p>
    </div>

    <div class="glossary-item">
      <div class="glossary-term">Depreciación:</div>
      <p>La pérdida de valor de una propiedad debido al paso del tiempo, desgaste físico, obsolescencia funcional o factores externos.</p>
    </div>

    <div class="glossary-item">
      <div class="glossary-term">Vida Útil:</div>
      <p>El período durante el cual se espera que una propiedad o componente mantenga su funcionalidad y valor económico.</p>
    </div>
  </div>

  <div class="section page-break">
    <h2>4. DECLARACIONES Y CONDICIONES LIMITANTES</h2>

    <h3>4.1 Propósito y Uso del Avalúo</h3>
    <p>Este avalúo ha sido preparado exclusivamente para ${property.valuationRequest?.purpose || "el propósito indicado por el cliente"} y no debe ser utilizado para ningún otro propósito sin el consentimiento expreso del perito valuador.</p>

    <h3>4.2 Inspección y Verificación</h3>
    <div class="limiting-condition">
      La inspección de la propiedad se realizó el ${property.inspectionDate ? new Date(property.inspectionDate).toLocaleDateString("es-EC") : "fecha indicada en el reporte"}.
    </div>
    <div class="limiting-condition">
      El perito no es responsable de condiciones ocultas o defectos estructurales que no sean aparentes durante la inspección visual.
    </div>
    <div class="limiting-condition">
      No se realizaron pruebas destructivas ni análisis de laboratorio de materiales de construcción.
    </div>

    <h3>4.3 Información Proporcionada</h3>
    <div class="limiting-condition">
      Se asume que toda la información proporcionada por el cliente, propietario o fuentes oficiales es correcta y confiable.
    </div>
    <div class="limiting-condition">
      Las medidas y áreas reportadas se basan en ${property.areaOnSite ? "mediciones realizadas en sitio" : "información proporcionada por el propietario o documentos legales"}.
    </div>
    <div class="limiting-condition">
      Se asume que no existen gravámenes, servidumbres o restricciones no divulgadas que afecten el valor de la propiedad.
    </div>

    <h3>4.4 Supuestos del Avalúo</h3>
    <div class="limiting-condition">
      Se asume que la propiedad cumple con todas las regulaciones de zonificación y códigos de construcción aplicables.
    </div>
    <div class="limiting-condition">
      El valor estimado está basado en las condiciones del mercado a la fecha del avalúo y puede cambiar con el tiempo.
    </div>
    <div class="limiting-condition">
      Los valores de comparables utilizados se obtuvieron de ${report.parametersSnapshot?.marketData?.comparablesCount || 0} propiedades similares en el área.
    </div>
    ${!property.areaAccordingToDeed ? '<div class="limiting-condition">No se proporcionó documentación legal de la propiedad, por lo que las áreas reportadas no han sido verificadas contra escrituras.</div>' : ""}

    <h3>4.5 Limitaciones de Responsabilidad</h3>
    <div class="limiting-condition">
      Este avalúo refleja la opinión profesional del perito basada en la información disponible y las condiciones observadas.
    </div>
    <div class="limiting-condition">
      El perito no asume responsabilidad por eventos futuros que puedan afectar el valor de la propiedad.
    </div>
    <div class="limiting-condition">
      La exactitud del avalúo depende de la veracidad y completitud de la información proporcionada.
    </div>

    <div class="warning-box">
      <strong>IMPORTANTE:</strong> Este avalúo ha sido preparado de acuerdo con las normativas de la Superintendencia de Bancos y Seguros (SBS) de Ecuador (Anexo 1, Sección 3) y los estándares internacionales de valoración.
    </div>

    <div class="warning-box">
      <strong>AUTENTICIDAD DEL DOCUMENTO:</strong> Este reporte contiene un hash criptográfico SHA-256 que garantiza la integridad del documento. Cualquier modificación al contenido invalidará el hash. El hash puede ser verificado mediante herramientas de validación de documentos.
    </div>
  </div>

  <div class="section">
    <h2>5. DESCRIPCIÓN DEL ENTORNO</h2>
    <p>${report.environmentDescription}</p>
  </div>

  <div class="section">
    <h2>6. DESCRIPCIÓN TÉCNICA</h2>
    <p>${report.technicalDescription}</p>
  </div>

  <div class="section">
    <h2>7. JUSTIFICACIÓN DEL VALOR</h2>
    <p>${report.valueJustification}</p>
  </div>

  ${
    property.photos && property.photos.length > 0
      ? `
  <div class="section page-break">
    <h2>8. ANEXO FOTOGRÁFICO</h2>
    <p>A continuación se presentan las fotografías del inmueble evaluado, organizadas por categoría para facilitar la comprensión visual de sus características y estado de conservación.</p>

    <div class="photo-gallery">
      <div class="photo-grid">
        ${property.photos
          .map((photo: any) => {
            const categoryLabels: Record<string, string> = {
              facade: "Fachada",
              interior: "Interior",
              kitchen: "Cocina",
              bathroom: "Baño",
              damage: "Daño/Patología",
              document: "Documento",
            };

            const categoryLabel =
              categoryLabels[photo.category] || photo.category;

            return `
            <div class="photo-item">
              <img src="${photo.url}" alt="${categoryLabel}" />
              <div class="photo-info">
                <div class="photo-category">${categoryLabel}</div>
                ${photo.caption ? `<div class="photo-caption">${photo.caption}</div>` : ""}
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    </div>
  </div>
  `
      : `
  <div class="section">
    <h2>8. ANEXO FOTOGRÁFICO</h2>
    <div class="no-photos-message">
      No se adjuntaron fotografías para esta propiedad.
    </div>
  </div>
  `
  }

  <div class="section">
    <h2>9. DESGLOSE DE COSTOS</h2>
    <table>
      <tr><th>Concepto</th><th>Valor</th></tr>
      <tr><td>Valor del Terreno</td><td>$${Math.round(report.landValue || 0).toLocaleString("es-EC")}</td></tr>
      <tr><td>Costo de Construcción</td><td>$${Math.round(report.constructionCost || 0).toLocaleString("es-EC")}</td></tr>
      <tr><td>Depreciación (${metodoDep})</td><td style="color: #dc2626; font-weight: 600;">-$${Math.round(report.depreciationAmount || 0).toLocaleString("es-EC")}</td></tr>
      ${report.additionalWorksCost && report.additionalWorksCost > 0 ? `<tr><td>Obras Adicionales</td><td>$${Math.round(report.additionalWorksCost).toLocaleString("es-EC")}</td></tr>` : ""}
      <tr style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); font-weight: 700;">
        <td>TOTAL VALOR DE COSTO</td>
        <td style="color: #2563eb;">$${Math.round(report.costValue || 0).toLocaleString("es-EC")}</td>
      </tr>
    </table>

    <h3>Análisis de Depreciación</h3>
    <table>
      <tr><th>Parámetro</th><th>Valor</th></tr>
      <tr><td>Método de Depreciación</td><td><strong>${metodoDep}</strong></td></tr>
      <tr><td>Edad Cronológica</td><td>${report.chronologicalAge || 0} años</td></tr>
      <tr><td>Vida Útil Total</td><td>${report.totalUsefulLife || 0} años</td></tr>
      <tr><td>Vida Útil Remanente</td><td>${report.remainingUsefulLife ? report.remainingUsefulLife.toFixed(2) : "0"} años</td></tr>
      <tr><td>Porcentaje de Depreciación</td><td><strong>${report.depreciationAmount && report.constructionCost ? ((report.depreciationAmount / (report.constructionCost + report.depreciationAmount)) * 100).toFixed(2) : "0"}%</strong></td></tr>
    </table>
  </div>

  ${
    report.incomeValue
      ? `
  <div class="section">
    <h2>10. ANÁLISIS DE CAPITALIZACIÓN DE RENTAS</h2>
    <table>
      <tr><th>Concepto</th><th>Valor</th></tr>
      <tr><td>Renta Mensual Estimada</td><td>$${Math.round(report.estimatedMonthlyRent || 0).toLocaleString("es-EC")}</td></tr>
      <tr><td>Ingreso Bruto Anual</td><td>$${Math.round(report.annualGrossIncome || 0).toLocaleString("es-EC")}</td></tr>
      <tr><td>Gastos Operativos Anuales</td><td style="color: #dc2626; font-weight: 600;">-$${Math.round(report.operatingExpenses || 0).toLocaleString("es-EC")}</td></tr>
      <tr><td>Ingreso Neto Anual</td><td>$${Math.round(report.annualNetIncome || 0).toLocaleString("es-EC")}</td></tr>
      <tr><td>Tasa de Capitalización</td><td>${report.capitalizationRate}%</td></tr>
      <tr style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); font-weight: 700;">
        <td>VALOR POR CAPITALIZACIÓN</td>
        <td style="color: #2563eb;">$${Math.round(report.incomeValue).toLocaleString("es-EC")}</td></tr>
    </table>
  </div>
  `
      : ""
  }

  <div class="footer">
    <div class="highlight-box">
      <p style="margin: 0;"><strong>Hash del Documento:</strong> ${report.documentHash}</p>
    </div>
    <p><strong>Timestamp de Generación:</strong> ${reportTimestamp}</p>
    <p><strong>Fecha y Hora de Emisión:</strong> ${formattedDate}</p>
    <div class="metadata">
      <div><strong>Reporte ID:</strong> ${report.id}</div>
      <div><strong>Propiedad ID:</strong> ${property.id}</div>
      <div><strong>Método de Cálculo:</strong> ${metodoDep}</div>
      <div><strong>Estado:</strong> ${estadoReporte}</div>
    </div>
    <p style="margin-top: 20px; font-weight: 600;">Este reporte fue generado automáticamente por TasaciónEC</p>
    <p style="font-size: 8pt;">© ${new Date().getFullYear()} TasaciónEC - Todos los derechos reservados</p>
  </div>
</body>
</html>
  `;
}

export const generatePDF = baseProcedure
  .input(
    z.object({
      token: z.string(),
      reportId: z.number(),
    }),
  )
  .mutation(async ({ input }) => {
    const userId = await getUserIdFromToken(input.token);

    const report = await db.valuationReport.findUnique({
      where: { id: input.reportId },
      include: {
        property: {
          include: {
            photos: true,
          },
        },
      },
    });

    if (!report) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Report not found",
      });
    }

    if (report.userId !== userId) {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (user?.role !== "ADMIN" && user?.role !== "SUPERVISOR") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }
    }

    try {
      const html = generateReportHTML(report, report.property);

      const pdfBuffer = await generatePDFFromHTML(html);

      const objectKey = `reports/report-${report.id}-${Date.now()}.pdf`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: "property-photos", // Tu bucket de Supabase
          Key: objectKey,
          Body: pdfBuffer,
          ContentType: "application/pdf",
          ContentLength: pdfBuffer.length,
        }),
      );

      const pdfUrl = `${minioBaseUrl}/property-photos/${objectKey}`;

      const updatedReport = await db.valuationReport.update({
        where: { id: input.reportId },
        data: {
          pdfUrl,
        },
      });

      await db.auditLog.create({
        data: {
          userId,
          action: "PDF_GENERATED",
          entity: "ValuationReport",
          entityId: report.id,
          reportId: report.id,
          propertyId: report.propertyId,
          metadata: JSON.stringify({ pdfUrl }),
        },
      });

      return {
        pdfUrl,
        report: updatedReport,
      };
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate PDF",
      });
    }
  });
