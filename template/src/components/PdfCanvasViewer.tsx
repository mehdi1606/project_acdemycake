import React, { useEffect, useRef, useState } from 'react';

/**
 * PdfCanvasViewer — reads a PDF inside the page on phones.
 *
 * iOS Safari and Android Chrome cannot display a PDF inside an <iframe>: they
 * show a file name and an "Open" button, which also lets students download it.
 * Here every page is drawn onto a <canvas> with pdf.js (self-hosted in
 * public/vendor/pdfjs), fitted to the screen width. There is no toolbar, no
 * download and no long-press "save image" (canvases do not offer it).
 *
 * Pages are rendered lazily as they approach the viewport, so long PDFs stay light.
 * If pdf.js cannot open the file, `fallback` (the previous viewer) is shown instead.
 */

const PDFJS_BASE = `${process.env.PUBLIC_URL}/vendor/pdfjs`;

let pdfjsPromise: Promise<any> | null = null;
const loadPdfJs = (): Promise<any> => {
  const w = window as any;
  if (w.pdfjsLib) return Promise.resolve(w.pdfjsLib);
  if (!pdfjsPromise) {
    pdfjsPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `${PDFJS_BASE}/pdf.min.js`;
      s.async = true;
      s.onload = () => {
        const lib = (window as any).pdfjsLib;
        if (!lib) { reject(new Error('pdf.js unavailable')); return; }
        lib.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.min.js`;
        resolve(lib);
      };
      s.onerror = () => { pdfjsPromise = null; reject(new Error('pdf.js failed to load')); };
      document.head.appendChild(s);
    });
  }
  return pdfjsPromise;
};

const GOLD = '#C5973E';

interface PageBox { width: number; height: number }

const PdfPage: React.FC<{ doc: any; index: number; box: PageBox; width: number; total: number }> = ({
  doc, index, box, width, total,
}) => {
  const holderRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [drawn, setDrawn] = useState(false);

  // Start rendering when the page comes within ~1.5 screens of the viewport.
  useEffect(() => {
    const el = holderRef.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { setVisible(true); return; }
    const io = new IntersectionObserver(
      entries => { if (entries.some(e => e.isIntersecting)) { setVisible(true); io.disconnect(); } },
      { rootMargin: '1200px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !width || !canvasRef.current) return;
    let cancelled = false;
    let task: any = null;
    doc.getPage(index + 1).then((page: any) => {
      if (cancelled || !canvasRef.current) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const scale = (width / box.width) * dpr;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      task = page.render({ canvasContext: canvas.getContext('2d'), viewport });
      return task.promise.then(() => { if (!cancelled) setDrawn(true); });
    }).catch(() => { /* a single failed page just stays as its placeholder */ });
    return () => { cancelled = true; try { task?.cancel(); } catch { /* already done */ } };
  }, [visible, width, doc, index, box.width]);

  const height = width ? Math.round((box.height / box.width) * width) : 0;

  return (
    <div ref={holderRef} style={{ position: 'relative', width: '100%', marginBottom: 10 }}>
      <div style={{
        position: 'relative', width: '100%', height, borderRadius: 6, overflow: 'hidden',
        background: '#fff', boxShadow: '0 6px 22px rgba(0,0,0,0.35)',
      }}>
        {!drawn && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#f7f4ee,#efe9df)' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', border: '3px solid rgba(197,151,62,0.2)', borderTopColor: GOLD, animation: 'spin 0.9s linear infinite' }} />
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%', opacity: drawn ? 1 : 0, transition: 'opacity .25s' }}
        />
      </div>
      <div style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(222,187,107,0.75)', marginTop: 6 }}>
        {index + 1} / {total}
      </div>
    </div>
  );
};

interface Props {
  url: string;
  title?: string;
  /** Rendered instead when pdf.js cannot open the document. */
  fallback?: React.ReactNode;
}

const PdfCanvasViewer: React.FC<Props> = ({ url, title, fallback }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<any>(null);
  const [boxes, setBoxes] = useState<PageBox[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [width, setWidth] = useState(0);

  // Keep canvases matched to the available width (rotation, resize).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.floor(el.clientWidth));
    measure();
    if (!('ResizeObserver' in window)) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [status]);

  useEffect(() => {
    let cancelled = false;
    let loaded: any = null;
    setStatus('loading'); setDoc(null); setBoxes([]);
    loadPdfJs()
      .then(lib => lib.getDocument({ url, withCredentials: false }).promise)
      .then(async (pdf: any) => {
        loaded = pdf;
        if (cancelled) return;
        const sizes: PageBox[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: 1 });
          sizes.push({ width: vp.width, height: vp.height });
          if (cancelled) return;
        }
        setDoc(pdf); setBoxes(sizes); setStatus('ready');
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; try { loaded?.destroy(); } catch { /* ignore */ } };
  }, [url]);

  if (status === 'error' && fallback) return <>{fallback}</>;

  return (
    <div
      ref={wrapRef}
      aria-label={title || 'PDF'}
      onContextMenu={e => e.preventDefault()}
      style={{ width: '100%', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' } as React.CSSProperties}
    >
      {status === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '56px 0' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid rgba(197,151,62,0.2)', borderTopColor: GOLD, animation: 'spin 0.9s linear infinite' }} />
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 600 }}>Loading PDF…</span>
        </div>
      )}
      {status === 'error' && (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '40px 16px' }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 34, display: 'block', marginBottom: 10, color: '#F87171' }} />
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Unable to load PDF</p>
        </div>
      )}
      {status === 'ready' && doc && width > 0 && boxes.map((box, i) => (
        <PdfPage key={`${url}-${i}`} doc={doc} index={i} box={box} width={width} total={boxes.length} />
      ))}
    </div>
  );
};

export default PdfCanvasViewer;
