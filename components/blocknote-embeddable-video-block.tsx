"use client";

import type { ComponentProps, ReactNode } from "react";
import { createVideoBlockConfig, videoParse } from "@blocknote/core";
import { RiVideoFill } from "react-icons/ri";
import {
  createReactBlockSpec,
  ReactCustomBlockRenderProps,
} from "@blocknote/react";
import {
  FigureWithCaption,
  LinkWithCaption,
  useResolveUrl,
} from "@blocknote/react";
import { UnipodResizableFileBlockWrapper } from "@/components/unipod-resizable-file-block-wrapper";
import { resolveVideoEmbed } from "@/lib/video-embed";

function EmbeddableVideoPreview(
  props: Omit<
    ReactCustomBlockRenderProps<typeof createVideoBlockConfig>,
    "contentRef"
  >,
) {
  const raw = props.block.props.url?.trim() ?? "";
  const resolved = useResolveUrl(raw);
  const r = resolveVideoEmbed(raw);

  if (!raw) {
    return null;
  }

  if (r.nativeVideoSrc) {
    const src =
      resolved.loadingState === "loaded" ? resolved.downloadUrl : raw;
    return (
      <video
        className="bn-visual-media"
        src={src}
        controls
        contentEditable={false}
        draggable={false}
      />
    );
  }

  if (r.iframeSrc) {
    return (
      <iframe
        className="bn-visual-media"
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          height: "auto",
          display: "block",
          border: 0,
        }}
        src={r.iframeSrc}
        title={props.block.props.name?.trim() || "Embedded video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  const href = r.openInNewTabUrl ?? raw;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-indigo-600 underline underline-offset-2 dark:text-indigo-400"
    >
      {props.block.props.name?.trim() || "Open video link"}
    </a>
  );
}

function EmbeddableVideoToExternalHTML(
  props: Omit<
    ReactCustomBlockRenderProps<typeof createVideoBlockConfig>,
    "contentRef"
  >,
) {
  if (!props.block.props.url) {
    return <p>Add video</p>;
  }

  const raw = props.block.props.url.trim();
  const r = resolveVideoEmbed(raw);

  let inner: ReactNode;
  if (props.block.props.showPreview) {
    if (r.nativeVideoSrc) {
      inner = <video src={r.nativeVideoSrc} />;
    } else if (r.iframeSrc) {
      inner = <iframe src={r.iframeSrc} title="Video" />;
    } else {
      inner = (
        <a href={r.openInNewTabUrl ?? raw}>
          {props.block.props.name || r.openInNewTabUrl || raw}
        </a>
      );
    }
  } else {
    inner = (
      <a href={r.openInNewTabUrl ?? raw}>
        {props.block.props.name || r.openInNewTabUrl || raw}
      </a>
    );
  }

  if (props.block.props.caption) {
    return props.block.props.showPreview ? (
      <FigureWithCaption caption={props.block.props.caption}>
        {inner}
      </FigureWithCaption>
    ) : (
      <LinkWithCaption caption={props.block.props.caption}>
        {inner}
      </LinkWithCaption>
    );
  }

  return <>{inner}</>;
}

function EmbeddableVideoBlock(
  props: ReactCustomBlockRenderProps<typeof createVideoBlockConfig>,
) {
  return (
    <UnipodResizableFileBlockWrapper
      {...(props as unknown as ComponentProps<typeof UnipodResizableFileBlockWrapper>)}
      buttonIcon={<RiVideoFill size={24} />}
    >
      <EmbeddableVideoPreview {...props} />
    </UnipodResizableFileBlockWrapper>
  );
}

/** Drop-in replacement for BlockNote’s default video block: supports YouTube, Vimeo, Loom, Drive, and generic URLs — not only `<video src>`. */
export const embeddableReactVideoBlock = createReactBlockSpec(
  createVideoBlockConfig,
  (config) => ({
    render: EmbeddableVideoBlock,
    parse: videoParse(config),
    toExternalHTML: EmbeddableVideoToExternalHTML,
  }),
);
