import { useState } from "react";
import type { Route } from "./+types/roasting";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Coffee Roasting | Management" },
    { name: "description", content: "Track your coffee roasting batches" },
  ];
}

interface RoastBatch {
  id: number;
  beanName: string;
  beanOrigin: string;
  greenWeight: number; // grams
  roastedWeight: number; // grams
  roastDate: string; // YYYY-MM-DD
  agtron: number; // Agtron scale (25-95)
  duration: number; // minutes
  temperature: number; // °F
  notes: string;
}

const initialRoasts: RoastBatch[] = [
  {
    id: 1,
    beanName: "Ethiopian Yirgacheffe",
    beanOrigin: "Ethiopia",
    greenWeight: 5000,
    roastedWeight: 4250,
    roastDate: "2026-04-07",
    agtron: 80,
    duration: 11,
    temperature: 410,
    notes: "Bright acidity, floral aroma. First crack at 9 min.",
  },
  {
    id: 2,
    beanName: "Colombian Supremo",
    beanOrigin: "Colombia",
    greenWeight: 8000,
    roastedWeight: 6720,
    roastDate: "2026-04-06",
    agtron: 58,
    duration: 13,
    temperature: 430,
    notes: "Balanced body, caramel sweetness. Good for espresso.",
  },
  {
    id: 3,
    beanName: "Sumatra Mandheling",
    beanOrigin: "Indonesia",
    greenWeight: 6000,
    roastedWeight: 4920,
    roastDate: "2026-04-05",
    agtron: 35,
    duration: 16,
    temperature: 460,
    notes: "Full body, earthy with herbal notes. Second crack at 14 min.",
  },
  {
    id: 4,
    beanName: "Guatemala Antigua",
    beanOrigin: "Guatemala",
    greenWeight: 4000,
    roastedWeight: 3440,
    roastDate: "2026-04-04",
    agtron: 48,
    duration: 14,
    temperature: 445,
    notes: "Chocolate and spice notes. Rich, smooth finish.",
  },
  {
    id: 5,
    beanName: "Kenya AA",
    beanOrigin: "Kenya",
    greenWeight: 3000,
    roastedWeight: 2580,
    roastDate: "2026-04-03",
    agtron: 85,
    duration: 10,
    temperature: 405,
    notes: "Bright citrus acidity, blackcurrant. Complex cup.",
  },
];

const emptyForm: Omit<RoastBatch, "id"> = {
  beanName: "",
  beanOrigin: "",
  greenWeight: 0,
  roastedWeight: 0,
  roastDate: new Date().toISOString().split("T")[0],
  agtron: 55,
  duration: 0,
  temperature: 0,
  notes: "",
};

/**
 * Agtron Scale Reference:
 *   95–86: Very Light (Cinnamon)
 *   85–76: Light
 *   75–66: Medium-Light (City)
 *   65–56: Medium (Full City)
 *   55–46: Medium-Dark (Full City+)
 *   45–36: Dark (Vienna)
 *   35–26: Very Dark (French/Italian)
 *   ≤25:   Extremely Dark
 */
function getAgtronInfo(agtron: number) {
  if (agtron >= 86) return { label: "Very Light", bg: "rgba(253, 224, 120, 0.15)", color: "#a16207", dot: "#fde047" };
  if (agtron >= 76) return { label: "Light", bg: "rgba(251, 191, 36, 0.12)", color: "#d97706", dot: "#fbbf24" };
  if (agtron >= 66) return { label: "Medium-Light", bg: "rgba(210, 160, 60, 0.12)", color: "#a3700a", dot: "#c89632" };
  if (agtron >= 56) return { label: "Medium", bg: "rgba(180, 130, 60, 0.12)", color: "#92640a", dot: "#b4823c" };
  if (agtron >= 46) return { label: "Medium-Dark", bg: "rgba(139, 90, 43, 0.12)", color: "#6b4226", dot: "#8b5a2b" };
  if (agtron >= 36) return { label: "Dark", bg: "rgba(80, 40, 20, 0.12)", color: "#502814", dot: "#502814" };
  return { label: "Very Dark", bg: "rgba(40, 20, 10, 0.15)", color: "#28140a", dot: "#28140a" };
}

