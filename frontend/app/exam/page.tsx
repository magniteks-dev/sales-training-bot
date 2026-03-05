"use client";

import { useEffect, useState } from "react";
import { api, ExamQuestion, ExamResult } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";

type Stage = "start" | "taking" | "result";

export default function ExamPage() {
  const [stage, setStage] = useState<Stage>("start");
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [attempts, setAttempts] = useState<{ score: number; passed: boolean; created_at: string }[]>([]);

  useEffect(() => {
    api.exam.getAttempts().then(setAttempts).catch(() => {});
  }, []);

  async function startExam() {
    setLoading(true);
    setError("");
    try {
      const data = await api.exam.getQuestions();
      setQuestions(data.questions);
      setAnswers({});
      setCurrentQ(0);
      setStage("taking");
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function submitExam() {
    const answersList = Object.entries(answers).map(([question_id, answer]) => ({ question_id, answer }));
    if (answersList.length < questions.length) {
      alert("Ответьте на все вопросы");
      return;
    }
    setLoading(true);
    try {
      const res = await api.exam.submit(answersList);
      setResult(res);
      setStage("result");
    } finally {
      setLoading(false);
    }
  }

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  const q = questions[currentQ];
  const progress = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0;

  if (stage === "start") {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b border-gray-200 px-4 py-5">
          <h1 className="text-xl font-bold text-gray-900">Экзамен</h1>
          <p className="text-sm text-gray-500 mt-1">Проверьте свои знания</p>
        </div>

        <div className="px-4 py-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-3">Как проходит экзамен</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-blue-500">📋</span>
                Вопросы по всем пройденным модулям
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">✅</span>
                Тесты с выбором ответа и открытые вопросы
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">🎯</span>
                Минимальный проходной балл — 80%
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500">🔄</span>
                При провале — пересдача через 24 часа
              </li>
            </ul>
          </div>

          {attempts.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Предыдущие попытки</h3>
              {attempts.slice(0, 3).map((a, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600">
                    {new Date(a.created_at).toLocaleDateString("ru-RU")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{a.score}%</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${a.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {a.passed ? "Сдан" : "Не сдан"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={startExam}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold text-base disabled:opacity-50"
          >
            {loading ? "Загрузка..." : "Начать экзамен"}
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (stage === "taking" && q) {
    return (
      <div className="min-h-screen bg-gray-50 pb-8">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              Вопрос {currentQ + 1} из {questions.length}
            </span>
            <span className="text-sm font-medium text-blue-600">
              {Object.keys(answers).length}/{questions.length} отвечено
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="px-4 py-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <p className="text-gray-900 font-medium leading-relaxed">{q.question}</p>
          </div>

          {q.question_type === "mcq" && q.options ? (
            <div className="space-y-3">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setAnswer(q.id, opt)}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 transition-colors text-sm font-medium ${
                    answers[q.id] === opt
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <span className="font-bold mr-2 text-gray-400">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              value={answers[q.id] || ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              placeholder="Напишите развёрнутый ответ..."
              className="w-full bg-white border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 min-h-[120px]"
            />
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 flex gap-3">
          <button
            onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
            disabled={currentQ === 0}
            className="flex-1 py-3 border-2 border-gray-200 rounded-2xl text-gray-600 font-medium disabled:opacity-30"
          >
            Назад
          </button>
          {currentQ < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ((q) => q + 1)}
              className="flex-1 py-3 bg-blue-600 rounded-2xl text-white font-medium"
            >
              Далее
            </button>
          ) : (
            <button
              onClick={submitExam}
              disabled={loading}
              className="flex-1 py-3 bg-green-600 rounded-2xl text-white font-medium disabled:opacity-50"
            >
              {loading ? "Проверка..." : "Сдать экзамен"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Result
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-5">
        <h1 className="text-xl font-bold text-gray-900">Результат экзамена</h1>
      </div>
      <div className="px-4 py-4 space-y-4">
        <div className={`rounded-2xl p-6 text-center ${result?.passed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <div className="text-5xl mb-3">{result?.passed ? "🎉" : "😔"}</div>
          <div className={`text-5xl font-bold mb-2 ${result?.passed ? "text-green-600" : "text-red-500"}`}>
            {result?.score}%
          </div>
          <p className={`font-semibold text-lg ${result?.passed ? "text-green-700" : "text-red-600"}`}>
            {result?.passed ? "Экзамен сдан!" : "Не сдан"}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Правильно: {result?.correct_answers} из {result?.total_questions}
          </p>
          {!result?.passed && result?.can_retry_at && (
            <p className="text-gray-500 text-xs mt-2">
              Пересдача доступна: {new Date(result.can_retry_at).toLocaleString("ru-RU")}
            </p>
          )}
        </div>

        {/* Feedback */}
        {result?.feedback && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">Разбор ошибок</h3>
            {result.feedback.filter(f => !f.is_correct).map((f, i) => (
              <div key={i} className="bg-red-50 rounded-xl p-3">
                <p className="text-sm font-medium text-gray-900 mb-1">{f.question}</p>
                <p className="text-xs text-red-600 mb-1">Ваш ответ: {f.user_answer}</p>
                <p className="text-xs text-green-600 mb-1">Правильно: {f.correct_answer}</p>
                <p className="text-xs text-gray-500">{f.explanation}</p>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setStage("start")}
          className="w-full bg-blue-600 text-white py-3 rounded-2xl font-medium"
        >
          На страницу экзамена
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
