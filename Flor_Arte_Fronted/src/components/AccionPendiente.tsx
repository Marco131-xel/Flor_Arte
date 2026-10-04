import { useId } from "react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className: string;
  mensaje: string;
}

export default function AccionPendiente({ children, className, mensaje }: Props) {
  const avisoId = useId();

  return (
    <div className="d-inline-flex flex-column gap-1">
      <button
        type="button"
        className={className}
        disabled
        aria-describedby={avisoId}
        style={{ opacity: 0.6, cursor: "not-allowed" }}
      >
        {children}
      </button>
      <small id={avisoId} className="text-secondary">{mensaje}</small>
    </div>
  );
}
