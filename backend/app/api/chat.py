from fastapi import APIRouter, Depends, HTTPException
from app.api.auth import verify_token
from app.models.schemas import ChatMessageRequest, ChatMessageResponse
from app.services.supabase_service import get_supabase
from app.services import claude_service

router = APIRouter()


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(data: ChatMessageRequest, payload: dict = Depends(verify_token)):
    db = get_supabase()
    user_id = payload["sub"]

    # Get module materials
    materials_result = (
        db.table("training_materials")
        .select("content_text")
        .eq("module_id", data.module_id)
        .execute()
    )
    if not materials_result.data:
        raise HTTPException(status_code=404, detail="No materials found for this module")

    material_text = "\n\n".join([m["content_text"] for m in materials_result.data])

    # Get conversation history
    history_result = (
        db.table("chat_messages")
        .select("role, content")
        .eq("user_id", user_id)
        .eq("module_id", data.module_id)
        .order("created_at")
        .execute()
    )
    conversation_history = [{"role": m["role"], "content": m["content"]} for m in history_result.data]

    # Get AI reply
    reply = claude_service.chat_with_training_material(
        material_text=material_text,
        conversation_history=conversation_history,
        user_message=data.message,
    )

    # Check if module is completed
    module_completed = "[МОДУЛЬ ЗАВЕРШЁН]" in reply
    reply_clean = reply.replace("[МОДУЛЬ ЗАВЕРШЁН]", "").strip()

    # Save messages to DB
    db.table("chat_messages").insert([
        {"user_id": user_id, "module_id": data.module_id, "role": "user", "content": data.message},
        {"user_id": user_id, "module_id": data.module_id, "role": "assistant", "content": reply_clean},
    ]).execute()

    # Update progress if module completed
    if module_completed:
        existing = (
            db.table("user_progress")
            .select("id")
            .eq("user_id", user_id)
            .eq("module_id", data.module_id)
            .execute()
        )
        if existing.data:
            db.table("user_progress").update({"chat_completed": True}).eq("id", existing.data[0]["id"]).execute()
        else:
            db.table("user_progress").insert({
                "user_id": user_id,
                "module_id": data.module_id,
                "chat_completed": True,
            }).execute()

    return ChatMessageResponse(reply=reply_clean, module_completed=module_completed)
