import { Link } from "@remix-run/react";

export function AppLayout({
  title,
  children,
  active
}: {
  title: string;
  children: React.ReactNode;
  active: "inicio" | "materiais" | "categorias" | "compartilhamentos" | "notificacoes";
}) {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="icon-ph">logo</span>
            <span>Instituto Criativo</span>
          </div>
          <div className="top-actions">
            <Link to="/notificacoes" className="chip chip-soft chip-notifications">Notificacoes</Link>
            <Link to="/perfil" className="chip chip-strong">Perfil</Link>
            <Link to="/materiais/novo" className="chip chip-add">+</Link>
          </div>
        </div>
      </header>
      <main className="layout columns">
        <aside className="menu">
          <Link to="/" className={`menu-item ${active === "inicio" ? "menu-item-active" : ""}`}>Inicio</Link>
          <Link to="/materiais" className={`menu-item ${active === "materiais" ? "menu-item-active" : ""}`}>Materiais</Link>
          <Link to="/categorias-tags" className={`menu-item ${active === "categorias" ? "menu-item-active" : ""}`}>Categorias e Tags</Link>
          <Link to="/materiais" className={`menu-item ${active === "compartilhamentos" ? "menu-item-active" : ""}`}>Compartilhamentos</Link>
          <Link to="/notificacoes" className={`menu-item ${active === "notificacoes" ? "menu-item-active" : ""}`}>Notificacoes</Link>
        </aside>
        <section className="card stack">
          <h1 className="title">{title}</h1>
          {children}
        </section>
      </main>
    </div>
  );
}
