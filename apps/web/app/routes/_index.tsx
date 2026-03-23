import { json, type MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Bell, Search } from "lucide-react";
import { AppLayout } from "../components/layout";
import { MaterialThumbnail } from "../components/material-thumbnail";
import { apiFetch } from "../lib/api.server";
import { requireUser } from "../lib/session.server";

export const meta: MetaFunction = () => [{ title: "Início | Instituto Criativo" }];

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  const [notifRes, materialsRes] = await Promise.all([
    apiFetch("/api/notifications", undefined, request),
    apiFetch("/api/materials?pageSize=3", undefined, request)
  ]);

  const notifications = notifRes.ok ? await notifRes.json() : [];
  const materials = materialsRes.ok ? (await materialsRes.json()).items : [];

  return json({ notifications: notifications.slice(0, 3), materials });
}

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();

  return (
    <AppLayout title="Início" active="inicio">
      <p className="muted">Acompanhe atualizações da equipe e encontre recursos rapidamente.</p>
      <div className="row quick-actions">
        <Link className="btn btn-primary" to="/materiais">
          <Search size={16} aria-hidden="true" />
          <span>Ir para busca</span>
        </Link>
      </div>

      <div className="section-head section-notifications">
        <h2 className="section-title-tight">Notificações Recentes</h2>
        <Link className="text-link" to="/notificacoes">Ver todas</Link>
      </div>
      {data.notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={18} aria-hidden="true" /> Nenhuma notificação no momento.
        </div>
      ) : (
        <div className="notif-list">
          {data.notifications.map((n: any) => (
            <article className="list-item stack-tight" key={n.id}>
              <div className="between"><strong>{n.title}</strong><span className="time-note">{new Date(n.createdAt).toLocaleString("pt-BR")}</span></div>
              {n.body ? <div className="meta-line"><span>{n.body}</span></div> : null}
            </article>
          ))}
        </div>
      )}

      <div className="section-head section-materials">
        <h2 className="section-title-tight">Últimos Materiais</h2>
        <Link className="text-link" to="/materiais">Abrir catálogo</Link>
      </div>
      {data.materials.length === 0 ? (
        <div className="empty-state">Ainda não há materiais publicados.</div>
      ) : (
        <div className="material-list">
          {data.materials.map((m: any) => (
            <article className="list-item stack-tight" key={m.id}>
              <div className="material-row">
                <MaterialThumbnail type={m.materialType} title={m.title} />
                <div className="stack-tight material-info">
                  <strong>{m.title}</strong>
                  <div className="meta-line"><span>Categoria: {m.categoryName}</span><span>Tags: {(m.tags || []).join(", ") || "Sem tags"}</span></div>
                </div>
                <Link className="btn btn-primary" to={`/materiais/${m.id}`}>Ver</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
