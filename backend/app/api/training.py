from fastapi import APIRouter, Depends, HTTPException
from app.api.auth import verify_token
from app.models.schemas import TrainingModuleResponse, TrainingMaterialResponse
from app.services.supabase_service import get_supabase

router = APIRouter()


@router.get("/modules", response_model=list[TrainingModuleResponse])
async def get_modules(payload: dict = Depends(verify_token)):
    db = get_supabase()
    result = db.table("training_modules").select("*").eq("is_active", True).order("order_index").execute()
    return result.data


@router.get("/modules/{module_id}", response_model=TrainingModuleResponse)
async def get_module(module_id: str, payload: dict = Depends(verify_token)):
    db = get_supabase()
    result = db.table("training_modules").select("*").eq("id", module_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Module not found")
    return result.data[0]


@router.get("/modules/{module_id}/materials", response_model=list[TrainingMaterialResponse])
async def get_module_materials(module_id: str, payload: dict = Depends(verify_token)):
    db = get_supabase()
    result = (
        db.table("training_materials")
        .select("*")
        .eq("module_id", module_id)
        .order("created_at")
        .execute()
    )
    return result.data


@router.get("/modules/{module_id}/chat-history")
async def get_chat_history(module_id: str, payload: dict = Depends(verify_token)):
    db = get_supabase()
    result = (
        db.table("chat_messages")
        .select("*")
        .eq("user_id", payload["sub"])
        .eq("module_id", module_id)
        .order("created_at")
        .execute()
    )
    messages = [{"role": m["role"], "content": m["content"]} for m in result.data]
    return {"messages": messages}
