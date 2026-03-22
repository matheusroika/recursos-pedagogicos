import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
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

  const payload = {
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    categoryId: String(formData.get("categoryId") || ""),
    tagIds: formData.getAll("tagIds").map(String),
    materialType: String(formData.get("materialType") || "document"),
    privacy: String(formData.get("privacy") || "institution"),
    status: String(formData.get("status") || "draft"),
    externalUrl: formData.get("externalUrl") ? String(formData.get("externalUrl")) : null
  };

  const res = await apiFetch("/api/materials", { method: "POST", body: JSON.stringify(payload) }, request);
  if (!res.ok) {
    return json({ error: "Nao foi possivel criar o material" }, 400);
  }

  const created = await res.json();
  return redirect(`/materiais/${created.id}`);
}

export default function NovoMaterialPage() {
  const { categories, tags } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <AppLayout title="Novo material" active="materiais">
      <Form method="post" className="stack">
        <div className="stack"><label className="muted">Titulo</label><input name="title" className="input" required /></div>
        <div className="stack"><label className="muted">Descricao</label><textarea name="description" className="textarea" required /></div>
        <div className="split-2">
          <div className="stack"><label className="muted">Categoria</label><select name="categoryId" className="select" required>{categories.map((c: any) => <option value={c.id} key={c.id}>{c.name}</option>)}</select></div>
          <div className="stack"><label className="muted">Tags</label><select name="tagIds" className="select" multiple>{tags.map((t: any) => <option value={t.id} key={t.id}>{t.name}</option>)}</select></div>
        </div>
        <div className="split-2">
          <div className="stack"><label className="muted">Tipo do material</label><select name="materialType" className="select"><option value="pdf">PDF</option><option value="document">Documento</option><option value="image">Imagem</option><option value="video">Video</option><option value="link">Link</option></select></div>
          <div className="stack"><label className="muted">Privacidade</label><select name="privacy" className="select"><option value="private">Privado</option><option value="institution">Instituicao</option><option value="public">Publico</option></select></div>
        </div>
        <div className="stack"><label className="muted">Arquivo ou link</label><input name="externalUrl" className="input" placeholder="https://..." /></div>
        <div className="row"><button name="status" value="draft" className="btn btn-secondary" type="submit">Salvar rascunho</button><button name="status" value="published" className="btn btn-primary" type="submit">Publicar material</button></div>
        {actionData && "error" in actionData ? <p className="muted">{actionData.error}</p> : null}
        <Link to="/materiais" className="btn">Voltar</Link>
      </Form>
    </AppLayout>
  );
}
