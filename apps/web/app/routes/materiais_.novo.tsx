import { json, redirect, type MetaFunction } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { AppLayout } from "../components/layout";
import { MaterialThumbnail } from "../components/material-thumbnail";
import { apiFetch } from "../lib/api.server";
import { requireUser } from "../lib/session.server";

export const meta: MetaFunction = () => [{ title: "Novo Material | Instituto Criativo" }];

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
    return json({ error: "Não foi possível criar o material. Revise os dados e tente novamente." }, 400);
  }

  const created = await res.json();
  return redirect(`/materiais/${created.id}`);
}

export default function NovoMaterialPage() {
  const { categories, tags } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <AppLayout title="Novo Material" active="materiais">
      <p className="muted">Preencha as informações essenciais para cadastrar o conteúdo pedagógico.</p>
      <div className="split-2">
        <Form method="post" className="stack" aria-label="Formulário de criação de material">
          <div className="stack-tight"><label htmlFor="title" className="muted">Título</label><input id="title" name="title" className="input" required autoComplete="off" /></div>
          <div className="stack-tight"><label htmlFor="description" className="muted">Descrição</label><textarea id="description" name="description" className="textarea" required /></div>
          <div className="split-2">
            <div className="stack-tight"><label htmlFor="categoryId" className="muted">Categoria</label><select id="categoryId" name="categoryId" className="select" required>{categories.map((c: any) => <option value={c.id} key={c.id}>{c.name}</option>)}</select></div>
            <div className="stack-tight">
              <label htmlFor="tagIds" className="muted">Tags</label>
              <select id="tagIds" name="tagIds" className="select" multiple>{tags.map((t: any) => <option value={t.id} key={t.id}>{t.name}</option>)}</select>
              <p className="muted">Você pode selecionar mais de uma tag.</p>
            </div>
          </div>
          <div className="split-2">
            <div className="stack-tight"><label htmlFor="materialType" className="muted">Tipo do material</label><select id="materialType" name="materialType" className="select"><option value="pdf">PDF</option><option value="document">Documento</option><option value="image">Imagem</option><option value="video">Vídeo</option><option value="link">Link</option></select></div>
            <div className="stack-tight"><label htmlFor="privacy" className="muted">Privacidade</label><select id="privacy" name="privacy" className="select"><option value="private">Privado</option><option value="institution">Instituição</option><option value="public">Público</option></select></div>
          </div>
          <div className="stack-tight"><label htmlFor="externalUrl" className="muted">Arquivo externo ou link (opcional)</label><input id="externalUrl" name="externalUrl" type="url" className="input" placeholder="https://... (preencha apenas se o material estiver fora da plataforma)" autoComplete="off" /></div>
          <div className="row"><button name="status" value="draft" className="btn btn-secondary" type="submit">Salvar rascunho</button><button name="status" value="published" className="btn btn-primary" type="submit">Publicar material</button></div>
          {actionData && "error" in actionData ? <p className="status-error" aria-live="polite">{actionData.error}</p> : null}
          <Link to="/materiais" className="btn">Voltar</Link>
        </Form>

        <aside className="card card-emphasis stack" aria-label="Visual de referência do material">
          <h2 className="section-title-tight">Visual por tipo</h2>
          <MaterialThumbnail type="document" title="Exemplo de documento" loading="eager" />
          <p className="muted">As capas variam automaticamente conforme o tipo de material escolhido.</p>
        </aside>
      </div>
    </AppLayout>
  );
}