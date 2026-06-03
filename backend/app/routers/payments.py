from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
import logging

from app.services import mercadopago_service
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/payments", tags=["payments"])
logger = logging.getLogger(__name__)

class CreatePixRequest(BaseModel):
    amount: float = 10.0
    description: str = "Recarga de Cotas - Pygame APC"

class CreatePixResponse(BaseModel):
    status: str
    transaction_id: str
    qr_code: str
    qr_code_base64: str
    ticket_url: str

@router.post("/pix", response_model=CreatePixResponse)
async def create_pix_endpoint(body: CreatePixRequest, user: dict = Depends(get_current_user)):
    """
    Gera um pagamento PIX para o usuario adicionar mais cotas na sua conta.
    """
    email = user.get("email", "anonymous@test.com")
    
    try:
        payment_data = await mercadopago_service.create_pix_payment(
            user_email=email,
            amount=body.amount,
            description=body.description
        )
        return payment_data
    except Exception as e:
        logger.exception("Erro ao gerar pagamento PIX.")
        raise HTTPException(status_code=500, detail="Nao foi possivel gerar o pagamento.")


@router.post("/webhook")
async def mercadopago_webhook(request: Request):
    """
    Recebe as notificacoes do Mercado Pago (IPN/Webhook).
    A atualizacao do pagamento incrementara as cotas do usuario.
    """
    try:
        # Extrai parametros da query enviados pelo Mercado Pago
        topic = request.query_params.get("topic") or request.query_params.get("type")
        payment_id = request.query_params.get("id") or request.query_params.get("data.id")
        
        if not payment_id or not topic:
            return {"status": "ignored"}
            
        success = await mercadopago_service.process_webhook_notification(topic, payment_id)
        if success:
            logger.info("Webhook processado com sucesso.")
            
        return {"status": "ok"}
    except Exception as e:
        logger.exception("Erro ao processar webhook do Mercado Pago.")
        raise HTTPException(status_code=500, detail="Erro interno.")
