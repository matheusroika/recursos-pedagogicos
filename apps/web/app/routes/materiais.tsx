import { json } from "@remix-run/node";
import { Form, Link, useLoaderData, useNavigation } from "@remix-run/react";
import { Funnel, Plus } from "lucide-react";
import { AppLayout } from "../components/layout";
import { MaterialThumbnail } from "../components/material-thumbnail";
import { apiFetch } from "../lib/api.server";
import { requireUser } from "../lib/session.server";

export async function loader({ request }: { request: Request }) {
  await requireUser(request);
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const categoryId = url.searchParams.get("categoryId") || "";
  const tags = url.searchParams.getAll("tagId");
  const sort = url.searchParams.get("sort") || "recent";

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (categoryId) params.set("categoryId", categoryId);
  tags.forEach((t) => params.append("tags", t));
  params.set("sort", sort);

  const [materialsRes, categoriesRes, tagsRes] = await Promise.all([
    apiFetch(`/api/materials?${params.toString()}`, undefined, request),
    apiFetch("/api/categories", undefined, request),
    apiFetch("/api/tags", undefined, request)
  ]);

  return json({
    filters: { q, categoryId, tags, sort },
    materials: materialsRes.ok ? (await materialsRes.json()).items : [],
    categories: categoriesRes.ok ? await categoriesRes.json() : [],
    tags: tagsRes.ok ? await tagsRes.json() : []
  });
}

export default function MateriaisPage() {
  const data = useLoaderData<typeof loader>();
  const nav = useNavigation();

  return (
    <AppLayout title="Materiais Pedagógicos" active="materiais">
      <Form method="get" className="stack-tight" aria-label="Filtros de busca de materiais">
        <div className="row search-bar">
          <label htmlFor="q" className="muted">Buscar por título, autor ou descrição</label>
          <input id="q" className="input" style={{ flex: 1 }} name="q" defaultValue={data.filters.q} placeholder="Buscar material…" autoComplete="off" />
          <button className="btn btn-primary" type="submit" disabled={nav.state !== "idle"}>Buscar</button>
        </div>
        <div className="row search-filters" style={{ gap: 8, flexWrap: "wrap" }}>
          <label htmlFor="categoryId" className="muted">Categoria</label>
          <select id="categoryId" name="categoryId" className="select" defaultValue={data.filters.categoryId}>
            <option value="">Todas as categorias</option>
            {data.categories.map((c: any) => <option value={c.id} key={c.id}>{c.name}</option>)}
          </select>

          <label htmlFor="sort" className="muted">Ordenação</label>
          <select id="sort" name="sort" className="select" defaultValue={data.filters.sort}>
            <option value="recent">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="az">A-Z</option>
            <option value="za">Z-A</option>
          </select>

          <Link to="/materiais/novo" className="btn btn-secondary">
            <Plus size={16} aria-hidden="true" />
            <span>Novo material</span>
          </Link>
        </div>
      </Form>

      <div className="between results-title">
        <h2 className="section-title-tight">Resultados</h2>
        <span className="muted"><Funnel size={14} aria-hidden="true" /> {data.materials.length} itens</span>
      </div>

      {data.materials.length === 0 ? (
        <div className="empty-state">Nenhum material encontrado para os filtros selecionados.</div>
      ) : (
        <div className="material-list">
          {data.materials.map((m: any) => (
            <article className="list-item stack-tight" key={m.id}>
              <div className="material-row">
                <MaterialThumbnail type={m.materialType} title={m.title} />
                <div className="stack-tight material-info">
                  <strong>{m.title}</strong>
                  <div className="meta-line">
                    <span>Categoria: {m.categoryName}</span>
                    <span>Tags: {(m.tags || []).join(", ") || "Sem tags"}</span>
                    <span>Tipo: {m.materialType}</span>
                    <span>Autor: {m.authorName}</span>
                  </div>
                  <div className="row material-actions">
                    <Link className="btn btn-primary" to={`/materiais/${m.id}`}>Ver</Link>
                    <Link className="btn btn-secondary" to={`/materiais/${m.id}?edit=1`}>Editar</Link>
                    <Link className="btn" to={`/materiais/${m.id}/compartilhar`}>Compartilhar</Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
