from abc import ABC, abstractmethod

class AddUserController(ABC):
    @abstractmethod
    def add_user(self, user_data):
        pass