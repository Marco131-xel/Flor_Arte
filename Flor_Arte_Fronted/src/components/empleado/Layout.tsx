import PanelLayout from "../shared/PanelLayout";
import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
export default function Layout() { return <PanelLayout Header={Header} Sidebar={Sidebar} Footer={Footer} />; }
