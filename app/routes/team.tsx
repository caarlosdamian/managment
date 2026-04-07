import type { Route } from "./+types/team";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Team | Management" },
    { name: "description", content: "Manage your team members" },
  ];
}

export default function Team() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Team</h1>
        <p className="page-subtitle">Manage your team members and roles</p>
      </div>
      <div className="page-content">
        <div className="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="empty-state-icon">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h2>No team members yet</h2>
          <p>Invite your first team member to collaborate.</p>
        </div>
      </div>
    </div>
  );
}
