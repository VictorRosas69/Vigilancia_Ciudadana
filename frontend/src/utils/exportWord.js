import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, BorderStyle, WidthType, ShadingType,
  Header, Footer, PageNumber,
} from 'docx';

const fmt = (date) =>
  new Date(date).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

const fmtShort = (date) =>
  new Date(date).toLocaleDateString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

/** Convierte un data URL base64 PNG a Uint8Array para docx ImageRun */
const base64ToUint8Array = (dataUrl) => {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
};

/** Celda de encabezado de tabla */
const headerCell = (text, widthPct) =>
  new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, size: 18, font: 'Calibri', color: '1E293B' })],
      alignment: AlignmentType.CENTER,
    })],
    shading: { type: ShadingType.SOLID, color: 'EEF2FF' },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    width: { size: widthPct, type: WidthType.PERCENTAGE },
  });

/**
 * Genera y descarga un documento Word formal de petición ciudadana.
 * @param {Object} petition - Objeto petición con firmas
 */
export const exportPetitionWord = async (petition) => {
  const today = new Date().toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  // ── Encabezado del documento ──────────────────────────────────────────────
  const header = new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: 'VIGILANCIA CIUDADANA', bold: true, size: 18, color: '4338CA', font: 'Calibri' }),
          new TextRun({ text: '  |  Plataforma de Reporte de Obras Abandonadas', size: 16, color: '64748B', font: 'Calibri' }),
        ],
        alignment: AlignmentType.CENTER,
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '4338CA' } },
        spacing: { after: 200 },
      }),
    ],
  });

  // ── Pie de página ─────────────────────────────────────────────────────────
  const footer = new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: 'Documento generado por Vigilancia Ciudadana  —  Página ', size: 16, color: '94A3B8', font: 'Calibri' }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '94A3B8', font: 'Calibri' }),
          new TextRun({ text: ' de ', size: 16, color: '94A3B8', font: 'Calibri' }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '94A3B8', font: 'Calibri' }),
        ],
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' } },
      }),
    ],
  });

  // ── Ciudad y fecha ────────────────────────────────────────────────────────
  const cityDate = new Paragraph({
    children: [
      new TextRun({ text: `${petition.city || 'Pasto'}, ${today}`, size: 22, font: 'Calibri', italics: true }),
    ],
    alignment: AlignmentType.RIGHT,
    spacing: { after: 400 },
  });

  // ── Destinatario ──────────────────────────────────────────────────────────
  const recipient = [
    new Paragraph({
      children: [new TextRun({ text: petition.recipientName || 'Señor Alcalde Municipal', bold: true, size: 22, font: 'Calibri' })],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: petition.recipientTitle || 'Alcalde Municipal', size: 22, font: 'Calibri' })],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Municipio de ${petition.city || 'Pasto'}`, size: 22, font: 'Calibri' })],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Su Despacho', size: 22, font: 'Calibri', italics: true })],
      spacing: { after: 400 },
    }),
  ];

  // ── Asunto ────────────────────────────────────────────────────────────────
  const subject = new Paragraph({
    children: [
      new TextRun({ text: 'Asunto: ', bold: true, size: 22, font: 'Calibri' }),
      new TextRun({ text: petition.title, size: 22, font: 'Calibri', underline: {} }),
    ],
    spacing: { after: 400 },
  });

  // ── Saludo ────────────────────────────────────────────────────────────────
  const greeting = new Paragraph({
    children: [
      new TextRun({
        text: `Respetado ${petition.recipientTitle || 'Señor Alcalde'}:`,
        size: 22, font: 'Calibri',
      }),
    ],
    spacing: { after: 300 },
  });

  // ── Cuerpo ────────────────────────────────────────────────────────────────
  const bodyParagraphs = petition.body
    .split('\n')
    .filter(line => line.trim())
    .map(line => new Paragraph({
      children: [new TextRun({ text: line.trim(), size: 22, font: 'Calibri' })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 200 },
      indent: { firstLine: 720 },
    }));

  // ── Petitorio ─────────────────────────────────────────────────────────────
  const petitoryTitle = new Paragraph({
    children: [new TextRun({ text: 'PETITORIO', bold: true, size: 22, font: 'Calibri', color: '4338CA' })],
    spacing: { before: 300, after: 200 },
  });

  const petitoryIntro = new Paragraph({
    children: [new TextRun({
      text: 'En consecuencia, respetuosamente solicitamos a su despacho:',
      size: 22, font: 'Calibri',
    })],
    spacing: { after: 200 },
  });

  const petitoryItems = (petition.requests || []).map((req, i) =>
    new Paragraph({
      children: [
        new TextRun({ text: `${i + 1}. `, bold: true, size: 22, font: 'Calibri', color: '4338CA' }),
        new TextRun({ text: req, size: 22, font: 'Calibri' }),
      ],
      spacing: { after: 160 },
      indent: { left: 360 },
    })
  );

  // ── Cierre ────────────────────────────────────────────────────────────────
  const closing = [
    new Paragraph({
      children: [new TextRun({
        text: 'De los ciudadanos abajo firmantes, quienes esperamos una pronta atención a la presente solicitud.',
        size: 22, font: 'Calibri',
      })],
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 300, after: 200 },
      indent: { firstLine: 720 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Atentamente,', size: 22, font: 'Calibri', italics: true })],
      spacing: { after: 160 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Los Ciudadanos — ${petition.signaturesCount || petition.signatures?.length || 0} Firmantes`,
        bold: true, size: 22, font: 'Calibri',
      })],
      spacing: { after: 600 },
    }),
  ];

  // ── Tabla de firmas ───────────────────────────────────────────────────────
  // Fila de título
  const signaturesTitleRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: 'REGISTRO DE FIRMAS', bold: true, size: 24, font: 'Calibri', color: 'FFFFFF' })],
          alignment: AlignmentType.CENTER,
        })],
        columnSpan: 6,
        shading: { type: ShadingType.SOLID, color: '4338CA' },
        margins: { top: 120, bottom: 120, left: 180, right: 180 },
      }),
    ],
  });

  // Fila de cabecera
  const tableHeader = new TableRow({
    tableHeader: true,
    children: [
      headerCell('N°',                 5),
      headerCell('Nombre completo',   26),
      headerCell('Cédula',            16),
      headerCell('Ciudad',            14),
      headerCell('Firma manuscrita',  24),
      headerCell('Fecha',             15),
    ],
  });

  // Filas de datos
  const rowColor = (i) => i % 2 === 0 ? 'FFFFFF' : 'F8FAFC';

  const signatureRows = await Promise.all(
    (petition.signatures || []).map(async (sig, i) => {
      const bg = rowColor(i);

      // Celda de imagen de firma
      let sigCell;
      if (sig.signatureImage) {
        try {
          const imgData = base64ToUint8Array(sig.signatureImage);
          sigCell = new TableCell({
            children: [new Paragraph({
              children: [new ImageRun({
                data: imgData,
                transformation: { width: 110, height: 40 },
                type: 'png',
              })],
              alignment: AlignmentType.CENTER,
            })],
            shading: { type: ShadingType.SOLID, color: bg },
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            width: { size: 24, type: WidthType.PERCENTAGE },
          });
        } catch {
          sigCell = new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: '(imagen no disponible)', size: 16, font: 'Calibri', color: '94A3B8', italics: true })],
              alignment: AlignmentType.CENTER,
            })],
            shading: { type: ShadingType.SOLID, color: bg },
            margins: { top: 80, bottom: 80, left: 80, right: 80 },
            width: { size: 24, type: WidthType.PERCENTAGE },
          });
        }
      } else {
        sigCell = new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: '—', size: 18, font: 'Calibri', color: '94A3B8' })],
            alignment: AlignmentType.CENTER,
          })],
          shading: { type: ShadingType.SOLID, color: bg },
          margins: { top: 80, bottom: 80, left: 80, right: 80 },
          width: { size: 24, type: WidthType.PERCENTAGE },
        });
      }

      return new TableRow({
        children: [
          // N°
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: String(i + 1), size: 18, font: 'Calibri', color: '4338CA', bold: true })],
              alignment: AlignmentType.CENTER,
            })],
            shading: { type: ShadingType.SOLID, color: bg },
            margins: { top: 80, bottom: 80, left: 80, right: 80 },
            width: { size: 5, type: WidthType.PERCENTAGE },
          }),
          // Nombre
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: sig.name || 'Ciudadano', size: 18, font: 'Calibri' })],
            })],
            shading: { type: ShadingType.SOLID, color: bg },
            margins: { top: 80, bottom: 80, left: 100, right: 80 },
            width: { size: 26, type: WidthType.PERCENTAGE },
          }),
          // Cédula
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: sig.cedula || '—', size: 18, font: 'Calibri', color: '374151' })],
              alignment: AlignmentType.CENTER,
            })],
            shading: { type: ShadingType.SOLID, color: bg },
            margins: { top: 80, bottom: 80, left: 80, right: 80 },
            width: { size: 16, type: WidthType.PERCENTAGE },
          }),
          // Ciudad
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: sig.city || '—', size: 18, font: 'Calibri', color: '64748B' })],
            })],
            shading: { type: ShadingType.SOLID, color: bg },
            margins: { top: 80, bottom: 80, left: 80, right: 80 },
            width: { size: 14, type: WidthType.PERCENTAGE },
          }),
          // Firma manuscrita
          sigCell,
          // Fecha
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: fmtShort(sig.signedAt), size: 18, font: 'Calibri', color: '64748B' })],
              alignment: AlignmentType.CENTER,
            })],
            shading: { type: ShadingType.SOLID, color: bg },
            margins: { top: 80, bottom: 80, left: 80, right: 80 },
            width: { size: 15, type: WidthType.PERCENTAGE },
          }),
        ],
      });
    })
  );

  const signaturesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [signaturesTitleRow, tableHeader, ...signatureRows],
    borders: {
      top:     { style: BorderStyle.SINGLE, size: 4, color: 'C7D2FE' },
      bottom:  { style: BorderStyle.SINGLE, size: 4, color: 'C7D2FE' },
      left:    { style: BorderStyle.SINGLE, size: 4, color: 'C7D2FE' },
      right:   { style: BorderStyle.SINGLE, size: 4, color: 'C7D2FE' },
      insideH: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
      insideV: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
    },
  });

  // ── Nota final ────────────────────────────────────────────────────────────
  const finalNote = new Paragraph({
    children: [
      new TextRun({
        text: `Total de firmas recolectadas: ${petition.signatures?.length || 0} ciudadanos  |  Documento generado el ${today}`,
        size: 18, font: 'Calibri', italics: true, color: '94A3B8',
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' } },
  });

  // ── Construir documento ───────────────────────────────────────────────────
  const doc = new Document({
    numbering: { config: [] },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
            size: { orientation: 'landscape', width: 15840, height: 12240 },
          },
        },
        headers: { default: header },
        footers: { default: footer },
        children: [
          cityDate,
          ...recipient,
          subject,
          greeting,
          ...bodyParagraphs,
          petitoryTitle,
          petitoryIntro,
          ...petitoryItems,
          ...closing,
          signaturesTable,
          finalNote,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const fecha = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `peticion-ciudadana-${fecha}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
