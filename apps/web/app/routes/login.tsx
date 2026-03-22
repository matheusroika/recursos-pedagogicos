import { redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { login } from "../lib/session.server";

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
    return { error: "Informe e-mail e senha." };
  }

  const response = await login(email, password);
  if (!response.ok) {
    return { error: "Credenciais invalidas." };
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
      <section className="auth-card stack">
        <div className="brand">
          <span className="icon-ph">logo</span>
          <span>Instituto Criativo</span>
        </div>
        <h1 className="title">Acesso</h1>
        <Form method="post" className="stack">
          <div className="stack">
            <label className="muted">E-mail</label>
            <input className="input" name="email" type="email" defaultValue="matheus@instituto-criativo.org" />
          </div>
          <div className="stack">
            <label className="muted">Senha</label>
            <input className="input" name="password" type="password" defaultValue="12345678" />
          </div>
          {actionData?.error ? <p className="muted">{actionData.error}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={nav.state !== "idle"}>
            {nav.state === "submitting" ? "Entrando..." : "Entrar"}
          </button>
        </Form>
      </section>
    </main>
  );
}
