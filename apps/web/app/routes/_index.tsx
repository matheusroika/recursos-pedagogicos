import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { AppLayout } from "../components/layout";
import { apiFetch } from "../lib/api.server";
import { requireUser } from "../lib/session.server";

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
    <AppLayout title="Inicio" active="inicio">
      <p className="muted">Acompanhe atualizacoes da equipe e encontre recursos rapidamente.</p>
      <div className="row search-bar">
        <Link className="btn btn-primary" to="/materiais">Ir para busca</Link>
      </div>
      <div className="section-head section-notifications">
        <h2 className="section-title-tight" style={{ marginBottom: 0 }}>Notificacoes recentes</h2>
        <Link className="text-link" to="/notificacoes">Ver tudo</Link>
      </div>
      {data.notifications.map((n: any) => (
        <article className="list-item stack-tight" key={n.id}>
          <div className="between"><strong>{n.title}</strong><span className="time-note">{new Date(n.createdAt).toLocaleString("pt-BR")}</span></div>
          {n.body ? <div className="meta-line"><span>{n.body}</span></div> : null}
        </article>
      ))}
      <h2 className="section-title-tight section-materials">Ultimos materiais</h2>
      {data.materials.map((m: any) => (
        <article className="list-item stack-tight" key={m.id}>
          <div className="material-row">
            <div className="material-thumb">previa</div>
            <div className="stack-tight">
              <strong>{m.title}</strong>
              <div className="meta-line"><span>Categoria: {m.categoryName}</span><span>Tags: {(m.tags || []).join(", ")}</span></div>
            </div>
            <Link className="btn btn-primary" to={`/materiais/${m.id}`}>Ver</Link>
          </div>
        </article>
      ))}
    </AppLayout>
  );
}
