import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      sessionStorage.removeItem("session");
      localStorage.removeItem("token");
      navigate("/login");
    }, 1000);
  };

  return { isLoggingOut, handleLogout };
}
