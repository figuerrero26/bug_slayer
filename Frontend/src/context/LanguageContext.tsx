import { createContext, useContext, useState, ReactNode } from "react";

export type LangCode = "ES" | "EN" | "IT" | "PT" | "FR";

export const LANGUAGES: { code: LangCode; flag: string; name: string }[] = [
  { code: "ES", flag: "🇪🇸", name: "Español"   },
  { code: "EN", flag: "🇺🇸", name: "English"   },
  { code: "IT", flag: "🇮🇹", name: "Italiano"  },
  { code: "PT", flag: "🇧🇷", name: "Português" },
  { code: "FR", flag: "🇫🇷", name: "Français"  },
];

type T = Record<string, string>;

const ES: T = {
  /* Navbar */
  home: "Home", nosotros: "Nosotros", ferias: "Nuestras ferias",
  inscripciones: "Inscripciones", noticias: "Noticias", login: "Login",
  buscar: "Buscar...",
  /* Hero */
  hero_title: "Coniiti 2026", hero_country: "País invitado: Italia",
  hero_speakers: "Conferencistas internacionales",
  /* Stats */
  stat_speakers: "Conferencistas", stat_sponsors: "Patrocinadores",
  stat_workshops: "Talleres", stat_attendees: "Participantes",
  stat_host: "País anfitrión", stat_days: "Días de evento",
  /* Countdown */
  days: "Días", hours: "Horas", minutes: "Minutos", seconds: "Segundos",
  /* Tarjetas Home */
  card1_title: "Home", card1_p: "Explora nuestra información principal.",
  card2_title: "Nuestras Ferias", card2_p: "Eventos académicos y empresariales.",
  card3_title: "Inscripciones", card3_p: "Conoce los pasos para aplicar.",
  card4_title: "Noticias", card4_p: "Mantente informado.",
  /* Nosotros */
  nos_what: "¿Qué es CONIITI?",
  nos_what_p: "El Congreso Internacional de Innovación y Tendencias en Ingeniería es el evento académico insignia de la Universidad Católica de Colombia. En su XII edición, CONIITI 2026 tiene como país invitado a Italia.",
  nos_history: "Historia",
  nos_history_p: "Desde 2014, CONIITI ha crecido de un evento nacional a un congreso con presencia en más de 20 países. Cada edición ha impulsado la publicación de investigaciones indexadas y el fortalecimiento de redes internacionales.",
  nos_uni: "Universidad Organizadora",
  nos_uni_p: "La Universidad Católica de Colombia, con más de 50 años de historia y acreditación de alta calidad, es la sede y alma de CONIITI. Su Facultad de Ingeniería lidera cada edición con rigor académico y visión global.",
  nos_visit: "Visitar sitio oficial →",
  nos_goals: "Objetivos",
  goal1_t: "Internacionalización", goal1_p: "Intercambio de conocimiento entre ingenieros del mundo.",
  goal2_t: "Innovación", goal2_p: "Últimas tendencias tecnológicas e investigaciones aplicadas.",
  goal3_t: "Networking", goal3_p: "Redes entre académicos, empresas e investigadores.",
  goal4_t: "Formación", goal4_p: "Fortalecimiento de competencias en ingeniería.",
  /* Footer */
  footer_center: "Centro de Convenciones",
  footer_rights: "© 2026 CONIITI - Todos los derechos reservados",
  /* Login */
  back: "Volver al inicio",
};

