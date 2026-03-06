import React from 'react'
import "./css/Login.css";
import Barra from "./Barra";
export const Login = () => {
  return (
    <>
        <Barra />
        <form className="login">
        <h2>Iniciar Sesión</h2>

        <input 
            type="text"
            name="username"
            placeholder="Usuario"
            required
            minLength={4}
            maxLength={12}
            pattern="[A-Za-z0-9_]+"
            title="Solo letras, números y guion bajo. Entre 4 y 12 caracteres"
        />

        <input 
            type="password"
            name="password"
            placeholder="Contraseña"
            required
            pattern="(?=.*[A-Z])(?=.*[0-9])(?=.*[\W_]).{8,}"
            title="Debe tener mínimo 8 caracteres, una mayúscula, un número y un símbolo"
        />

        <button className="ENVIAR" type="submit">Entrar</button>
        </form>

    
    </>
  )
}
export default Login
