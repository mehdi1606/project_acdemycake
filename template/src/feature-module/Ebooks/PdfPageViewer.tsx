import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist/types/src/display/api';

// The worker is shipped as a static file (same pinned version as the package).
pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ''}/assets/pdfjs/3.11.174/pdf.worker.min.js`;

const GOLD = '#C5912C';

/**
 * Renders an ebook page by page onto <canvas> elements.
 *
 * Ebooks are read-only inside the platform: unlike the browser's own PDF viewer
 * there is no download / print / "save as" button, no text selection and no
 * right-click menu. Pages are drawn only when they scroll near the screen, so a
 * 70-page, 77 MB book stays light on memory.
 */
const PdfPageViewer: React.FC<{
  data: ArrayBuffer;
  zoom: number;
  onPageCount?: (n: number) => void;
  onError?: () => void;
}> = ({ data, zoom, onPageCount, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [ratio, setRatio] = useState(1.414); // height / width of page 1
  const [width, setWidth] = useState(0);

  // Open the document.
  useEffect(() => {
    let cancelled = false;
    // pdf.js takes ownership of the buffer it is given, so pass a copy.
    const task = pdfjsLib.getDocument({ data: new Uint8Array(data.slice(0)), isEvalSupported: false });
    task.promise
      .then(async pdf => {
        if (cancelled) { pdf.destroy(); return; }
        const first = await pdf.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        setRatio(vp.height / vp.width);
        setDoc(pdf);
        onPageCount?.(pdf.numPages);
      })
      .catch(() => { if (!cancelled) onError?.(); });
    return () => { cancelled = true; task.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Track the available width so pages fit the screen.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => setWidth(Math.floor(entries[0].contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pageWidth = Math.max(240, Math.min(width, 980) * zoom);

  return (
    <div
      ref={containerRef}
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
      style={{ width: '100%', userSelect: 'none', WebkitUserSelect: 'none', overflowX: zoom > 1 ? 'auto' : 'hidden' }}
    >
      {doc && width > 0 && Array.from({ length: doc.numPages }, (_, i) => (
        <PdfPage key={i} doc={doc} pageNumber={i + 1} width={pageWidth} ratio={ratio} />
      ))}
    </div>
  );
};

const PdfPage: React.FC<{ doc: PDFDocumentProxy; pageNumber: number; width: number; ratio: number }> = ({
  doc, pageNumber, width, ratio,
}) => {
  const holderRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [height, setHeight] = useState(Math.round(width * ratio));
  const [drawn, setDrawn] = useState(false);

  // Only draw pages that are on (or near) the screen.
  useEffect(() => {
    const el = holderRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '900px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!visible || !canvas) return;
    let task: RenderTask | null = null;
    let cancelled = false;
    doc.getPage(pageNumber).then(page => {
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      const scale = width / base.width;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vp = page.getViewport({ scale: scale * dpr });
      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      setHeight(Math.round(base.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      task = page.render({ canvasContext: ctx, viewport: vp });
      task.promise.then(() => { if (!cancelled) setDrawn(true); }).catch(() => { /* cancelled */ });
    });
    return () => { cancelled = true; task?.cancel(); };
  }, [visible, doc, pageNumber, width]);

  // Free the bitmap of pages far off screen.
  useEffect(() => {
    if (!visible && drawn && canvasRef.current) {
      canvasRef.current.width = 0;
      canvasRef.current.height = 0;
      setDrawn(false);
    }
  }, [visible, drawn]);

  return (
    <div
      ref={holderRef}
      style={{
        position: 'relative', width, height, margin: '0 auto 14px', background: '#fff',
        borderRadius: 6, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      {!drawn && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            border: '3px solid rgba(197,145,44,0.25)', borderTopColor: GOLD, animation: 'spin 0.9s linear infinite',
          }} />
        </div>
      )}
    </div>
  );
};

export default PdfPageViewer;
