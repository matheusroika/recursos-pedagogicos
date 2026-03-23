import { json, type MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Share2, UserRound, UsersRound } from "lucide-react";
import { AppLayout } from "../components/layout";
import { apiFetch } from "../lib/api.server";
import { requireUser } from "../lib/session.server";

export const meta: MetaFunction = () => [{ title: "Compartilhamentos | Instituto Criativo" }];

type ShareRow = {
  id: string;
  permission: "view" | "edit";
  message: string | null;
  createdAt: string;
  sharedWithUserId: string;
  sharedWithName: string;
};

export async function loader({ request }: { request: Request }) {
  const user = await requireUser(request);

  const [materialsRes, notificationsRes] = await Promise.all([
    apiFetch("/api/materials?page=1&pageSize=50", undefined, request),
    apiFetch("/api/notifications", undefined, request)
  ]);

  const materials = materialsRes.ok ? (await materialsRes.json()).items : [];
  const notifications = notificationsRes.ok ? await notificationsRes.json() : [];

  const sharedWithMe = notifications
    .filter((n: any) => n.type === "share")
    .map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.body,
      materialId: n.materialId,
      createdAt: n.createdAt,
      isRead: n.isRead
    }));

  const sharedByMe = (
    await Promise.all(
      materials.map(async (m: any) => {
        const materialRes = await apiFetch(`/api/materials/${m.id}`, undefined, request);
        if (!materialRes.ok) return null;

        const material = await materialRes.json();
        if (material.author?.id !== user.id) return null;

        const sharesRes = await apiFetch(`/api/materials/${m.id}/shares`, undefined, request);
        if (!sharesRes.ok) return null;
        const shares = (await sharesRes.json()) as ShareRow[];

        if (shares.length === 0) return null;

        return {
          materialId: m.id,
          title: m.title,
          categoryName: m.categoryName,
          shares
        };
      })
    )
  ).filter(Boolean);

  return json({ sharedWithMe, sharedByMe });
}

export default function CompartilhamentosPage() {
  const { sharedWithMe, sharedByMe } = useLoaderData<typeof loader>();

  return (
    <AppLayout title="Compartilhamentos" active="compartilhamentos">
      <p className="muted">Acompanhe recursos recebidos e materiais que você já distribuiu para a equipe.</p>

      <section className="stack">
        <div className="section-head">
          <h2 className="section-title-tight"><UsersRound size={16} aria-hidden="true" /> Compartilhados comigo</h2>
        </div>

        {sharedWithMe.length === 0 ? (
          <div className="empty-state">Nenhum material foi compartilhado com você até agora.</div>
        ) : (
          <div className="material-list">
            {sharedWithMe.map((share: any) => (
              <article className="list-item stack-tight" key={share.id}>
                <div className="between">
                  <strong>{share.title}</strong>
                  <span className="time-note">{new Date(share.createdAt).toLocaleString("pt-BR")}</span>
                </div>
                {share.message ? <p className="muted">{share.message}</p> : null}
                <div className="row">
                  {share.materialId ? <Link className="btn btn-primary" to={`/materiais/${share.materialId}`}>Abrir material</Link> : null}
                  {!share.isRead ? <span className="chip chip-soft">Não lida</span> : <span className="chip chip-soft">Lida</span>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="stack">
        <div className="section-head">
          <h2 className="section-title-tight"><Share2 size={16} aria-hidden="true" /> Compartilhados por mim</h2>
        </div>

        {sharedByMe.length === 0 ? (
          <div className="empty-state">Você ainda não compartilhou materiais com outros profissionais.</div>
        ) : (
          <div className="material-list">
            {sharedByMe.map((material: any) => (
              <article className="list-item stack-tight" key={material.materialId}>
                <div className="between">
                  <strong>{material.title}</strong>
                  <span className="chip chip-soft">{material.categoryName}</span>
                </div>
                <div className="stack-tight">
                  {material.shares.map((row: any) => (
                    <div className="row" key={row.id} style={{ justifyContent: "space-between" }}>
                      <span><UserRound size={14} aria-hidden="true" /> {row.sharedWithName}</span>
                      <span className="chip chip-soft">Permissão: {row.permission}</span>
                    </div>
                  ))}
                </div>
                <div className="row">
                  <Link className="btn btn-primary" to={`/materiais/${material.materialId}`}>Ver material</Link>
                  <Link className="btn" to={`/materiais/${material.materialId}/compartilhar`}>Gerenciar</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
