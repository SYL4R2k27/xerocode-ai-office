const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageBreak, PageNumber, LevelFormat, ExternalHyperlink,
  TabStopType, TabStopPosition
} = require("docx");

// ── Brand Colors ──
const PURPLE = "8B5CF6";
const DARK = "0A0A0A";
const DARK2 = "141416";
const GREEN = "22C55E";
const BLUE = "3B82F6";
const AMBER = "F59E0B";
const RED = "EF4444";
const GRAY = "6B7280";
const LIGHT_PURPLE = "EDE9FE";
const LIGHT_BLUE = "DBEAFE";
const LIGHT_GREEN = "D1FAE5";
const LIGHT_AMBER = "FEF3C7";
const LIGHT_RED = "FEE2E2";
const WHITE = "FFFFFF";

const PAGE_W = 12240;
const MARGIN = 1440;
const CONTENT_W = PAGE_W - MARGIN * 2; // 9360

const border = { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0 };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function headerCell(text, width, color = PURPLE) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: color, type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: WHITE, font: "Arial", size: 20 })] })]
  });
}

function cell(text, width, fill = WHITE) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 50, bottom: 50, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text: String(text), font: "Arial", size: 19 })] })]
  });
}

function boldCell(text, width, fill = WHITE) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 50, bottom: 50, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text: String(text), bold: true, font: "Arial", size: 19 })] })]
  });
}

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, children: [new TextRun({ text, font: "Arial" })] });
}

function subheading(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, font: "Arial" })] });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 22, ...opts })]
  });
}

function emptyLine() {
  return new Paragraph({ spacing: { after: 100 }, children: [] });
}

function kpiBox(label, value, color) {
  return new TableCell({
    borders: noBorders,
    width: { size: Math.floor(CONTENT_W / 4), type: WidthType.DXA },
    shading: { fill: color, type: ShadingType.CLEAR },
    margins: { top: 120, bottom: 120, left: 150, right: 150 },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: value, bold: true, font: "Arial", size: 36, color: DARK })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40 }, children: [new TextRun({ text: label, font: "Arial", size: 18, color: GRAY })] }),
    ]
  });
}

