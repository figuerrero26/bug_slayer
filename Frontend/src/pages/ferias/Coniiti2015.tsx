import { Link } from "react-router-dom";

function Coniiti2015() {
  return (
    <div style={{padding:"40px", maxWidth:"900px", margin:"auto", lineHeight:"1.7"}}>

      <Link 
        to="/ferias"
        style={{
          display:"inline-block",
          marginBottom:"30px",
          padding:"10px 20px",
          background:"#2563eb",
          color:"white",
          borderRadius:"8px",
          textDecoration:"none",
          fontWeight:"bold"
        }}
      >
        ← Volver a Ferias
      </Link>

      <h1 style={{fontSize:"40px", marginBottom:"10px"}}>
        I CONIITI 2015
      </h1>

      <h3 style={{color:"#555", marginBottom:"30px"}}>
        Congreso Internacional de Innovación y Tendencias en Ingeniería
      </h3>

      <p style={{fontWeight:"bold"}}>Octubre 13, 2015</p>

      <p>
        La Universidad Católica de Colombia, en el marco de la semana de Ingeniería,
        desarrolló el <strong>I Congreso Internacional de Innovación y Tendencias
        en Ingeniería – CONIITI 2015</strong>, realizado entre el 14 y el 17 de
        octubre de 2015 en la ciudad de Bogotá.
      </p>

      <p>
        Este evento académico fue organizado por la Facultad de Ingeniería con el
        objetivo de brindar a los asistentes conocimientos sobre las nuevas
        tendencias tecnológicas y herramientas que impulsen el desarrollo de la
        innovación en nuestro país.
      </p>

      <h2 style={{marginTop:"40px"}}>Líneas temáticas</h2>

      <ul>
        <li>Software Inteligente y Convergencia Tecnológica</li>
        <li>Infraestructura y Medio Ambiente</li>
        <li>Gestión Integral y Dinámica de las Organizaciones Empresariales</li>
      </ul>

      <p>
        Alrededor de estas líneas temáticas se realizaron presentaciones en formato
        de ponencia y póster. Cada trabajo presentó un resumen extendido que forma
        parte de las memorias oficiales del congreso.
      </p>

      <h2 style={{marginTop:"40px"}}>Impacto del evento</h2>

      <p>
        El <strong>I CONIITI 2015</strong> reunió aproximadamente
        <strong> 2850 asistentes</strong> en su primera versión, consolidándose
        como un espacio de intercambio académico y tecnológico.
      </p>

      <h2 style={{marginTop:"40px"}}>Participación</h2>

      <ul>
        <li>
          <strong>7 conferencias internacionales</strong> provenientes de Brasil,
          Luxemburgo, Alemania, España, México, Cuba y Venezuela.
        </li>

        <li>
          <strong>22 conferencias nacionales</strong> con la participación de
          organizaciones como IBM, UNISYS, ANE, Secretaría del Hábitat,
          DigitalWare, Ministerio TIC y CRC.
        </li>

        <li>
          <strong>9 universidades nacionales invitadas</strong> entre ellas:
          Pontificia Universidad Javeriana, Escuela Colombiana de Ingeniería Julio
          Garavito, Universidad Industrial de Santander, Universidad Nacional de
          Colombia, Universidad Distrital Francisco José de Caldas, Universidad
          El Bosque y Universidad de Antioquia.
        </li>
      </ul>

    </div>
  );
}

export default Coniiti2015;