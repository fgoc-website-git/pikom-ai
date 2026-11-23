import type { Content } from "./engine";
/** Where "view" goes: the slide viewer for presentations, otherwise the PDF itself (or the source write-up). */
export const viewHref = (c: Content) => c.slides?.length ? `/insights/${c.id}` : c.fileUrl || c.url;
/** Same-site PDFs download straight from the link; others go through /api/download so they save as a file. */
export const downloadHref = (c: Content) => !c.fileUrl ? "" : c.fileUrl.startsWith("/") ? c.fileUrl : `/api/download/${c.id}`;
