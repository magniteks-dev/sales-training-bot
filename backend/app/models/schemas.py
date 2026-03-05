from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# Auth
class TelegramAuthData(BaseModel):
    init_data: str


class AdminLoginRequest(BaseModel):
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str


# User
class UserCreate(BaseModel):
    telegram_id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    telegram_id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    role: str
    created_at: datetime


# Training modules
class TrainingModuleCreate(BaseModel):
    title: str
    description: str
    order_index: int
    passing_score: int = 80


class TrainingModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None
    passing_score: Optional[int] = None
    is_active: Optional[bool] = None


class TrainingModuleResponse(BaseModel):
    id: str
    title: str
    description: str
    order_index: int
    passing_score: int
    is_active: bool
    created_at: datetime


# Training materials
class TrainingMaterialCreate(BaseModel):
    module_id: str
    content_text: str
    material_type: str = "text"  # text, faq, script


class TrainingMaterialResponse(BaseModel):
    id: str
    module_id: str
    content_text: str
    material_type: str
    created_at: datetime


# Chat messages
class ChatMessageRequest(BaseModel):
    module_id: str
    message: str


class ChatMessageResponse(BaseModel):
    reply: str
    module_completed: bool = False


# Roleplay
class RoleplayScenarioCreate(BaseModel):
    product_type: str
    client_persona: str
    difficulty: str  # easy, medium, hard
    system_prompt: str
    title: str


class RoleplayScenarioResponse(BaseModel):
    id: str
    product_type: str
    client_persona: str
    difficulty: str
    title: str
    created_at: datetime


class RoleplayStartRequest(BaseModel):
    scenario_id: str


class RoleplayMessageRequest(BaseModel):
    session_id: str
    message: str


class RoleplayMessageResponse(BaseModel):
    reply: str
    session_ended: bool = False


class RoleplayEndRequest(BaseModel):
    session_id: str


class RoleplayFeedbackResponse(BaseModel):
    score: int
    feedback: str
    strengths: List[str]
    improvements: List[str]


# Voice sessions
class VoiceSessionStart(BaseModel):
    scenario_id: str


class VoiceSessionEnd(BaseModel):
    session_id: str
    transcript: str


class VoiceFeedbackResponse(BaseModel):
    score: int
    feedback: str
    transcript: str


# Exam
class ExamQuestionCreate(BaseModel):
    module_id: str
    question: str
    question_type: str  # mcq, open
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str


class ExamQuestionResponse(BaseModel):
    id: str
    module_id: str
    question: str
    question_type: str
    options: Optional[List[str]] = None


class ExamSubmitRequest(BaseModel):
    answers: List[dict]  # [{question_id, answer}]


class ExamResultResponse(BaseModel):
    score: int
    passed: bool
    total_questions: int
    correct_answers: int
    feedback: List[dict]
    can_retry_at: Optional[datetime] = None


# Progress
class ProgressResponse(BaseModel):
    user_id: str
    modules: List[dict]
    overall_completion: float
    exam_passed: bool
    exam_score: Optional[int] = None


# Admin analytics
class TraineeProgressItem(BaseModel):
    user_id: str
    first_name: str
    last_name: Optional[str]
    username: Optional[str]
    modules_completed: int
    total_modules: int
    exam_passed: bool
    exam_score: Optional[int]
    roleplay_sessions: int
    voice_sessions: int
    joined_at: datetime
