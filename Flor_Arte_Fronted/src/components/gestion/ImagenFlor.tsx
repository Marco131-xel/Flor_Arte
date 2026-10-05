import { useState } from "react";

export default function ImagenFlor({ src, nombre, detalle = false }: { src: string; nombre: string; detalle?: boolean }) {
  const [fallo, setFallo] = useState(false);
  if (fallo) return detalle ? null : <span className="fa-record-icon"><i className="bi bi-flower3" aria-hidden="true" /></span>;
  return <img className={detalle ? "fa-flower-preview" : "fa-flower-thumb"} src={src} alt={detalle ? nombre : ""} loading="lazy" onError={() => setFallo(true)} />;
}
