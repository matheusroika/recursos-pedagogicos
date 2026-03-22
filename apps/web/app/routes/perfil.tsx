import { json } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { AppLayout } from "../components/layout";
import { apiFetch } from "../lib/api.server";
import { requireUser } from "../lib/session.server";

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
      <Form method="post" className="stack">
        <div className="split-2">
          <div className="stack"><label className="muted">Nome completo</label><input className="input" name="name" defaultValue={profile?.name || ""} /></div>
          <div className="stack"><label className="muted">E-mail</label><input className="input" value={profile?.email || ""} readOnly /></div>
        </div>
        <div className="split-2">
          <div className="stack"><label className="muted">Funcao</label><input className="input" value={profile?.role || ""} readOnly /></div>
          <div className="stack"><label className="muted">Telefone</label><input className="input" name="phone" defaultValue={profile?.phone || ""} /></div>
        </div>
        <div className="stack"><label className="muted">Bio</label><textarea className="textarea" name="bio" defaultValue={profile?.bio || ""} /></div>
        <button className="btn btn-primary" type="submit" disabled={nav.state !== "idle"}>{nav.state === "submitting" ? "Salvando..." : "Salvar alteracoes"}</button>
      </Form>
    </AppLayout>
  );
}
