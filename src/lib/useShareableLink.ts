"use client";

import { useCallback } from "react";
import LZString from "lz-string";
import { DocumentInfo, Experiment } from "./types";

interface SharePayload {
  docInfo: DocumentInfo;
  experiments: Experiment[];
}

/** Encodes project data into a URL-safe highly compressed string. */
export function encodeSharePayload(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  return LZString.compressToEncodedURIComponent(json);
}

/** Decodes a compressed or base64 share payload back into project data. Returns null on failure. */
export function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    // First try the new LZString decompression
    const decompressed = LZString.decompressFromEncodedURIComponent(encoded);
    if (decompressed) {
      return JSON.parse(decompressed) as SharePayload;
    }
    
    // Fallback for older legacy base64-only links
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as SharePayload;
  } catch {
    return null;
  }
}

/** Builds the full shareable URL for the current window. */
export function buildShareUrl(payload: SharePayload): string {
  const encoded = encodeSharePayload(payload);
  const base =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "";
  return `${base}?share=${encoded}`;
}

/** Hook — returns a function that copies a compressed URL to the clipboard. */
export function useShareableLink() {
  const copyShareLink = useCallback(
    async (docInfo: DocumentInfo, experiments: Experiment[]): Promise<void> => {
      // Exclude personal student info from the link so it only shares the template
      const sanitizedDocInfo = {
        ...docInfo,
        studentName: "",
        registerNumber: "",
      };
      const url = buildShareUrl({ docInfo: sanitizedDocInfo, experiments });
      await navigator.clipboard.writeText(url);
    },
    []
  );

  return { copyShareLink };
}

/** Reads the ?share= param from the URL and returns decoded data (client-side only). */
export function readShareFromUrl(): SharePayload | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("share");
  if (!encoded) return null;
  return decodeSharePayload(encoded);
}
