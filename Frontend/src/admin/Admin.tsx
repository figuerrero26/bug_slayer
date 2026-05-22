import { useState, useEffect, useCallback, useRef } from "react";
import { SEARCH_URL } from "../services/api";
import "../css/Admin.css";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Conference {
  id: number;
  title: string;
  description: string | null;
  speaker_name: string | null;
  speaker_image_url: string | null;
  category: string | null;
  schedule: string | null;
  location_text: string | null;
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
  location_text: string;
  capacity: number;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const CATEGORIES = ["IAAA", "Software", "Redes", "Datos", "Robótica", "Gestión", "Innovación", "Otro"];

const EMPTY_FORM: ConferenceForm = {
  title: "", description: "", speaker_name: "",
  category: "", schedule: "", location_text: "", capacity: 100,
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
  const [conferences, setConferences]   = useState<Conference[]>([]);
  const [loading, setLoading]           = useState(true);
  const [pageError, setPageError]       = useState("");

  const [toast, setToast] = useState({ msg: "", ok: true });

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Conference | null>(null);
  const [form, setForm]           = useState<ConferenceForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Imagen
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragging, setDragging]         = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toDelete, setToDelete] = useState<Conference | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showQrScanner, setShowQrScanner] = useState(false);
  const [qrValidating, setQrValidating]   = useState(false);
  const [qrResult, setQrResult]           = useState<{
    valid: boolean;
    message: string;
    conference_title?: string | null;
    attendee_name?: string | null;
  } | null>(null);
  const scannerRef = useRef<any>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchConferences = useCallback(async () => {
    try {
      const res = await fetch(`${SEARCH_URL}/conferences`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setConferences(await res.json());
      setPageError("");
    } catch (e: any) {
      setPageError(e.message || "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConferences(); }, [fetchConferences]);

  // ── Toast ──────────────────────────────────────────────────────────────────

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: "", ok: true }), 3500);
  }

  // ── Imagen ─────────────────────────────────────────────────────────────────

  function applyFile(file: File | null) {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    applyFile(e.target.files?.[0] ?? null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

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
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Error al subir la imagen");
    }
    const updated: Conference = await res.json();
    setConferences(prev => prev.map(c => (c.id === conferenceId ? updated : c)));
  }

  // ── Modal ──────────────────────────────────────────────────────────────────

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    clearImage();
    setShowModal(true);
  }

  function openEdit(conf: Conference) {
    setEditing(conf);
    setForm({
      title:         conf.title,
      description:   conf.description   ?? "",
      speaker_name:  conf.speaker_name  ?? "",
      category:      conf.category      ?? "",
      schedule:      toLocalDT(conf.schedule),
      location_text: conf.location_text ?? "",
      capacity:      conf.capacity,
    });
    setFormError("");
    clearImage();
    // Mostrar imagen actual como preview si existe
    setImagePreview(speakerImgSrc(conf.speaker_image_url));
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setFormError("");
    clearImage();
  }

  function validate(): string | null {
    if (!form.title.trim()) return "El título es obligatorio.";
    if (form.capacity <= 0) return "La capacidad debe ser mayor a 0.";
    return null;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setFormError(err); return; }

    setSubmitting(true);
    setFormError("");

    const body = {
      title:         form.title.trim(),
      description:   form.description.trim()   || null,
      speaker_name:  form.speaker_name.trim()  || null,
      category:      form.category             || null,
      schedule:      form.schedule ? form.schedule + ":00" : null,
      location_text: form.location_text.trim() || null,
      capacity:      form.capacity,
    };

    try {
      const url    = editing ? `${SEARCH_URL}/conferences/${editing.id}` : `${SEARCH_URL}/conferences`;
      const method = editing ? "PUT" : "POST";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: Conference = await res.json();

      if (!res.ok) {
        const msg = Array.isArray((data as any).detail)
          ? (data as any).detail.map((d: any) => d.msg).join(", ")
          : (data as any).detail || "Error al guardar";
        setFormError(msg);
        return;
      }

      // Actualizar lista localmente
      if (editing) {
        setConferences(prev => prev.map(c => (c.id === editing.id ? data : c)));
      } else {
        setConferences(prev => [...prev, data]);
      }

      // Subir imagen si el usuario seleccionó una
      if (imageFile) {
        try {
          await uploadImage(data.id);
          showToast(editing ? "Conferencia actualizada con imagen" : "Conferencia creada con imagen");
        } catch (imgErr: any) {
          showToast(`Guardado OK, pero la imagen falló: ${imgErr.message}`, false);
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

  // ── Eliminar ───────────────────────────────────────────────────────────────

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
        showToast(data.detail || "No se pudo eliminar", false);
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
    try {
      await scannerRef.current?.pause(true);
    } catch {}

    setQrValidating(true);
    setQrResult(null);

    try {
      const res = await fetch(`${SEARCH_URL}/qr/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_payload: decodedText }),
      });
      const data = await res.json();
      setQrResult({
        valid: data.valid,
        message: data.message,
        conference_title: data.conference_title,
        attendee_name: data.attendee_name,
      });
    } catch {
      setQrResult({ valid: false, message: "Error de conexión con el servidor" });
    } finally {
      setQrValidating(false);
    }
  }

  function closeQrScanner() {
    try { scannerRef.current?.stop(); } catch {}
    scannerRef.current = null;
    setShowQrScanner(false);
    setQrResult(null);
    setQrValidating(false);
  }

  function resetScan() {
    setQrResult(null);
    try { scannerRef.current?.resume(); } catch {}
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
      scannerRef.current?.stop().catch(() => {});
      scannerRef.current = null;
    };
  }, [showQrScanner]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="adm-page">

      {toast.msg && (
        <div className={`adm-toast ${toast.ok ? "toast-ok" : "toast-err"}`}>{toast.msg}</div>
      )}

      <header className="adm-header">
        <div>
          <span className="adm-badge">Administración</span>
          <h1 className="adm-title">Panel de Conferencias</h1>
          <p className="adm-sub">CONIITTI 2026 — Gestión interna · acceso directo</p>
        </div>
        <div className="adm-header-actions">
          <button className="adm-btn-secondary" onClick={() => { setQrResult(null); setShowQrScanner(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <path d="M14 14h3v3M17 20h3M20 17v3"/>
            </svg>
            Validar QR
          </button>
          <button className="adm-btn-primary" onClick={openCreate}>+ Nueva conferencia</button>
        </div>
      </header>

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
                  <th>ID</th>
                  <th>Ponente</th>
                  <th>Título</th>
                  <th>Categoría</th>
                  <th>Fecha</th>
                  <th>Cupos</th>
                  <th>Inscritos</th>
                  <th>Acciones</th>
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

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
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

              {/* Imagen del ponente */}
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
                  <input
                    id="speaker-img"
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={handleImageChange}
                  />
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

              <div className="fld">
                <label>Ubicación</label>
                <input value={form.location_text} onChange={e => setForm({ ...form, location_text: e.target.value })} placeholder="Ej: Salón 301 — Bloque C" />
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

      {/* ── Confirmar borrado ───────────────────────────────────────────────── */}
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

            <div className={
              `qr-viewport-wrap ${
                qrResult ? (qrResult.valid ? 'qr-glow-green' : 'qr-glow-red') : ''
              }`
            }>
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
                      <circle cx="40" cy="40" r="34" stroke="#e8941a" strokeWidth="6"
                        strokeLinecap="round" strokeDasharray="60 154"
                        className="qr-ring-arc"
                      />
                    </svg>
                  </div>
                  <p className="qr-validating-label">Validando…</p>
                </div>
              )}

              {qrResult && !qrValidating && (
                <div className={`qr-result-overlay ${
                  qrResult.valid ? 'qr-result-ok' : 'qr-result-err'
                }`}>
                  <div className="qr-result-icon">
                    {qrResult.valid ? '✓' : '✕'}
                  </div>
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
                  <button className="qr-btn-rescan" onClick={resetScan}>
                    Escanear otro
                  </button>
                </div>
              )}
            </div>

            <p className="qr-hint">
              {qrResult ? '' : 'Apunta la cámara al código QR del ticket'}
            </p>

          </div>
        </div>
      )}

    </div>
  );
}
