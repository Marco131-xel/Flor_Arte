import { useState } from "react";
import type { InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "type"> & { value: string | number };

// Conserva el texto mientras se escribe, aunque el formulario calcule con números.
export default function CampoNumero({ value, onChange, onFocus, ...props }: Props) {
  const [borrador, setBorrador] = useState({ origen: value, texto: String(value) });
  const texto = Object.is(borrador.origen, value) ? borrador.texto : String(value);
  return <input {...props} type="number" value={texto} onFocus={e => {
    if (Number(e.target.value) === 0 && e.target.value !== "") e.target.select();
    onFocus?.(e);
  }} onChange={e => {
    const nuevo = e.target.value.replace(/^0+(?=\d)/, "");
    e.target.value = nuevo;
    setBorrador({ origen: typeof value === "number" ? Number(nuevo) || 0 : nuevo, texto: nuevo });
    onChange?.(e);
  }} />;
}
