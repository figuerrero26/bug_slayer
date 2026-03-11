from abc import ABC, abstractmethod

class GetUserController(ABC):
    @abstractmethod
    def get_user(self, user_id: str):
        """
        Método abstracto para obtener un usuario por su ID.
        
        :param db: Sesión de base de datos.
        :param user_id: ID del usuario a buscar.
        :return: Usuario encontrado o None si no existe.
        """
        pass
    
    @abstractmethod
    def get_all_users(self):
        """
        Método abstracto para obtener todos los usuarios.
        
        :param db: Sesión de base de datos.
        :return: Lista de usuarios.
        """
        pass