import httpx
from app.config import settings


def get_signed_url() -> str:
    """Get a signed URL for ElevenLabs Conversational AI agent."""
    url = f"https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id={settings.elevenlabs_agent_id}"
    headers = {"xi-api-key": settings.elevenlabs_api_key}

    with httpx.Client() as client:
        response = client.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data["signed_url"]


def get_agent_info() -> dict:
    """Get ElevenLabs agent info."""
    url = f"https://api.elevenlabs.io/v1/convai/agents/{settings.elevenlabs_agent_id}"
    headers = {"xi-api-key": settings.elevenlabs_api_key}

    with httpx.Client() as client:
        response = client.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
