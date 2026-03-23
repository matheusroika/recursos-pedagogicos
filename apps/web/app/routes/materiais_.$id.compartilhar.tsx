import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { AppLayout } from "../components/layout";
import { apiFetch } from "../lib/api.server";
import { requireUser } from "../lib/session.server";

export async function loader({ request, params }: { request: Request; params: { id?: string } }) {
  await requireUser(request);
  const [materialRes, usersRes] = await Promise.all([
    apiFetch(`/api/materials/${params.id}`, undefined, request),
    apiFetch("/api/users", undefined, request)
  ]);
  if (!materialRes.ok) throw new Response("Não encontrado", { status: 404 });
  const material = await materialRes.json();
  const usersRaw = usersRes.ok ? await usersRes.json() : [];

  return json({ material, users: usersRaw });
}

export async function action({ request, params }: { request: Request; params: { id?: string } }) {
  await requireUser(request);
  const formData = await request.formData();

  const payload = {
    sharedWithUserId: String(formData.get("sharedWithUserId") || ""),
    permission: String(formData.get("permission") || "view"),
    message: String(formData.get("message") || "")
  };

  const res = await apiFetch(`/api/materials/${params.id}/share`, { method: "POST", body: JSON.stringify(payload) }, request);
  if (!res.ok) return json({ error: "Não foi possível compartilhar. Tente novamente." }, 400);

  return redirect(`/materiais/${params.id}`);
}

export default function CompartilharMaterialPage() {
  const { material, users } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <AppLayout title="Compartilhar Material" active="compartilhamentos">
      <span className="muted title-page-spacing">{material.title}</span>
      <Form method="post" className="stack" aria-label="Compartilhar material com profissional">
        <div className="stack-tight">
          <label htmlFor="sharedWithUserId" className="muted">Profissional</label>
          <select id="sharedWithUserId" className="select" name="sharedWithUserId" required>
            {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} - {u.role}</option>)}
          </select>
        </div>
        <div className="stack-tight">
          <label htmlFor="permission" className="muted">Permissão</label>
          <select id="permission" className="select" name="permission"><option value="view">Visualizar</option><option value="edit">Editar</option></select>
        </div>
        <div className="stack-tight"><label htmlFor="message" className="muted">Mensagem</label><textarea id="message" className="textarea" name="message" placeholder="Contextualize o compartilhamento…" /></div>
        <div className="row"><Link className="btn btn-secondary" to={`/materiais/${material.id}`}>Cancelar</Link><button className="btn btn-primary" type="submit">Confirmar envio</button></div>
        {actionData && "error" in actionData ? <p className="status-error" aria-live="polite">{actionData.error}</p> : null}
      </Form>
    </AppLayout>
  );
}
