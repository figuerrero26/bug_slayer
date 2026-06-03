import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useLang } from "../../context/LanguageContext";
import "../../css/Ferias.css";

/* ── Animation presets ── */
const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 44 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } },
};
const fadeLeft: Variants = {
  hidden:  { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: "easeOut" } },
};
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11 } },
};

/* ── Animated counter ── */
function AnimCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref   = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !fired.current) {
        fired.current = true;
        let f = 0;
        const id = setInterval(() => {
          f++;
          setVal(Math.min(Math.round((f / 60) * target), target));
          if (f >= 60) clearInterval(id);
        }, 16);
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{val}{suffix}</span>;
}

/* ── Static data ── */
const TIMELINE = [
  { year: "2014", icon: "🚀" },
  { year: "2016", icon: "🌍" },
  { year: "2019", icon: "🏆" },
  { year: "2020", icon: "💻" },
  { year: "2025", icon: "⚡" },
  { year: "2026", icon: "🇮🇹" },
];

const PARTNERS = [
  { name: "IEEE Colombia",                 icon: "⚡" },
  { name: "Univ. Católica de Colombia",    icon: "🎓" },
  { name: "ACOFI",                         icon: "🏛️" },
  { name: "Soc. Colombiana de Ingenieros", icon: "🔧" },
];

/* Ediciones con link o "próximamente" */
const EDITIONS = [
  { year: "CONIITI 2015", to: "/coniiti2015", active: true  },
  { year: "CONIITI 2016", to: null,           active: false },
  { year: "CONIITI 2019", to: null,           active: false },
  { year: "CONIITI 2020", to: null,           active: false },
  { year: "CONIITI 2025", to: null,           active: false },
];

