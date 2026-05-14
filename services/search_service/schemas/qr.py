from pydantic import BaseModel


class QRValidationRequest(BaseModel):
    qr_payload: str


class QRValidationResponse(BaseModel):
    valid: bool
    message: str
    registration_id: int | None = None
    user_id: int | None = None
    conference_id: int | None = None
    conference_title: str | None = None
    attendee_name: str | None = None