// ══════════════════════════════════════════════════════════════
// BUILD DOCUMENT
// ══════════════════════════════════════════════════════════════

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: PURPLE },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: DARK },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [
    // ══════════════════════════════════════════════════════════
    // TITLE PAGE
    // ══════════════════════════════════════════════════════════
    {
      properties: {
        page: { size: { width: PAGE_W, height: 15840 }, margin: { top: 3600, right: MARGIN, bottom: MARGIN, left: MARGIN } }
      },
      children: [
        emptyLine(), emptyLine(), emptyLine(),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "XeroCode", font: "Arial", size: 72, bold: true, color: PURPLE }),
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
          new TextRun({ text: "AI Office Platform", font: "Arial", size: 36, color: GRAY }),
        ]}),
        emptyLine(),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "Питч-презентация и Бизнес-план", font: "Arial", size: 28, color: DARK }),
        ]}),
        emptyLine(), emptyLine(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
          new TextRun({ text: "Команда ИИ вместо одного чат-бота", font: "Arial", size: 24, italics: true, color: GRAY }),
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "Подключи свои ключи \u2014 плати только провайдерам", font: "Arial", size: 24, italics: true, color: GRAY }),
        ]}),
        emptyLine(), emptyLine(), emptyLine(), emptyLine(),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "xerocode.space", font: "Arial", size: 24, color: PURPLE, bold: true }),
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
          new TextRun({ text: "github.com/SYL4R2k27/xerocode-ai-office", font: "Arial", size: 20, color: GRAY }),
        ]}),
        emptyLine(), emptyLine(),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "\u041C\u0430\u0440\u0442 2026 \u0433.", font: "Arial", size: 22, color: GRAY }),
        ]}),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "\u0412\u043B\u0430\u0434\u0438\u043C\u0438\u0440 \u0422\u0438\u0440\u0441\u043A\u0438\u0445", font: "Arial", size: 22, color: GRAY }),
        ]}),
      ]
    },
    // ══════════════════════════════════════════════════════════
    // PAGE 2: PROBLEM → SOLUTION → KPIs
    // ══════════════════════════════════════════════════════════
    {
      properties: {
        page: { size: { width: PAGE_W, height: 15840 }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } }
      },
      headers: {
        default: new Header({ children: [new Paragraph({
          children: [
            new TextRun({ text: "XeroCode \u2014 AI Office Platform", font: "Arial", size: 18, color: PURPLE, bold: true }),
            new TextRun({ text: "\tПитч и Бизнес-план", font: "Arial", size: 18, color: GRAY }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: PURPLE, space: 4 } },
        })] })
      },
      footers: {
        default: new Footer({ children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "xerocode.space \u2014 \u0441\u0442\u0440. ", font: "Arial", size: 16, color: GRAY }),
            new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: GRAY }),
          ]
        })] })
      },
      children: [
        // ── PROBLEM ──
        heading("\u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430"),
        para("AI-\u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B \u0441\u0435\u0439\u0447\u0430\u0441 \u2014 \u044D\u0442\u043E \u0437\u0430\u043C\u043A\u043D\u0443\u0442\u044B\u0435 \u044D\u043A\u043E\u0441\u0438\u0441\u0442\u0435\u043C\u044B. \u041A\u0430\u0436\u0434\u044B\u0439 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440 (OpenAI, Anthropic, Google) \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0441\u0432\u043E\u0439 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441, \u0441\u0432\u043E\u044E \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0443, \u0441\u0432\u043E\u0439 \u0444\u043E\u0440\u043C\u0430\u0442. \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0432\u044B\u043D\u0443\u0436\u0434\u0435\u043D \u0432\u044B\u0431\u0438\u0440\u0430\u0442\u044C \u043E\u0434\u043D\u043E\u0433\u043E."),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: "GPT-5 \u043F\u0438\u0448\u0435\u0442 \u043A\u043E\u0434, \u043D\u043E \u043D\u0435 \u0440\u0438\u0441\u0443\u0435\u0442. Claude \u0430\u043D\u0430\u043B\u0438\u0437\u0438\u0440\u0443\u0435\u0442, \u043D\u043E \u043D\u0435 \u0438\u0441\u043F\u043E\u043B\u043D\u044F\u0435\u0442. Gemini \u0431\u044B\u0441\u0442\u0440\u044B\u0439, \u043D\u043E \u043D\u0435\u0433\u043B\u0443\u0431\u043E\u043A\u0438\u0439.", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: "\u041D\u0435\u0442 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u0430, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u044F\u0435\u0442 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043C\u043E\u0434\u0435\u043B\u0435\u0439 \u0432 \u043A\u043E\u043C\u0430\u043D\u0434\u0443 \u0434\u043B\u044F \u0440\u0435\u0448\u0435\u043D\u0438\u044F \u043E\u0434\u043D\u043E\u0439 \u0437\u0430\u0434\u0430\u0447\u0438.", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0438\u0441\u0442\u044B, \u043A\u043E\u043F\u0438\u0440\u0430\u0439\u0442\u0435\u0440\u044B, \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0438 \u043F\u043B\u0430\u0442\u044F\u0442 \u0437\u0430 5+ \u043F\u043E\u0434\u043F\u0438\u0441\u043E\u043A \u043E\u0434\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E.", font: "Arial", size: 22 })] }),

        // ── SOLUTION ──
        heading("\u0420\u0435\u0448\u0435\u043D\u0438\u0435: XeroCode"),
        para("XeroCode \u2014 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430-\u043E\u0440\u043A\u0435\u0441\u0442\u0440\u0430\u0442\u043E\u0440. \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441\u0442\u0430\u0432\u0438\u0442 \u0446\u0435\u043B\u044C \u2014 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430 \u0440\u0430\u0437\u0431\u0438\u0432\u0430\u0435\u0442 \u0435\u0451 \u043D\u0430 \u0437\u0430\u0434\u0430\u0447\u0438 \u0438 \u0440\u0430\u0441\u043F\u0440\u0435\u0434\u0435\u043B\u044F\u0435\u0442 \u043C\u0435\u0436\u0434\u0443 \u043B\u0443\u0447\u0448\u0438\u043C\u0438 \u043C\u043E\u0434\u0435\u043B\u044F\u043C\u0438:", { bold: true }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: "BYOK (Bring Your Own Key) \u2014 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0430\u0435\u0442 \u0441\u0432\u043E\u0438 API-\u043A\u043B\u044E\u0447\u0438. \u041C\u044B \u043D\u0435 \u043F\u0435\u0440\u0435\u043F\u0440\u043E\u0434\u0430\u0451\u043C \u0434\u043E\u0441\u0442\u0443\u043F.", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: "Mixed-model \u043A\u043E\u043C\u0430\u043D\u0434\u044B \u2014 Claude \u043A\u0430\u043A \u0430\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u043E\u0440 + GPT \u043A\u0430\u043A \u043A\u043E\u0434\u0435\u0440 + Gemini \u043A\u0430\u043A \u0440\u0435\u0432\u044C\u044E\u0435\u0440.", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: "Arena \u2014 \u043C\u043E\u0434\u0435\u043B\u0438 \u0441\u043E\u0440\u0435\u0432\u043D\u0443\u044E\u0442\u0441\u044F \u0438 \u0443\u043B\u0443\u0447\u0448\u0430\u044E\u0442 \u043E\u0442\u0432\u0435\u0442\u044B \u0434\u0440\u0443\u0433 \u0434\u0440\u0443\u0433\u0430 (\u042D\u0432\u043E\u043B\u044E\u0446\u0438\u044F).", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "7 \u043F\u0440\u043E\u0444\u0438\u043B\u044C\u043D\u044B\u0445 \u043F\u0430\u043D\u0435\u043B\u0435\u0439: \u041A\u043E\u0434, \u0414\u0438\u0437\u0430\u0439\u043D, \u0420\u0435\u0441\u0451\u0440\u0447, \u0422\u0435\u043A\u0441\u0442, \u0414\u0430\u043D\u043D\u044B\u0435, \u041C\u0435\u043D\u0435\u0434\u0436\u043C\u0435\u043D\u0442, \u041E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u0438\u0435.", font: "Arial", size: 22 })] }),

        // ── KPIs ──
        heading("KPI \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0430"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [CONTENT_W/4, CONTENT_W/4, CONTENT_W/4, CONTENT_W/4],
          rows: [new TableRow({ children: [
            kpiBox("\u0421\u0442\u0440\u043E\u043A \u043A\u043E\u0434\u0430", "34 000", LIGHT_PURPLE),
            kpiBox("AI \u043C\u043E\u0434\u0435\u043B\u0435\u0439", "430+", LIGHT_BLUE),
            kpiBox("\u041F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440\u043E\u0432", "10", LIGHT_GREEN),
            kpiBox("\u041C\u0430\u0440\u0436\u0430", "81-100%", LIGHT_AMBER),
          ]})]
        }),
        emptyLine(),

        // ── MARKET ──
        new Paragraph({ children: [new PageBreak()] }),
        heading("\u0420\u044B\u043D\u043E\u043A"),
        para("\u0413\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u044B\u0439 \u0440\u044B\u043D\u043E\u043A AI-\u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u043E\u0432: $60B+ \u0432 2026, \u0440\u043E\u0441\u0442 35% \u0432 \u0433\u043E\u0434. \u0420\u043E\u0441\u0441\u0438\u0439\u0441\u043A\u0438\u0439 \u0440\u044B\u043D\u043E\u043A: $2-3B, \u0440\u0430\u0441\u0442\u0451\u0442 \u0431\u044B\u0441\u0442\u0440\u0435\u0435 \u043C\u0438\u0440\u043E\u0432\u043E\u0433\u043E."),

        subheading("\u041A\u043E\u043D\u043A\u0443\u0440\u0435\u043D\u0442\u044B \u0438 \u043D\u0430\u0448\u0438 \u043F\u0440\u0435\u0438\u043C\u0443\u0449\u0435\u0441\u0442\u0432\u0430"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [2200, 1500, 2800, 2860],
          rows: [
            new TableRow({ children: [headerCell("\u041A\u043E\u043D\u043A\u0443\u0440\u0435\u043D\u0442", 2200), headerCell("Stars", 1500), headerCell("\u0427\u0442\u043E \u0434\u0435\u043B\u0430\u0435\u0442", 2800), headerCell("\u041D\u0430\u0448\u0435 \u043F\u0440\u0435\u0438\u043C\u0443\u0449\u0435\u0441\u0442\u0432\u043E", 2860)] }),
            new TableRow({ children: [boldCell("Open WebUI", 2200), cell("128K", 1500), cell("ChatGPT-\u043A\u043B\u043E\u043D, multi-provider", 2800), cell("\u041D\u0435\u0442 \u043C\u0443\u043B\u044C\u0442\u0438-\u0430\u0433\u0435\u043D\u0442\u043E\u0432", 2860, LIGHT_GREEN)] }),
            new TableRow({ children: [boldCell("LobeHub", 2200), cell("72K", 1500), cell("\u041A\u0440\u0430\u0441\u0438\u0432\u044B\u0439 UI, marketplace", 2800), cell("\u041F\u0438\u0432\u043E\u0442\u044F\u0442 \u043A \u043C\u0443\u043B\u044C\u0442\u0438-\u0430\u0433\u0435\u043D\u0442 (\u0443\u0433\u0440\u043E\u0437\u0430!)", 2860, LIGHT_AMBER)] }),
            new TableRow({ children: [boldCell("CrewAI", 2200), cell("46K", 1500), cell("\u041C\u0443\u043B\u044C\u0442\u0438-\u0430\u0433\u0435\u043D\u0442 \u0444\u0440\u0435\u0439\u043C\u0432\u043E\u0440\u043A", 2800), cell("\u041D\u0435\u0442 BYOK, \u0444\u0440\u0435\u0439\u043C\u0432\u043E\u0440\u043A \u043D\u0435 \u043F\u0440\u043E\u0434\u0443\u043A\u0442", 2860, LIGHT_GREEN)] }),
            new TableRow({ children: [boldCell("GitHub Squad", 2200), cell("\u2014", 1500), cell("\u041A\u043E\u043C\u0430\u043D\u0434\u0430 \u0430\u0433\u0435\u043D\u0442\u043E\u0432 \u0432 \u0440\u0435\u043F\u043E", 2800), cell("\u041F\u0440\u0438\u0432\u044F\u0437\u0430\u043D \u043A Copilot, \u043C\u044B \u2014 \u043B\u044E\u0431\u044B\u0435 \u043C\u043E\u0434\u0435\u043B\u0438", 2860, LIGHT_GREEN)] }),
          ]
        }),
        emptyLine(),

        subheading("3 \u043A\u043B\u044E\u0447\u0435\u0432\u044B\u0445 \u043E\u0442\u043B\u0438\u0447\u0438\u044F XeroCode"),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          new TextRun({ text: "BYOK + \u041C\u0443\u043B\u044C\u0442\u0438-\u0430\u0433\u0435\u043D\u0442 ", bold: true, font: "Arial", size: 22 }),
          new TextRun({ text: "\u2014 \u0445\u0430\u0431\u044B \u0434\u0430\u044E\u0442 BYOK \u0431\u0435\u0437 \u043C\u0443\u043B\u044C\u0442\u0438-\u0430\u0433\u0435\u043D\u0442\u043E\u0432; \u0444\u0440\u0435\u0439\u043C\u0432\u043E\u0440\u043A\u0438 \u0434\u0430\u044E\u0442 \u043C\u0443\u043B\u044C\u0442\u0438-\u0430\u0433\u0435\u043D\u0442 \u0431\u0435\u0437 BYOK. \u041C\u044B \u2014 \u043E\u0431\u0430.", font: "Arial", size: 22 }),
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 }, children: [
          new TextRun({ text: "Mixed-model \u043A\u043E\u043C\u0430\u043D\u0434\u044B ", bold: true, font: "Arial", size: 22 }),
          new TextRun({ text: "\u2014 Claude + GPT + Gemini \u0432 \u043E\u0434\u043D\u043E\u043C workflow. \u041D\u0438\u043A\u0442\u043E \u0442\u0430\u043A \u043D\u0435 \u0434\u0435\u043B\u0430\u0435\u0442.", font: "Arial", size: 22 }),
        ]}),
        new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 200 }, children: [
          new TextRun({ text: "Arena (\u042D\u0432\u043E\u043B\u044E\u0446\u0438\u044F) ", bold: true, font: "Arial", size: 22 }),
          new TextRun({ text: "\u2014 \u043C\u043E\u0434\u0435\u043B\u0438 \u0432\u0438\u0434\u044F\u0442 \u043E\u0442\u0432\u0435\u0442\u044B \u0434\u0440\u0443\u0433 \u0434\u0440\u0443\u0433\u0430 \u0438 \u0443\u043B\u0443\u0447\u0448\u0430\u044E\u0442. \u041D\u0438 \u0443 \u043A\u043E\u0433\u043E \u043D\u0435\u0442.", font: "Arial", size: 22 }),
        ]}),

        // ── TARIFFS ──
        new Paragraph({ children: [new PageBreak()] }),
        heading("\u0422\u0430\u0440\u0438\u0444\u044B \u0438 \u0446\u0435\u043D\u044B"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [1800, 1400, 1400, 1400, 1560, 1800],
          rows: [
            new TableRow({ children: [headerCell("\u041F\u043B\u0430\u043D", 1800), headerCell("\u0426\u0435\u043D\u0430", 1400), headerCell("\u0410\u0433\u0435\u043D\u0442\u044B", 1400), headerCell("\u0417\u0430\u0434\u0430\u0447\u0438/\u043C\u0435\u0441", 1400), headerCell("\u0418\u0437\u043E\u0431\u0440.", 1560), headerCell("\u041C\u0430\u0440\u0436\u0430", 1800)] }),
            new TableRow({ children: [boldCell("START", 1800), cell("500\u20BD \u0440\u0430\u0437\u043E\u0432\u043E", 1400), cell("3", 1400), cell("50", 1400), cell("0", 1560), cell("100%", 1800, LIGHT_GREEN)] }),
            new TableRow({ children: [boldCell("PRO", 1800), cell("1 990\u20BD/\u043C\u0435\u0441", 1400), cell("10", 1400), cell("500", 1400), cell("100", 1560), cell("100%", 1800, LIGHT_GREEN)] }),
            new TableRow({ children: [boldCell("PRO PLUS", 1800), cell("5 490\u20BD/\u043C\u0435\u0441", 1400), cell("15", 1400), cell("2 000", 1400), cell("500", 1560), cell("93%", 1800, LIGHT_GREEN)] }),
            new TableRow({ children: [boldCell("ULTIMA", 1800), cell("34 990\u20BD/\u043C\u0435\u0441", 1400), cell("\u221E", 1400), cell("\u221E", 1400), cell("\u221E", 1560), cell("91%", 1800, LIGHT_GREEN)] }),
            new TableRow({ children: [boldCell("CORP 3-5", 1800), cell("89 990\u20BD/\u043C\u0435\u0441", 1400), cell("\u221E", 1400), cell("\u221E", 1400), cell("\u221E", 1560), cell("81%", 1800, LIGHT_AMBER)] }),
          ]
        }),
        emptyLine(),

        // ── FINANCIALS ──
        heading("\u0424\u0438\u043D\u0430\u043D\u0441\u043E\u0432\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C"),
        subheading("\u0420\u0430\u0441\u0445\u043E\u0434\u044B (\u0435\u0436\u0435\u043C\u0435\u0441\u044F\u0447\u043D\u044B\u0435)"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [4000, 2680, 2680],
          rows: [
            new TableRow({ children: [headerCell("\u0421\u0442\u0430\u0442\u044C\u044F", 4000), headerCell("\u0421\u0443\u043C\u043C\u0430", 2680), headerCell("\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439", 2680)] }),
            new TableRow({ children: [cell("Yandex Cloud (\u0441\u0435\u0440\u0432\u0435\u0440)", 4000), cell("2 500\u20BD", 2680), cell("2 CPU, 4 GB RAM", 2680)] }),
            new TableRow({ children: [cell("EU Proxy (HyNet VDS)", 4000), cell("500\u20BD", 2680), cell("\u041D\u0438\u0434\u0435\u0440\u043B\u0430\u043D\u0434\u044B, \u20AC3.5", 2680)] }),
            new TableRow({ children: [cell("\u0414\u043E\u043C\u0435\u043D xerocode.space", 4000), cell("83\u20BD", 2680), cell("1000\u20BD/\u0433\u043E\u0434", 2680)] }),
            new TableRow({ children: [cell("API \u043A\u043B\u044E\u0447\u0438 (100 \u044E\u0437\u0435\u0440\u043E\u0432)", 4000), cell("~38 300\u20BD", 2680), cell("~383\u20BD/PRO+ \u044E\u0437\u0435\u0440", 2680)] }),
            new TableRow({ children: [cell("API \u043A\u043B\u044E\u0447\u0438 (200 \u044E\u0437\u0435\u0440\u043E\u0432)", 4000), cell("~76 600\u20BD", 2680), cell("\u041B\u0438\u043D\u0435\u0439\u043D\u044B\u0439 \u0440\u043E\u0441\u0442", 2680)] }),
            new TableRow({ children: [boldCell("\u0418\u0422\u041E\u0413\u041E (\u0444\u0438\u043A\u0441)", 4000), boldCell("3 083\u20BD/\u043C\u0435\u0441", 2680, LIGHT_BLUE), cell("\u0411\u0435\u0437 API \u043A\u043B\u044E\u0447\u0435\u0439", 2680)] }),
          ]
        }),
        emptyLine(),

        subheading("\u0413\u0440\u0430\u0444\u0438\u043A \u043E\u043A\u0443\u043F\u0430\u0435\u043C\u043E\u0441\u0442\u0438 (100 \u044E\u0437\u0435\u0440\u043E\u0432)"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [1560, 1560, 1560, 1560, 1560, 1560],
          rows: [
            new TableRow({ children: [headerCell("\u041C\u0435\u0441\u044F\u0446", 1560), headerCell("\u042E\u0437\u0435\u0440\u043E\u0432", 1560), headerCell("\u0412\u044B\u0440\u0443\u0447\u043A\u0430", 1560), headerCell("\u0420\u0430\u0441\u0445\u043E\u0434\u044B", 1560), headerCell("\u041F\u0440\u0438\u0431\u044B\u043B\u044C", 1560), headerCell("MRR", 1560)] }),
            new TableRow({ children: [cell("1", 1560), cell("10", 1560), cell("15 900\u20BD", 1560), cell("3 083\u20BD", 1560), cell("12 817\u20BD", 1560, LIGHT_GREEN), cell("15 900\u20BD", 1560)] }),
            new TableRow({ children: [cell("2", 1560), cell("25", 1560), cell("44 750\u20BD", 1560), cell("6 658\u20BD", 1560), cell("38 092\u20BD", 1560, LIGHT_GREEN), cell("44 750\u20BD", 1560)] }),
            new TableRow({ children: [cell("3", 1560), cell("50", 1560), cell("109 500\u20BD", 1560), cell("22 233\u20BD", 1560), cell("87 267\u20BD", 1560, LIGHT_GREEN), cell("109 500\u20BD", 1560)] }),
            new TableRow({ children: [cell("6", 1560), cell("100", 1560), cell("484 400\u20BD", 1560), cell("55 343\u20BD", 1560), cell("429 057\u20BD", 1560, LIGHT_GREEN), cell("484 400\u20BD", 1560)] }),
            new TableRow({ children: [cell("12", 1560), cell("200", 1560), cell("968 800\u20BD", 1560), cell("110 686\u20BD", 1560), boldCell("858 114\u20BD", 1560, LIGHT_GREEN), cell("968 800\u20BD", 1560)] }),
          ]
        }),
        emptyLine(),

        subheading("\u0422\u043E\u0447\u043A\u0430 \u0431\u0435\u0437\u0443\u0431\u044B\u0442\u043E\u0447\u043D\u043E\u0441\u0442\u0438"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [4680, 4680],
          rows: [
            new TableRow({ children: [headerCell("\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u044C", 4680), headerCell("\u0417\u043D\u0430\u0447\u0435\u043D\u0438\u0435", 4680)] }),
            new TableRow({ children: [cell("\u0424\u0438\u043A\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u0440\u0430\u0441\u0445\u043E\u0434\u044B", 4680), cell("3 083\u20BD/\u043C\u0435\u0441", 4680)] }),
            new TableRow({ children: [cell("\u0421\u0440\u0435\u0434\u043D\u0438\u0439 \u0447\u0435\u043A (\u043C\u0438\u043A\u0441 PRO)", 4680), cell("~2 500\u20BD/\u043C\u0435\u0441", 4680)] }),
            new TableRow({ children: [boldCell("\u0422\u043E\u0447\u043A\u0430 \u0431\u0435\u0437\u0443\u0431\u044B\u0442\u043E\u0447\u043D\u043E\u0441\u0442\u0438", 4680), boldCell("2 PRO \u044E\u0437\u0435\u0440\u0430", 4680, LIGHT_GREEN)] }),
            new TableRow({ children: [cell("\u0421 \u0443\u0447\u0451\u0442\u043E\u043C \u0437\u0430\u0440\u043F\u043B\u0430\u0442\u044B (100\u041A)", 4680), cell("52 PRO \u044E\u0437\u0435\u0440\u0430", 4680)] }),
          ]
        }),
        emptyLine(),

        // ── INVESTMENT ──
        new Paragraph({ children: [new PageBreak()] }),
        heading("\u0418\u043D\u0432\u0435\u0441\u0442\u0438\u0446\u0438\u043E\u043D\u043D\u043E\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435"),

        subheading("\u041D\u0430 \u0447\u0442\u043E \u043D\u0443\u0436\u043D\u044B \u0438\u043D\u0432\u0435\u0441\u0442\u0438\u0446\u0438\u0438"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [4000, 2000, 3360],
          rows: [
            new TableRow({ children: [headerCell("\u0421\u0442\u0430\u0442\u044C\u044F", 4000), headerCell("\u0421\u0443\u043C\u043C\u0430", 2000), headerCell("\u041D\u0430 \u0447\u0442\u043E", 3360)] }),
            new TableRow({ children: [cell("API-\u043A\u043B\u044E\u0447\u0438 \u0434\u043B\u044F \u044E\u0437\u0435\u0440\u043E\u0432", 4000), cell("500 000\u20BD", 2000), cell("6 \u043C\u0435\u0441 \u043D\u0430 100 PRO+ \u044E\u0437\u0435\u0440\u043E\u0432", 3360)] }),
            new TableRow({ children: [cell("\u0421\u0435\u0440\u0432\u0435\u0440 \u043F\u043E\u043C\u043E\u0449\u043D\u0435\u0435", 4000), cell("60 000\u20BD", 2000), cell("4 CPU / 8 GB, \u043D\u0430 200+ \u044E\u0437\u0435\u0440\u043E\u0432", 3360)] }),
            new TableRow({ children: [cell("\u041C\u0430\u0440\u043A\u0435\u0442\u0438\u043D\u0433 (Habr, Telegram, YouTube)", 4000), cell("100 000\u20BD", 2000), cell("6 \u043C\u0435\u0441 \u043F\u0440\u043E\u0434\u0432\u0438\u0436\u0435\u043D\u0438\u044F", 3360)] }),
            new TableRow({ children: [cell("\u042E\u041A\u0430\u0441\u0441\u0430 \u0438\u043D\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044F", 4000), cell("30 000\u20BD", 2000), cell("\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430, 54-\u0424\u0417", 3360)] }),
            new TableRow({ children: [cell("\u0420\u0435\u0437\u0435\u0440\u0432", 4000), cell("110 000\u20BD", 2000), cell("\u041D\u0435\u043F\u0440\u0435\u0434\u0432\u0438\u0434\u0435\u043D\u043D\u044B\u0435 \u0440\u0430\u0441\u0445\u043E\u0434\u044B", 3360)] }),
            new TableRow({ children: [boldCell("\u0418\u0422\u041E\u0413\u041E", 4000), boldCell("800 000\u20BD", 2000, LIGHT_PURPLE), boldCell("~$8 500", 3360, LIGHT_PURPLE)] }),
          ]
        }),
        emptyLine(),

        subheading("\u0427\u0442\u043E \u043F\u043E\u043B\u0443\u0447\u0430\u0435\u0442 \u0438\u043D\u0432\u0435\u0441\u0442\u043E\u0440"),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: "\u0413\u043E\u0442\u043E\u0432\u044B\u0439 \u043F\u0440\u043E\u0434\u0443\u043A\u0442 \u0441 34 000 \u0441\u0442\u0440\u043E\u043A \u043A\u043E\u0434\u0430, \u0437\u0430\u0434\u0435\u043F\u043B\u043E\u0435\u043D\u043D\u044B\u0439 \u043D\u0430 xerocode.space", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: "\u041D\u0438\u0437\u043A\u0430\u044F \u0442\u043E\u0447\u043A\u0430 \u0432\u0445\u043E\u0434\u0430 \u2014 2 \u044E\u0437\u0435\u0440\u0430 \u0434\u043E \u0431\u0435\u0437\u0443\u0431\u044B\u0442\u043E\u0447\u043D\u043E\u0441\u0442\u0438", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: "\u041C\u0430\u0440\u0436\u0430 81-100% \u2014 SaaS-\u043C\u043E\u0434\u0435\u043B\u044C \u0441 \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u043C\u0438 \u0440\u0430\u0441\u0445\u043E\u0434\u0430\u043C\u0438 \u043D\u0430 \u0438\u043D\u0444\u0440\u0443", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text: "\u0423\u043D\u0438\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u0444\u0438\u0447\u0438 (Arena, Mixed-model) \u0431\u0435\u0437 \u0430\u043D\u0430\u043B\u043E\u0433\u043E\u0432 \u043D\u0430 \u0440\u044B\u043D\u043A\u0435", font: "Arial", size: 22 })] }),
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 200 }, children: [new TextRun({ text: "\u041E\u043A\u0443\u043F\u0430\u0435\u043C\u043E\u0441\u0442\u044C 3-6 \u043C\u0435\u0441\u044F\u0446\u0435\u0432 \u043F\u0440\u0438 100 \u044E\u0437\u0435\u0440\u0430\u0445", font: "Arial", size: 22 })] }),

        // ── RISKS ──
        subheading("\u0420\u0438\u0441\u043A\u0438 \u0438 \u043C\u0438\u0442\u0438\u0433\u0430\u0446\u0438\u044F"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [2800, 1200, 5360],
          rows: [
            new TableRow({ children: [headerCell("\u0420\u0438\u0441\u043A", 2800), headerCell("\u0423\u0440\u043E\u0432\u0435\u043D\u044C", 1200), headerCell("\u041C\u0438\u0442\u0438\u0433\u0430\u0446\u0438\u044F", 5360)] }),
            new TableRow({ children: [cell("API \u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u043A\u0430 \u0420\u0424", 2800), cell("\u041D\u0438\u0437\u043A\u0438\u0439", 1200, LIGHT_GREEN), cell("EU proxy \u0443\u0436\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 + OpenRouter + APIyi", 5360)] }),
            new TableRow({ children: [cell("\u041A\u043E\u043D\u043A\u0443\u0440\u0435\u043D\u0442 \u0441\u043A\u043E\u043F\u0438\u0440\u0443\u0435\u0442", 2800), cell("\u0421\u0440\u0435\u0434\u043D\u0438\u0439", 1200, LIGHT_AMBER), cell("\u0411\u044B\u0441\u0442\u0440\u0435\u0435 \u0440\u0435\u043B\u0438\u0437\u0438\u0442\u044C Arena + \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E", 5360)] }),
            new TableRow({ children: [cell("\u0426\u0435\u043D\u044B API \u0432\u044B\u0440\u0430\u0441\u0442\u0443\u0442", 2800), cell("\u0421\u0440\u0435\u0434\u043D\u0438\u0439", 1200, LIGHT_AMBER), cell("\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0435 \u043C\u043E\u0434\u0435\u043B\u0438 (Groq, Gemini, SambaNova) \u043F\u043E\u043A\u0440\u044B\u0432\u0430\u044E\u0442 PRO", 5360)] }),
            new TableRow({ children: [cell("\u042E\u0437\u0435\u0440\u044B \u043D\u0435 \u043F\u0440\u0438\u0434\u0443\u0442", 2800), cell("\u0421\u0440\u0435\u0434\u043D\u0438\u0439", 1200, LIGHT_AMBER), cell("START 500\u20BD + Habr + YouTube + \u0440\u0435\u0444\u0435\u0440\u0430\u043B\u044C\u043D\u0430\u044F", 5360)] }),
          ]
        }),
        emptyLine(),

        // ── ROADMAP ──
        subheading("Roadmap \u043D\u0430 \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0438\u0435 3 \u043C\u0435\u0441\u044F\u0446\u0430"),
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [1800, 5000, 2560],
          rows: [
            new TableRow({ children: [headerCell("\u0421\u0440\u043E\u043A", 1800), headerCell("\u0417\u0430\u0434\u0430\u0447\u0430", 5000), headerCell("KPI", 2560)] }),
            new TableRow({ children: [boldCell("\u041D\u0435\u0434\u0435\u043B\u044F 1", 1800), cell("\u042E\u041A\u0430\u0441\u0441\u0430 + \u043E\u043F\u043B\u0430\u0442\u0430 + OAuth", 5000), cell("\u041F\u0435\u0440\u0432\u044B\u0439 \u043F\u043B\u0430\u0442\u0451\u0436", 2560, LIGHT_GREEN)] }),
            new TableRow({ children: [boldCell("\u041D\u0435\u0434\u0435\u043B\u044F 2", 1800), cell("Email SMTP + \u043A\u0430\u0442\u0430\u043B\u043E\u0433 430+ \u043C\u043E\u0434\u0435\u043B\u0435\u0439", 5000), cell("\u041A\u0430\u0442\u0430\u043B\u043E\u0433 \u0432 UI", 2560)] }),
            new TableRow({ children: [boldCell("\u041D\u0435\u0434\u0435\u043B\u044F 3-4", 1800), cell("Arena (\u0414\u0443\u044D\u043B\u044C + \u042D\u0432\u043E\u043B\u044E\u0446\u0438\u044F + \u0422\u0443\u0440\u043D\u0438\u0440)", 5000), cell("50 \u0431\u0430\u0442\u043B\u043E\u0432", 2560)] }),
            new TableRow({ children: [boldCell("\u041C\u0435\u0441\u044F\u0446 2", 1800), cell("\u041C\u0430\u0440\u043A\u0435\u0442\u043F\u043B\u0435\u0439\u0441 \u043F\u0443\u043B\u043E\u0432 + \u0440\u0435\u0439\u0442\u0438\u043D\u0433 + \u043C\u0430\u0440\u043A\u0435\u0442\u0438\u043D\u0433", 5000), cell("100 \u044E\u0437\u0435\u0440\u043E\u0432", 2560, LIGHT_GREEN)] }),
            new TableRow({ children: [boldCell("\u041C\u0435\u0441\u044F\u0446 3", 1800), cell("Docker + \u043C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433 + \u043C\u0430\u0441\u0448\u0442\u0430\u0431\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435", 5000), cell("200 \u044E\u0437\u0435\u0440\u043E\u0432", 2560, LIGHT_GREEN)] }),
          ]
        }),
        emptyLine(),

        // ── CONTACTS ──
        subheading("\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u044B"),
        para("\u0412\u043B\u0430\u0434\u0438\u043C\u0438\u0440 \u0422\u0438\u0440\u0441\u043A\u0438\u0445", { bold: true }),
        new Paragraph({ spacing: { after: 80 }, children: [
          new ExternalHyperlink({ children: [new TextRun({ text: "https://xerocode.space", style: "Hyperlink", font: "Arial", size: 22 })], link: "https://xerocode.space" }),
        ]}),
        new Paragraph({ spacing: { after: 80 }, children: [
          new ExternalHyperlink({ children: [new TextRun({ text: "github.com/SYL4R2k27/xerocode-ai-office", style: "Hyperlink", font: "Arial", size: 22 })], link: "https://github.com/SYL4R2k27/xerocode-ai-office" }),
        ]}),
        new Paragraph({ spacing: { after: 80 }, children: [
          new ExternalHyperlink({ children: [new TextRun({ text: "npmjs.com/package/xerocode-agent", style: "Hyperlink", font: "Arial", size: 22 })], link: "https://www.npmjs.com/package/xerocode-agent" }),
        ]}),
      ]
    }
  ]
});

// ── GENERATE ──
Packer.toBuffer(doc).then(buffer => {
  const outPath = "/Users/vladimirtirs/Desktop/\u0418\u0418 \u041E\u0424\u0418\u0421 /XeroCode_Pitch_BusinessPlan.docx";
  fs.writeFileSync(outPath, buffer);
  console.log("Created:", outPath, "(" + Math.round(buffer.length / 1024) + " KB)");
});
