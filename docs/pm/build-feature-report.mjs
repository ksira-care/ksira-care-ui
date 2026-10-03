/**
 * Renders docs/pm/feature-log.mjs into a Word document for Product.
 * Usage: npm run docs:pm
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { report } from './feature-log.mjs';

const OUTPUT = fileURLToPath(new URL('./Therapist-Portal-Feature-Report.docx', import.meta.url));

// Brand palette, mirrored from src/styles.scss.
const GREEN = '1F4D35';
const MINT = 'E6F4EA';
const BORDER = 'D9D9D9';
const MUTED = '6B7280';
const FONT = 'Arial';

// A4 with 1" margins → 9026 DXA of usable width.
const CONTENT_WIDTH = 9026;

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: BORDER };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

// ── Building blocks ──────────────────────────────────────────

const text = (value, options = {}) => new TextRun({ text: value, font: FONT, ...options });

const para = (value, options = {}) =>
  new Paragraph({ spacing: { after: 120 }, ...options, children: [text(value)] });

const bullet = (children) => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children });

const numbered = (reference, value) =>
  new Paragraph({ numbering: { reference, level: 0 }, children: [text(value)] });

const heading = (value, level, options = {}) =>
  new Paragraph({ heading: level, ...options, children: [text(value)] });

/** Label/value line, e.g. "Status: Built". */
const fact = (label, value) =>
  new Paragraph({
    spacing: { after: 60 },
    children: [text(`${label}: `, { bold: true, color: MUTED }), text(value)],
  });

function table(columns, rows) {
  const widths = columns.map((c) => c.width);
  const cell = (value, width, isHeader) =>
    new TableCell({
      width: { size: width, type: WidthType.DXA },
      borders: cellBorders,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      shading: isHeader ? { fill: MINT, type: ShadingType.CLEAR, color: 'auto' } : undefined,
      children: [new Paragraph({ children: [text(value, { bold: isHeader, size: 20 })] })],
    });

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: columns.map((c) => cell(c.label, c.width, true)) }),
      ...rows.map(
        (row) => new TableRow({ cantSplit: true, children: row.map((value, i) => cell(value, widths[i], false)) }),
      ),
    ],
  });
}

const spacer = () => new Paragraph({ spacing: { after: 120 }, children: [] });

// ── Sections ─────────────────────────────────────────────────

function titleBlock() {
  return [
    new Paragraph({
      spacing: { after: 80 },
      children: [text(report.title, { bold: true, size: 44, color: GREEN })],
    }),
    new Paragraph({ children: [text(report.subtitle, { size: 24, color: MUTED })] }),
    new Paragraph({
      spacing: { after: 240 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GREEN, space: 8 } },
      children: [text(`Last updated: ${report.updated}`, { size: 20, color: MUTED })],
    }),
  ];
}

function howToRead() {
  return [
    heading('How to read this report', HeadingLevel.HEADING_1),
    para(
      'Each feature is described in three parts: the Situation (why it was needed), the Actions (what was built and decided) and the Result (what it delivers today). Decisions, open items and a short demo guide follow each feature.',
    ),
  ];
}

function overview() {
  return [
    heading('At a glance', HeadingLevel.HEADING_1),
    table(
      [
        { label: 'ID', width: 700 },
        { label: 'Feature', width: 2000 },
        { label: 'Status', width: 2126 },
        { label: 'What it delivers', width: 4200 },
      ],
      report.features.map((f) => [f.id, f.name, f.status, f.summary]),
    ),
  ];
}

function questionsForProduct() {
  if (!report.questions?.length) return [];
  return [
    heading('Questions for Product', HeadingLevel.HEADING_1),
    para('Decisions needed from Product, why they matter, and the answer once given.'),
    table(
      [
        { label: '#', width: 680 },
        { label: 'Question', width: 2620 },
        { label: 'Why it matters', width: 2526 },
        { label: 'Answer', width: 2000 },
        { label: 'Raised in', width: 1200 },
      ],
      report.questions.map((q) => [
        q.id,
        q.question,
        q.context,
        q.answer ? `${q.answer} (${q.answeredOn})` : 'Open',
        q.raisedIn,
      ]),
    ),
  ];
}

function featureSection(feature, index) {
  const demoList = `demo-${index}`;
  return {
    demoList,
    children: [
      // Each feature starts on its own page so the report stays easy to scan as it grows.
      heading(`${feature.id} · ${feature.name}`, HeadingLevel.HEADING_1, { pageBreakBefore: true }),
      fact('Status', feature.status),
      fact('Last updated', feature.date),
      spacer(),

      heading('Situation', HeadingLevel.HEADING_2),
      ...feature.situation.map((p) => para(p)),

      heading('Actions', HeadingLevel.HEADING_2),
      ...feature.actions.map((a) => bullet([text(`${a.title}. `, { bold: true }), text(a.detail)])),

      heading('Result', HeadingLevel.HEADING_2),
      ...feature.result.map((r) => bullet([text(r)])),

      heading('Decisions taken', HeadingLevel.HEADING_2),
      table(
        [
          { label: 'Decision', width: 4026 },
          { label: 'Why', width: 5000 },
        ],
        feature.decisions.map((d) => [d.decision, d.reason]),
      ),

      heading('Open items', HeadingLevel.HEADING_2),
      table(
        [
          { label: 'Item', width: 4326 },
          { label: 'Owner', width: 1500 },
          { label: 'Why it matters', width: 3200 },
        ],
        feature.openItems.map((o) => [o.item, o.owner, o.impact]),
      ),

      heading('How to try it', HeadingLevel.HEADING_2),
      ...feature.demo.map((step) => numbered(demoList, step)),
    ],
  };
}

function changelog() {
  return [
    heading('Change log', HeadingLevel.HEADING_1),
    table(
      [
        { label: 'Date', width: 2000 },
        { label: 'Update', width: 7026 },
      ],
      report.changelog.map((c) => [c.date, c.entry]),
    ),
  ];
}

// ── Document ─────────────────────────────────────────────────

const features = report.features.map(featureSection);

const doc = new Document({
  creator: 'Ksira Care Engineering',
  title: report.title,
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 32, bold: true, font: FONT, color: GREEN },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0, keepNext: true },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 26, bold: true, font: FONT, color: GREEN },
        paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1, keepNext: true },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '•',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 }, spacing: { after: 80 } } },
          },
        ],
      },
      // One numbering instance per feature so each demo list restarts at 1.
      ...features.map(({ demoList }) => ({
        reference: demoList,
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 }, spacing: { after: 80 } } },
          },
        ],
      })),
    ],
  },
  sections: [
    {
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [text('Ksira Care · Therapist Portal', { size: 18, color: MUTED })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                text('Page ', { size: 18, color: MUTED }),
                new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: MUTED }),
              ],
            }),
          ],
        }),
      },
      children: [
        ...titleBlock(),
        ...howToRead(),
        ...overview(),
        ...questionsForProduct(),
        ...features.flatMap((f) => f.children),
        ...changelog(),
      ],
    },
  ],
});

await writeFile(OUTPUT, await Packer.toBuffer(doc));
console.log(`Wrote ${OUTPUT}`);
