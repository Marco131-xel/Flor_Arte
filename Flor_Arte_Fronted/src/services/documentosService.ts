import {isAxiosError} from "axios";
import {api} from "./apiService";
import type {Comprobante,DocumentoComprobante,Empresa,TipoComprobante} from "../types/comprobante";
export const empresa:Empresa={nombre:"FlorArte",direccion:"1 Calle 25-78 Zona1, Quetzaltenango",correo:"jadestrella7@gmail.com",telefono:"+502 3584 7828"};
const parsear=(c:Omit<Comprobante,"documento">&{documento:string|DocumentoComprobante}):Comprobante=>({...c,recibidoEn:Date.now(),documento:typeof c.documento==="string"?JSON.parse(c.documento):c.documento});
export const emitirComprobante=async(tipo:TipoComprobante,idOrigen:number)=>parsear((await api.post('/comprobante',{tipo,idOrigen})).data);
export const consultarComprobante=async(id:number)=>parsear((await api.get(`/comprobante/${id}`)).data);
let logo:Promise<string>|undefined;
export function logoEmpresa(){
  if(!logo)logo=fetch('/images/florarte.png').then(async r=>{if(!r.ok)throw new Error('No se pudo cargar el logo de FlorArte.');const blob=await r.blob();return new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('No se pudo leer el logo.'));reader.readAsDataURL(blob);});}).catch(e=>{logo=undefined;throw e;});
  return logo;
}
export function descargarBlob(blob:Blob,nombre:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=nombre;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}

export const enviarComprobanteCorreo=async(id:number,correo:string)=>
  (await api.post<{message:string}>(`/comprobante/${id}/correo`,{correo})).data;

export const eliminarComprobante=async(id:number)=>{await api.delete(`/comprobante/${id}`);};
export const descargarComprobantePdf=async(id:number)=>{
  try{return (await api.get<Blob>(`/comprobante/${id}/pdf`,{responseType:'blob'})).data;}
  catch(error){
    if(!isAxiosError(error))throw error;
    let mensaje='No se pudo descargar el PDF. Revisa la conexión e intenta nuevamente.';
    if(error.response?.data instanceof Blob){
      try{const data=JSON.parse(await error.response.data.text());if(typeof data.message==='string')mensaje=data.message;}catch{/* Respuesta sin mensaje válido. */}
    }
    throw new Error(mensaje,{cause:error});
  }
};
