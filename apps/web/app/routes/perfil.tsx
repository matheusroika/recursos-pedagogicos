import { json, type MetaFunction } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { AppLayout } from "../components/layout";
import { apiFetch } from "../lib/api.server";
import { requireUser } from "../lib/session.server";

export const meta: MetaFunction = () => [{ title: "Perfil | Instituto Criativo" }];

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  const res = await apiFetch("/api/profile", undefined, request);
  return json({ profile: res.ok ? await res.json() : null });
}

export async function action({ request }: { request: Request }) {
  await requireUser(request);
  const formData = await request.formData();
  const payload = {
    name: String(formData.get("name") || ""),
    phone: String(formData.get("phone") || ""),
    bio: String(formData.get("bio") || "")
  };

  const res = await apiFetch("/api/profile", { method: "PATCH", body: JSON.stringify(payload) }, request);
  return json({ ok: res.ok });
}

export default function PerfilPage() {
  const { profile } = useLoaderData<typeof loader>();
  const nav = useNavigation();

  return (
    <AppLayout title="Perfil" active="inicio">
      <Form method="post" className="stack" aria-label="Editar perfil">
        <div className="split-2">
          <div className="stack-tight"><label htmlFor="name" className="muted">Nome completo</label><input id="name" className="input" name="name" defaultValue={profile?.name || ""} autoComplete="name" /></div>
          <div className="stack-tight"><label htmlFor="email" className="muted">E-mail</label><input id="email" className="input" value={profile?.email || ""} readOnly disabled /></div>
        </div>
        <div className="split-2">
          <div className="stack-tight"><label htmlFor="role" className="muted">Função</label><input id="role" className="input" value={profile?.role || ""} readOnly disabled /></div>
          <div className="stack-tight"><label htmlFor="phone" className="muted">Telefone</label><input id="phone" className="input" name="phone" defaultValue={profile?.phone || ""} type="tel" autoComplete="tel" /></div>
        </div>
        <div className="stack-tight"><label htmlFor="bio" className="muted">Bio</label><textarea id="bio" className="textarea" name="bio" defaultValue={profile?.bio || ""} /></div>
        <button className="btn btn-primary" type="submit" disabled={nav.state !== "idle"}>{nav.state === "submitting" ? "Salvando…" : "Salvar alterações"}</button>
      </Form>
    </AppLayout>
  );
}
