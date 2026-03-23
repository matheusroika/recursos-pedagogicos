import { json, type MetaFunction } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { FolderPlus, Hash, Trash2 } from "lucide-react";
import { AppLayout } from "../components/layout";
import { apiFetch } from "../lib/api.server";
import { requireUser } from "../lib/session.server";

export const meta: MetaFunction = () => [{ title: "Categorias e Tags | Instituto Criativo" }];

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  const [categoriesRes, tagsRes] = await Promise.all([
    apiFetch("/api/categories", undefined, request),
    apiFetch("/api/tags", undefined, request)
  ]);
  return json({
    categories: categoriesRes.ok ? await categoriesRes.json() : [],
    tags: tagsRes.ok ? await tagsRes.json() : []
  });
}

export async function action({ request }: { request: Request }) {
  await requireUser(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  if (intent === "create-category") {
    await apiFetch("/api/categories", { method: "POST", body: JSON.stringify({ name: String(formData.get("name") || "") }) }, request);
  }
  if (intent === "create-tag") {
    await apiFetch("/api/tags", { method: "POST", body: JSON.stringify({ name: String(formData.get("name") || "") }) }, request);
  }
  if (intent === "delete-category") {
    const id = String(formData.get("id") || "");
    await apiFetch(`/api/categories/${id}`, { method: "DELETE" }, request);
  }
  if (intent === "delete-tag") {
    const id = String(formData.get("id") || "");
    await apiFetch(`/api/tags/${id}`, { method: "DELETE" }, request);
  }

  return null;
}

export default function CategoriasTagsPage() {
  const { categories, tags } = useLoaderData<typeof loader>();

  return (
    <AppLayout title="Categorias & Tags" active="categorias">
      <p className="muted">Organize taxonomias para facilitar busca, filtro e compartilhamento de materiais.</p>
      <div className="split-2">
        <section className="card card-emphasis stack">
          <h2 className="section-title"><FolderPlus size={16} aria-hidden="true" /> Categorias</h2>
          {categories.length === 0 ? <div className="empty-state">Nenhuma categoria cadastrada.</div> : null}
          {categories.map((c: any) => (
            <Form method="post" key={c.id} className="list-item row" style={{ justifyContent: "space-between" }}>
              <span>{c.name}</span>
              <input type="hidden" name="id" value={c.id} />
              <button className="btn" type="submit" name="intent" value="delete-category" aria-label={`Excluir categoria ${c.name}`}><Trash2 size={15} aria-hidden="true" /> Excluir</button>
            </Form>
          ))}
          <Form method="post" className="row" aria-label="Adicionar nova categoria">
            <input name="name" className="input" placeholder="Nova categoria…" required autoComplete="off" />
            <button className="btn btn-secondary" type="submit" name="intent" value="create-category">Adicionar</button>
          </Form>
        </section>
        <section className="card card-emphasis stack">
          <h2 className="section-title"><Hash size={16} aria-hidden="true" /> Tags</h2>
          {tags.length === 0 ? <div className="empty-state">Nenhuma tag cadastrada.</div> : null}
          {tags.map((t: any) => (
            <Form method="post" key={t.id} className="list-item row" style={{ justifyContent: "space-between" }}>
              <span>{t.name}</span>
              <input type="hidden" name="id" value={t.id} />
              <button className="btn" type="submit" name="intent" value="delete-tag" aria-label={`Excluir tag ${t.name}`}><Trash2 size={15} aria-hidden="true" /> Excluir</button>
            </Form>
          ))}
          <Form method="post" className="row" aria-label="Adicionar nova tag">
            <input name="name" className="input" placeholder="Nova tag…" required autoComplete="off" />
            <button className="btn btn-secondary" type="submit" name="intent" value="create-tag">Adicionar</button>
          </Form>
        </section>
      </div>
      <div className="card muted">Boas práticas: evitar duplicidade, padronizar nomenclaturas e manter tags curtas e objetivas.</div>
    </AppLayout>
  );
}
