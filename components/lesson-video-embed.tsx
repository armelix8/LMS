import { resolveVideoEmbed } from "@/lib/video-embed";

export function LessonVideoEmbed({ videoUrl }: { videoUrl: string }) {
  const r = resolveVideoEmbed(videoUrl);

  if (r.nativeVideoSrc) {
    return (
      <div className="mt-6 space-y-3">
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-900/10 dark:ring-white/10">
          <video
            title="Lesson video"
            src={r.nativeVideoSrc}
            controls
            className="h-full w-full"
            preload="metadata"
          />
        </div>
        {r.openInNewTabUrl ? (
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            <a
              href={r.openInNewTabUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sky-600 underline-offset-2 hover:underline dark:text-sky-400"
            >
              Open video URL
            </a>
            <span className="text-slate-500 dark:text-slate-500">
              {" "}
              in a new tab if playback fails.
            </span>
          </p>
        ) : null}
      </div>
    );
  }

  if (!r.iframeSrc) {
    const href = r.openInNewTabUrl ?? videoUrl.trim();
    if (!href) return null;
    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-5 text-center dark:border-slate-700 dark:bg-slate-900/40">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          This link cannot be embedded inline.
        </p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
        >
          Open video link
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-900/10 dark:ring-white/10">
        <iframe
          title="Lesson video"
          src={r.iframeSrc}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      {r.youtubeWatchUrl ? (
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          <a
            href={r.youtubeWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sky-600 underline-offset-2 hover:underline dark:text-sky-400"
          >
            Open in YouTube
          </a>
          <span className="text-slate-500 dark:text-slate-500">
            {" "}
            if the video does not load in your browser.
          </span>
        </p>
      ) : r.openInNewTabUrl ? (
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          <a
            href={r.openInNewTabUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sky-600 underline-offset-2 hover:underline dark:text-sky-400"
          >
            Open video in new tab
          </a>
          <span className="text-slate-500 dark:text-slate-500">
            {" "}
            if the video does not load here.
          </span>
        </p>
      ) : null}
    </div>
  );
}
