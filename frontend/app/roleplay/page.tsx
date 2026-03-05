"use client";

import { useEffect, useState } from "react";
import { api, RoleplayScenario, RoleplayFeedback } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";

type Stage = "select" | "chat" | "feedback";

const difficultyLabel: Record<string, string> = {
  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",
};
const difficultyColor: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

export default function RoleplayPage() {
  const [stage, setStage] = useState<Stage>("select");
  const [scenarios, setScenarios] = useState<RoleplayScenario[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<RoleplayFeedback | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario | null>(null);

  useEffect(() => {
    api.roleplay.getScenarios().then(setScenarios);
  }, []);

  async function startSession(scenario: RoleplayScenario) {
    setLoading(true);
    try {
      const res = await api.roleplay.startSession(scenario.id);
      setSessionId(res.session_id);
      setSelectedScenario(scenario);
      setMessages([{ role: "assistant", content: res.opening_message }]);
      setStage("chat");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await api.roleplay.sendMessage(sessionId, text);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } finally {
      setLoading(false);
    }
  }

  async function endSession() {
    setLoading(true);
    try {
      const result = await api.roleplay.endSession(sessionId);
      setFeedback(result);
      setStage("feedback");
    } catch (e: unknown) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    setStage("select");
    setMessages([]);
    setFeedback(null);
    setSessionId("");
    setSelectedScenario(null);
  }

  if (stage === "select") {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b border-gray-200 px-4 py-5">
          <h1 className="text-xl font-bold text-gray-900">Практика продаж</h1>
          <p className="text-sm text-gray-500 mt-1">Выберите сценарий и попрактикуйтесь в переписке с клиентом</p>
        </div>
        <div className="px-4 py-4 space-y-3">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => startSession(s)}
              disabled={loading}
              className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  💼
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{s.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor[s.difficulty]}`}>
                      {difficultyLabel[s.difficulty]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{s.product_type}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.client_persona}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        <BottomNav />
      </div>
    );
  }

  if (stage === "chat") {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={restart} className="text-blue-500 text-lg">‹</button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 text-sm truncate">{selectedScenario?.title}</h1>
            <p className="text-xs text-gray-500">Вы — менеджер, бот — клиент</p>
          </div>
          <button
            onClick={endSession}
            disabled={loading || messages.length < 4}
            className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-xl disabled:opacity-40"
          >
            Завершить
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-1">
                  👤
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-500 text-white rounded-br-md"
                  : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm mr-2">👤</div>
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex gap-1 items-center h-4">
                  {[0, 150, 300].map((d) => (
                    <div key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border-t border-gray-200 px-4 py-3">
          {messages.length >= 4 && (
            <p className="text-xs text-gray-400 text-center mb-2">Нажмите «Завершить» для оценки диалога</p>
          )}
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ваш ответ клиенту..."
              className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center disabled:opacity-50"
            >
              <span className="text-white text-lg">↑</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // feedback stage
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-5">
        <h1 className="text-xl font-bold text-gray-900">Результат практики</h1>
      </div>
      <div className="px-4 py-4 space-y-4">
        {/* Score */}
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
          <div className={`text-6xl font-bold mb-2 ${
            (feedback?.score ?? 0) >= 7 ? "text-green-500" : (feedback?.score ?? 0) >= 5 ? "text-yellow-500" : "text-red-500"
          }`}>
            {feedback?.score}/10
          </div>
          <p className="text-gray-600 text-sm mt-2 leading-relaxed">{feedback?.feedback}</p>
        </div>

        {/* Strengths */}
        {feedback?.strengths && feedback.strengths.length > 0 && (
          <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
            <h3 className="font-semibold text-green-800 mb-3 text-sm">Сильные стороны</h3>
            <ul className="space-y-2">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                  <span className="flex-shrink-0">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {feedback?.improvements && feedback.improvements.length > 0 && (
          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
            <h3 className="font-semibold text-orange-800 mb-3 text-sm">Что улучшить</h3>
            <ul className="space-y-2">
              {feedback.improvements.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-orange-700">
                  <span className="flex-shrink-0">→</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={restart}
          className="w-full bg-blue-600 text-white py-3 rounded-2xl font-medium"
        >
          Попробовать ещё раз
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