export default function Roasting() {
  const [batches, setBatches] = useState<RoastBatch[]>(initialRoasts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<RoastBatch | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const totalGreen = batches.reduce((s, b) => s + b.greenWeight, 0);
  const totalRoasted = batches.reduce((s, b) => s + b.roastedWeight, 0);
  const avgLoss = totalGreen > 0 ? ((1 - totalRoasted / totalGreen) * 100).toFixed(1) : "0";
  const avgDuration = batches.length > 0 ? (batches.reduce((s, b) => s + b.duration, 0) / batches.length).toFixed(1) : "0";

  const openAddModal = () => {
    setEditingBatch(null);
    setFormData({ ...emptyForm, roastDate: new Date().toISOString().split("T")[0] });
    setModalOpen(true);
  };

  const openEditModal = (batch: RoastBatch) => {
    setEditingBatch(batch);
    setFormData({
      beanName: batch.beanName,
      beanOrigin: batch.beanOrigin,
      greenWeight: batch.greenWeight,
      roastedWeight: batch.roastedWeight,
      roastDate: batch.roastDate,
      agtron: batch.agtron,
      duration: batch.duration,
      temperature: batch.temperature,
      notes: batch.notes,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBatch(null);
  };

  const handleSave = () => {
    if (!formData.beanName.trim()) return;

    if (editingBatch) {
      setBatches((prev) =>
        prev.map((b) => (b.id === editingBatch.id ? { ...b, ...formData } : b))
      );
    } else {
      const newId = Math.max(0, ...batches.map((b) => b.id)) + 1;
      setBatches((prev) => [{ id: newId, ...formData }, ...prev]);
    }
    closeModal();
  };

  const handleDelete = (id: number) => {
    setBatches((prev) => prev.filter((b) => b.id !== id));
    setDeleteConfirm(null);
  };

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="page page--wide" id="roasting-page">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Coffee Roasting</h1>
          <p className="page-subtitle">Track roast batches, bean origins, and roast profiles</p>
        </div>
        <button className="btn btn--primary" onClick={openAddModal} id="btn-add-roast">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Log Roast
        </button>
      </div>

      {/* Stats */}
      <div className="roast-stats" id="roast-stats">
        <div className="roast-stat-card">
          <span className="roast-stat-emoji">☕</span>
          <div className="roast-stat-content">
            <span className="roast-stat-value">{batches.length}</span>
            <span className="roast-stat-label">Total Batches</span>
          </div>
        </div>
        <div className="roast-stat-card">
          <span className="roast-stat-emoji">🫘</span>
          <div className="roast-stat-content">
            <span className="roast-stat-value">{(totalGreen / 1000).toFixed(1)} kg</span>
            <span className="roast-stat-label">Green Beans Used</span>
          </div>
        </div>
        <div className="roast-stat-card">
          <span className="roast-stat-emoji">📉</span>
          <div className="roast-stat-content">
            <span className="roast-stat-value">{avgLoss}%</span>
            <span className="roast-stat-label">Avg Weight Loss</span>
          </div>
        </div>
        <div className="roast-stat-card">
          <span className="roast-stat-emoji">⏱️</span>
          <div className="roast-stat-content">
            <span className="roast-stat-value">{avgDuration} min</span>
            <span className="roast-stat-label">Avg Roast Time</span>
          </div>
        </div>
      </div>

      {/* Roast Cards */}
      <div className="roast-list" id="roast-list">
        {batches.map((batch) => {
          const agtronInfo = getAgtronInfo(batch.agtron);
          const weightLoss = ((1 - batch.roastedWeight / batch.greenWeight) * 100).toFixed(1);
          const isExpanded = expandedId === batch.id;

          return (
            <div
              key={batch.id}
              className={`roast-card ${isExpanded ? "roast-card--expanded" : ""}`}
              id={`roast-${batch.id}`}
            >
              <div className="roast-card-main" onClick={() => setExpandedId(isExpanded ? null : batch.id)}>
                <div className="roast-card-left">
                  <div className="roast-bean-icon">🫘</div>
                  <div className="roast-card-info">
                    <div className="roast-card-title">{batch.beanName}</div>
                    <div className="roast-card-meta">
                      <span className="roast-origin">{batch.beanOrigin}</span>
                      <span className="roast-date">{new Date(batch.roastDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>

                <div className="roast-card-details">
                  <div className="roast-detail">
                    <span className="roast-detail-label">Green</span>
                    <span className="roast-detail-value">{(batch.greenWeight / 1000).toFixed(1)} kg</span>
                  </div>
                  <div className="roast-detail">
                    <span className="roast-detail-label">Roasted</span>
                    <span className="roast-detail-value">{(batch.roastedWeight / 1000).toFixed(1)} kg</span>
                  </div>
                  <div className="roast-detail">
                    <span className="roast-detail-label">Loss</span>
                    <span className="roast-detail-value">{weightLoss}%</span>
                  </div>
                  <span
                    className="roast-level-badge"
                    style={{ background: agtronInfo.bg, color: agtronInfo.color }}
                  >
                    <span className="roast-level-dot" style={{ background: agtronInfo.dot }} />
                    #{batch.agtron} · {agtronInfo.label}
                  </span>
                </div>

                <div className="roast-card-expand">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {isExpanded && (
                <div className="roast-card-expanded">
                  <div className="roast-expanded-grid">
                    <div className="roast-expanded-item">
                      <span className="roast-expanded-label">Duration</span>
                      <span className="roast-expanded-value">{batch.duration} min</span>
                    </div>
                    <div className="roast-expanded-item">
                      <span className="roast-expanded-label">Temperature</span>
                      <span className="roast-expanded-value">{batch.temperature}°F</span>
                    </div>
                    <div className="roast-expanded-item">
                      <span className="roast-expanded-label">Agtron</span>
                      <span className="roast-expanded-value">#{batch.agtron} ({getAgtronInfo(batch.agtron).label})</span>
                    </div>
                    <div className="roast-expanded-item">
                      <span className="roast-expanded-label">Weight Loss</span>
                      <span className="roast-expanded-value">{weightLoss}%</span>
                    </div>
                  </div>

                  {batch.notes && (
                    <div className="roast-notes">
                      <span className="roast-notes-label">Notes</span>
                      <p className="roast-notes-text">{batch.notes}</p>
                    </div>
                  )}

                  <div className="roast-card-actions">
                    <button className="btn btn--ghost btn--sm" onClick={() => openEditModal(batch)}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                    {deleteConfirm === batch.id ? (
                      <div className="roast-delete-confirm">
                        <span className="roast-delete-text">Delete this roast?</span>
                        <button className="btn btn--danger btn--sm" onClick={() => handleDelete(batch.id)}>Yes, Delete</button>
                        <button className="btn btn--ghost btn--sm" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button className="btn btn--ghost btn--sm btn--danger-text" onClick={() => setDeleteConfirm(batch.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {batches.length === 0 && (
          <div className="empty-state">
            <span style={{ fontSize: 48, marginBottom: 12 }}>☕</span>
            <h2>No roasts logged yet</h2>
            <p>Log your first coffee roast to start tracking.</p>
          </div>
        )}
      </div>

      {/* ── Add/Edit Roast Modal ─────────────────────── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal} id="roast-modal">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingBatch ? "Edit Roast" : "Log New Roast"}</h2>
              <button className="modal-close" onClick={closeModal} aria-label="Close modal">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group form-group--wide">
                  <label className="form-label">Bean Name</label>
                  <input
                    className="form-input"
                    type="text"
                    value={formData.beanName}
                    onChange={(e) => updateField("beanName", e.target.value)}
                    placeholder="e.g. Ethiopian Yirgacheffe"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Origin</label>
                  <input
                    className="form-input"
                    type="text"
                    value={formData.beanOrigin}
                    onChange={(e) => updateField("beanOrigin", e.target.value)}
                    placeholder="e.g. Ethiopia"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Green Weight (g)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={formData.greenWeight}
                    onChange={(e) => updateField("greenWeight", Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Roasted Weight (g)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={formData.roastedWeight}
                    onChange={(e) => updateField("roastedWeight", Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Roast Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={formData.roastDate}
                    onChange={(e) => updateField("roastDate", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Agtron Number</label>
                  <div className="agtron-input-wrapper">
                    <input
                      className="form-input"
                      type="number"
                      min="25"
                      max="95"
                      value={formData.agtron}
                      onChange={(e) => updateField("agtron", Number(e.target.value))}
                    />
                    <span
                      className="agtron-preview"
                      style={{
                        background: getAgtronInfo(formData.agtron).bg,
                        color: getAgtronInfo(formData.agtron).color,
                      }}
                    >
                      <span className="roast-level-dot" style={{ background: getAgtronInfo(formData.agtron).dot }} />
                      {getAgtronInfo(formData.agtron).label}
                    </span>
                  </div>
                  <span className="form-hint">25 (very dark) → 95 (very light)</span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Duration (min)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={formData.duration}
                    onChange={(e) => updateField("duration", Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Temperature (°F)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={formData.temperature}
                    onChange={(e) => updateField("temperature", Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input form-textarea"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Tasting notes, observations, first/second crack times..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
              <button
                className="btn btn--primary"
                onClick={handleSave}
                disabled={!formData.beanName.trim()}
                id="btn-save-roast"
              >
                {editingBatch ? "Save Changes" : "Log Roast"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
