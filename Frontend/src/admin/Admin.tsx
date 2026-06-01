import { useState, useEffect, useCallback, useRef } from "react";
import { SEARCH_URL } from "../services/api";
import {
  Speaker,
  DEFAULT_SPEAKERS,
  AREAS_LIST,
  PROFESSIONS_LIST,
  GRADIENT_PRESETS,
  computeInitials,
  loadSpeakers,
  saveSpeakers,
  getExpLabel,
  getExpClass,
} from "../interfaces/ponente";
import "../css/Admin.css";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type AdminTab = "conferences" | "speakers";

interface Conference {
  id: number;
  title: string;
  description: string | null;
  speaker_name: string | null;
  speaker_image_url: string | null;
  category: string | null;
  schedule: string | null;
  campus_name: string | null;
  room_name: string | null;
  capacity: number;
  is_active: boolean;
  registered_count: number;
}

interface ConferenceForm {
  title: string;
  description: string;
  speaker_name: string;
  category: string;
  schedule: string;
  campus_name: string;
  room_name: string;
  capacity: number;
}

interface SpeakerForm {
  name: string;
  institution: string;
  country: string;
  countryName: string;
  area: string;
  profession: string;
  experience: number;
  topic: string;
  bio: string;
  keynote: boolean;
  initials: string;
  gradient: string;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Software Engineering and Information Systems",
  "Artificial Intelligence and Co-existence",
  "Smart Cities and Sustainable Development",
  "Security, Privacy and Infrastructure",
  "Technology, Society and Innovation",
];

const EMPTY_FORM: ConferenceForm = {
  title: "", description: "", speaker_name: "",
  category: "", schedule: "", campus_name: "", room_name: "", capacity: 100,
};

