import anthropic
from app.config import settings

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

MODEL = "claude-sonnet-4-6"


def chat_with_training_material(
    material_text: str,
    conversation_history: list[dict],
    user_message: str,
) -> str:
    system_prompt = f"""Ты опытный бизнес-тренер по продажам. Твоя задача — обучить стажёра по следующему материалу.

УЧЕБНЫЙ МАТЕРИАЛ:
{material_text}

ПРАВИЛА:
- Объясняй материал простым и понятным языком
- Приводи примеры из реальных продаж
- Отвечай ТОЛЬКО на вопросы, связанные с данным материалом и продажами
- Если стажёр понял тему — задавай проверочные вопросы
- Будь дружелюбным, поддерживающим наставником
- Отвечай на русском языке
- Когда стажёр явно освоил весь материал и готов к экзамену — напиши в конце ответа: [МОДУЛЬ ЗАВЕРШЁН]"""

    messages = conversation_history + [{"role": "user", "content": user_message}]

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=system_prompt,
        messages=messages,
    )
    return response.content[0].text


def chat_roleplay_as_client(
    scenario_system_prompt: str,
    conversation_history: list[dict],
    trainee_message: str,
) -> str:
    messages = conversation_history + [{"role": "user", "content": trainee_message}]

    response = client.messages.create(
        model=MODEL,
        max_tokens=512,
        system=scenario_system_prompt,
        messages=messages,
    )
    return response.content[0].text


def evaluate_roleplay_session(
    product_type: str,
    client_persona: str,
    conversation: list[dict],
) -> dict:
    conversation_text = "\n".join(
        [f"{'Стажёр' if m['role'] == 'user' else 'Клиент'}: {m['content']}" for m in conversation]
    )

    system_prompt = """Ты эксперт по продажам с 15-летним опытом. Оцени диалог продаж между стажёром и клиентом."""

    prompt = f"""Оцени следующий диалог продаж по продукту "{product_type}".
Тип клиента: {client_persona}

ДИАЛОГ:
{conversation_text}

Дай оценку по 10-балльной шкале и подробный разбор. Ответь СТРОГО в JSON формате:
{{
  "score": <число от 1 до 10>,
  "feedback": "<общий фидбэк на 2-3 предложения>",
  "strengths": ["<сильная сторона 1>", "<сильная сторона 2>"],
  "improvements": ["<что улучшить 1>", "<что улучшить 2>", "<что улучшить 3>"]
}}"""

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=system_prompt,
        messages=[{"role": "user", "content": prompt}],
    )

    import json
    text = response.content[0].text
    start = text.find("{")
    end = text.rfind("}") + 1
    return json.loads(text[start:end])


def evaluate_voice_call(transcript: str, product_type: str) -> dict:
    system_prompt = """Ты тренер по телефонным продажам. Оцени звонок стажёра."""

    prompt = f"""Оцени телефонный звонок стажёра по продукту "{product_type}".

ТРАНСКРИПЦИЯ ЗВОНКА:
{transcript}

Ответь СТРОГО в JSON формате:
{{
  "score": <число от 1 до 10>,
  "feedback": "<подробный разбор звонка>",
  "strengths": ["<сильная сторона 1>"],
  "improvements": ["<что улучшить 1>", "<что улучшить 2>"]
}}"""

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=system_prompt,
        messages=[{"role": "user", "content": prompt}],
    )

    import json
    text = response.content[0].text
    start = text.find("{")
    end = text.rfind("}") + 1
    return json.loads(text[start:end])


def check_open_answer(question: str, correct_answer: str, user_answer: str) -> dict:
    prompt = f"""Вопрос экзамена: {question}
Эталонный ответ: {correct_answer}
Ответ стажёра: {user_answer}

Оцени ответ стажёра. Засчитай как правильный, если суть совпадает с эталонным ответом.
Ответь в JSON:
{{"is_correct": true/false, "explanation": "<объяснение>"}}"""

    response = client.messages.create(
        model=MODEL,
        max_tokens=256,
        messages=[{"role": "user", "content": prompt}],
    )

    import json
    text = response.content[0].text
    start = text.find("{")
    end = text.rfind("}") + 1
    return json.loads(text[start:end])
