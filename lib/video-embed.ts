/**
 * Normalize video URLs for embedding: YouTube, Vimeo, Loom, Google Drive preview,
 * Dailymotion, direct media files, and generic https URLs (iframe attempt + fallback link).
 */

export type ResolvedVideoEmbed = {
  /** iframe `src` when embedding in an iframe is appropriate */
  iframeSrc: string;
  /** Direct file URL for a native `<video>` element (mp4, webm, …) */
  nativeVideoSrc?: string;
  /** YouTube watch URL when the source was YouTube */
  youtubeWatchUrl?: string;
  /** “Open in new tab” — original or canonical page when iframe may not work */
  openInNewTabUrl?: string;
};

function parseYouTubeTimeToSeconds(t: string): number {
  const trimmed = t.trim();
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  let sec = 0;
  const h = trimmed.match(/(\d+)h/);
  const m = trimmed.match(/(\d+)m/);
  const s = trimmed.match(/(\d+)s/);
  if (h) sec += parseInt(h[1], 10) * 3600;
  if (m) sec += parseInt(m[1], 10) * 60;
  if (s) sec += parseInt(s[1], 10);
  if (h || m) return sec;
  const parts = trimmed.split(":").map((x) => parseInt(x, 10));
  if (parts.length >= 2 && parts.every((n) => !Number.isNaN(n))) {
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3)
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return sec;
}

function tryParseYouTube(
  raw: string,
): { videoId: string; start?: number } | null {
  const input = raw.trim();
  if (!input) return null;
  try {
    const u = new URL(input);
    const host = u.hostname.replace(/^www\./, "");
    let videoId: string | undefined;

    if (host === "youtu.be") {
      videoId = u.pathname.split("/").filter(Boolean)[0];
      let start: number | undefined;
      const t =
        u.searchParams.get("t") ?? u.searchParams.get("start");
      if (t) start = parseYouTubeTimeToSeconds(t);
      if (!videoId || videoId.length < 6) return null;
      return { videoId, start };
    }
    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" && parts[1]) videoId = parts[1];
      else if (parts[0] === "shorts" && parts[1]) videoId = parts[1];
      else if (parts[0] === "live" && parts[1]) videoId = parts[1];
      else videoId = u.searchParams.get("v") ?? undefined;
    }

    if (!videoId || videoId.length < 6) return null;

    let start: number | undefined;
    const t =
      u.searchParams.get("t") ??
      u.searchParams.get("start") ??
      u.searchParams.get("time_continue");
    if (t) start = parseYouTubeTimeToSeconds(t);

    return { videoId, start };
  } catch {
    return null;
  }
}

function buildYouTubeNoCookieEmbed(yt: {
  videoId: string;
  start?: number;
}): string {
  const u = new URL(
    `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt.videoId)}`,
  );
  if (yt.start != null && yt.start > 0) {
    u.searchParams.set("start", String(yt.start));
  }
  return u.toString();
}

/** Vimeo watch URL → numeric video id */
function tryParseVimeoId(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0] === "video" && parts[1] && /^\d+$/.test(parts[1]))
      return parts[1];
    if (parts[0] === "channels" || parts[0] === "groups") {
      const last = parts[parts.length - 1];
      if (last && /^\d{6,}$/.test(last)) return last;
    }
    const numeric = parts.find((p) => /^\d{6,}$/.test(p));
    if (numeric) return numeric;
    return null;
  } catch {
    return null;
  }
}

function tryParseLoomEmbed(raw: string): { embed: string; page: string } | null {
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "loom.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0] === "share" && parts[1]) {
      const id = parts[1];
      const origin = `${u.protocol}//${u.hostname}`;
      return {
        embed: `${origin}/embed/${id}`,
        page: raw.trim(),
      };
    }
    if (parts[0] === "embed" && parts[1]) {
      const id = parts[1];
      const origin = `${u.protocol}//${u.hostname}`;
      return {
        embed: raw.trim(),
        page: `${origin}/share/${id}`,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function tryParseGoogleDrivePreview(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "drive.google.com") return null;
    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (!m?.[1]) return null;
    return `https://drive.google.com/file/d/${m[1]}/preview`;
  } catch {
    return null;
  }
}

function tryParseDailymotionEmbed(
  raw: string,
): { embed: string; page: string } | null {
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "dailymotion.com" && host !== "dai.ly") return null;
    if (host === "dai.ly") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (!id) return null;
      return {
        embed: `https://www.dailymotion.com/embed/video/${id}`,
        page: raw.trim(),
      };
    }
    const parts = u.pathname.split("/").filter(Boolean);
    const vi = parts.indexOf("video");
    if (vi >= 0 && parts[vi + 1]) {
      const id = parts[vi + 1];
      return {
        embed: `https://www.dailymotion.com/embed/video/${id}`,
        page: raw.trim(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function isLikelyDirectVideoFile(url: string): boolean {
  const path = url.trim().split("?")[0].toLowerCase();
  return /\.(mp4|webm|ogg|ogv|mov|m4v)$/i.test(path);
}

/**
 * Resolves a stored video URL for embedding in an iframe, native `<video>`, or link fallback.
 */
export function resolveVideoEmbed(url: string): ResolvedVideoEmbed {
  const trimmed = url.trim();
  if (!trimmed) {
    return { iframeSrc: "" };
  }

  const yt = tryParseYouTube(trimmed);
  if (yt) {
    return {
      iframeSrc: buildYouTubeNoCookieEmbed(yt),
      youtubeWatchUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(yt.videoId)}`,
      openInNewTabUrl: trimmed,
    };
  }

  const vimeoId = tryParseVimeoId(trimmed);
  if (vimeoId) {
    return {
      iframeSrc: `https://player.vimeo.com/video/${encodeURIComponent(vimeoId)}`,
      openInNewTabUrl: trimmed,
    };
  }

  const loom = tryParseLoomEmbed(trimmed);
  if (loom) {
    return {
      iframeSrc: loom.embed,
      openInNewTabUrl: loom.page,
    };
  }

  const drivePreview = tryParseGoogleDrivePreview(trimmed);
  if (drivePreview) {
    return {
      iframeSrc: drivePreview,
      openInNewTabUrl: trimmed,
    };
  }

  const dm = tryParseDailymotionEmbed(trimmed);
  if (dm) {
    return {
      iframeSrc: dm.embed,
      openInNewTabUrl: dm.page,
    };
  }

  if (isLikelyDirectVideoFile(trimmed)) {
    return {
      iframeSrc: "",
      nativeVideoSrc: trimmed,
      openInNewTabUrl: /^https?:\/\//i.test(trimmed) ? trimmed : undefined,
    };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return {
      iframeSrc: trimmed,
      openInNewTabUrl: trimmed,
    };
  }

  return {
    iframeSrc: "",
    openInNewTabUrl: trimmed,
  };
}
