import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.conversation_model import Conversation
from models.message_model import Message
from schemas.chat_schema import AskRequest, AskResponse, ConversationOut, MessageOut
from services.n8n_client import ask_rogelio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assistant", tags=["assistant"])


def _get_or_create_conversation(
    db: Session,
    session_id: str,
    conversation_id: int | None,
    user_id: int | None,
    title: str,
) -> Conversation:
    if conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conv:
            return conv

    # Buscar por session_id para retomar la conversación tras refresh de página
    if session_id:
        conv = db.query(Conversation).filter(Conversation.session_id == session_id).first()
        if conv:
            return conv

    conv = Conversation(
        session_id=session_id,
        user_id=user_id,
        title=title[:60],
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.post("/ask", response_model=AskResponse, status_code=200)
async def ask(payload: AskRequest, db: Session = Depends(get_db)):
    # Garantizar session_id — el frontend lo puede omitir
    session_id = payload.session_id or str(uuid.uuid4())

    try:
        conv = _get_or_create_conversation(
            db,
            session_id=session_id,
            conversation_id=payload.conversation_id,
            user_id=payload.user_id,
            title=payload.message,
        )
    except Exception as e:
        logger.error("Error creando conversación: %s", e)
        # Aún así intentamos responder sin persistencia
        reply = await ask_rogelio(payload.user_id, 0, payload.message, [])
        return AskResponse(
            conversation_id=0,
            session_id=session_id,
            reply=reply,
            message_id=0,
        )

    # Persistir mensaje del usuario
    try:
        user_msg = Message(conversation_id=conv.id, role="user", content=payload.message)
        db.add(user_msg)
        db.commit()
    except Exception as e:
        logger.error("Error guardando mensaje: %s", e)
        user_msg = None

    # Historial reciente
    try:
        recent = (
            db.query(Message)
            .filter(
                Message.conversation_id == conv.id,
                *([] if user_msg is None else [Message.id != user_msg.id]),
            )
            .order_by(Message.created_at.desc())
            .limit(20)
            .all()
        )
        history = [{"role": m.role, "content": m.content} for m in reversed(recent)]
    except Exception:
        history = []

    # Llamar a Rogelio (n8n o fallback)
    reply = await ask_rogelio(conv.user_id, conv.id, payload.message, history)

    # Persistir respuesta del asistente
    assistant_msg_id = 0
    try:
        assistant_msg = Message(conversation_id=conv.id, role="assistant", content=reply)
        db.add(assistant_msg)
        db.commit()
        db.refresh(assistant_msg)
        assistant_msg_id = assistant_msg.id
    except Exception as e:
        logger.error("Error guardando respuesta: %s", e)

    return AskResponse(
        conversation_id=conv.id,
        session_id=conv.session_id or session_id,
        reply=reply,
        message_id=assistant_msg_id,
    )


@router.get("/conversations", response_model=List[ConversationOut])
def get_conversations(user_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
        .limit(20)
        .all()
    )


@router.get("/conversations/{conv_id}/messages", response_model=List[MessageOut])
def get_messages(conv_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Message)
        .filter(Message.conversation_id == conv_id)
        .order_by(Message.created_at)
        .all()
    )


@router.delete("/conversations/{conv_id}", status_code=200)
def delete_conversation(conv_id: int, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")
    db.delete(conv)
    db.commit()
    return {"message": "Conversación eliminada"}
