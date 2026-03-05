import uuid
from fastapi import APIRouter, Depends, HTTPException
from app.api.auth import verify_token
from app.models.schemas import (
    RoleplayStartRequest, RoleplayMessageRequest, RoleplayMessageResponse,
    RoleplayEndRequest, RoleplayFeedbackResponse, RoleplayScenarioResponse,
)
from app.services.supabase_service import get_supabase
from app.services import claude_service

router = APIRouter()


@router.get("/scenarios", response_model=list[RoleplayScenarioResponse])
async def get_scenarios(payload: dict = Depends(verify_token)):
    db = get_supabase()
    result = db.table("roleplay_scenarios").select("*").order("product_type").execute()
    return result.data


@router.post("/start")
async def start_session(data: RoleplayStartRequest, payload: dict = Depends(verify_token)):
    db = get_supabase()
    user_id = payload["sub"]

    scenario_result = db.table("roleplay_scenarios").select("*").eq("id", data.scenario_id).execute()
    if not scenario_result.data:
        raise HTTPException(status_code=404, detail="Scenario not found")

    session_result = db.table("roleplay_sessions").insert({
        "user_id": user_id,
        "scenario_id": data.scenario_id,
        "messages": [],
        "status": "active",
    }).execute()

    session = session_result.data[0]
    scenario = scenario_result.data[0]

    # Generate opening client message
    opening_reply = claude_service.chat_roleplay_as_client(
        scenario_system_prompt=scenario["system_prompt"],
        conversation_history=[],
        trainee_message="[НАЧАЛО ДИАЛОГА — поздоровайся и начни как клиент]",
    )

    # Save opening message
    messages = [{"role": "assistant", "content": opening_reply}]
    db.table("roleplay_sessions").update({"messages": messages}).eq("id", session["id"]).execute()

    return {
        "session_id": session["id"],
        "scenario": scenario,
        "opening_message": opening_reply,
    }


@router.post("/message", response_model=RoleplayMessageResponse)
async def send_message(data: RoleplayMessageRequest, payload: dict = Depends(verify_token)):
    db = get_supabase()
    user_id = payload["sub"]

    session_result = (
        db.table("roleplay_sessions")
        .select("*, roleplay_scenarios(*)")
        .eq("id", data.session_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session = session_result.data[0]
    if session["status"] != "active":
        raise HTTPException(status_code=400, detail="Session is not active")

    scenario = session["roleplay_scenarios"]
    messages = session["messages"] or []

    reply = claude_service.chat_roleplay_as_client(
        scenario_system_prompt=scenario["system_prompt"],
        conversation_history=messages,
        trainee_message=data.message,
    )

    messages.append({"role": "user", "content": data.message})
    messages.append({"role": "assistant", "content": reply})

    db.table("roleplay_sessions").update({"messages": messages}).eq("id", data.session_id).execute()

    return RoleplayMessageResponse(reply=reply)


@router.post("/end", response_model=RoleplayFeedbackResponse)
async def end_session(data: RoleplayEndRequest, payload: dict = Depends(verify_token)):
    db = get_supabase()
    user_id = payload["sub"]

    session_result = (
        db.table("roleplay_sessions")
        .select("*, roleplay_scenarios(*)")
        .eq("id", data.session_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not session_result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session = session_result.data[0]
    scenario = session["roleplay_scenarios"]
    messages = session["messages"] or []

    if len(messages) < 4:
        raise HTTPException(status_code=400, detail="Too few messages to evaluate. Continue the dialogue.")

    evaluation = claude_service.evaluate_roleplay_session(
        product_type=scenario["product_type"],
        client_persona=scenario["client_persona"],
        conversation=messages,
    )

    db.table("roleplay_sessions").update({
        "status": "completed",
        "score": evaluation["score"],
        "feedback": evaluation["feedback"],
    }).eq("id", data.session_id).execute()

    return RoleplayFeedbackResponse(**evaluation)
