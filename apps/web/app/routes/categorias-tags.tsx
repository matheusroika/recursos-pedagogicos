import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { AppLayout } from "../components/layout";
import { apiFetch } from "../lib/api.server";
import { requireUser } from "../lib/session.server";

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
    <AppLayout title="Categorias e tags" active="categorias">
      <div className="split-2">
        <section className="card card-emphasis stack">
          <h2 className="section-title">Categorias</h2>
          {categories.map((c: any) => (
            <Form method="post" key={c.id} className="list-item row" style={{ justifyContent: "space-between" }}>
              <span>{c.name}</span>
              <input type="hidden" name="id" value={c.id} />
              <button className="btn" type="submit" name="intent" value="delete-category">Excluir</button>
            </Form>
          ))}
          <Form method="post" className="row">
            <input name="name" className="input" placeholder="Nova categoria" required />
            <button className="btn btn-secondary" type="submit" name="intent" value="create-category">Nova categoria</button>
          </Form>
        </section>
        <section className="card card-emphasis stack">
          <h2 className="section-title">Tags</h2>
          {tags.map((t: any) => (
            <Form method="post" key={t.id} className="list-item row" style={{ justifyContent: "space-between" }}>
              <span>{t.name}</span>
              <input type="hidden" name="id" value={t.id} />
              <button className="btn" type="submit" name="intent" value="delete-tag">Excluir</button>
            </Form>
          ))}
          <Form method="post" className="row">
            <input name="name" className="input" placeholder="Nova tag" required />
            <button className="btn btn-secondary" type="submit" name="intent" value="create-tag">Nova tag</button>
          </Form>
        </section>
      </div>
      <div className="card muted">Regras de uso: evitar duplicidade, padronizar nomenclatura e manter tags curtas.</div>
    </AppLayout>
  );
}
