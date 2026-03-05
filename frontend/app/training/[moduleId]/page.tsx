"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ChatMessage, Module } from "@/lib/api";

export default function ModuleChatPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const router = useRouter();
  const [module, setModule] = useState<Module | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadModule();
  }, [moduleId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadModule() {
    try {
      const [mod, history] = await Promise.all([
        api.training.getModule(moduleId),
        api.training.getChatHistory(moduleId),
      ]);
      setModule(mod);
      if (history.messages.length === 0) {
        // Start with greeting from AI
        await sendFirstMessage(mod.title);
      } else {
        setMessages(history.messages);
      }
    } finally {
      setInitialLoading(false);
    }
  }

  async function sendFirstMessage(moduleTitle: string) {
    setLoading(true);
    try {
      const res = await api.chat.sendMessage(moduleId, `Привет! Я готов изучить тему "${moduleTitle}". Начнём!`);
      setMessages([
        { role: "user", content: `Привет! Я готов изучить тему "${moduleTitle}". Начнём!` },
        { role: "assistant", content: res.reply },
      ]);
      if (res.module_completed) setCompleted(true);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await api.chat.sendMessage(moduleId, userMessage);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
      if (res.module_completed) setCompleted(true);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Произошла ошибка. Попробуйте ещё раз." }]);
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-blue-500 text-lg">‹</button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-gray-900 text-sm truncate">{module?.title}</h1>
          <p className="text-xs text-gray-500">Чат с AI-тренером</p>
        </div>
        {completed && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ Завершено</span>}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-1">
                🤖
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-500 text-white rounded-br-md"
                  : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm flex-shrink-0 mr-2">
              🤖
            </div>
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1 items-center h-4">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Completion banner */}
      {completed && (
        <div className="mx-4 mb-2 bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-green-700 font-medium text-sm">Модуль завершён! 🎉</p>
          <button
            onClick={() => router.push("/training")}
            className="mt-2 text-xs text-green-600 underline"
          >
            Вернуться к списку модулей
          </button>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Напишите вопрос или ответ..."
            className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center disabled:opacity-50 flex-shrink-0"
          >
            <span className="text-white text-lg">↑</span>
          </button>
        </form>
      </div>
    </div>
  );
}
