import type { Route } from "./+types/reports";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Reports | Management" },
    { name: "description", content: "View analytics and reports" },
  ];
}

export default function Reports() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Analytics and performance insights</p>
      </div>
      <div className="page-content">
        <div className="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="empty-state-icon">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <h2>No reports available</h2>
          <p>Reports will appear here once data is available.</p>
        </div>
      </div>
    </div>
  );
}
