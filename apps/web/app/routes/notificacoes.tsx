import { json, type MetaFunction } from "@remix-run/node";
import { Bell, CheckCheck } from "lucide-react";
import { useLoaderData } from "@remix-run/react";
import { AppLayout } from "../components/layout";
import { apiFetch } from "../lib/api.server";
import { requireUser } from "../lib/session.server";

export const meta: MetaFunction = () => [{ title: "Notificações | Instituto Criativo" }];

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  const res = await apiFetch("/api/notifications", undefined, request);
  return json({ notifications: res.ok ? await res.json() : [] });
}

export default function NotificacoesPage() {
  const { notifications } = useLoaderData<typeof loader>();
  return (
    <AppLayout title="Notificações" active="notificacoes">
      <div className="row"><div className="chip">Todas</div><div className="chip">Não lidas</div><div className="chip">Compartilhamentos</div><div className="chip">Publicações</div></div>
      {notifications.length === 0 ? (
        <div className="empty-state"><CheckCheck size={18} aria-hidden="true" /> Tudo certo: sem notificações pendentes.</div>
      ) : (
        <div className="notif-list">
          {notifications.map((n: any) => (
            <article className="list-item stack-tight" key={n.id}>
              <div className="between"><strong><Bell size={14} aria-hidden="true" /> {n.title}</strong><span className="time-note">{new Date(n.createdAt).toLocaleString("pt-BR")}</span></div>
              {n.body ? <div className="meta-line"><span>{n.body}</span></div> : null}
            </article>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
