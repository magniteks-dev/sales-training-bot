from fastapi import APIRouter, Depends, HTTPException
from app.api.auth import verify_token
from app.models.schemas import VoiceSessionStart, VoiceSessionEnd, VoiceFeedbackResponse
from app.services.supabase_service import get_supabase
from app.services import claude_service, elevenlabs_service

router = APIRouter()


@router.post("/start")
async def start_voice_session(data: VoiceSessionStart, payload: dict = Depends(verify_token)):
    db = get_supabase()
    user_id = payload["sub"]

    scenario_result = db.table("roleplay_scenarios").select("*").eq("id", data.scenario_id).execute()
    if not scenario_result.data:
        raise HTTPException(status_code=404, detail="Scenario not found")

    scenario = scenario_result.data[0]

    # Get signed URL for ElevenLabs Conversational AI
    signed_url = elevenlabs_service.get_signed_url()

    # Create voice session record
    session_result = db.table("voice_sessions").insert({
        "user_id": user_id,
        "scenario_id": data.scenario_id,
        "status": "active",
    }).execute()

    return {
        "session_id": session_result.data[0]["id"],
        "signed_url": signed_url,
        "scenario": scenario,
    }


@router.post("/end", response_model=VoiceFeedbackResponse)
async def end_voice_session(data: VoiceSessionEnd, payload: dict = Depends(verify_token)):
    db = get_supabase()
    user_id = payload["sub"]

    session_result = (
        db.table("voice_sessions")
        .select("*, roleplay_scenarios(*)")
        .eq("id", data.session_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session = session_result.data[0]
    scenario = session["roleplay_scenarios"]

    evaluation = claude_service.evaluate_voice_call(
        transcript=data.transcript,
        product_type=scenario["product_type"],
    )

    db.table("voice_sessions").update({
        "status": "completed",
        "transcript": data.transcript,
        "score": evaluation["score"],
        "feedback": evaluation["feedback"],
    }).eq("id", data.session_id).execute()

    return VoiceFeedbackResponse(
        score=evaluation["score"],
        feedback=evaluation["feedback"],
        transcript=data.transcript,
    )


@router.get("/sessions")
async def get_voice_sessions(payload: dict = Depends(verify_token)):
    db = get_supabase()
    result = (
        db.table("voice_sessions")
        .select("*, roleplay_scenarios(title, product_type)")
        .eq("user_id", payload["sub"])
        .order("created_at", desc=True)
        .execute()
    )
    return result.data
