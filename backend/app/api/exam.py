from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from app.api.auth import verify_token
from app.models.schemas import ExamSubmitRequest, ExamResultResponse
from app.services.supabase_service import get_supabase
from app.services import claude_service

router = APIRouter()

RETRY_HOURS = 24


@router.get("/questions")
async def get_exam_questions(payload: dict = Depends(verify_token)):
    db = get_supabase()
    user_id = payload["sub"]

    # Check if user can take exam (all modules completed)
    modules_result = db.table("training_modules").select("id").eq("is_active", True).execute()
    total_modules = len(modules_result.data)

    if total_modules == 0:
        raise HTTPException(status_code=400, detail="No modules available")

    progress_result = (
        db.table("user_progress")
        .select("module_id")
        .eq("user_id", user_id)
        .eq("chat_completed", True)
        .execute()
    )
    completed_modules = len(progress_result.data)

    if completed_modules < total_modules:
        raise HTTPException(
            status_code=403,
            detail=f"Complete all training modules first ({completed_modules}/{total_modules} done)",
        )

    # Check last attempt
    last_attempt = (
        db.table("exam_attempts")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if last_attempt.data:
        attempt = last_attempt.data[0]
        if not attempt["passed"]:
            retry_at = datetime.fromisoformat(attempt["created_at"].replace("Z", "+00:00")) + timedelta(hours=RETRY_HOURS)
            if datetime.utcnow().replace(tzinfo=retry_at.tzinfo) < retry_at:
                raise HTTPException(
                    status_code=429,
                    detail=f"You can retry the exam after {retry_at.isoformat()}",
                )

    # Get all active exam questions (without correct answers)
    questions_result = (
        db.table("exam_questions")
        .select("id, module_id, question, question_type, options")
        .eq("is_active", True)
        .execute()
    )

    return {"questions": questions_result.data, "total": len(questions_result.data)}


@router.post("/submit", response_model=ExamResultResponse)
async def submit_exam(data: ExamSubmitRequest, payload: dict = Depends(verify_token)):
    db = get_supabase()
    user_id = payload["sub"]

    # Get questions with correct answers
    question_ids = [a["question_id"] for a in data.answers]
    questions_result = db.table("exam_questions").select("*").in_("id", question_ids).execute()
    questions_map = {q["id"]: q for q in questions_result.data}

    correct_count = 0
    feedback = []

    for answer in data.answers:
        qid = answer["question_id"]
        user_answer = answer["answer"]
        question = questions_map.get(qid)

        if not question:
            continue

        if question["question_type"] == "mcq":
            is_correct = user_answer.strip().lower() == question["correct_answer"].strip().lower()
            explanation = question["explanation"]
        else:
            # Open question — check with Claude
            result = claude_service.check_open_answer(
                question=question["question"],
                correct_answer=question["correct_answer"],
                user_answer=user_answer,
            )
            is_correct = result["is_correct"]
            explanation = result["explanation"]

        if is_correct:
            correct_count += 1

        feedback.append({
            "question_id": qid,
            "question": question["question"],
            "is_correct": is_correct,
            "user_answer": user_answer,
            "correct_answer": question["correct_answer"],
            "explanation": explanation,
        })

    total = len(data.answers)
    score = round((correct_count / total) * 100) if total > 0 else 0

    # Get passing score from modules (use minimum across modules)
    module_ids = list(set(questions_map[qid]["module_id"] for qid in questions_map))
    modules_result = db.table("training_modules").select("passing_score").in_("id", module_ids).execute()
    min_passing = min([m["passing_score"] for m in modules_result.data]) if modules_result.data else 80

    passed = score >= min_passing

    # Save attempt
    db.table("exam_attempts").insert({
        "user_id": user_id,
        "score": score,
        "passed": passed,
        "answers": data.answers,
        "correct_count": correct_count,
        "total_questions": total,
    }).execute()

    can_retry_at = None
    if not passed:
        can_retry_at = datetime.utcnow() + timedelta(hours=RETRY_HOURS)

    return ExamResultResponse(
        score=score,
        passed=passed,
        total_questions=total,
        correct_answers=correct_count,
        feedback=feedback,
        can_retry_at=can_retry_at,
    )


@router.get("/my-attempts")
async def get_my_attempts(payload: dict = Depends(verify_token)):
    db = get_supabase()
    result = (
        db.table("exam_attempts")
        .select("id, score, passed, correct_count, total_questions, created_at")
        .eq("user_id", payload["sub"])
        .order("created_at", desc=True)
        .execute()
    )
    return result.data
