"use client";

import { useEffect, useRef, useState } from "react";
import { api, RoleplayScenario } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";

type Stage = "select" | "calling" | "feedback";

export default function VoicePage() {
  const [stage, setStage] = useState<Stage>("select");
  const [scenarios, setScenarios] = useState<RoleplayScenario[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [signedUrl, setSignedUrl] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ score: number; feedback: string } | null>(null);
  const [transcript, setTranscript] = useState("");
  const [callDuration, setCallDuration] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.roleplay.getScenarios().then(setScenarios);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      wsRef.current?.close();
    };
  }, []);

  async function startCall(scenario: RoleplayScenario) {
    setLoading(true);
    try {
      const res = await api.voice.startSession(scenario.id);
      setSessionId(res.session_id);
      setSignedUrl(res.signed_url);
      setSelectedScenario(scenario);
      setCallDuration(0);
      setStage("calling");

      // Start call timer
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);

      // Connect to ElevenLabs WebSocket
      connectToElevenLabs(res.signed_url);
    } finally {
      setLoading(false);
    }
  }

  function connectToElevenLabs(url: string) {
    const ws = new WebSocket(url);
    wsRef.current = ws;
    const transcriptParts: string[] = [];

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "transcript" && data.text) {
          transcriptParts.push(`${data.role === "agent" ? "Клиент" : "Стажёр"}: ${data.text}`);
          setTranscript(transcriptParts.join("\n"));
        }
      } catch {}
    };

    ws.onclose = () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }

  async function endCall() {
    wsRef.current?.close();
    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(true);
    try {
      const result = await api.voice.endSession(sessionId, transcript || "Транскрипция недоступна");
      setFeedback(result);
      setStage("feedback");
    } finally {
      setLoading(false);
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  if (stage === "select") {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b border-gray-200 px-4 py-5">
          <h1 className="text-xl font-bold text-gray-900">Практика звонков</h1>
          <p className="text-sm text-gray-500 mt-1">Отработайте продажи по телефону с голосовым AI-клиентом</p>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <p className="text-sm text-blue-700">
              💡 Бот будет говорить голосом клиента. Общайтесь через микрофон браузера. После звонка получите оценку.
            </p>
          </div>
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => startCall(s)}
              disabled={loading}
              className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">📞</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{s.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{s.product_type} · {s.client_persona}</p>
                </div>
                <span className="text-gray-400">›</span>
              </div>
            </button>
          ))}
        </div>
        <BottomNav />
      </div>
    );
  }

  if (stage === "calling") {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <span className="text-4xl">📞</span>
          </div>
          <h2 className="text-white text-xl font-semibold mb-1">{selectedScenario?.product_type}</h2>
          <p className="text-gray-400 text-sm mb-2">{selectedScenario?.client_persona}</p>
          <p className="text-green-400 font-mono text-lg">{formatTime(callDuration)}</p>

          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <p className="text-gray-300 text-sm">Звонок активен — говорите с клиентом</p>
          </div>

          {transcript && (
            <div className="mt-6 bg-gray-800 rounded-2xl p-4 max-w-sm text-left max-h-40 overflow-y-auto">
              <p className="text-xs text-gray-400 mb-2">Транскрипция</p>
              <p className="text-xs text-gray-300 whitespace-pre-wrap">{transcript}</p>
            </div>
          )}
        </div>

        <button
          onClick={endCall}
          disabled={loading || callDuration < 10}
          className="mt-12 w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 disabled:opacity-40 transition-colors"
        >
          <span className="text-white text-2xl">📵</span>
        </button>
        <p className="text-gray-500 text-xs mt-3">Нажмите для завершения</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-5">
        <h1 className="text-xl font-bold text-gray-900">Итоги звонка</h1>
      </div>
      <div className="px-4 py-4 space-y-4">
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
          <div className={`text-6xl font-bold mb-2 ${
            (feedback?.score ?? 0) >= 7 ? "text-green-500" : (feedback?.score ?? 0) >= 5 ? "text-yellow-500" : "text-red-500"
          }`}>
            {feedback?.score}/10
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">{feedback?.feedback}</p>
        </div>

        {transcript && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Транскрипция</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">{transcript}</p>
          </div>
        )}

        <button
          onClick={() => { setStage("select"); setFeedback(null); setTranscript(""); }}
          className="w-full bg-blue-600 text-white py-3 rounded-2xl font-medium"
        >
          Позвонить ещё раз
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
