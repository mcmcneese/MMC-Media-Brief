import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeightRule,
  ImageRun,
  LevelFormat,
  PageNumber,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import fs from "node:fs";
import path from "node:path";
import type { FormData, MultiSelectValue } from "./types";

// ---- Constants ----
const FONT_NAME = "Montserrat";
const COLOR_TEXT = "1A1A1A";
const COLOR_MUTED = "6B6B6B";
const COLOR_RULE = "E5E2DC";

// DXA / half-point reference
const CONTENT_WIDTH = 9360; // 6.5"
const COL_WIDTH = 4680; // 4.875" each (half of content)
const PAGE_W = 12240;
const PAGE_H = 15840;
const MARGIN = 1440;

// Font sizes (half-points — docx uses these for `size`)
const SIZE_QA = 21; // 10.5pt
const SIZE_SECTION = 28; // 14pt
const SIZE_TITLE = 32; // 16pt
const SIZE_WORDMARK = 22; // 11pt
const SIZE_META = 20; // 10pt
const SIZE_FOOTER = 18; // 9pt

// ---- Helpers ----
function run(text: string, opts: { bold?: boolean; italics?: boolean; color?: string; size?: number } = {}): TextRun {
  return new TextRun({
    text,
    bold: opts.bold,
    italics: opts.italics,
    color: opts.color ?? COLOR_TEXT,
    size: opts.size ?? SIZE_QA,
    font: { name: FONT_NAME, hint: "default" },
  });
}

export function fmtCurrency(n: number): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "";
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function parseIsoDateLocal(iso: string): Date | null {
  if (!iso) return null;
  // Parse "YYYY-MM-DD" as a local date to avoid off-by-one from UTC parsing.
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const [, y, mo, day] = m;
  return new Date(Number(y), Number(mo) - 1, Number(day));
}

// Standard Q&A pair.
export function qa(
  question: string,
  answer: string,
  opts: { italics?: boolean; muted?: boolean } = {}
): Paragraph[] {
  const answerText = answer && answer.trim().length > 0 ? answer : "Not provided";
  const answerIsFallback = !(answer && answer.trim().length > 0);
  const useItalics = opts.italics ?? answerIsFallback;
  const color = opts.muted || answerIsFallback ? COLOR_MUTED : COLOR_TEXT;

  return [
    new Paragraph({
      spacing: { before: 0, after: 60 },
      children: [run(question, { bold: true })],
    }),
    new Paragraph({
      spacing: { before: 0, after: 240 },
      children: [run(answerText, { italics: useItalics, color })],
    }),
  ];
}

// Q&A where the answer is a numbered list (e.g., Top Competitors).
export function qaNumbered(question: string, items: string[]): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      spacing: { before: 0, after: 60 },
      children: [run(question, { bold: true })],
    }),
  ];
  items.forEach((text, i) => {
    const isLast = i === items.length - 1;
    paragraphs.push(
      new Paragraph({
        spacing: { before: 0, after: isLast ? 240 : 40 },
        indent: { left: 0 },
        children: [run(`${i + 1}. ${text && text.trim().length > 0 ? text : "Not provided"}`)],
      })
    );
  });
  return paragraphs;
}

// Q&A where the answer is a bullet list. Uses the "bullets" numbering reference.
export function qaBullets(question: string, items: string[]): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      spacing: { before: 0, after: 60 },
      children: [run(question, { bold: true })],
    }),
  ];
  items.forEach((text, i) => {
    const isLast = i === items.length - 1;
    paragraphs.push(
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { before: 0, after: isLast ? 240 : 40 },
        children: [run(text && text.trim().length > 0 ? text : "Not provided")],
      })
    );
  });
  return paragraphs;
}

// Section header (underlined) + spacer paragraph.
export function sectionHeader(title: string, isFirst = false): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: isFirst ? 0 : 280, after: 80 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_RULE, space: 4 },
      },
      children: [run(title, { bold: true, size: SIZE_SECTION })],
    }),
    new Paragraph({
      spacing: { before: 0, after: 0 },
      children: [run("", { size: SIZE_QA })],
    }),
  ];
}

// ---- Multi-select rendering per spec 10.7 ----
function multiSelectItems(v: MultiSelectValue): string[] {
  const items = [...v.selected.filter((x) => x !== "Other")];
  if (v.selected.includes("Other") && v.other.trim().length > 0) {
    items.push(`Other: ${v.other.trim()}`);
  } else if (v.selected.includes("Other")) {
    items.push("Other");
  }
  return items;
}

