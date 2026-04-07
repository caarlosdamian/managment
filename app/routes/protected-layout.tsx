import { Outlet, redirect } from "react-router";
import { Sidebar } from "~/components/sidebar";
import { getSession } from "~/sessions.server";
import type { Route } from "./+types/protected-layout";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has("userId")) {
    throw redirect("/login");
  }
  return null;
}

export default function ProtectedLayout() {
  return (
    <div className="app-layout" id="app-layout">
      <Sidebar />
      <main className="app-main" id="main-content">
        <Outlet />
      </main>
    </div>
  );
}
