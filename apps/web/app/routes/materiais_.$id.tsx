import { json, type MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/layout";
import { MaterialThumbnail } from "../components/material-thumbnail";
import { apiFetch } from "../lib/api.server";
import { requireUser } from "../lib/session.server";

type ShareRow = {
  id: string;
  permission: "view" | "edit";
  message: string | null;
  createdAt: string;
  sharedWithUserId: string;
  sharedWithName: string;
};

type FlashShare = {
  recipientName: string;
  permissionLabel: string;
} | null;

const A_TILDE = String.fromCharCode(227);
const C_CEDILLA = String.fromCharCode(231);
const O_TILDE = String.fromCharCode(245);

const TEXT_NOT_FOUND = `N${A_TILDE}o encontrado`;
const TEXT_PERMISSION = `permiss${A_TILDE}o`;
const TEXT_INFO = `Informa${C_CEDILLA}${O_TILDE}es do Material`;
const TEXT_EMPTY_SHARES = `Este material ainda n${A_TILDE}o foi compartilhado com outros profissionais.`;

export async function loader({ request, params }: { request: Request; params: { id?: string } }) {
  await requireUser(request);
  const id = params.id!;
  const url = new URL(request.url);

  const [materialRes, sharesRes] = await Promise.all([
    apiFetch(`/api/materials/${id}`, undefined, request),
    apiFetch(`/api/materials/${id}/shares`, undefined, request)
  ]);

  if (!materialRes.ok) throw new Response(TEXT_NOT_FOUND, { status: 404 });

  const shares = sharesRes.ok ? ((await sharesRes.json()) as ShareRow[]) : [];

  let flashShare: FlashShare = null;
  const isShareSuccess = url.searchParams.get("share") === "success";
  const recipientId = url.searchParams.get("recipient") || "";
  const permission = url.searchParams.get("permission") || "view";

  if (isShareSuccess) {
    const recipientName = shares.find((row) => row.sharedWithUserId === recipientId)?.sharedWithName || "o profissional selecionado";
    const permissionLabel = permission === "edit" ? "editar" : "visualizar";

    flashShare = {
      recipientName,
      permissionLabel
    };
  }

  return json({
    material: await materialRes.json(),
    shares,
    flashShare
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
  const { material, shares, flashShare } = useLoaderData<typeof loader>();
  const [isToastVisible, setToastVisible] = useState(Boolean(flashShare));

  const toastMessage = useMemo(() => {
    if (!flashShare) return "";
    return `Material compartilhado com sucesso com ${flashShare.recipientName} (${TEXT_PERMISSION}: ${flashShare.permissionLabel}).`;
  }, [flashShare]);

  useEffect(() => {
    if (!flashShare) return;
    const timer = setTimeout(() => setToastVisible(false), 6000);
    return () => clearTimeout(timer);
  }, [flashShare]);

  return (
    <AppLayout title={material.title} active="materiais">
      {flashShare && isToastVisible ? <div className="flash-toast" role="status">{toastMessage}</div> : null}
      <span className="muted title-page-spacing">{material.category?.name} | {material.author?.name}</span>
      <div className="split-2">
        <MaterialThumbnail type={material.materialType} title={material.title} loading="eager" size="detail" />
        <div className="card card-emphasis stack">
          <h2 className="section-title-tight">{TEXT_INFO}</h2>
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
        <div className="empty-state">{TEXT_EMPTY_SHARES}</div>
      ) : (
        shares.map((s: ShareRow) => <div className="list-item" key={s.id}>{s.sharedWithName} - {s.permission}</div>)
      )}
    </AppLayout>
  );
}
