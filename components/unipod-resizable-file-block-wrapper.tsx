"use client";

/**
 * Fork of BlockNote’s ResizableFileBlockWrapper with a fix: on resize end,
 * `previewWidth` is taken from the wrapper DOM (`ref`) so it isn’t stale when
 * `mouseup` runs before React applies the last `setWidth` (iframes/embeds are
 * especially sensitive to this).
 */
import type { BlockConfig, FileBlockConfig } from "@blocknote/core";
import type {
  MouseEvent as ReactMouseEvent,
  ReactNode,
  TouchEvent as ReactTouchEvent,
} from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileBlockWrapper,
  useSelectedBlocks,
  useUploadLoading,
} from "@blocknote/react";
import type { ReactCustomBlockRenderProps } from "@blocknote/react";

type Props = Omit<
  ReactCustomBlockRenderProps<
    BlockConfig<
      FileBlockConfig["type"],
      FileBlockConfig["propSchema"] & {
        showPreview?: { default: true };
        previewWidth?: { default: number };
        textAlignment?: { default: "left" };
      },
      FileBlockConfig["content"]
    >
  >,
  "contentRef"
> & {
  buttonIcon?: ReactNode;
  children?: ReactNode;
};

export function UnipodResizableFileBlockWrapper(props: Props) {
  const [resizeParams, setResizeParams] = useState<
    | {
        initialWidth: number;
        initialClientX: number;
        handleUsed: "left" | "right";
      }
    | undefined
  >(undefined);

  const [width, setWidth] = useState<number | undefined>(
    props.block.props.previewWidth,
  );
  const [hovered, setHovered] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  const previewWidth = props.block.props.previewWidth;
  const [prevPreviewWidth, setPrevPreviewWidth] = useState(previewWidth);
  if (!resizeParams && previewWidth !== prevPreviewWidth) {
    setPrevPreviewWidth(previewWidth);
    setWidth(previewWidth);
  }

  useEffect(() => {
    const windowMouseMoveHandler = (event: MouseEvent | TouchEvent) => {
      let newWidth: number;

      const clientX =
        "touches" in event ? event.touches[0].clientX : event.clientX;

      if (props.block.props.textAlignment === "center") {
        if (resizeParams!.handleUsed === "left") {
          newWidth =
            resizeParams!.initialWidth +
            (resizeParams!.initialClientX - clientX) * 2;
        } else {
          newWidth =
            resizeParams!.initialWidth +
            (clientX - resizeParams!.initialClientX) * 2;
        }
      } else {
        if (resizeParams!.handleUsed === "left") {
          newWidth =
            resizeParams!.initialWidth + resizeParams!.initialClientX - clientX;
        } else {
          newWidth =
            resizeParams!.initialWidth + clientX - resizeParams!.initialClientX;
        }
      }

      const minWidth = 64;

      setWidth(
        Math.min(
          Math.max(newWidth, minWidth),
          props.editor.domElement?.firstElementChild?.clientWidth ??
            Number.MAX_VALUE,
        ),
      );
    };

    const windowMouseUpHandler = () => {
      setResizeParams(undefined);

      const measured =
        ref.current?.clientWidth ??
        width ??
        props.block.props.previewWidth;

      (props.editor as { updateBlock: (b: unknown, u: unknown) => void }).updateBlock(
        props.block,
        {
          props: {
            previewWidth: measured,
          },
        },
      );
    };

    if (resizeParams) {
      window.addEventListener("mousemove", windowMouseMoveHandler);
      window.addEventListener("touchmove", windowMouseMoveHandler);
      window.addEventListener("mouseup", windowMouseUpHandler);
      window.addEventListener("touchend", windowMouseUpHandler);
    }

    return () => {
      window.removeEventListener("mousemove", windowMouseMoveHandler);
      window.removeEventListener("touchmove", windowMouseMoveHandler);
      window.removeEventListener("mouseup", windowMouseUpHandler);
      window.removeEventListener("touchend", windowMouseUpHandler);
    };
  }, [props, resizeParams, width]);

  const wrapperMouseEnterHandler = useCallback(() => {
    if (props.editor.isEditable) {
      setHovered(true);
    }
  }, [props.editor.isEditable]);

  const wrapperMouseLeaveHandler = useCallback(() => {
    setHovered(false);
  }, []);

  const leftResizeHandleMouseDownHandler = useCallback(
    (event: ReactMouseEvent | ReactTouchEvent) => {
      event.preventDefault();

      const clientX =
        "touches" in event ? event.touches[0].clientX : event.clientX;

      setResizeParams({
        handleUsed: "left",
        initialWidth: ref.current!.clientWidth,
        initialClientX: clientX,
      });
    },
    [],
  );
  const rightResizeHandleMouseDownHandler = useCallback(
    (event: ReactMouseEvent | ReactTouchEvent) => {
      event.preventDefault();

      const clientX =
        "touches" in event ? event.touches[0].clientX : event.clientX;

      setResizeParams({
        handleUsed: "right",
        initialWidth: ref.current!.clientWidth,
        initialClientX: clientX,
      });
    },
    [],
  );

  const showLoader = useUploadLoading(props.block.id);
  const selectedBlocks = useSelectedBlocks(props.editor);
  const isThisBlockSelected = selectedBlocks.some(
    (b) => b.id === props.block.id,
  );

  /** BlockNote defaults `previewWidth` to undefined; upstream used `fit-content`, which makes iframe embeds (YouTube, etc.) stay tiny. Full width matches the lesson layout until the user picks an explicit size. */
  const previewStyle =
    props.block.props.url && !showLoader && props.block.props.showPreview
      ? {
          width: width != null ? `${width}px` : "100%",
          maxWidth: "100%",
          boxSizing: "border-box" as const,
        }
      : undefined;

  const showResizeHandles =
    props.editor.isEditable &&
    (hovered || resizeParams !== undefined || isThisBlockSelected);

  return (
    <FileBlockWrapper
      {...props}
      onMouseEnter={wrapperMouseEnterHandler}
      onMouseLeave={wrapperMouseLeaveHandler}
      style={previewStyle}
    >
      <div
        className="bn-visual-media-wrapper"
        style={{ position: "relative" }}
        ref={ref}
      >
        {props.children}
        {showResizeHandles && (
          <>
            <div
              className="bn-resize-handle"
              style={{ left: "4px" }}
              onMouseDown={leftResizeHandleMouseDownHandler}
              onTouchStart={leftResizeHandleMouseDownHandler}
            />
            <div
              className="bn-resize-handle"
              style={{ right: "4px" }}
              onMouseDown={rightResizeHandleMouseDownHandler}
              onTouchStart={rightResizeHandleMouseDownHandler}
            />
          </>
        )}
        {resizeParams && (
          <div
            style={{
              position: "absolute",
              height: "100%",
              width: "100%",
            }}
          />
        )}
      </div>
    </FileBlockWrapper>
  );
}
