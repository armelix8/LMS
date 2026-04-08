import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { embeddableReactVideoBlock } from "@/components/blocknote-embeddable-video-block";

/** Default BlockNote schema with a video block that embeds YouTube, Vimeo, Loom, Drive, direct files, and other https URLs. */
export const UNIPOD_BLOCKNOTE_SCHEMA = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    video: embeddableReactVideoBlock(),
  },
});
