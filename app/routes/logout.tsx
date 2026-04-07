import { redirect } from "react-router";
import { destroySession, getSession } from "~/sessions.server";
import type { Route } from "./+types/logout";

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

// Optional: redirect to home if someone visits /logout directly without POST
export async function loader() {
  return redirect("/");
}
