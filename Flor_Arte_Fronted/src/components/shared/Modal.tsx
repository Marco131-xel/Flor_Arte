import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export default function Modal({ titulo, children, cerrar, ocupado = false }: { titulo: string; children: ReactNode; cerrar: () => void; ocupado?: boolean }) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const callback = useRef(cerrar);
  useEffect(() => { callback.current = cerrar; }, [cerrar]);
  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => { document.body.style.overflow = overflow; previo?.focus(); };
  }, []);
  return createPortal(
    <div className="fa-overlay" onMouseDown={e => { if (e.target === e.currentTarget && !ocupado) cerrar(); }}>
      <div className="fa-dialog" ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id}
        onKeyDown={e => {
          if (e.key === "Escape" && !ocupado) { e.stopPropagation(); callback.current(); }
          if (e.key === "Tab") {
            const nodos = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? []);
            const first = nodos[0], last = nodos[nodos.length - 1];
            if (!first) { e.preventDefault(); return; }
            if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { e.preventDefault(); first.focus(); }
          }
        }}>
        <header className="fa-dialog-head"><div><span className="fa-eyebrow">FlorArte · Detalle</span><h2 id={id}>{titulo}</h2></div>
          <button type="button" className="fa-icon-button" aria-label="Cerrar ventana" onClick={cerrar} disabled={ocupado}><i className="bi bi-x-lg" aria-hidden="true" /></button>
        </header>
        <div className="fa-dialog-body">{children}</div>
      </div>
    </div>, document.body
  );
}
