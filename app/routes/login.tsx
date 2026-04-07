import { Form, redirect, useActionData } from "react-router";
import type { Route } from "./+types/login";
import { getSession, commitSession } from "~/sessions.server";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (session.has("userId")) {
    throw redirect("/");
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");

  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (username === validUsername && password === validPassword) {
    const session = await getSession(request.headers.get("Cookie"));
    session.set("userId", "admin");
    throw redirect("/", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  return { error: "Invalid username or password" };
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <h2 className="login-title">Management System</h2>
          <p className="login-subtitle">Enter your credentials to access your account</p>
        </div>

        {actionData?.error && (
          <div className="login-error">{actionData.error}</div>
        )}

        <Form method="post" className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              type="text"
              name="username"
              id="username"
              className="form-input"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              className="form-input"
              required
            />
          </div>
          <button type="submit" className="btn btn--primary" style={{ width: "100%", marginTop: "16px", padding: "12px" }}>
            Sign In
          </button>
        </Form>
      </div>
    </div>
  );
}
