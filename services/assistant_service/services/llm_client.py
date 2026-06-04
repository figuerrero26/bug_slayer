"""
Cliente directo a OpenAI — sin depender de n8n.
Si hay OPENAI_API_KEY configurada, Rogelio usa el LLM completo.
Si no, el sistema cae al fallback de palabras clave.
"""
import os
import json
import logging
import httpx

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL   = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_URL     = "https://api.openai.com/v1/chat/completions"

_TIMEOUT = 30.0


async def call_openai(
    message: str,
    history: list[dict],
    system_prompt: str,
) -> str | None:
    """
    Llama directamente a OpenAI. Devuelve la respuesta o None si no está disponible.
    history: lista de dicts {"role": "user"|"assistant", "content": "..."}
    """
    if not OPENAI_API_KEY:
        return None

    messages = [
        {"role": "system", "content": system_prompt},
        *history[-18:],  # últimas 18 entradas = ~9 turnos de conversación
        {"role": "user", "content": message},
    ]

    payload = {
        "model":             OPENAI_MODEL,
        "messages":          messages,
        "temperature":       0.75,   # conversacional pero coherente
        "max_tokens":        900,
        "presence_penalty":  0.4,    # evita repetición de frases
        "frequency_penalty": 0.3,
    }

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.post(
                OPENAI_URL,
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type":  "application/json",
                },
                content=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            )
            resp.raise_for_status()
            data  = resp.json()
            reply = data["choices"][0]["message"]["content"].strip()
            return reply if reply else None
    except Exception as exc:
        logger.warning("OpenAI directo no disponible: %s", exc)
        return None
