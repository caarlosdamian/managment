import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("components/sidebar-layout.tsx", [
    index("routes/home.tsx"),
    route("pos", "routes/pos.tsx"),
    route("inventory", "routes/inventory.tsx"),
    route("projects", "routes/projects.tsx"),
    route("team", "routes/team.tsx"),
    route("calendar", "routes/calendar.tsx"),
    route("reports", "routes/reports.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
