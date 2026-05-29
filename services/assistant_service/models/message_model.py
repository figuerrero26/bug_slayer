from sqlalchemy import Column, Integer, Text, Enum, DateTime, ForeignKey, func, Index
from sqlalchemy.orm import relationship
from database import Base


class Message(Base):
    __tablename__ = "messages"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(
        Integer,
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    role       = Column(Enum("user", "assistant"), nullable=False)
    content    = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")

    __table_args__ = (
        Index("idx_conv_created", "conversation_id", "created_at"),
    )