const EN: T = {
  home: "Home", nosotros: "About Us", ferias: "Our Fairs",
  inscripciones: "Registrations", noticias: "News", login: "Login",
  buscar: "Search...",
  hero_title: "Coniiti 2026", hero_country: "Guest Country: Italy",
  hero_speakers: "International Speakers",
  stat_speakers: "Speakers", stat_sponsors: "Sponsors",
  stat_workshops: "Workshops", stat_attendees: "Attendees",
  stat_host: "Host Country", stat_days: "Event Days",
  days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds",
  card1_title: "Home", card1_p: "Explore our main information.",
  card2_title: "Our Fairs", card2_p: "Academic and business events.",
  card3_title: "Registrations", card3_p: "Learn the steps to apply.",
  card4_title: "News", card4_p: "Stay informed.",
  nos_what: "What is CONIITI?",
  nos_what_p: "The International Congress of Innovation and Trends in Engineering is the flagship academic event of Universidad Católica de Colombia. In its XII edition, CONIITI 2026 welcomes Italy as guest country.",
  nos_history: "History",
  nos_history_p: "Since 2014, CONIITI has grown from a national event to a congress with presence in more than 20 countries. Each edition has driven the publication of indexed research and the strengthening of international networks.",
  nos_uni: "Organizing University",
  nos_uni_p: "Universidad Católica de Colombia, with more than 50 years of history and high quality accreditation, is the home of CONIITI. Its Faculty of Engineering leads each edition with academic rigor and global vision.",
  nos_visit: "Visit official site →",
  nos_goals: "Goals",
  goal1_t: "Internationalization", goal1_p: "Knowledge exchange among engineers worldwide.",
  goal2_t: "Innovation", goal2_p: "Latest technological trends and applied research.",
  goal3_t: "Networking", goal3_p: "Networks among academics, companies and researchers.",
  goal4_t: "Training", goal4_p: "Strengthening engineering competencies.",
  footer_center: "Convention Center",
  footer_rights: "© 2026 CONIITI - All rights reserved",
  back: "Back to home",
};

const IT: T = {
  home: "Home", nosotros: "Chi Siamo", ferias: "Le Nostre Fiere",
  inscripciones: "Iscrizioni", noticias: "Notizie", login: "Accedi",
  buscar: "Cerca...",
  hero_title: "Coniiti 2026", hero_country: "Paese ospite: Italia",
  hero_speakers: "Relatori internazionali",
  stat_speakers: "Relatori", stat_sponsors: "Sponsor",
  stat_workshops: "Workshop", stat_attendees: "Partecipanti",
  stat_host: "Paese ospitante", stat_days: "Giorni di evento",
  days: "Giorni", hours: "Ore", minutes: "Minuti", seconds: "Secondi",
  card1_title: "Home", card1_p: "Esplora le nostre informazioni principali.",
  card2_title: "Le Nostre Fiere", card2_p: "Eventi accademici e aziendali.",
  card3_title: "Iscrizioni", card3_p: "Scopri i passi per candidarsi.",
  card4_title: "Notizie", card4_p: "Rimani informato.",
  nos_what: "Cos'è CONIITI?",
  nos_what_p: "Il Congresso Internazionale di Innovazione e Tendenze nell'Ingegneria è l'evento accademico di punta dell'Università Cattolica della Colombia. Nella sua XII edizione, CONIITI 2026 ha l'Italia come paese ospite.",
  nos_history: "Storia",
  nos_history_p: "Dal 2014, CONIITI è cresciuto da un evento nazionale a un congresso con presenza in più di 20 paesi. Ogni edizione ha promosso la pubblicazione di ricerche indicizzate.",
  nos_uni: "Università Organizzatrice",
  nos_uni_p: "L'Università Cattolica della Colombia, con oltre 50 anni di storia e accreditamento di alta qualità, è la sede di CONIITI.",
  nos_visit: "Visita il sito ufficiale →",
  nos_goals: "Obiettivi",
  goal1_t: "Internazionalizzazione", goal1_p: "Scambio di conoscenze tra ingegneri del mondo.",
  goal2_t: "Innovazione", goal2_p: "Ultime tendenze tecnologiche e ricerche applicate.",
  goal3_t: "Networking", goal3_p: "Reti tra accademici, aziende e ricercatori.",
  goal4_t: "Formazione", goal4_p: "Rafforzamento delle competenze ingegneristiche.",
  footer_center: "Centro Congressi",
  footer_rights: "© 2026 CONIITI - Tutti i diritti riservati",
  back: "Torna alla home",
};