export default function Ferias(): React.JSX.Element {
  const { t } = useLang();

  const whyCards = [
    { icon: "🤝", num: "01", title: t.goal1_t, text: t.goal1_p },
    { icon: "💡", num: "02", title: t.goal2_t, text: t.goal2_p },
    { icon: "🔗", num: "03", title: t.goal3_t, text: t.goal3_p },
    { icon: "📈", num: "04", title: t.goal4_t, text: t.goal4_p },
  ];

  const dates = [
    { icon: "📝", val: t.fer_date1_val, label: t.fer_date1_label },
    { icon: "✅", val: t.fer_date2_val, label: t.fer_date2_label },
    { icon: "🎤", val: t.fer_date3_val, label: t.fer_date3_label },
  ];

  const includes = [t.fer_inc1, t.fer_inc2, t.fer_inc3];

  return (
    <div className="fer-page">

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="fer-hero">
        <div className="fer-hero-dots" />
        <div className="fer-glow fer-glow-tr" />
        <div className="fer-glow fer-glow-bl" />

        <motion.div
          className="fer-hero-content"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <span className="fer-chip">{t.fer_hero_tag}</span>
          <h1 className="fer-hero-title">CONIITI</h1>
          <p className="fer-hero-sub">{t.fer_hero_sub}</p>
          <div className="fer-hero-pills">
            <span className="fer-pill">📍 Bogotá, Colombia</span>
            <span className="fer-pill fer-pill-red">📅 Sep 30 – Oct 2, 2026</span>
          </div>
        </motion.div>

        <div className="fer-hero-wave" />
      </section>

      {/* ══════════════════ STATS (light) ══════════════════ */}
      <section className="fer-stats-section">
        <div className="fer-stats-wrap">
          {[
            { t: 12,  s: "",  l: t.fer_stat_editions    },
            { t: 20,  s: "+", l: t.fer_stat_countries   },
            { t: 452, s: "+", l: t.fer_stat_participants },
            { t: 35,  s: "",  l: t.fer_stat_spk         },
          ].map((s, i) => (
            <div className="fer-stat-item" key={i}>
              <div className="fer-stat-decor">{s.t}{s.s}</div>
              <strong className="fer-stat-num">
                <AnimCounter target={s.t} suffix={s.s} />
              </strong>
              <span className="fer-stat-lbl">{s.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ MISIÓN (dark navy) ══════════════════ */}
      <section className="fer-dark fer-mission-section">
        <div className="fer-stripe" />
        <div className="fer-inner">
          <motion.div
            className="fer-mission-wrap"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="fer-mission-head">
              <span className="fer-mission-badge">{t.fer_mission_label}</span>
              <span className="fer-mission-decor">XII</span>
            </div>
            <blockquote className="fer-glass-quote">
              <span className="fer-big-quote">"</span>
              <p>{t.fer_mission_q}</p>
            </blockquote>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════ EDICIONES (white, cards) ══════════════════ */}
      <section className="fer-light">
        <div className="fer-inner">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="fer-title-light fer-centered">{t.fer_editions_title}</h2>
            <p className="fer-sub-center">{t.fer_editions_sub}</p>
          </motion.div>

          <motion.div
            className="fer-editions-grid"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
          >
            {EDITIONS.map((ed, i) => (
              <motion.div key={i} variants={fadeUp}>
                {ed.active && ed.to ? (
                  <Link to={ed.to} className="fer-edition-card fer-edition-active">
                    <span className="fer-ed-num">0{i + 1}</span>
                    <h3>{ed.year}</h3>
                    <p>{t.fer_card_2015}</p>
                    <span className="fer-ed-arrow">→</span>
                  </Link>
                ) : (
                  <div className="fer-edition-card fer-edition-soon">
                    <span className="fer-ed-num">0{i + 1}</span>
                    <h3>{ed.year}</h3>
                    <span className="fer-soon-tag">{t.fer_coming_soon}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════ TIMELINE (light blue) ══════════════════ */}
      <section className="fer-light-alt">
        <div className="fer-inner">
          <motion.h2
            className="fer-title-light fer-centered"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
          >
            {t.fer_timeline}
          </motion.h2>
          <motion.div
            className="fer-tl-grid"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
          >
            {TIMELINE.map((item, i) => (
              <motion.div className="fer-tl-card" key={item.year} variants={fadeUp}>
                <span className="fer-tl-bg-num">0{i + 1}</span>
                <div className="fer-tl-head">
                  <span className="fer-tl-icon">{item.icon}</span>
                  <span className="fer-tl-year">{item.year}</span>
                </div>
                <p className="fer-tl-text">{t[`fer_tl_${item.year}`]}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════ ¿POR QUÉ ASISTIR? (very dark) ══════════════════ */}
      <section className="fer-dark fer-why-section">
        <div className="fer-stripe" />
        <div className="fer-inner">
          <motion.h2
            className="fer-title-dark fer-centered"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
          >
            {t.fer_why}
          </motion.h2>
          <motion.div
            className="fer-why-grid"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
          >
            {whyCards.map((c, i) => (
              <motion.div className="fer-glass-card" key={i} variants={fadeUp}>
                <span className="fer-glass-num">{c.num}</span>
                <div className="fer-glass-icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════ FECHAS + INCLUDES (white) ══════════════════ */}
      <section className="fer-light">
        <div className="fer-inner">
          <motion.h2
            className="fer-title-light fer-centered"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
          >
            {t.fer_dates_title}
          </motion.h2>

          <motion.div
            className="fer-dates-grid"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
          >
            {dates.map((d, i) => (
              <motion.div className="fer-date-card" key={i} variants={fadeUp}>
                <span className="fer-date-icon">{d.icon}</span>
                <strong className="fer-date-val">{d.val}</strong>
                <span className="fer-date-lbl">{d.label}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="fer-includes-box"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
          >
            <h3 className="fer-includes-title">{t.fer_includes}</h3>
            <ul className="fer-includes-list">
              {includes.map((inc, i) => (
                <li key={i}>
                  <span className="fer-check">✓</span>
                  {inc}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════ MODALIDADES (dark navy) ══════════════════ */}
      <section className="fer-dark fer-modal-section">
        <div className="fer-stripe" />
        <div className="fer-inner">
          <motion.h2
            className="fer-title-dark fer-centered"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
          >
            {t.fer_modalities}
          </motion.h2>
          <motion.div
            className="fer-modal-row"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div className="fer-modal-card" variants={fadeUp}>
              <div className="fer-modal-icon">🏛️</div>
              <h3 className="fer-modal-title">{t.fer_modal_local}</h3>
              <p className="fer-modal-desc">{t.fer_modal_local_desc}</p>
            </motion.div>
            <div className="fer-modal-sep" />
            <motion.div className="fer-modal-card" variants={fadeUp}>
              <div className="fer-modal-icon">💻</div>
              <h3 className="fer-modal-title">{t.fer_modal_virtual}</h3>
              <p className="fer-modal-desc">{t.fer_modal_virtual_desc}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════ ALIADOS + UNIVERSIDAD (light blue) ══════════════════ */}
      <section className="fer-light-alt">
        <div className="fer-inner">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeLeft}
          >
            <h2 className="fer-title-light">{t.nos_uni}</h2>
            <p className="fer-body-p">{t.nos_uni_p}</p>
            <a
              href="https://www.ucatolica.edu.co"
              target="_blank" rel="noreferrer"
              className="fer-link-arrow"
            >
              {t.nos_visit}
            </a>
          </motion.div>

          <motion.div
            style={{ marginTop: 52 }}
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 className="fer-title-light" variants={fadeUp}>
              {t.fer_partners_title}
            </motion.h2>
            <div className="fer-partners-wrap">
              {PARTNERS.map((p, i) => (
                <motion.div className="fer-partner-pill" key={i} variants={fadeUp}>
                  <span>{p.icon}</span>
                  <span>{p.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════ CONTACTO (very dark) ══════════════════ */}
      <section className="fer-dark fer-contact-section">
        <div className="fer-stripe" />
        <div className="fer-inner">
          <motion.h2
            className="fer-title-dark fer-centered"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
          >
            {t.fer_contact_title}
          </motion.h2>
          <motion.div
            className="fer-contact-grid"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div className="fer-contact-card" variants={fadeUp}>
              <div className="fer-contact-icon">📧</div>
              <span className="fer-contact-lbl">{t.fer_contact_email_l}</span>
              <a href="mailto:coniiti@ucatolica.edu.co" className="fer-contact-val">
                coniiti@ucatolica.edu.co
              </a>
            </motion.div>
            <motion.div className="fer-contact-card" variants={fadeUp}>
              <div className="fer-contact-icon">📞</div>
              <span className="fer-contact-lbl">{t.fer_contact_phone_l}</span>
              <span className="fer-contact-val">(601) 4433700<br />Ext. 3130 · 60 · 90</span>
            </motion.div>
            <motion.div className="fer-contact-card" variants={fadeUp}>
              <div className="fer-contact-icon">📍</div>
              <span className="fer-contact-lbl">{t.fer_contact_addr_l}</span>
              <span className="fer-contact-val">Carrera 13 # 47–30<br />Sede 4, Bogotá</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════ CTA FINAL ══════════════════ */}
      <motion.section
        className="fer-cta-section"
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        variants={fadeUp}
      >
        <div className="fer-cta-glow-l" />
        <div className="fer-cta-glow-r" />
        <div className="fer-cta-inner">
          <h2 className="fer-cta-title">{t.fer_cta_title}</h2>
          <p className="fer-cta-sub">{t.fer_format}</p>
          <a href="/inscripciones" className="fer-cta-btn">{t.fer_cta_btn}</a>
        </div>
      </motion.section>

    </div>
  );
}
