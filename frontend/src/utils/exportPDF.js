import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUS_LABELS = {
  pending:    'Pendiente',
  verified:   'Verificado',
  inProgress: 'En progreso',
  resolved:   'Resuelto',
  rejected:   'Rechazado',
  closed:     'Cerrado',
};

const PRIORITY_LABELS = {
  critical: 'Crítica',
  high:     'Alta',
  medium:   'Media',
  low:      'Baja',
};

const WORK_LABELS = {
  road:      'Vía / Carretera',
  sidewalk:  'Andén / Acera',
  park:      'Parque',
  building:  'Edificio',
  drainage:  'Alcantarillado',
  lighting:  'Alumbrado',
  bridge:    'Puente',
  water:     'Agua potable',
  other:     'Otro',
};

// Color indigo principal
const PRIMARY   = [67, 56, 202];   // #4338ca
const DARK      = [30, 41, 59];    // #1e293b
const LIGHT_BG  = [248, 250, 252]; // #f8fafc
const GRAY      = [100, 116, 139]; // #64748b
const WHITE     = [255, 255, 255];

const fmt = (date) =>
  new Date(date).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

/**
 * Genera y descarga un PDF profesional con los reportes.
 * @param {Array}  reports  - Lista de reportes a exportar
 * @param {Object} stats    - Estadísticas generales { reports: { total, pending, inProgress, resolved, rejected } }
 * @param {Object} filters  - Filtros aplicados { status, search }
 * @param {Object} adminUser - Usuario que exporta { name }
 */
export const exportReportsPDF = (reports, stats, filters = {}, adminUser = {}) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();   // 297mm
  const H = doc.internal.pageSize.getHeight();  // 210mm

  // ── Cabecera ──────────────────────────────────────────────────────────────
  // Fondo degradado simulado (rectángulo sólido)
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, W, 32, 'F');

  // Logo cuadrado VC
  doc.setFillColor(...WHITE);
  doc.roundedRect(10, 7, 18, 18, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY);
  doc.text('VC', 19, 18.5, { align: 'center' });

  // Título
  doc.setTextColor(...WHITE);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Vigilancia Ciudadana', 33, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Plataforma de reporte de obras abandonadas — Informe de reportes', 33, 20);

  // Fecha y exportado por (esquina derecha)
  doc.setFontSize(8);
  doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, W - 10, 13, { align: 'right' });
  doc.text(`Exportado por: ${adminUser.name || 'Administrador'}`, W - 10, 19, { align: 'right' });
  if (filters.status || filters.search) {
    const filterText = [
      filters.status ? `Estado: ${STATUS_LABELS[filters.status] || filters.status}` : null,
      filters.search ? `Búsqueda: "${filters.search}"` : null,
    ].filter(Boolean).join('  |  ');
    doc.text(`Filtros: ${filterText}`, W - 10, 25, { align: 'right' });
  }

  // ── Tarjetas de resumen ───────────────────────────────────────────────────
  const summaryY = 40;
  const cards = [
    { label: 'Total reportes',  value: stats?.reports?.total      ?? reports.length, color: PRIMARY },
    { label: 'Pendientes',      value: stats?.reports?.pending     ?? 0,              color: [245, 158, 11] },
    { label: 'En progreso',     value: stats?.reports?.inProgress  ?? 0,              color: [139, 92, 246] },
    { label: 'Resueltos',       value: stats?.reports?.resolved    ?? 0,              color: [34, 197, 94] },
    { label: 'Rechazados',      value: stats?.reports?.rejected    ?? 0,              color: [239, 68, 68] },
  ];

  const cardW = 44;
  const cardH = 20;
  const gap   = 6;
  const startX = (W - (cards.length * cardW + (cards.length - 1) * gap)) / 2;

  cards.forEach((card, i) => {
    const x = startX + i * (cardW + gap);
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(x, summaryY, cardW, cardH, 2, 2, 'F');
    doc.setFillColor(...card.color);
    doc.roundedRect(x, summaryY, 3, cardH, 1, 1, 'F');

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(String(card.value), x + cardW / 2 + 1.5, summaryY + 11, { align: 'center' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(card.label, x + cardW / 2 + 1.5, summaryY + 16.5, { align: 'center' });
  });

  // ── Tabla de reportes ─────────────────────────────────────────────────────
  const tableY = summaryY + cardH + 8;

  const rows = reports.map((r, idx) => [
    idx + 1,
    r.title?.length > 45 ? r.title.substring(0, 45) + '…' : r.title,
    r.author?.name || 'Anónimo',
    [r.location?.neighborhood, r.location?.city].filter(Boolean).join(', ') || '—',
    WORK_LABELS[r.workType]   || r.workType   || '—',
    PRIORITY_LABELS[r.priority] || r.priority || '—',
    STATUS_LABELS[r.status]   || r.status     || '—',
    fmt(r.createdAt),
  ]);

  const priorityColors = {
    'Crítica': [239, 68,  68],
    'Alta':    [249, 115, 22],
    'Media':   [234, 179,  8],
    'Baja':    [156, 163, 175],
  };
  const statusColors = {
    'Pendiente':   [245, 158,  11],
    'Verificado':  [ 6,  182, 212],
    'En progreso': [139,  92, 246],
    'Resuelto':    [ 34, 197,  94],
    'Rechazado':   [239,  68,  68],
    'Cerrado':     [156, 163, 175],
  };

  autoTable(doc, {
    startY: tableY,
    head: [['#', 'Título', 'Autor', 'Ubicación', 'Tipo', 'Prioridad', 'Estado', 'Fecha']],
    body: rows,
    styles: {
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      font: 'helvetica',
      textColor: DARK,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: DARK,
      textColor: WHITE,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: LIGHT_BG,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 68 },
      2: { cellWidth: 30 },
      3: { cellWidth: 38 },
      4: { cellWidth: 28 },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'center', cellWidth: 24 },
      7: { halign: 'center', cellWidth: 22 },
    },
    didParseCell: (data) => {
      // Colorear celdas de Prioridad y Estado
      if (data.section === 'body') {
        if (data.column.index === 5) {
          const col = priorityColors[data.cell.text[0]];
          if (col) {
            data.cell.styles.fillColor = col;
            data.cell.styles.textColor = data.cell.text[0] === 'Media' ? DARK : WHITE;
            data.cell.styles.fontStyle = 'bold';
          }
        }
        if (data.column.index === 6) {
          const col = statusColors[data.cell.text[0]];
          if (col) {
            data.cell.styles.fillColor = col;
            data.cell.styles.textColor = WHITE;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
    margin: { left: 10, right: 10 },
  });

  // ── Pie de página ─────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...LIGHT_BG);
    doc.rect(0, H - 10, W, 10, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text('Vigilancia Ciudadana © 2025 — Documento generado automáticamente', 10, H - 4);
    doc.text(`Página ${i} de ${pageCount}`, W - 10, H - 4, { align: 'right' });
  }

  // ── Descarga ──────────────────────────────────────────────────────────────
  const fecha = new Date().toISOString().split('T')[0];
  doc.save(`vigilancia-ciudadana-reportes-${fecha}.pdf`);
};
