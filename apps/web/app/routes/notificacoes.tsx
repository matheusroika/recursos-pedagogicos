import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { AppLayout } from "../components/layout";
import { apiFetch } from "../lib/api.server";
import { requireUser } from "../lib/session.server";

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  const res = await apiFetch("/api/notifications", undefined, request);
  return json({ notifications: res.ok ? await res.json() : [] });
}

export default function NotificacoesPage() {
  const { notifications } = useLoaderData<typeof loader>();
  return (
    <AppLayout title="Notificacoes" active="notificacoes">
      <div className="row"><div className="chip">Todas</div><div className="chip">Nao lidas</div><div className="chip">Compartilhamentos</div><div className="chip">Publicacoes</div></div>
      {notifications.map((n: any) => (
        <article className="list-item stack-tight" key={n.id}>
          <div className="between"><strong>{n.title}</strong><span className="time-note">{new Date(n.createdAt).toLocaleString("pt-BR")}</span></div>
          {n.body ? <div className="meta-line"><span>{n.body}</span></div> : null}
        </article>
      ))}
    </AppLayout>
  );
}
