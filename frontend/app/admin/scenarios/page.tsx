"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, RoleplayScenario } from "@/lib/api";

const PRODUCTS = [
  "Билет на бизнес-форум",
  "Абонемент в бизнес-клуб",
  "Консалтинг для бизнеса",
  "Услуги digital-агентства",
  "Внедрение CRM",
  "Обучение в Школе продаж",
];

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<RoleplayScenario[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{
    title: string;
    product_type: string;
    client_persona: string;
    difficulty: "easy" | "medium" | "hard";
    system_prompt: string;
  }>({
    title: "",
    product_type: PRODUCTS[0],
    client_persona: "",
    difficulty: "medium",
    system_prompt: "",
  });

  useEffect(() => {
    api.admin.getScenarios().then(setScenarios);
  }, []);

  async function createScenario() {
    await api.admin.createScenario(form);
    setShowForm(false);
    setForm({ title: "", product_type: PRODUCTS[0], client_persona: "", difficulty: "medium", system_prompt: "" });
    const updated = await api.admin.getScenarios();
    setScenarios(updated);
  }

  async function deleteScenario(id: string) {
    if (!confirm("Удалить сценарий?")) return;
    await api.admin.deleteScenario(id);
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }

  const diffMap = { easy: "Лёгкий", medium: "Средний", hard: "Сложный" };
  const diffColor: Record<string, string> = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    hard: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <Link href="/admin" className="text-blue-500">‹ Назад</Link>
        <h1 className="font-bold text-gray-900 flex-1">Сценарии практики</h1>
        <button onClick={() => setShowForm(true)} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-xl">
          + Сценарий
        </button>
      </div>

      <div className="p-4 space-y-3">
        {showForm && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-200 space-y-3">
            <h3 className="font-semibold text-gray-900">Новый сценарий</h3>

            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Название сценария"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
            />

            <div>
              <label className="text-xs text-gray-500">Продукт</label>
              <select
                value={form.product_type}
                onChange={(e) => setForm({ ...form, product_type: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none mt-1"
              >
                {PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <input
              value={form.client_persona}
              onChange={(e) => setForm({ ...form, client_persona: e.target.value })}
              placeholder="Тип клиента (напр. Скептичный предприниматель, 40 лет)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
            />

            <div>
              <label className="text-xs text-gray-500">Сложность</label>
              <div className="flex gap-2 mt-1">
                {["easy", "medium", "hard"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setForm({ ...form, difficulty: d as "easy" | "medium" | "hard" })}
                    className={`flex-1 py-2 rounded-xl text-xs border-2 ${form.difficulty === d ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-600"}`}
                  >
                    {diffMap[d as "easy" | "medium" | "hard"]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">System Prompt для бота-клиента</label>
              <textarea
                value={form.system_prompt}
                onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                placeholder="Ты клиент по имени ... Твоя позиция: ... Возражения: ..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none min-h-[120px] mt-1"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={createScenario} className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-medium">
                Создать
              </button>
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm">
                Отмена
              </button>
            </div>
          </div>
        )}

        {scenarios.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">💼</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{s.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${diffColor[s.difficulty]}`}>
                    {diffMap[s.difficulty as keyof typeof diffMap]}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{s.product_type}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.client_persona}</p>
              </div>
              <button onClick={() => deleteScenario(s.id)} className="text-red-400 text-sm flex-shrink-0">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
