export const SPEAKERS_KEY = "coniiti_ponentes";

export const AREAS_LIST = [
  "IA & Machine Learning",
  "Software",
  "Redes",
  "Datos",
  "Robótica",
  "Gestión",
  "Innovación",
  "Sostenibilidad",
  "Smart Cities",
  "IoT & Industria 4.0",
  "Bioingeniería",
  "Ciberseguridad",
] as const;

export const PROFESSIONS_LIST = [
  "Profesor",
  "Investigador",
  "Ingeniero",
  "Empresario",
  "Directivo",
] as const;

export interface Speaker {
  id: number;
  name: string;
  institution: string;
  country: string;
  countryName: string;
  area: string;
  profession: string;
  topic: string;
  bio: string;
  experience: number;
  keynote?: boolean;
  initials: string;
  gradient: string;
}

export type ExpLabel = "Emergente" | "En desarrollo" | "Experimentado" | "Experto";

export function getExpLabel(years: number): ExpLabel {
  if (years <= 7)  return "Emergente";
  if (years <= 14) return "En desarrollo";
  if (years <= 21) return "Experimentado";
  return "Experto";
}

export function getExpClass(years: number): string {
  return getExpLabel(years).toLowerCase().replace(/ /g, "-");
}

export function computeInitials(name: string): string {
  const skip = ["prof.", "dr.", "dra.", "ing.", "lic.", "mgr.", "msc.", "sr.", "sra."];
  const words = name.split(" ").filter(w => !skip.includes(w.toLowerCase()) && w.length > 0);
  if (!words.length) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function loadSpeakers(): Speaker[] {
  try {
    const raw = localStorage.getItem(SPEAKERS_KEY);
    if (raw) return JSON.parse(raw) as Speaker[];
  } catch {}
  return DEFAULT_SPEAKERS;
}

export function saveSpeakers(speakers: Speaker[]): void {
  localStorage.setItem(SPEAKERS_KEY, JSON.stringify(speakers));
}

export const GRADIENT_PRESETS = [
  "linear-gradient(135deg, #009246, #ce2b37)",
  "linear-gradient(135deg, #ce2b37, #009246)",
  "linear-gradient(135deg, #0055cc, #2b7fff)",
  "linear-gradient(135deg, #7c3aed, #a78bfa)",
  "linear-gradient(135deg, #fcd116, #003893)",
  "linear-gradient(135deg, #006847, #ce1126)",
  "linear-gradient(135deg, #74acdf, #3a6fc0)",
  "linear-gradient(135deg, #009c3b, #fedf00)",
  "linear-gradient(135deg, #c43e1c, #f26522)",
  "linear-gradient(135deg, #bc002d, #ff6b8a)",
  "linear-gradient(135deg, #057a55, #0ea5e9)",
  "linear-gradient(135deg, #be185d, #ec4899)",
  "linear-gradient(135deg, #e63946, #c0392b)",
  "linear-gradient(135deg, #d62828, #0077b6)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #f97316, #8b5cf6)",
  "linear-gradient(135deg, #111827, #dd0000)",
  "linear-gradient(135deg, #0066cc, #cc0000)",
  "linear-gradient(135deg, #d62828, #f4a261)",
  "linear-gradient(135deg, #0891b2, #06b6d4)",
];

export const DEFAULT_SPEAKERS: Speaker[] = [
  {
    id: 1,
    name: "Prof. Marco Bertolini",
    institution: "Politecnico di Milano",
    country: "🇮🇹", countryName: "Italia",
    area: "IA & Machine Learning",
    profession: "Profesor",
    topic: "Inteligencia artificial aplicada a la manufactura avanzada",
    bio: "Doctor en Ingeniería de Sistemas por el Politecnico di Milano. Pionero en integración de modelos de ML en cadenas de producción industriales. Ha liderado más de 40 proyectos de I+D en Europa y América Latina con impacto en más de 200 empresas del sector.",
    experience: 28,
    keynote: true,
    initials: "MB",
    gradient: "linear-gradient(135deg, #009246, #ce2b37)",
  },
  {
    id: 2,
    name: "Dra. Giulia Romano",
    institution: "Università di Bologna",
    country: "🇮🇹", countryName: "Italia",
    area: "Sostenibilidad",
    profession: "Investigadora",
    topic: "Ingeniería verde y economía circular en la era digital",
    bio: "Investigadora senior en ingeniería medioambiental. Coordinadora del programa europeo GreenTech 2030. Sus trabajos sobre economía circular han sido adoptados por 12 empresas de la lista Fortune 500 y por organismos de la ONU.",
    experience: 22,
    keynote: true,
    initials: "GR",
    gradient: "linear-gradient(135deg, #ce2b37, #009246)",
  },
  {
    id: 3,
    name: "Dr. James Chen",
    institution: "Massachusetts Institute of Technology",
    country: "🇺🇸", countryName: "EE.UU.",
    area: "IA & Machine Learning",
    profession: "Investigador",
    topic: "Deep learning para sistemas embebidos de alta eficiencia",
    bio: "PhD en Ciencias de la Computación por MIT. Especialista en modelos neuronales eficientes para dispositivos edge. Autor de 3 patentes en optimización de redes neuronales y colaborador habitual en NeurIPS y ICML.",
    experience: 19,
    initials: "JC",
    gradient: "linear-gradient(135deg, #0055cc, #2b7fff)",
  },
  {
    id: 4,
    name: "Prof. Sarah Mitchell",
    institution: "Imperial College London",
    country: "🇬🇧", countryName: "Reino Unido",
    area: "Smart Cities",
    profession: "Profesor",
    topic: "Infraestructuras cognitivas para ciudades inteligentes",
    bio: "Catedrática en Ingeniería Urbana del Imperial College London. Consultora del gobierno del Reino Unido para planes de smart city. Ha publicado 2 libros sobre movilidad urbana del futuro y gestionado proyectos de £80M.",
    experience: 24,
    initials: "SM",
    gradient: "linear-gradient(135deg, #7c3aed, #a78bfa)",
  },
  {
    id: 5,
    name: "Ing. Andrés Torres",
    institution: "Universidad Católica de Colombia",
    country: "🇨🇴", countryName: "Colombia",
    area: "IoT & Industria 4.0",
    profession: "Ingeniero",
    topic: "Redes de sensores distribuidos en entornos industriales",
    bio: "Ingeniero electrónico especializado en protocolos IoT industriales. Fundador de TechSens Colombia, startup líder en sensórica para minas y plataformas petroleras. Ganador del premio Colciencias Joven Innovador 2022.",
    experience: 12,
    initials: "AT",
    gradient: "linear-gradient(135deg, #fcd116, #003893)",
  },
  {
    id: 6,
    name: "Dra. Valeria Ruiz",
    institution: "Universidad Nacional Autónoma de México",
    country: "🇲🇽", countryName: "México",
    area: "Bioingeniería",
    profession: "Investigadora",
    topic: "Dispositivos bioelectrónicos implantables de nueva generación",
    bio: "Doctora en Bioingeniería por la UNAM con posdoctorado en Johns Hopkins. Sus investigaciones en neuroprótesis han sido financiadas por el NIH y la OPS. Reconocida como una de las 100 científicas más influyentes de América Latina.",
    experience: 18,
    initials: "VR",
    gradient: "linear-gradient(135deg, #006847, #ce1126)",
  },
  {
    id: 7,
    name: "Prof. Carlos Medina",
    institution: "Universidad de Buenos Aires",
    country: "🇦🇷", countryName: "Argentina",
    area: "Ciberseguridad",
    profession: "Profesor",
    topic: "Arquitecturas zero-trust en redes críticas de infraestructura",
    bio: "Catedrático en Seguridad Informática en la UBA. Asesor de defensa cibernética para el Ministerio de Defensa de Argentina. Certificado CISSP y CEH con más de 200 publicaciones académicas y 15 libros de texto.",
    experience: 21,
    initials: "CM",
    gradient: "linear-gradient(135deg, #74acdf, #3a6fc0)",
  },
  {
    id: 8,
    name: "Dra. Patricia Lima",
    institution: "Universidade de São Paulo",
    country: "🇧🇷", countryName: "Brasil",
    area: "Sostenibilidad",
    profession: "Investigadora",
    topic: "Transición energética y microrredes eléctricas renovables",
    bio: "PhD en Ingeniería Eléctrica por la USP. Coordinadora del laboratorio LEER de energías renovables. Ha diseñado microrredes solares para 15 comunidades rurales en el Amazonas con financiación del Banco Mundial.",
    experience: 16,
    initials: "PL",
    gradient: "linear-gradient(135deg, #009c3b, #fedf00)",
  },
  {
    id: 9,
    name: "Dr. Ahmed Hassan",
    institution: "Cairo University",
    country: "🇪🇬", countryName: "Egipto",
    area: "Smart Cities",
    profession: "Investigador",
    topic: "Gestión hídrica inteligente con sensórica urbana",
    bio: "Investigador en sistemas de gestión de recursos hídricos urbanos. Premio UNESCO 2022 a la innovación en tecnologías del agua. Asesor técnico de la Liga Árabe en infraestructura verde y resiliencia climática.",
    experience: 15,
    initials: "AH",
    gradient: "linear-gradient(135deg, #c43e1c, #f26522)",
  },
  {
    id: 10,
    name: "Prof. Yuki Tanaka",
    institution: "Tokyo Institute of Technology",
    country: "🇯🇵", countryName: "Japón",
    area: "IoT & Industria 4.0",
    profession: "Profesor",
    topic: "Robótica colaborativa y cobots en entornos de manufactura flexible",
    bio: "Investigador principal del laboratorio de robótica avanzada en Tokyo Tech. Pionero en sistemas de control adaptativo para cobots. Ha colaborado con Honda, Toyota y Fanuc en más de 30 proyectos de automatización industrial.",
    experience: 26,
    initials: "YT",
    gradient: "linear-gradient(135deg, #bc002d, #ff6b8a)",
  },
  {
    id: 11,
    name: "Ing. Felipe Herrera",
    institution: "Universidad Nacional de Colombia",
    country: "🇨🇴", countryName: "Colombia",
    area: "Smart Cities",
    profession: "Empresario",
    topic: "Transformación digital de sistemas de transporte urbano",
    bio: "CEO de UrbanTech Bogotá y consultor del IDU. Ha liderado la digitalización de 3 sistemas de transporte masivo en Latinoamérica reduciendo tiempos de espera en un 40%. Speaker TEDx Bogotá 2024.",
    experience: 9,
    initials: "FH",
    gradient: "linear-gradient(135deg, #057a55, #0ea5e9)",
  },
  {
    id: 12,
    name: "Dra. Marcela Ospina",
    institution: "Universidad de los Andes",
    country: "🇨🇴", countryName: "Colombia",
    area: "IA & Machine Learning",
    profession: "Investigadora",
    topic: "Modelos predictivos para mantenimiento industrial preventivo",
    bio: "PhD en Ciencia de Datos por los Andes. Directora del laboratorio AI4Industry. Sus modelos de mantenimiento predictivo han reducido un 35% los tiempos de inactividad en plantas de acero de Colombia y Ecuador.",
    experience: 14,
    initials: "MO",
    gradient: "linear-gradient(135deg, #be185d, #ec4899)",
  },
  {
    id: 13,
    name: "Dr. Luca Ferrari",
    institution: "EPFL — École Polytechnique Fédérale de Lausanne",
    country: "🇨🇭", countryName: "Suiza",
    area: "Software",
    profession: "Investigador",
    topic: "Arquitecturas de microservicios resilientes a gran escala",
    bio: "Investigador en sistemas distribuidos en la EPFL. Ex-arquitecto principal en Google Zürich. Autor del framework open-source ResiliX con más de 40k estrellas en GitHub y adoptado por más de 500 empresas.",
    experience: 17,
    initials: "LF",
    gradient: "linear-gradient(135deg, #e63946, #c0392b)",
  },
  {
    id: 14,
    name: "Ing. María González",
    institution: "Pontificia Universidad Católica de Chile",
    country: "🇨🇱", countryName: "Chile",
    area: "Redes",
    profession: "Directivo",
    topic: "Redes 5G y conectividad rural en América Latina",
    bio: "Directora de Infraestructura Digital en el Ministerio de Telecomunicaciones de Chile. Lideró el programa de conectividad rural que llevó 5G a 300 comunidades indígenas, alcanzando a más de 500.000 personas sin acceso previo.",
    experience: 20,
    initials: "MG",
    gradient: "linear-gradient(135deg, #d62828, #0077b6)",
  },
  {
    id: 15,
    name: "Prof. David Nguyen",
    institution: "Hanoi University of Science and Technology",
    country: "🇻🇳", countryName: "Vietnam",
    area: "Robótica",
    profession: "Profesor",
    topic: "Robótica de enjambre en operaciones de búsqueda y rescate",
    bio: "PhD en Robótica Autónoma por la Universidad de Tokio. Fundador del laboratorio SWARMBOT en Hanoi. Sus algoritmos de coordinación de drones fueron usados en la búsqueda de supervivientes del terremoto de Turquía 2023.",
    experience: 23,
    initials: "DN",
    gradient: "linear-gradient(135deg, #d62828, #f4a261)",
  },
  {
    id: 16,
    name: "Dra. Elena Volkova",
    institution: "Moscow Institute of Physics and Technology",
    country: "🇷🇺", countryName: "Rusia",
    area: "Datos",
    profession: "Investigadora",
    topic: "Procesamiento de grandes volúmenes de datos en tiempo real",
    bio: "PhD en Matemáticas Aplicadas por MIPT. Especialista en algoritmos de streaming y computación distribuida en tiempo real. Ha desarrollado sistemas de análisis de datos para bolsas de valores europeas y redes eléctricas inteligentes.",
    experience: 11,
    initials: "EV",
    gradient: "linear-gradient(135deg, #0066cc, #cc0000)",
  },
  {
    id: 17,
    name: "Ing. Sebastián Morales",
    institution: "EAFIT — Universidad de Ingeniería y Administración",
    country: "🇨🇴", countryName: "Colombia",
    area: "Gestión",
    profession: "Empresario",
    topic: "Metodologías ágiles y gestión de producto en la era de la IA",
    bio: "Co-fundador de AgileHub Medellín y Product Manager certificado (CSPO, SAFe). Ha escalado 3 startups de tecnología desde pre-seed hasta Serie A con exit exitoso en 2023. Mentor en Endeavor Colombia desde 2022.",
    experience: 7,
    initials: "SE",
    gradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
  },
  {
    id: 18,
    name: "Dra. Priya Sharma",
    institution: "Indian Institute of Technology Bombay",
    country: "🇮🇳", countryName: "India",
    area: "IA & Machine Learning",
    profession: "Investigadora",
    topic: "Modelos de lenguaje para comunidades con recursos limitados",
    bio: "PhD en NLP e IA por IIT Bombay. Investigadora destacada del programa AI for All de Google India. Sus modelos multilingües para idiomas indígenas han recibido el premio ACL 2024 y son usados por más de 10 millones de personas.",
    experience: 13,
    initials: "PS",
    gradient: "linear-gradient(135deg, #f97316, #8b5cf6)",
  },
  {
    id: 19,
    name: "Prof. Otto Müller",
    institution: "Technische Universität München",
    country: "🇩🇪", countryName: "Alemania",
    area: "Innovación",
    profession: "Profesor",
    topic: "Transferencia tecnológica entre academia e industria en Europa",
    bio: "Decano de Innovación en la TU München y Director del Centro de Transferencia Tecnológica. En sus 30 años ha cofundado 8 spinoffs y gestionado más de €120M en proyectos Horizon Europe con impacto en 40 países.",
    experience: 30,
    initials: "OM",
    gradient: "linear-gradient(135deg, #111827, #dd0000)",
  },
  {
    id: 20,
    name: "Ing. Carlos Africano",
    institution: "Universidad Distrital Francisco José de Caldas",
    country: "🇨🇴", countryName: "Colombia",
    area: "Redes",
    profession: "Ingeniero",
    topic: "Seguridad en redes SDN y virtualización de funciones de red",
    bio: "Ingeniero de telecomunicaciones con especialización en SDN/NFV. Ganador del premio IEEE Colombia 2024 para jóvenes ingenieros. Actualmente lidera el proyecto de redes cognitivas del Ministerio TIC de Colombia.",
    experience: 5,
    initials: "CA",
    gradient: "linear-gradient(135deg, #fcd116, #003893)",
  },
];
