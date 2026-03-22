import { json } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { AppLayout } from "../components/layout";
import { apiFetch } from "../lib/api.server";
import { requireUser } from "../lib/session.server";

export async function loader({ request, params }: { request: Request; params: { id?: string } }) {
  await requireUser(request);
  const id = params.id!;
  const [materialRes, sharesRes] = await Promise.all([
    apiFetch(`/api/materials/${id}`, undefined, request),
    apiFetch(`/api/materials/${id}/shares`, undefined, request)
  ]);

  if (!materialRes.ok) throw new Response("Nao encontrado", { status: 404 });

  return json({
    material: await materialRes.json(),
    shares: sharesRes.ok ? await sharesRes.json() : []
  });
}

export default function MaterialDetailPage() {
  const { material, shares } = useLoaderData<typeof loader>();

  return (
    <AppLayout title={material.title} active="materiais">
      <span className="muted title-page-spacing">{material.category?.name} | {material.author?.name}</span>
      <div className="split-2">
        <div className="img-ph">previa do material</div>
        <div className="card card-emphasis stack">
          <span>Tipo: {material.materialType}</span>
          <span>Visibilidade: {material.privacy}</span>
          <span>Status: {material.status}</span>
        </div>
      </div>
      <div className="card">{material.description}</div>
      <div className="row">
        <Link className="btn btn-primary" to={material.externalUrl || "#"}>Abrir</Link>
        <Link className="btn" to={`/materiais/${material.id}/compartilhar`}>Compartilhar</Link>
      </div>
      <h2 className="section-title">Compartilhamentos</h2>
      {shares.map((s: any) => <div className="list-item" key={s.id}>{s.sharedWithName} - {s.permission}</div>)}
    </AppLayout>
  );
}
