import { Link, NavLink, useLocation, useRouteLoaderData } from "@remix-run/react";
import {
  Bell,
  BookOpen,
  FolderTree,
  House,
  Plus,
  Share2,
  UserCircle
} from "lucide-react";
import { Brand } from "./brand";

const navItems = [
  { to: "/", label: "Início", key: "inicio", icon: House },
  { to: "/materiais", label: "Materiais", key: "materiais", icon: BookOpen },
  { to: "/categorias-tags", label: "Categorias & Tags", key: "categorias", icon: FolderTree },
  { to: "/compartilhamentos", label: "Compartilhamentos", key: "compartilhamentos", icon: Share2 },
  { to: "/notificacoes", label: "Notificações", key: "notificacoes", icon: Bell }
] as const;

export function AppLayout({
  title,
  children,
  active
}: {
  title: string;
  children: React.ReactNode;
  active: "inicio" | "materiais" | "categorias" | "compartilhamentos" | "notificacoes";
}) {
  const location = useLocation();
  const rootData = useRouteLoaderData("root") as { unreadNotifications?: number } | undefined;
  const showNotificationDot = (rootData?.unreadNotifications || 0) > 0;

  return (
    <div className="shell">
      <a href="#main-content" className="skip-link">Pular para conteúdo principal</a>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand-link" aria-label="Ir para início">
            <Brand compact />
          </Link>
          <div className="top-actions" aria-label="Ações rápidas">
            <Link to="/notificacoes" className="icon-btn" aria-label="Abrir notificações">
              <Bell size={18} aria-hidden="true" />
              {showNotificationDot ? <span className="notification-dot" aria-hidden="true" /> : null}
            </Link>
            <Link to="/perfil" className="chip chip-strong">
              <UserCircle size={16} aria-hidden="true" />
              <span>Perfil</span>
            </Link>
            <Link to="/materiais/novo" className="chip chip-add">
              <Plus size={16} aria-hidden="true" />
              <span>Novo</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="layout columns" id="main-content">
        <aside className="menu" aria-label="Navegação principal">
          <p className="menu-label">Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = active === item.key || location.pathname === item.to;
            return (
              <NavLink
                key={item.key}
                to={item.to}
                className={`menu-item ${isSelected ? "menu-item-active" : ""}`.trim()}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </aside>
        <section className="content-panel stack">
          <h1 className="title page-title">{title}</h1>
          {children}
        </section>
      </main>
    </div>
  );
}
