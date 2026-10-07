import {api} from "./apiService";
import type {Comprobante,DocumentoComprobante,Empresa,TipoComprobante} from "../types/comprobante";
export const empresa:Empresa={nombre:"FlorArte",direccion:"1 Calle 25-78 Zona1, Quetzaltenango",correo:"jadestrella7@gmail.com",telefono:"+502 3584 7828"};
const parsear=(c:Omit<Comprobante,"documento">&{documento:string|DocumentoComprobante}):Comprobante=>({...c,documento:typeof c.documento==="string"?JSON.parse(c.documento):c.documento});
export const emitirComprobante=async(tipo:TipoComprobante,idOrigen:number)=>parsear((await api.post('/comprobante',{tipo,idOrigen})).data);
export const consultarComprobante=async(id:number)=>parsear((await api.get(`/comprobante/${id}`)).data);
let logo:Promise<string>|undefined;
export function logoEmpresa(){
  if(!logo)logo=fetch('/images/florarte.png').then(async r=>{if(!r.ok)throw new Error('No se pudo cargar el logo de FlorArte.');const blob=await r.blob();return new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('No se pudo leer el logo.'));reader.readAsDataURL(blob);});}).catch(e=>{logo=undefined;throw e;});
  return logo;
}
export function descargarBlob(blob:Blob,nombre:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=nombre;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
