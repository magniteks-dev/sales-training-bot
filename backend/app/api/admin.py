import csv
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.api.auth import require_admin
from app.models.schemas import (
    TrainingModuleCreate, TrainingModuleUpdate, TrainingModuleResponse,
    TrainingMaterialCreate, TrainingMaterialResponse,
    RoleplayScenarioCreate, RoleplayScenarioResponse,
    ExamQuestionCreate, ExamQuestionResponse,
)
from app.services.supabase_service import get_supabase

router = APIRouter()


# ─── Training Modules ────────────────────────────────────────────────────────

@router.get("/modules", response_model=list[TrainingModuleResponse])
async def list_modules(payload: dict = Depends(require_admin)):
    db = get_supabase()
    result = db.table("training_modules").select("*").order("order_index").execute()
    return result.data


@router.post("/modules", response_model=TrainingModuleResponse)
async def create_module(data: TrainingModuleCreate, payload: dict = Depends(require_admin)):
    db = get_supabase()
    result = db.table("training_modules").insert(data.model_dump()).execute()
    return result.data[0]


@router.patch("/modules/{module_id}", response_model=TrainingModuleResponse)
async def update_module(module_id: str, data: TrainingModuleUpdate, payload: dict = Depends(require_admin)):
    db = get_supabase()
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    result = db.table("training_modules").update(update_data).eq("id", module_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Module not found")
    return result.data[0]


@router.delete("/modules/{module_id}")
async def delete_module(module_id: str, payload: dict = Depends(require_admin)):
    db = get_supabase()
    db.table("training_modules").update({"is_active": False}).eq("id", module_id).execute()
    return {"ok": True}


# ─── Training Materials ───────────────────────────────────────────────────────

@router.get("/modules/{module_id}/materials", response_model=list[TrainingMaterialResponse])
async def list_materials(module_id: str, payload: dict = Depends(require_admin)):
    db = get_supabase()
    result = db.table("training_materials").select("*").eq("module_id", module_id).order("created_at").execute()
    return result.data


@router.post("/materials", response_model=TrainingMaterialResponse)
async def create_material(data: TrainingMaterialCreate, payload: dict = Depends(require_admin)):
    db = get_supabase()
    result = db.table("training_materials").insert(data.model_dump()).execute()
    return result.data[0]


@router.delete("/materials/{material_id}")
async def delete_material(material_id: str, payload: dict = Depends(require_admin)):
    db = get_supabase()
    db.table("training_materials").delete().eq("id", material_id).execute()
    return {"ok": True}


# ─── Exam Questions ───────────────────────────────────────────────────────────

@router.get("/exam-questions", response_model=list[ExamQuestionResponse])
async def list_questions(payload: dict = Depends(require_admin)):
    db = get_supabase()
    result = db.table("exam_questions").select("*").eq("is_active", True).execute()
    return result.data


@router.post("/exam-questions", response_model=ExamQuestionResponse)
async def create_question(data: ExamQuestionCreate, payload: dict = Depends(require_admin)):
    db = get_supabase()
    result = db.table("exam_questions").insert({**data.model_dump(), "is_active": True}).execute()
    return result.data[0]


@router.delete("/exam-questions/{question_id}")
async def delete_question(question_id: str, payload: dict = Depends(require_admin)):
    db = get_supabase()
    db.table("exam_questions").update({"is_active": False}).eq("id", question_id).execute()
    return {"ok": True}


# ─── Roleplay Scenarios ───────────────────────────────────────────────────────

@router.get("/roleplay-scenarios", response_model=list[RoleplayScenarioResponse])
async def list_scenarios(payload: dict = Depends(require_admin)):
    db = get_supabase()
    result = db.table("roleplay_scenarios").select("*").order("product_type").execute()
    return result.data


@router.post("/roleplay-scenarios", response_model=RoleplayScenarioResponse)
async def create_scenario(data: RoleplayScenarioCreate, payload: dict = Depends(require_admin)):
    db = get_supabase()
    result = db.table("roleplay_scenarios").insert(data.model_dump()).execute()
    return result.data[0]


@router.delete("/roleplay-scenarios/{scenario_id}")
async def delete_scenario(scenario_id: str, payload: dict = Depends(require_admin)):
    db = get_supabase()
    db.table("roleplay_scenarios").delete().eq("id", scenario_id).execute()
    return {"ok": True}


# ─── Analytics ───────────────────────────────────────────────────────────────

@router.get("/trainees")
async def list_trainees(payload: dict = Depends(require_admin)):
    db = get_supabase()
    users_result = db.table("users").select("*").eq("role", "trainee").order("created_at", desc=True).execute()
    users = users_result.data

    total_modules = len(db.table("training_modules").select("id").eq("is_active", True).execute().data)

    result = []
    for user in users:
        uid = user["id"]

        completed = len(
            db.table("user_progress").select("id").eq("user_id", uid).eq("chat_completed", True).execute().data
        )
        roleplay_count = len(
            db.table("roleplay_sessions").select("id").eq("user_id", uid).eq("status", "completed").execute().data
        )
        voice_count = len(
            db.table("voice_sessions").select("id").eq("user_id", uid).eq("status", "completed").execute().data
        )
        exam_attempt = (
            db.table("exam_attempts")
            .select("score, passed")
            .eq("user_id", uid)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
            .data
        )

        exam_passed = exam_attempt[0]["passed"] if exam_attempt else False
        exam_score = exam_attempt[0]["score"] if exam_attempt else None

        result.append({
            **user,
            "modules_completed": completed,
            "total_modules": total_modules,
            "exam_passed": exam_passed,
            "exam_score": exam_score,
            "roleplay_sessions": roleplay_count,
            "voice_sessions": voice_count,
        })

    return result


@router.get("/trainees/export")
async def export_trainees_csv(payload: dict = Depends(require_admin)):
    trainees = await list_trainees(payload)

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "first_name", "last_name", "username", "telegram_id",
        "modules_completed", "total_modules", "exam_passed", "exam_score",
        "roleplay_sessions", "voice_sessions", "created_at",
    ])
    writer.writeheader()
    for t in trainees:
        writer.writerow({k: t.get(k, "") for k in writer.fieldnames})

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=trainees.csv"},
    )


@router.get("/stats")
async def get_stats(payload: dict = Depends(require_admin)):
    db = get_supabase()
    total_trainees = len(db.table("users").select("id").eq("role", "trainee").execute().data)
    passed_exam = len(db.table("exam_attempts").select("id").eq("passed", True).execute().data)
    total_roleplay = len(db.table("roleplay_sessions").select("id").eq("status", "completed").execute().data)
    total_voice = len(db.table("voice_sessions").select("id").eq("status", "completed").execute().data)

    return {
        "total_trainees": total_trainees,
        "passed_exam": passed_exam,
        "total_roleplay_sessions": total_roleplay,
        "total_voice_sessions": total_voice,
    }
