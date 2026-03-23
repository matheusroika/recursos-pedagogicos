import { json, type MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { AppLayout } from "../components/layout";
import { MaterialThumbnail } from "../components/material-thumbnail";
import { apiFetch } from "../lib/api.server";
import { requireUser } from "../lib/session.server";

export async function loader({ request, params }: { request: Request; params: { id?: string } }) {
  await requireUser(request);
  const id = params.id!;
  const [materialRes, sharesRes] = await Promise.all([
    apiFetch(`/api/materials/${id}`, undefined, request),
    apiFetch(`/api/materials/${id}/shares`, undefined, request)
  ]);

  if (!materialRes.ok) throw new Response("Não encontrado", { status: 404 });

  return json({
    material: await materialRes.json(),
    shares: sharesRes.ok ? await sharesRes.json() : []
  });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    title: data?.material?.title
      ? `${data.material.title} | Instituto Criativo`
      : "Detalhe do Material | Instituto Criativo"
  }
];

export default function MaterialDetailPage() {
  const { material, shares } = useLoaderData<typeof loader>();

  return (
    <AppLayout title={material.title} active="materiais">
      <span className="muted title-page-spacing">{material.category?.name} | {material.author?.name}</span>
      <div className="split-2">
        <MaterialThumbnail type={material.materialType} title={material.title} loading="eager" size="detail" />
        <div className="card card-emphasis stack">
          <h2 className="section-title-tight">Informações do Material</h2>
          <span>Tipo: {material.materialType}</span>
          <span>Visibilidade: {material.privacy}</span>
          <span>Status: {material.status}</span>
          {material.externalUrl ? <a href={material.externalUrl} className="text-link" target="_blank" rel="noreferrer">Abrir recurso externo</a> : null}
        </div>
      </div>
      <div className="card">{material.description}</div>
      <div className="row">
        <Link className="btn btn-primary" to={material.externalUrl || "#"}>Abrir</Link>
        <Link className="btn" to={`/materiais/${material.id}/compartilhar`}>Compartilhar</Link>
      </div>
      <h2 className="section-title">Compartilhamentos</h2>
      {shares.length === 0 ? (
        <div className="empty-state">Este material ainda não foi compartilhado com outros profissionais.</div>
      ) : (
        shares.map((s: any) => <div className="list-item" key={s.id}>{s.sharedWithName} - {s.permission}</div>)
      )}
    </AppLayout>
  );
}