function qaMultiSelect(question: string, v: MultiSelectValue): Paragraph[] {
  const items = multiSelectItems(v);
  if (items.length === 0) return qa(question, "");
  if (items.length <= 2) {
    return qa(question, items.join(", "));
  }
  return qaBullets(question, items);
}

// ---- Letterhead block ----
function wordmarkFallbackParagraph(): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 0, after: 0 },
    children: [run("MERCURIUS MEDIA CAPITAL", { bold: true, size: SIZE_WORDMARK })],
  });
}

function logoParagraph(): Paragraph {
  try {
    const pngPath = path.join(process.cwd(), "public", "mmc-logo.png");
    if (!fs.existsSync(pngPath)) {
      return wordmarkFallbackParagraph();
    }
    const buffer = fs.readFileSync(pngPath);
    return new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 0 },
      children: [
        new ImageRun({
          data: buffer,
          transformation: { width: 72, height: 72 },
        }),
      ],
    });
  } catch (err) {
    console.error("[docx] Failed to load logo, using text fallback:", err);
    return wordmarkFallbackParagraph();
  }
}

function letterheadBlock(companyName: string, submissionDate: Date): (Paragraph | Table)[] {
  const borderlessCellBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };

  const leftCell = new TableCell({
    width: { size: COL_WIDTH, type: WidthType.DXA },
    borders: borderlessCellBorders,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    children: [logoParagraph()],
  });

  const rightCell = new TableCell({
    width: { size: COL_WIDTH, type: WidthType.DXA },
    borders: borderlessCellBorders,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 0, after: 0 },
        children: [run("Media Brief", { bold: true, size: SIZE_TITLE })],
      }),
    ],
  });

  const table = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [COL_WIDTH, COL_WIDTH],
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [new TableRow({ children: [leftCell, rightCell] })],
  });

  // Horizontal rule via paragraph bottom border
  const rule = new Paragraph({
    spacing: { before: 80, after: 200 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000", space: 1 },
    },
    children: [run("", { size: 2 })],
  });

  const metaCompany = new Paragraph({
    spacing: { before: 0, after: 40 },
    children: [run(companyName || "—", { color: COLOR_MUTED, size: SIZE_META })],
  });

  const metaDate = new Paragraph({
    spacing: { before: 0, after: 480 },
    children: [
      run(`Submitted ${fmtDate(submissionDate)}`, { color: COLOR_MUTED, size: SIZE_META }),
    ],
  });

  return [table, rule, metaCompany, metaDate];
}

// ---- Main builder ----
export interface GeneratedDoc {
  buffer: Buffer;
  filename: string;
}