const PT: T = {
  home: "Início", nosotros: "Sobre Nós", ferias: "Nossas Feiras",
  inscripciones: "Inscrições", noticias: "Notícias", login: "Entrar",
  buscar: "Buscar...",
  hero_title: "Coniiti 2026", hero_country: "País convidado: Itália",
  hero_speakers: "Palestrantes internacionais",
  stat_speakers: "Palestrantes", stat_sponsors: "Patrocinadores",
  stat_workshops: "Oficinas", stat_attendees: "Participantes",
  stat_host: "País anfitrião", stat_days: "Dias de evento",
  days: "Dias", hours: "Horas", minutes: "Minutos", seconds: "Segundos",
  card1_title: "Início", card1_p: "Explore nossas informações principais.",
  card2_title: "Nossas Feiras", card2_p: "Eventos acadêmicos e empresariais.",
  card3_title: "Inscrições", card3_p: "Conheça os passos para se inscrever.",
  card4_title: "Notícias", card4_p: "Fique informado.",
  nos_what: "O que é CONIITI?",
  nos_what_p: "O Congresso Internacional de Inovação e Tendências em Engenharia é o evento acadêmico principal da Universidade Católica da Colômbia. Em sua XII edição, CONIITI 2026 tem a Itália como país convidado.",
  nos_history: "História",
  nos_history_p: "Desde 2014, o CONIITI cresceu de um evento nacional para um congresso com presença em mais de 20 países.",
  nos_uni: "Universidade Organizadora",
  nos_uni_p: "A Universidade Católica da Colômbia, com mais de 50 anos de história e acreditação de alta qualidade, é a sede do CONIITI.",
  nos_visit: "Visitar site oficial →",
  nos_goals: "Objetivos",
  goal1_t: "Internacionalização", goal1_p: "Troca de conhecimento entre engenheiros do mundo.",
  goal2_t: "Inovação", goal2_p: "Últimas tendências tecnológicas e pesquisas aplicadas.",
  goal3_t: "Networking", goal3_p: "Redes entre acadêmicos, empresas e pesquisadores.",
  goal4_t: "Formação", goal4_p: "Fortalecimento de competências em engenharia.",
  footer_center: "Centro de Convenções",
  footer_rights: "© 2026 CONIITI - Todos os direitos reservados",
  back: "Voltar ao início",
};

const FR: T = {
  home: "Accueil", nosotros: "À propos", ferias: "Nos Foires",
  inscripciones: "Inscriptions", noticias: "Actualités", login: "Connexion",
  buscar: "Rechercher...",
  hero_title: "Coniiti 2026", hero_country: "Pays invité : Italie",
  hero_speakers: "Conférenciers internationaux",
  stat_speakers: "Conférenciers", stat_sponsors: "Sponsors",
  stat_workshops: "Ateliers", stat_attendees: "Participants",
  stat_host: "Pays hôte", stat_days: "Jours d'événement",
  days: "Jours", hours: "Heures", minutes: "Minutes", seconds: "Secondes",
  card1_title: "Accueil", card1_p: "Explorez nos informations principales.",
  card2_title: "Nos Foires", card2_p: "Événements académiques et d'entreprise.",
  card3_title: "Inscriptions", card3_p: "Découvrez les étapes pour postuler.",
  card4_title: "Actualités", card4_p: "Restez informé.",
  nos_what: "Qu'est-ce que CONIITI ?",
  nos_what_p: "Le Congrès International d'Innovation et de Tendances en Ingénierie est l'événement académique phare de l'Université Catholique de Colombie. Dans sa XIIe édition, CONIITI 2026 accueille l'Italie comme pays invité.",
  nos_history: "Histoire",
  nos_history_p: "Depuis 2014, CONIITI est passé d'un événement national à un congrès présent dans plus de 20 pays.",
  nos_uni: "Université Organisatrice",
  nos_uni_p: "L'Université Catholique de Colombie, avec plus de 50 ans d'histoire et une accréditation de haute qualité, est le siège de CONIITI.",
  nos_visit: "Visiter le site officiel →",
  nos_goals: "Objectifs",
  goal1_t: "Internationalisation", goal1_p: "Échange de connaissances entre ingénieurs du monde entier.",
  goal2_t: "Innovation", goal2_p: "Dernières tendances technologiques et recherches appliquées.",
  goal3_t: "Networking", goal3_p: "Réseaux entre universitaires, entreprises et chercheurs.",
  goal4_t: "Formation", goal4_p: "Renforcement des compétences en ingénierie.",
  footer_center: "Centre de Conventions",
  footer_rights: "© 2026 CONIITI - Tous droits réservés",
  back: "Retour à l'accueil",
};

export const TRANSLATIONS: Record<LangCode, T> = { ES, EN, IT, PT, FR };

interface LanguageContextType {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: T;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "ES", setLang: () => {}, t: ES,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(
    () => (localStorage.getItem("lang") as LangCode) || "ES"
  );
  const setLang = (l: LangCode) => { setLangState(l); localStorage.setItem("lang", l); };
  return (
    <LanguageContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
