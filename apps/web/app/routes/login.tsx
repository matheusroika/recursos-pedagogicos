import { redirect, type MetaFunction } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { LockKeyhole, Mail } from "lucide-react";
import { Brand } from "../components/brand";
import { login } from "../lib/session.server";

export const meta: MetaFunction = () => [{ title: "Login | Instituto Criativo" }];

export async function loader({ request }: { request: Request }) {
  const cookie = request.headers.get("cookie") || "";
  if (cookie.includes("rp_session=")) return redirect("/");
  return null;
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Informe e-mail e senha para continuar." };
  }

  const response = await login(email, password);
  if (!response.ok) {
    return { error: "Credenciais inválidas. Verifique os dados e tente novamente." };
  }

  const setCookie = response.headers.get("set-cookie");
  return redirect("/", {
    headers: setCookie ? { "set-cookie": setCookie } : undefined
  });
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const nav = useNavigation();

  return (
    <main className="auth-wrap">
      <section className="auth-grid" aria-label="Acesso à plataforma">
        <aside className="auth-hero stack">
          <Brand />
          <img
            src="/images/hero-education.svg"
            alt="Equipe pedagógica colaborando no planejamento de atividades"
            width={1200}
            height={630}
            fetchPriority="high"
          />
          <h1 className="title">Plataforma de Recursos Pedagógicos</h1>
          <p className="muted">Organize materiais, compartilhe conhecimento e acompanhe notificações da equipe em um único ambiente.</p>
        </aside>

        <section className="auth-card stack">
          <h2 className="title">Entrar</h2>
          <p className="muted">Use suas credenciais institucionais para continuar.</p>
          <Form method="post" className="stack" aria-describedby="login-help">
            <div className="stack-tight">
              <label htmlFor="email" className="muted">E-mail</label>
              <div className="row" style={{ flexWrap: "nowrap" }}>
                <span className="icon-btn" aria-hidden="true"><Mail size={16} /></span>
                <input id="email" className="input" name="email" type="email" defaultValue="matheus@instituto-criativo.org" autoComplete="email" spellCheck={false} />
              </div>
            </div>
            <div className="stack-tight">
              <label htmlFor="password" className="muted">Senha</label>
              <div className="row" style={{ flexWrap: "nowrap" }}>
                <span className="icon-btn" aria-hidden="true"><LockKeyhole size={16} /></span>
                <input id="password" className="input" name="password" type="password" defaultValue="12345678" autoComplete="current-password" />
              </div>
            </div>
            {actionData?.error ? <p className="status-error" aria-live="polite">{actionData.error}</p> : null}
            <button className="btn btn-primary" type="submit" disabled={nav.state !== "idle"}>
              {nav.state === "submitting" ? "Entrando…" : "Entrar"}
            </button>
            <p id="login-help" className="auth-hint">
              Acesso de demonstração: <strong>matheus@instituto-criativo.org</strong> / <strong>12345678</strong>
            </p>
          </Form>
        </section>
      </section>
    </main>
  );
}