const EMPTY_SPEAKER_FORM: SpeakerForm = {
  name: "", institution: "", country: "🇨🇴", countryName: "Colombia",
  area: AREAS_LIST[0], profession: PROFESSIONS_LIST[0], experience: 1,
  topic: "", bio: "", keynote: false,
  initials: "", gradient: GRADIENT_PRESETS[2],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toLocalDT(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function speakerImgSrc(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${SEARCH_URL}${url}`;
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function Admin() {

  // ── Tab ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<AdminTab>("conferences");

  // ── Conferences state ─────────────────────────────────────────────────────
  const [conferences, setConferences]   = useState<Conference[]>([]);
  const [loading, setLoading]           = useState(true);
  const [pageError, setPageError]       = useState("");

  const [toast, setToast] = useState({ msg: "", ok: true });

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Conference | null>(null);
  const [form, setForm]           = useState<ConferenceForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragging, setDragging]         = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toDelete, setToDelete] = useState<Conference | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showQrScanner, setShowQrScanner] = useState(false);
  const [qrValidating, setQrValidating]   = useState(false);
  const [qrResult, setQrResult] = useState<{
    valid: boolean;
    message: string;
    conference_title?: string | null;
    attendee_name?: string | null;
  } | null>(null);
  const scannerRef = useRef<unknown>(null);

  // ── Speakers state ────────────────────────────────────────────────────────
  const [speakers, setSpeakers]               = useState<Speaker[]>([]);
  const [showSpeakerModal, setShowSpeakerModal] = useState(false);
  const [editingSpeaker, setEditingSpeaker]   = useState<Speaker | null>(null);
  const [speakerForm, setSpeakerForm]         = useState<SpeakerForm>(EMPTY_SPEAKER_FORM);
  const [speakerFormError, setSpeakerFormError] = useState("");
  const [submittingSpeaker, setSubmittingSpeaker] = useState(false);
  const [toDeleteSpeaker, setToDeleteSpeaker] = useState<Speaker | null>(null);

  // ── Fetch conferences ─────────────────────────────────────────────────────

  const fetchConferences = useCallback(async () => {
    try {
      const res = await fetch(`${SEARCH_URL}/conferences`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setConferences(await res.json());
      setPageError("");
    } catch (e: unknown) {
      setPageError((e as Error).message || "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConferences(); }, [fetchConferences]);

  // ── Load speakers ─────────────────────────────────────────────────────────

  useEffect(() => { setSpeakers(loadSpeakers()); }, []);

  // ── Toast ──────────────────────────────────────────────────────────────────

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: "", ok: true }), 3500);
  }

  // ── Conference: Imagen ─────────────────────────────────────────────────────

  function applyFile(file: File | null) {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    applyFile(e.target.files?.[0] ?? null);
  }

  function handleDragOver(e: React.DragEvent) { e.preventDefault(); setDragging(true); }
  function handleDragLeave() { setDragging(false); }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    if (file && ["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      applyFile(file);
    } else if (file) {
      showToast("Solo se permiten imágenes JPEG, PNG o WebP", false);
    }
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadImage(conferenceId: number): Promise<void> {
    if (!imageFile) return;
    const fd = new FormData();
    fd.append("file", imageFile);
    const res = await fetch(`${SEARCH_URL}/conferences/${conferenceId}/speaker-image`, {
      method: "POST", body: fd,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { detail?: string }).detail || "Error al subir la imagen");
    }
    const updated: Conference = await res.json();
    setConferences(prev => prev.map(c => (c.id === conferenceId ? updated : c)));
  }

  // ── Conference: Modal ──────────────────────────────────────────────────────

  function openCreate() {
    setEditing(null); setForm(EMPTY_FORM); setFormError(""); clearImage(); setShowModal(true);
  }

  function openEdit(conf: Conference) {
    setEditing(conf);
    setForm({
      title: conf.title, description: conf.description ?? "",
      speaker_name: conf.speaker_name ?? "", category: conf.category ?? "",
      schedule: toLocalDT(conf.schedule),
      campus_name: conf.campus_name ?? "", room_name: conf.room_name ?? "",
      capacity: conf.capacity,
    });
    setFormError(""); clearImage();
    setImagePreview(speakerImgSrc(conf.speaker_image_url));
    setShowModal(true);
  }

  function closeModal() { setShowModal(false); setEditing(null); setFormError(""); clearImage(); }

  function validate(): string | null {
    if (!form.title.trim()) return "El título es obligatorio.";
    if (!form.campus_name.trim()) return "La sede es obligatoria.";
    if (!form.room_name.trim()) return "El salón / aula es obligatorio.";
    if (form.capacity <= 0) return "La capacidad debe ser mayor a 0.";
    return null;
  }

  // ── Conference: Submit ─────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setFormError(err); return; }
    setSubmitting(true); setFormError("");

    const body = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      speaker_name: form.speaker_name.trim() || null,
      category: form.category || null,
      schedule: form.schedule ? form.schedule + ":00" : null,
      campus_name: form.campus_name.trim(),
      room_name: form.room_name.trim(),
      capacity: form.capacity,
    };

    try {
      const url    = editing ? `${SEARCH_URL}/conferences/${editing.id}` : `${SEARCH_URL}/conferences`;
      const method = editing ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data: Conference = await res.json();

      if (!res.ok) {
        const d = data as unknown as { detail?: string | { msg: string }[] };
        const msg = Array.isArray(d.detail)
          ? d.detail.map((x) => x.msg).join(", ")
          : d.detail || "Error al guardar";
        setFormError(msg);
        return;
      }

      if (editing) {
        setConferences(prev => prev.map(c => (c.id === editing.id ? data : c)));
      } else {
        setConferences(prev => [...prev, data]);
      }

      if (imageFile) {
        try {
          await uploadImage(data.id);
          showToast(editing ? "Conferencia actualizada con imagen" : "Conferencia creada con imagen");
        } catch (imgErr: unknown) {
          showToast(`Guardado OK, pero la imagen falló: ${(imgErr as Error).message}`, false);
        }
      } else {
        showToast(editing ? "Conferencia actualizada" : "Conferencia creada");
      }

      closeModal();
    } catch {
      setFormError("Error de conexión con el servidor.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Conference: Eliminar ───────────────────────────────────────────────────

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${SEARCH_URL}/conferences/${toDelete.id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setConferences(prev => prev.filter(c => c.id !== toDelete.id));
        showToast(`"${toDelete.title}" eliminada`);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast((data as { detail?: string }).detail || "No se pudo eliminar", false);
      }
    } catch {
      showToast("Error de conexión", false);
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  // ── QR Scanner ────────────────────────────────────────────────────────────

  async function handleQrDetected(decodedText: string) {
    if (qrValidating) return;
    try { await (scannerRef.current as { pause: (t: boolean) => Promise<void> })?.pause(true); } catch {}
    setQrValidating(true); setQrResult(null);
    try {
      const res = await fetch(`${SEARCH_URL}/qr/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_payload: decodedText }),
      });
      const data = await res.json();
      setQrResult({ valid: data.valid, message: data.message, conference_title: data.conference_title, attendee_name: data.attendee_name });
    } catch {
      setQrResult({ valid: false, message: "Error de conexión con el servidor" });
    } finally {
      setQrValidating(false);
    }
  }

  function closeQrScanner() {
    try { (scannerRef.current as { stop: () => void })?.stop(); } catch {}
    scannerRef.current = null;
    setShowQrScanner(false); setQrResult(null); setQrValidating(false);
  }

  function resetScan() {
    setQrResult(null);
    try { (scannerRef.current as { resume: () => void })?.resume(); } catch {}
  }

  useEffect(() => {
    if (!showQrScanner) return;
    const timer = setTimeout(async () => {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => handleQrDetected(decodedText),
          undefined,
        );
      } catch {
        setQrResult({ valid: false, message: 'No se pudo acceder a la cámara. Verifica los permisos.' });
      }
    }, 120);
    return () => {
      clearTimeout(timer);
      (scannerRef.current as { stop?: () => Promise<void> })?.stop?.().catch(() => {});
      scannerRef.current = null;
    };
  }, [showQrScanner]);

  // ── Speakers: CRUD ────────────────────────────────────────────────────────

  function openCreateSpeaker() {
    setEditingSpeaker(null);
    setSpeakerForm(EMPTY_SPEAKER_FORM);
    setSpeakerFormError("");
    setShowSpeakerModal(true);
  }

  function openEditSpeaker(sp: Speaker) {
    setEditingSpeaker(sp);
    setSpeakerForm({
      name: sp.name, institution: sp.institution,
      country: sp.country, countryName: sp.countryName,
      area: sp.area, profession: sp.profession, experience: sp.experience,
      topic: sp.topic, bio: sp.bio, keynote: sp.keynote ?? false,
      initials: sp.initials, gradient: sp.gradient,
    });
    setSpeakerFormError("");
    setShowSpeakerModal(true);
  }

  function closeSpeakerModal() {
    setShowSpeakerModal(false);
    setEditingSpeaker(null);
    setSpeakerFormError("");
  }

  function handleSpeakerNameChange(name: string) {
    const auto = computeInitials(name);
    setSpeakerForm(f => ({ ...f, name, initials: auto }));
  }

  function validateSpeaker(): string | null {
    if (!speakerForm.name.trim())        return "El nombre es obligatorio.";
    if (!speakerForm.institution.trim()) return "La institución es obligatoria.";
    if (!speakerForm.countryName.trim()) return "El país es obligatorio.";
    if (!speakerForm.topic.trim())       return "El tema de conferencia es obligatorio.";
    if (speakerForm.experience < 1)      return "La experiencia debe ser de al menos 1 año.";
    return null;
  }

  function handleSpeakerSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateSpeaker();
    if (err) { setSpeakerFormError(err); return; }
    setSubmittingSpeaker(true);

    const maxId = speakers.reduce((m, s) => Math.max(m, s.id), 0);
    const resolved: Speaker = {
      id: editingSpeaker ? editingSpeaker.id : maxId + 1,
      name: speakerForm.name.trim(),
      institution: speakerForm.institution.trim(),
      country: speakerForm.country.trim() || "🌐",
      countryName: speakerForm.countryName.trim(),
      area: speakerForm.area,
      profession: speakerForm.profession,
      experience: speakerForm.experience,
      topic: speakerForm.topic.trim(),
      bio: speakerForm.bio.trim(),
      keynote: speakerForm.keynote,
      initials: (speakerForm.initials.trim().toUpperCase().slice(0, 2)) || computeInitials(speakerForm.name),
      gradient: speakerForm.gradient,
    };

    const updated = editingSpeaker
      ? speakers.map(s => s.id === editingSpeaker.id ? resolved : s)
      : [...speakers, resolved];

    saveSpeakers(updated);
    setSpeakers(updated);
    showToast(editingSpeaker ? "Ponente actualizado" : "Ponente creado");
    closeSpeakerModal();
    setSubmittingSpeaker(false);
  }

  function handleDeleteSpeaker() {
    if (!toDeleteSpeaker) return;
    const updated = speakers.filter(s => s.id !== toDeleteSpeaker.id);
    saveSpeakers(updated);
    setSpeakers(updated);
    showToast(`"${toDeleteSpeaker.name}" eliminado`);
    setToDeleteSpeaker(null);
  }

  function resetSpeakersToDefaults() {
    saveSpeakers(DEFAULT_SPEAKERS);
    setSpeakers(DEFAULT_SPEAKERS);
    showToast("Ponentes restaurados a valores predeterminados");
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="adm-page">

      {toast.msg && (
        <div className={`adm-toast ${toast.ok ? "toast-ok" : "toast-err"}`}>{toast.msg}</div>
      )}

      {/* ── Header ── */}
      <header className="adm-header">
        <div>
          <span className="adm-badge">Administración</span>
          <h1 className="adm-title">Panel de Control</h1>
          <p className="adm-sub">CONIITI 2026 — Gestión interna · acceso directo</p>
        </div>
        <div className="adm-header-actions">
          {activeTab === "conferences" && (
            <>
              <button className="adm-btn-secondary" onClick={() => { setQrResult(null); setShowQrScanner(true); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <path d="M14 14h3v3M17 20h3M20 17v3"/>
                </svg>
                Validar QR
              </button>
              <button className="adm-btn-primary" onClick={openCreate}>+ Nueva conferencia</button>
            </>
          )}
          {activeTab === "speakers" && (
            <button className="adm-btn-primary" onClick={openCreateSpeaker}>+ Nuevo ponente</button>
          )}
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="adm-tabs">
        <button
          className={`adm-tab-btn${activeTab === "conferences" ? " active" : ""}`}
          onClick={() => setActiveTab("conferences")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          Conferencias
          <span className="adm-tab-count">{conferences.length}</span>
        </button>
        <button
          className={`adm-tab-btn${activeTab === "speakers" ? " active" : ""}`}
          onClick={() => setActiveTab("speakers")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/>
          </svg>
          Ponentes
          <span className="adm-tab-count">{speakers.length}</span>
        </button>
      </div>

      {/* ══════════════════════════════ CONFERENCIAS ══════════════════════════ */}
      {activeTab === "conferences" && (
        <>
          <div className="adm-statusbar">
            <span>{conferences.length} conferencia{conferences.length !== 1 ? "s" : ""} registrada{conferences.length !== 1 ? "s" : ""}</span>
            <button className="adm-btn-refresh" onClick={() => { setLoading(true); fetchConferences(); }}>↻ Actualizar</button>
          </div>

          <main className="adm-main">
            {loading && (
              <div className="adm-state"><div className="adm-spinner" /><p>Cargando…</p></div>
            )}
            {!loading && pageError && (
              <div className="adm-state adm-state-error">
                <p>⚠ {pageError}</p>
                <button onClick={() => { setLoading(true); fetchConferences(); }}>Reintentar</button>
              </div>
            )}
            {!loading && !pageError && conferences.length === 0 && (
              <div className="adm-state">
                <p>No hay conferencias aún.</p>
                <button className="adm-btn-primary" onClick={openCreate}>Crear la primera</button>
              </div>
            )}
            {!loading && !pageError && conferences.length > 0 && (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>Ponente</th><th>Título</th><th>Categoría</th>
                      <th>Fecha</th><th>Cupos</th><th>Inscritos</th><th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conferences.map(conf => (
                      <tr key={conf.id}>
                        <td className="td-id">{conf.id}</td>
                        <td>
                          <div className="td-speaker">
                            {speakerImgSrc(conf.speaker_image_url)
                              ? <img src={speakerImgSrc(conf.speaker_image_url)!} alt={conf.speaker_name ?? ""} className="td-avatar" />
                              : <div className="td-avatar-placeholder">{(conf.speaker_name ?? "?")[0].toUpperCase()}</div>
                            }
                            <span>{conf.speaker_name ?? "—"}</span>
                          </div>
                        </td>
                        <td className="td-title">{conf.title}</td>
                        <td>{conf.category ? <span className="td-cat">{conf.category}</span> : "—"}</td>
                        <td className="td-date">{formatDate(conf.schedule)}</td>
                        <td className="td-num">{conf.capacity}</td>
                        <td className="td-num">
                          <span className={conf.registered_count > 0 ? "td-count-active" : ""}>{conf.registered_count}</span>
                        </td>
                        <td className="td-actions">
                          <button className="btn-edit" onClick={() => openEdit(conf)}>Editar</button>
                          <button className="btn-del"  onClick={() => setToDelete(conf)}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </>
      )}

      {/* ══════════════════════════════ PONENTES ══════════════════════════════ */}
      {activeTab === "speakers" && (
        <>
          <div className="adm-statusbar">
            <span>{speakers.length} ponente{speakers.length !== 1 ? "s" : ""} registrado{speakers.length !== 1 ? "s" : ""}</span>
            <button className="adm-btn-refresh adm-btn-reset" onClick={resetSpeakersToDefaults} title="Restaurar ponentes predeterminados">
              ↺ Restablecer predeterminados
            </button>
          </div>

          <main className="adm-main">
            {speakers.length === 0 && (
              <div className="adm-state">
                <p>No hay ponentes aún.</p>
                <button className="adm-btn-primary" onClick={openCreateSpeaker}>Agregar el primero</button>
              </div>
            )}
            {speakers.length > 0 && (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Ponente</th>
                      <th>Institución · País</th>
                      <th>Área</th>
                      <th>Profesión</th>
                      <th>Experiencia</th>
                      <th>Tipo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {speakers.map(sp => (
                      <tr key={sp.id}>
                        <td className="td-id">{sp.id}</td>
                        <td>
                          <div className="td-speaker">
                            <div
                              className="td-avatar-gradient"
                              style={{ background: sp.gradient }}
                            >
                              {sp.initials}
                            </div>
                            <span>{sp.name}</span>
                          </div>
                        </td>
                        <td className="td-inst">
                          <span>{sp.institution}</span>
                          <span className="td-country">{sp.country} {sp.countryName}</span>
                        </td>
                        <td><span className="td-cat">{sp.area}</span></td>
                        <td>
                          <span className={`td-prof td-prof--${sp.profession.toLowerCase()}`}>{sp.profession}</span>
                        </td>
                        <td>
                          <div className="td-exp-cell">
                            <div className="td-exp-bar">
                              <div className="td-exp-fill" style={{ width: `${Math.min(100, Math.round((sp.experience / 35) * 100))}%` }} />
                            </div>
                            <span className={`exp-level-badge exp-level-badge--${getExpClass(sp.experience)}`}>
                              {getExpLabel(sp.experience)} · {sp.experience} a.
                            </span>
                          </div>
                        </td>
                        <td>
                          {sp.keynote
                            ? <span className="td-keynote">🎤 Keynote</span>
                            : <span className="td-regular">Regular</span>
                          }
                        </td>
                        <td className="td-actions">
                          <button className="btn-edit" onClick={() => openEditSpeaker(sp)}>Editar</button>
                          <button className="btn-del"  onClick={() => setToDeleteSpeaker(sp)}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </>
      )}

      {/* ── Modal conferencia ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="adm-overlay" onClick={closeModal}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{editing ? "Editar conferencia" : "Nueva conferencia"}</h2>
              <button className="modal-x" onClick={closeModal}>✕</button>
            </div>
            <form className="modal-body" onSubmit={handleSubmit} noValidate>
              {formError && <div className="modal-err">⚠ {formError}</div>}
              <div className="fld">
                <label>Título <span className="req">*</span></label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Nombre de la conferencia" />
              </div>
              <div className="fld-row">
                <div className="fld">
                  <label>Ponente</label>
                  <input value={form.speaker_name} onChange={e => setForm({ ...form, speaker_name: e.target.value })} placeholder="Nombre del ponente" />
                </div>
                <div className="fld">
                  <label>Categoría</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="">Sin categoría</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="fld">
                <label>Imagen del ponente</label>
                <div
                  className={`img-upload-area ${dragging ? "img-dragging" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {imagePreview
                    ? (
                      <div className="img-preview-wrap">
                        <img src={imagePreview} alt="Preview" className="img-preview" />
                        <button type="button" className="img-remove" onClick={clearImage}>✕ Quitar</button>
                      </div>
                    )
                    : (
                      <label className="img-dropzone" htmlFor="speaker-img">
                        <span className="img-icon">🖼️</span>
                        <span>{dragging ? "Suelta la imagen aquí" : "Arrastra o selecciona una imagen"}</span>
                        <span className="img-hint">JPEG, PNG o WebP · máx. 5 MB</span>
                      </label>
                    )
                  }
                  <input id="speaker-img" ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleImageChange} />
                </div>
              </div>
              <div className="fld">
                <label>Descripción</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción breve…" />
              </div>
              <div className="fld-row">
                <div className="fld">
                  <label>Fecha y hora</label>
                  <input type="datetime-local" value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} />
                </div>
                <div className="fld">
                  <label>Capacidad <span className="req">*</span></label>
                  <input type="number" min={1} value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="fld-row">
                <div className="fld">
                  <label>Sede <span className="req">*</span></label>
                  <input
                    value={form.campus_name}
                    onChange={e => setForm({ ...form, campus_name: e.target.value })}
                    placeholder="Ej: Claustro"
                    required
                  />
                </div>
                <div className="fld">
                  <label>Salón / Aula <span className="req">*</span></label>
                  <input
                    value={form.room_name}
                    onChange={e => setForm({ ...form, room_name: e.target.value })}
                    placeholder="Ej: Sala 3"
                    required
                  />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-cancel-modal" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="adm-btn-primary" disabled={submitting}>
                  {submitting ? "Guardando…" : editing ? "Guardar cambios" : "Crear conferencia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal ponente ──────────────────────────────────────────────────── */}
      {showSpeakerModal && (
        <div className="adm-overlay" onClick={closeSpeakerModal}>
          <div className="adm-modal adm-modal--wide" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{editingSpeaker ? "Editar ponente" : "Nuevo ponente"}</h2>
              <button className="modal-x" onClick={closeSpeakerModal}>✕</button>
            </div>
            <form className="modal-body" onSubmit={handleSpeakerSubmit} noValidate>
              {speakerFormError && <div className="modal-err">⚠ {speakerFormError}</div>}

              {/* Preview del avatar */}
              <div className="sp-preview">
                <div className="sp-preview-avatar" style={{ background: speakerForm.gradient }}>
                  {speakerForm.initials || "?"}
                </div>
                <div className="sp-preview-info">
                  <span className="sp-preview-name">{speakerForm.name || "Nombre del ponente"}</span>
                  <span className="sp-preview-inst">{speakerForm.institution || "Institución"}</span>
                </div>
              </div>

              <div className="fld">
                <label>Nombre completo <span className="req">*</span></label>
                <input
                  value={speakerForm.name}
                  onChange={e => handleSpeakerNameChange(e.target.value)}
                  placeholder="Ej: Prof. Marco Bertolini"
                />
              </div>

              <div className="fld-row">
                <div className="fld">
                  <label>Institución <span className="req">*</span></label>
                  <input value={speakerForm.institution} onChange={e => setSpeakerForm(f => ({ ...f, institution: e.target.value }))} placeholder="Universidad o empresa" />
                </div>
                <div className="fld">
                  <label>País <span className="req">*</span></label>
                  <div className="fld-row" style={{ gap: 8 }}>
                    <input value={speakerForm.country} onChange={e => setSpeakerForm(f => ({ ...f, country: e.target.value }))} placeholder="🇨🇴" style={{ maxWidth: 64, textAlign: "center", fontSize: 20 }} />
                    <input value={speakerForm.countryName} onChange={e => setSpeakerForm(f => ({ ...f, countryName: e.target.value }))} placeholder="Colombia" />
                  </div>
                </div>
              </div>

              <div className="fld-row">
                <div className="fld">
                  <label>Área técnica</label>
                  <select value={speakerForm.area} onChange={e => setSpeakerForm(f => ({ ...f, area: e.target.value }))}>
                    {AREAS_LIST.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="fld">
                  <label>Profesión / Rol</label>
                  <select value={speakerForm.profession} onChange={e => setSpeakerForm(f => ({ ...f, profession: e.target.value }))}>
                    {PROFESSIONS_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="fld-row">
                <div className="fld">
                  <label>Años de experiencia <span className="req">*</span></label>
                  <input type="number" min={1} max={60} value={speakerForm.experience} onChange={e => setSpeakerForm(f => ({ ...f, experience: parseInt(e.target.value) || 1 }))} />
                </div>
                <div className="fld">
                  <label>Iniciales (avatar)</label>
                  <input
                    value={speakerForm.initials}
                    onChange={e => setSpeakerForm(f => ({ ...f, initials: e.target.value.toUpperCase().slice(0, 2) }))}
                    placeholder="MB"
                    maxLength={2}
                    style={{ textTransform: "uppercase", letterSpacing: 3, textAlign: "center", fontWeight: 700 }}
                  />
                </div>
              </div>

              <div className="fld">
                <label>Color del avatar</label>
                <div className="gradient-picker">
                  {GRADIENT_PRESETS.map(g => (
                    <button
                      key={g}
                      type="button"
                      className={`gradient-swatch${speakerForm.gradient === g ? " active" : ""}`}
                      style={{ background: g }}
                      onClick={() => setSpeakerForm(f => ({ ...f, gradient: g }))}
                      title={g}
                      aria-label="Seleccionar color"
                    />
                  ))}
                </div>
              </div>

              <div className="fld">
                <label>Tipo de participación</label>
                <label className="sp-check-label">
                  <input type="checkbox" checked={speakerForm.keynote} onChange={e => setSpeakerForm(f => ({ ...f, keynote: e.target.checked }))} />
                  <span>Keynote Speaker (conferencista principal)</span>
                </label>
              </div>

              <div className="fld">
                <label>Tema de conferencia <span className="req">*</span></label>
                <input value={speakerForm.topic} onChange={e => setSpeakerForm(f => ({ ...f, topic: e.target.value }))} placeholder="Título o tema de la ponencia" />
              </div>

              <div className="fld">
                <label>Biografía / Descripción</label>
                <textarea rows={4} value={speakerForm.bio} onChange={e => setSpeakerForm(f => ({ ...f, bio: e.target.value }))} placeholder="Experiencia, logros, institución actual…" />
              </div>

              <div className="modal-foot">
                <button type="button" className="btn-cancel-modal" onClick={closeSpeakerModal}>Cancelar</button>
                <button type="submit" className="adm-btn-primary" disabled={submittingSpeaker}>
                  {submittingSpeaker ? "Guardando…" : editingSpeaker ? "Guardar cambios" : "Crear ponente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirmar borrado conferencia ──────────────────────────────────── */}
      {toDelete && (
        <div className="adm-overlay" onClick={() => setToDelete(null)}>
          <div className="adm-confirm" onClick={e => e.stopPropagation()}>
            <h3>Eliminar conferencia</h3>
            <p>¿Confirmas eliminar <strong>"{toDelete.title}"</strong>?</p>
            {toDelete.registered_count > 0 && (
              <p className="confirm-warn">⚠ Esta conferencia tiene {toDelete.registered_count} usuario(s) inscrito(s).</p>
            )}
            <div className="confirm-btns">
              <button onClick={() => setToDelete(null)}>Cancelar</button>
              <button className="btn-confirm-del" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Eliminando…" : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmar borrado ponente ──────────────────────────────────────── */}
      {toDeleteSpeaker && (
        <div className="adm-overlay" onClick={() => setToDeleteSpeaker(null)}>
          <div className="adm-confirm" onClick={e => e.stopPropagation()}>
            <h3>Eliminar ponente</h3>
            <p>¿Confirmas eliminar a <strong>"{toDeleteSpeaker.name}"</strong>?</p>
            <p className="confirm-warn" style={{ color: "#64748b", background: "#f8fafc", borderColor: "#e2e8f0" }}>
              Esta acción elimina el ponente de la vista pública de Ponentes.
            </p>
            <div className="confirm-btns">
              <button onClick={() => setToDeleteSpeaker(null)}>Cancelar</button>
              <button className="btn-confirm-del" onClick={handleDeleteSpeaker}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Escáner QR ─────────────────────────────────────────────────────── */}
      {showQrScanner && (
        <div className="adm-overlay qr-overlay" onClick={closeQrScanner}>
          <div className="qr-modal" onClick={e => e.stopPropagation()}>
            <div className="qr-modal-head">
              <div>
                <span className="qr-modal-badge">Escáner de entradas</span>
                <h2 className="qr-modal-title">Validar QR</h2>
              </div>
              <button className="modal-x" onClick={closeQrScanner}>✕</button>
            </div>
            <div className={`qr-viewport-wrap ${qrResult ? (qrResult.valid ? 'qr-glow-green' : 'qr-glow-red') : ''}`}>
              <div id="qr-reader" className="qr-reader" />
              {!qrResult && !qrValidating && (
                <div className="qr-frame" aria-hidden="true">
                  <span className="qr-corner qr-corner--tl" />
                  <span className="qr-corner qr-corner--tr" />
                  <span className="qr-corner qr-corner--bl" />
                  <span className="qr-corner qr-corner--br" />
                  <span className="qr-scan-line" />
                </div>
              )}
              {qrValidating && (
                <div className="qr-validating-overlay">
                  <div className="qr-ring">
                    <svg viewBox="0 0 80 80" fill="none">
                      <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.12)" strokeWidth="6"/>
                      <circle cx="40" cy="40" r="34" stroke="#e8941a" strokeWidth="6" strokeLinecap="round" strokeDasharray="60 154" className="qr-ring-arc" />
                    </svg>
                  </div>
                  <p className="qr-validating-label">Validando…</p>
                </div>
              )}
              {qrResult && !qrValidating && (
                <div className={`qr-result-overlay ${qrResult.valid ? 'qr-result-ok' : 'qr-result-err'}`}>
                  <div className="qr-result-icon">{qrResult.valid ? '✓' : '✕'}</div>
                  <p className="qr-result-msg">{qrResult.message}</p>
                  {qrResult.valid && qrResult.conference_title && (
                    <p className="qr-result-detail">
                      <span className="qr-detail-label">Conferencia</span>
                      {qrResult.conference_title}
                    </p>
                  )}
                  {qrResult.valid && qrResult.attendee_name && (
                    <p className="qr-result-detail">
                      <span className="qr-detail-label">Asistente</span>
                      {qrResult.attendee_name}
                    </p>
                  )}
                  <button className="qr-btn-rescan" onClick={resetScan}>Escanear otro</button>
                </div>
              )}
            </div>
            <p className="qr-hint">{qrResult ? '' : 'Apunta la cámara al código QR del ticket'}</p>
          </div>
        </div>
      )}

    </div>
  );
}
