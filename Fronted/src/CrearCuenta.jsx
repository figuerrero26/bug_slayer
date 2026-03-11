import React from "react";

const CrearCuenta = () => {
  return (
    <div style={{padding:"40px"}}>

      <h1>Crear Cuenta</h1>

      <p>Aquí se registrará un nuevo usuario.</p>

      <form>

        <input
          type="text"
          placeholder="Usuario"
        />

        <br /><br />

        <input
          type="password"
          placeholder="Contraseña"
        />

        <br /><br />

        <button>
          Crear cuenta
        </button>

      </form>

    </div>
  );
};

export default CrearCuenta;