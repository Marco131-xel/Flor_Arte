export const meses = Array.from({length:12},(_,mes)=>new Date(2020,mes,1).toLocaleString("es-GT",{month:"long"}));
export const nombrePeriodo = (value: string) => {
  const [year,month] = value.split("-").map(Number);
  return month ? `${meses[month-1]} de ${year}` : "Todos los períodos";
};
