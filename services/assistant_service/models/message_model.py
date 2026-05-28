from sqlalchemy import Column, Integer, Text, Enum, DateTime, ForeignKey, func
from database import Base


class Message(Base):
    __tablename__ = "messages"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(
        Integer,
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role       = Column(Enum("user", "assistant"), nullable=False)
    content    = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
