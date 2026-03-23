import { json, type LinksFunction } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import { apiFetch } from "./lib/api.server";
import stylesheet from "./styles.css?url";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap"
  },
  { rel: "stylesheet", href: stylesheet }
];

export async function loader({ request }: { request: Request }) {
  const sessionRes = await apiFetch("/api/auth/session", undefined, request);
  if (!sessionRes.ok) {
    return json({ unreadNotifications: 0 });
  }

  const session = await sessionRes.json();
  if (!session?.user) {
    return json({ unreadNotifications: 0 });
  }

  const notificationsRes = await apiFetch("/api/notifications?filter=unread", undefined, request);
  const unreadNotifications = notificationsRes.ok ? (await notificationsRes.json()).length : 0;

  return json({ unreadNotifications });
}

export default function App() {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
