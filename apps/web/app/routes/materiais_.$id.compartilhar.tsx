import { json, redirect, type MetaFunction } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/layout";
import { apiFetch } from "../lib/api.server";
import { requireUser } from "../lib/session.server";

export const meta: MetaFunction = () => [{ title: "Compartilhar Material | Instituto Criativo" }];

type UserOption = {
  id: string;
  name: string;
  role: string;
};

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

  const sharedWithUserId = String(formData.get("sharedWithUserId") || "");
  const permission = String(formData.get("permission") || "view");

  const payload = {
    sharedWithUserId,
    permission,
    message: String(formData.get("message") || "")
  };

  const res = await apiFetch(`/api/materials/${params.id}/share`, { method: "POST", body: JSON.stringify(payload) }, request);
  if (!res.ok) return json({ error: "Não foi possível compartilhar. Tente novamente." }, 400);

  const query = new URLSearchParams({
    share: "success",
    recipient: sharedWithUserId,
    permission
  });

  return redirect(`/materiais/${params.id}?${query.toString()}`);
}

export default function CompartilharMaterialPage() {
  const { material, users } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const normalizedUsers = users as UserOption[];
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(normalizedUsers[0]?.id || "");
  const [permission, setPermission] = useState<"view" | "edit">("view");

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return normalizedUsers;
    return normalizedUsers.filter((user) => user.name.toLowerCase().includes(search));
  }, [normalizedUsers, query]);

  useEffect(() => {
    if (!filteredUsers.some((user) => user.id === selectedUserId)) {
      setSelectedUserId(filteredUsers[0]?.id || "");
    }
  }, [filteredUsers, selectedUserId]);

  const selectedUser = normalizedUsers.find((user) => user.id === selectedUserId);
  const permissionLabel = permission === "edit" ? "editar" : "visualizar";

  return (
    <AppLayout title="Compartilhar Material" active="compartilhamentos">
      <span className="muted title-page-spacing">{material.title}</span>
      <Form method="post" className="stack" aria-label="Compartilhar material com profissional">
        <div className="stack-tight">
          <label htmlFor="userSearch" className="muted">Buscar profissional</label>
          <input
            id="userSearch"
            className="input"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Digite um nome para filtrar..."
            autoComplete="off"
          />
        </div>

        <div className="stack-tight">
          <label htmlFor="sharedWithUserId" className="muted">Profissional</label>
          <select
            id="sharedWithUserId"
            className="select"
            name="sharedWithUserId"
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.currentTarget.value)}
            required
          >
            {filteredUsers.map((u) => <option key={u.id} value={u.id}>{u.name} - {u.role}</option>)}
          </select>
          {filteredUsers.length === 0 ? <p className="muted">Nenhum profissional encontrado para essa busca.</p> : null}
        </div>

        <div className="stack-tight">
          <label htmlFor="permission" className="muted">Permissão</label>
          <select
            id="permission"
            className="select"
            name="permission"
            value={permission}
            onChange={(event) => setPermission(event.currentTarget.value as "view" | "edit")}
          >
            <option value="view">Visualizar</option>
            <option value="edit">Editar</option>
          </select>
        </div>

        <p className="share-summary" aria-live="polite">
          Você vai compartilhar "{material.title}" com {selectedUser?.name || "o profissional selecionado"} com permissão para {permissionLabel}.
        </p>

        <div className="stack-tight"><label htmlFor="message" className="muted">Mensagem</label><textarea id="message" className="textarea" name="message" placeholder="Contextualize o compartilhamento..." /></div>
        <div className="row"><Link className="btn btn-secondary" to={`/materiais/${material.id}`}>Cancelar</Link><button className="btn btn-primary" type="submit" disabled={!selectedUserId}>Confirmar envio</button></div>
        {actionData && "error" in actionData ? <p className="status-error" aria-live="polite">{actionData.error}</p> : null}
      </Form>
    </AppLayout>
  );
}