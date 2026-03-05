"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ExamQuestion, Module } from "@/lib/api";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    module_id: "",
    question: "",
    question_type: "mcq",
    options: ["", "", "", ""],
    correct_answer: "",
    explanation: "",
  });

  useEffect(() => {
    Promise.all([api.admin.getQuestions(), api.admin.getModules()]).then(([q, m]) => {
      setQuestions(q);
      setModules(m);
      if (m.length > 0) setForm((f) => ({ ...f, module_id: m[0].id }));
    });
  }, []);

  async function createQuestion() {
    const payload: Record<string, unknown> = {
      module_id: form.module_id,
      question: form.question,
      question_type: form.question_type,
      correct_answer: form.correct_answer,
      explanation: form.explanation,
    };
    if (form.question_type === "mcq") {
      payload.options = form.options.filter((o) => o.trim());
    }
    await api.admin.createQuestion(payload);
    setShowForm(false);
    const updated = await api.admin.getQuestions();
    setQuestions(updated);
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Удалить вопрос?")) return;
    await api.admin.deleteQuestion(id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function updateOption(i: number, val: string) {
    const opts = [...form.options];
    opts[i] = val;
    setForm({ ...form, options: opts });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <Link href="/admin" className="text-blue-500">‹ Назад</Link>
        <h1 className="font-bold text-gray-900 flex-1">Вопросы экзамена</h1>
        <button onClick={() => setShowForm(true)} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-xl">
          + Вопрос
        </button>
      </div>

      <div className="p-4 space-y-3">
        {showForm && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-200 space-y-3">
            <h3 className="font-semibold text-gray-900">Новый вопрос</h3>

            <div>
              <label className="text-xs text-gray-500">Модуль</label>
              <select
                value={form.module_id}
                onChange={(e) => setForm({ ...form, module_id: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none mt-1"
              >
                {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500">Тип вопроса</label>
              <div className="flex gap-2 mt-1">
                {["mcq", "open"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, question_type: t })}
                    className={`flex-1 py-2 rounded-xl text-sm border-2 ${form.question_type === t ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-600"}`}
                  >
                    {t === "mcq" ? "С вариантами" : "Открытый"}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              placeholder="Текст вопроса..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none min-h-[80px]"
            />

            {form.question_type === "mcq" && (
              <div className="space-y-2">
                <label className="text-xs text-gray-500">Варианты ответов</label>
                {form.options.map((opt, i) => (
                  <input
                    key={i}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Вариант ${i + 1}`}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                ))}
              </div>
            )}

            <input
              value={form.correct_answer}
              onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
              placeholder={form.question_type === "mcq" ? "Правильный ответ (точно как в варианте)" : "Эталонный ответ"}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
            />

            <textarea
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              placeholder="Объяснение правильного ответа..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none min-h-[60px]"
            />

            <div className="flex gap-2">
              <button onClick={createQuestion} className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-medium">
                Создать
              </button>
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm">
                Отмена
              </button>
            </div>
          </div>
        )}

        {questions.length === 0 && !showForm && (
          <div className="text-center py-12 text-gray-400">Вопросов ещё нет</div>
        )}

        {questions.map((q) => {
          const mod = modules.find((m) => m.id === q.module_id);
          return (
            <div key={q.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {q.question_type === "mcq" ? "Выбор" : "Открытый"}
                    </span>
                    {mod && <span className="text-xs text-blue-500">{mod.title}</span>}
                  </div>
                  <p className="text-sm text-gray-900 font-medium">{q.question}</p>
                  {q.options && (
                    <ul className="mt-2 space-y-1">
                      {q.options.map((opt, i) => (
                        <li key={i} className={`text-xs px-2 py-1 rounded-lg ${opt === q.correct_answer ? "bg-green-100 text-green-700" : "text-gray-500"}`}>
                          {String.fromCharCode(65 + i)}. {opt}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button onClick={() => deleteQuestion(q.id)} className="text-red-400 text-sm flex-shrink-0">✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
