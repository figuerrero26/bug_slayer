from abc import ABC , abstractmethod

class RemovePerson(ABC):
    @abstractmethod
    def removePerson(self,idPerson):
        pass