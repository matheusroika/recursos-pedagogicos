import { redirect, type MetaFunction } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { LockKeyhole, Mail, Sparkles } from "lucide-react";
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
    return { error: "Não foi possível entrar. Confira e-mail e senha e tente novamente." };
  }

  const setCookie = response.headers.get("set-cookie");
  return redirect("/", {
    headers: setCookie ? { "set-cookie": setCookie } : undefined
  });
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const nav = useNavigation();
  const isSubmitting = nav.state === "submitting";

  return (
    <main className="login-scene" id="main-content">
      <a href="#login-form" className="skip-link">
        Pular para o formulário
      </a>

      <section className="login-shell" aria-label="Acesso à plataforma">
        <aside className="login-story" aria-label="Visão geral da plataforma">
          <div className="login-story-noise" aria-hidden="true" />
          <div className="login-story-top">
            <Brand />
            <p className="login-eyebrow">
              <Sparkles size={14} aria-hidden="true" />
              Plataforma de aprendizagem integrada
            </p>
          </div>

          <div className="login-headline-wrap">
            <h1 className="login-headline">Organize e compartilhe materiais em um único lugar</h1>
            <p className="login-subcopy">
              Cadastre, busque e distribua recursos pedagógicos e de treinamento com clareza.
            </p>
          </div>

          <img
            src="/images/hero-education.svg"
            alt="Equipe colaborando no planejamento de atividades"
            width={1200}
            height={630}
            fetchPriority="high"
            className="login-hero-image"
          />
        </aside>

        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-panel-header">
            <p className="login-kicker">Acesso Seguro</p>
            <h2 id="login-title" className="login-title">Entrar na Plataforma</h2>
            <p className="login-panel-copy">Use suas credenciais de acesso para continuar.</p>
          </div>

          <Form method="post" className="login-form" id="login-form" aria-describedby="login-help login-error">
            <div className="login-field">
              <label htmlFor="email" className="login-label">
                E-mail de acesso
              </label>
              <div className="login-input-wrap">
                <Mail size={16} aria-hidden="true" className="login-input-icon" />
                <input
                  id="email"
                  className="login-input"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  spellCheck={false}
                  defaultValue="matheus@instituto-criativo.org"
                  placeholder="nome@instituto-criativo.org"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password" className="login-label">
                Senha
              </label>
              <div className="login-input-wrap">
                <LockKeyhole size={16} aria-hidden="true" className="login-input-icon" />
                <input
                  id="password"
                  className="login-input"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  defaultValue="12345678"
                  placeholder="Digite sua senha"
                  required
                />
              </div>
            </div>

            {actionData?.error ? (
              <p id="login-error" className="login-error" aria-live="polite">
                {actionData.error}
              </p>
            ) : (
              <p id="login-error" className="sr-only" aria-live="polite" />
            )}

            <button className="login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>

            <p id="login-help" className="login-help">
              Acesso de demonstração: <strong>matheus@instituto-criativo.org</strong> / <strong>12345678</strong>
            </p>
          </Form>
        </section>
      </section>
    </main>
  );
}