export async function generateBriefDocx(data: FormData): Promise<GeneratedDoc> {
  const submissionDate = new Date();

  const children: (Paragraph | Table)[] = [];

  // Letterhead
  children.push(...letterheadBlock(data.companyName, submissionDate));

  // CONTACT INFORMATION
  children.push(...sectionHeader("CONTACT INFORMATION", true));
  children.push(...qa("Primary Contact Name", data.contactName));
  children.push(...qa("Primary Contact Email", data.contactEmail));

  // SECTION 1
  children.push(...sectionHeader("SECTION 1: COMPANY INFORMATION"));
  children.push(...qa("Company Name", data.companyName));
  children.push(...qa("Company Website", data.companyWebsite));
  children.push(...qa("Tell Us About Your Company", data.companyDescription));
  children.push(...qa("What is your USP? (Unique Selling Proposition)", data.usp));
  children.push(
    ...qa(
      "What Are Your Market Differentiators? What Makes You Different than your competitors?",
      data.differentiators
    )
  );
  children.push(
    ...qaNumbered("Top Competitors", [data.competitor1, data.competitor2, data.competitor3])
  );
  children.push(
    ...qa("How much does your product/service cost? Are there different prices?", data.pricing)
  );
  children.push(
    ...qa("Where can your product/service be purchased or delivered?", data.availability)
  );
  children.push(
    ...qaMultiSelect(
      "Is your category subject to any advertising regulations or restrictions?",
      data.regulations
    )
  );
  children.push(
    ...qa("Current LTV (or goal LTV)", data.ltv != null ? fmtCurrency(data.ltv) : "")
  );

  // SECTION 2
  children.push(...sectionHeader("SECTION 2: AUDIENCE DETAILS"));
  children.push(...qa("Target Consumer (Age, Gender, Average HHI)", data.targetConsumer));
  children.push(...qa("Business Type", data.businessType || ""));
  children.push(...qa("Geographic Focus", data.geographicFocus));
  children.push(...qa("Interests and Purchase Habits", data.interestsAndHabits));
  children.push(...qa("Additional Audience Personas", data.additionalPersonas));

  // SECTION 3 — conditional
  children.push(...sectionHeader("SECTION 3: PAST AND PRESENT PAID MEDIA"));
  children.push(...qa("Have you advertised in the past?", data.hasAdvertised || ""));
  if (data.hasAdvertised === "No") {
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 240 },
        children: [
          run("No prior paid media activity reported.", {
            italics: true,
            color: COLOR_MUTED,
          }),
        ],
      })
    );
  } else if (data.hasAdvertised === "Yes") {
    children.push(...qa("Where/with what vendor? How much?", data.pastVendors));
    children.push(...qa("What Worked Well?", data.whatWorked));
    children.push(...qa("What Didn't Work?", data.whatDidntWork));
    children.push(...qa("Where did you Advertise (Geo)?", data.pastGeo));
    children.push(...qaMultiSelect("Creative Formats Used", data.pastCreative));
    children.push(...qa("Goal of Past Media (KPIs, Expected Outcomes)", data.pastGoal));
  }

  // SECTION 4
  children.push(...sectionHeader("SECTION 4: MMC CAMPAIGN SET UP"));
  children.push(...qa("Primary Campaign Goal", data.primaryGoal || ""));
  children.push(...qa("KPIs for Measuring Performance", data.kpis));
  children.push(...qa("Definition of Campaign Success", data.successDefinition));
  children.push(...qa("Tracking Technology in Place", data.trackingTech));
  children.push(...qa("Seasonality and Time-of-Day Considerations", data.seasonality));
  children.push(...qa("Channel Preferences and Channels to Avoid", data.channelPreferences));
  const startDateObj = parseIsoDateLocal(data.startDate);
  const endDateObj = parseIsoDateLocal(data.endDate);
  children.push(
    ...qa("Campaign Start Date", startDateObj ? fmtDate(startDateObj) : "")
  );
  children.push(...qa("Campaign End Date", endDateObj ? fmtDate(endDateObj) : ""));
  children.push(
    ...qa("Ideal Campaign Budget", data.budget != null ? fmtCurrency(data.budget) : "")
  );
  children.push(
    ...qa("Television Commercial Available? (30s and 15s)", data.hasTVCommercial || "")
  );
  children.push(...qa("Standard Digital Display Ads Available?", data.hasDisplayAds || ""));

  // Footer — right-aligned "Mercurius Media Capital | Page X of Y"
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({
            text: "Mercurius Media Capital  |  Page ",
            color: COLOR_MUTED,
            size: SIZE_FOOTER,
            font: { name: FONT_NAME, hint: "default" },
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            color: COLOR_MUTED,
            size: SIZE_FOOTER,
            font: { name: FONT_NAME, hint: "default" },
          }),
          new TextRun({
            text: " of ",
            color: COLOR_MUTED,
            size: SIZE_FOOTER,
            font: { name: FONT_NAME, hint: "default" },
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            color: COLOR_MUTED,
            size: SIZE_FOOTER,
            font: { name: FONT_NAME, hint: "default" },
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    creator: "Mercurius Media Capital",
    title: "MMC Media Brief",
    description: `Media Brief — ${data.companyName}`,
    styles: {
      default: {
        document: {
          run: {
            font: { name: FONT_NAME, hint: "default" },
            size: SIZE_QA,
            color: COLOR_TEXT,
          },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 360, hanging: 360 } },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_W, height: PAGE_H },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        footers: { default: footer },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  const sanitized = (data.companyName || "Company")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const isoDate = submissionDate.toISOString().split("T")[0];
  const filename = `MMC_Brief_${sanitized || "Company"}_${isoDate}.docx`;

  return { buffer: nodeBuffer, filename };
}

// Silence unused warnings for imports kept for type availability.
void HeightRule;
