from fastapi import APIRouter, Depends
from app.api.auth import verify_token
from app.services.supabase_service import get_supabase

router = APIRouter()


@router.get("/me")
async def get_my_progress(payload: dict = Depends(verify_token)):
    db = get_supabase()
    user_id = payload["sub"]

    modules_result = db.table("training_modules").select("*").eq("is_active", True).order("order_index").execute()
    modules = modules_result.data

    progress_result = (
        db.table("user_progress")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )
    progress_map = {p["module_id"]: p for p in progress_result.data}

    roleplay_result = (
        db.table("roleplay_sessions")
        .select("id, score, status")
        .eq("user_id", user_id)
        .eq("status", "completed")
        .execute()
    )

    voice_result = (
        db.table("voice_sessions")
        .select("id, score, status")
        .eq("user_id", user_id)
        .eq("status", "completed")
        .execute()
    )

    exam_result = (
        db.table("exam_attempts")
        .select("score, passed, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    modules_with_progress = []
    completed_count = 0
    for module in modules:
        prog = progress_map.get(module["id"], {})
        chat_done = prog.get("chat_completed", False)
        if chat_done:
            completed_count += 1
        modules_with_progress.append({
            **module,
            "chat_completed": chat_done,
        })

    total = len(modules)
    overall = round((completed_count / total) * 100) if total > 0 else 0

    exam_passed = False
    exam_score = None
    if exam_result.data and exam_result.data[0]["passed"]:
        exam_passed = True
        exam_score = exam_result.data[0]["score"]

    return {
        "user_id": user_id,
        "modules": modules_with_progress,
        "completed_modules": completed_count,
        "total_modules": total,
        "overall_completion": overall,
        "roleplay_sessions_count": len(roleplay_result.data),
        "voice_sessions_count": len(voice_result.data),
        "exam_passed": exam_passed,
        "exam_score": exam_score,
        "roleplay_sessions": roleplay_result.data,
        "voice_sessions": voice_result.data,
    }
