import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import { Outlet } from "react-router-dom";
interface Props {
  Header: ComponentType<{ toggleSidebar: () => void; sidebarOpen?: boolean }>;
  Sidebar: ComponentType<{ open: boolean }>;
  Footer: ComponentType;
}
export default function PanelLayout({Header,Sidebar,Footer}:Props) {
  const [movil,setMovil]=useState(()=>window.matchMedia("(max-width: 960px)").matches);
  const [abierto,setAbierto]=useState(()=>!window.matchMedia("(max-width: 960px)").matches);
  const menu=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const media=window.matchMedia("(max-width: 960px)");
    const ajustar=()=>{setMovil(media.matches);setAbierto(!media.matches);};
    media.addEventListener("change",ajustar);
    return ()=>media.removeEventListener("change",ajustar);
  },[]);
  useEffect(()=>{
    if(!movil||!abierto)return;
    const previo=document.activeElement as HTMLElement|null;
    const overflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    menu.current?.querySelector<HTMLElement>('a,button')?.focus();
    const tecla=(e:KeyboardEvent)=>{
      if(e.key==="Escape")setAbierto(false);
      if(e.key==="Tab"){
        const nodos=Array.from(menu.current?.querySelectorAll<HTMLElement>('a[href],button')??[]);
        const first=nodos[0],last=nodos[nodos.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      }
    };
    document.addEventListener("keydown",tecla);
    return ()=>{document.body.style.overflow=overflow;document.removeEventListener("keydown",tecla);previo?.focus();};
  },[movil,abierto]);
  return <div className={`empleado-layout fa-shell ${abierto?"menu-open":"menu-closed"}`}>
    <a href="#contenido-principal" className="fa-skip">Saltar al contenido</a>
    <Header toggleSidebar={()=>setAbierto(v=>!v)} sidebarOpen={abierto}/>
    <div className="empleado-body">
      {movil&&abierto&&<button tabIndex={-1} className="fa-menu-backdrop" aria-label="Cerrar menú" onClick={()=>setAbierto(false)}/>}
      <div ref={menu} className="fa-menu-wrapper" onClick={e=>{if(movil&&(e.target as HTMLElement).closest('a,button'))setAbierto(false);}}><Sidebar open={abierto}/></div>
      <main id="contenido-principal" className="empleado-content" tabIndex={-1}><Outlet/></main>
    </div><Footer/>
  </div>;
}
