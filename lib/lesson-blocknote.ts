import type { Block, PartialBlock } from "@blocknote/core";

/** Stored at the start of `Lesson.content` when using the block editor. */
export const BLOCKNOTE_MARK = "__BN1__\n";

/** Strip BOM and CRLF so `__BN1__\r\n` (Windows / DB) still matches BlockNote docs. */
export function normalizeBlockNoteRaw(raw: string): string {
  return raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
}

export function isBlockNoteContent(raw: string): boolean {
  return normalizeBlockNoteRaw(raw).startsWith(BLOCKNOTE_MARK);
}

/**
 * If the whole document was once mistaken for Markdown, a paragraph can contain a
 * full `__BN1__\n[...]` string as plain text — unwrap it back into real blocks.
 */
function tryParseEmbeddedPayloadAsBlocks(text: string): Block[] | null {
  const n = normalizeBlockNoteRaw(text).trimStart();
  if (!n.startsWith(BLOCKNOTE_MARK)) return null;
  try {
    const parsed = JSON.parse(n.slice(BLOCKNOTE_MARK.length)) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as Block[];
  } catch {
    return null;
  }
}

function repairMangledBlockNoteParagraphs(blocks: Block[]): Block[] {
  const out: Block[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const b = block as Block & {
      type?: string;
      content?: { type?: string; text?: string }[];
    };
    if (b.type === "paragraph" && Array.isArray(b.content)) {
      const only =
        b.content.length === 1 && b.content[0]?.type === "text"
          ? b.content[0].text
          : null;
      if (typeof only === "string") {
        const embedded = tryParseEmbeddedPayloadAsBlocks(only);
        if (embedded && embedded.length > 0) {
          out.push(...repairMangledBlockNoteParagraphs(embedded));
          continue;
        }
      }
    }
    out.push(block);
  }
  return out;
}

export function parseBlockNoteDocument(raw: string): Block[] | null {
  const normalized = normalizeBlockNoteRaw(raw);
  if (!normalized.startsWith(BLOCKNOTE_MARK)) return null;
  try {
    const parsed = JSON.parse(normalized.slice(BLOCKNOTE_MARK.length)) as unknown;
    if (!Array.isArray(parsed)) return null;
    return repairMangledBlockNoteParagraphs(parsed as Block[]);
  } catch {
    return null;
  }
}

export function serializeBlockNoteDocument(blocks: Block[]): string {
  return BLOCKNOTE_MARK + JSON.stringify(blocks);
}

/** Parse + repair + re-serialize so DB always stores LF after `__BN1__` and no mangled paragraphs. */
export function canonicalizeBlockNoteForStorage(raw: string): string | null {
  if (!isBlockNoteContent(raw)) return null;
  const blocks = parseBlockNoteDocument(raw);
  if (!blocks) return null;
  return serializeBlockNoteDocument(blocks);
}

function walkVideoUrl(block: unknown): string | null {
  if (!block || typeof block !== "object") return null;
  const o = block as Record<string, unknown>;
  if (o.type === "video" && o.props && typeof o.props === "object") {
    const url = (o.props as Record<string, unknown>).url;
    if (typeof url === "string" && url.trim()) return url.trim();
  }
  return null;
}

/** First embedded video URL (for syncing `Lesson.videoUrl`). */
export function extractFirstVideoUrlFromBlocks(blocks: unknown): string | null {
  if (!Array.isArray(blocks)) return null;
  for (const b of blocks) {
    const url = walkVideoUrl(b);
    if (url) return url;
  }
  return null;
}

/**
 * Legacy Markdown lessons → one paragraph so content opens in the block editor.
 */
export function markdownToFallbackBlocks(markdown: string): PartialBlock[] {
  const t =
    markdown.trim() ||
    "Start typing. Press / for paragraph, heading, image, video, lists, quote…";
  return [{ type: "paragraph", content: t }];
}

/** Legacy lesson with optional top-level `videoUrl` → blocks (video block + paragraph). */
export function legacyLessonToBlocks(
  markdown: string,
  videoUrl: string,
): PartialBlock[] {
  const blocks: PartialBlock[] = [];
  const v = videoUrl.trim();
  if (v) {
    blocks.push({
      type: "video",
      props: {
        url: v,
        name: "",
        caption: "",
        showPreview: true,
        textAlignment: "left",
        backgroundColor: "default",
      },
    });
  }
  blocks.push(...markdownToFallbackBlocks(markdown));
  return blocks;
}
