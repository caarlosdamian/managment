import type { Route } from "./+types/calendar";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Calendar | Management" },
    { name: "description", content: "View your calendar and events" },
  ];
}

export default function Calendar() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Calendar</h1>
        <p className="page-subtitle">View upcoming events and deadlines</p>
      </div>
      <div className="page-content">
        <div className="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="empty-state-icon">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h2>No events scheduled</h2>
          <p>Your calendar is empty. Add your first event.</p>
        </div>
      </div>
    </div>
  );
}
