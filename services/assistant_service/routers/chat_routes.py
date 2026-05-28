from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.conversation_model import Conversation
from models.message_model import Message
from schemas.chat_schema import AskRequest, AskResponse, ConversationOut, MessageOut
from services.n8n_client import ask_rogelio

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/ask", response_model=AskResponse, status_code=200)
async def ask(payload: AskRequest, db: Session = Depends(get_db)):
    # Obtener o crear conversación
    if payload.conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == payload.conversation_id).first()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversación no encontrada")
    else:
        title = payload.message[:60] if len(payload.message) > 60 else payload.message
        conv = Conversation(user_id=payload.user_id, title=title)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # Guardar mensaje del usuario
    user_msg = Message(conversation_id=conv.id, role="user", content=payload.message)
    db.add(user_msg)
    db.commit()

    # Historial reciente (últimos 10 mensajes, excluye el actual)
    recent = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id, Message.id != user_msg.id)
        .order_by(Message.created_at.desc())
        .limit(10)
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in reversed(recent)]

    # Llamar a Rogelio (n8n o fallback)
    reply = await ask_rogelio(payload.user_id, conv.id, payload.message, history)

    # Guardar respuesta del asistente
    assistant_msg = Message(conversation_id=conv.id, role="assistant", content=reply)
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return AskResponse(conversation_id=conv.id, reply=reply, message_id=assistant_msg.id)


@router.get("/conversations/{user_id}", response_model=List[ConversationOut])
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
