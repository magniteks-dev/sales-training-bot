"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Module, Material } from "@/lib/api";

export default function MaterialsPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: "", description: "", order_index: 1, passing_score: 80 });
  const [materialForm, setMaterialForm] = useState({ content_text: "", material_type: "text" });

  useEffect(() => {
    loadModules();
  }, []);

  async function loadModules() {
    const data = await api.admin.getModules();
    setModules(data);
    setLoading(false);
  }

  async function selectModule(mod: Module) {
    setSelectedModule(mod);
    const mats = await api.admin.getMaterials(mod.id);
    setMaterials(mats);
  }

  async function createModule() {
    await api.admin.createModule({ ...moduleForm });
    setShowModuleForm(false);
    setModuleForm({ title: "", description: "", order_index: modules.length + 1, passing_score: 80 });
    loadModules();
  }

  async function deleteModule(id: string) {
    if (!confirm("Деактивировать модуль?")) return;
    await api.admin.deleteModule(id);
    if (selectedModule?.id === id) setSelectedModule(null);
    loadModules();
  }

  async function createMaterial() {
    if (!selectedModule) return;
    await api.admin.createMaterial({ ...materialForm, module_id: selectedModule.id });
    setShowMaterialForm(false);
    setMaterialForm({ content_text: "", material_type: "text" });
    const mats = await api.admin.getMaterials(selectedModule.id);
    setMaterials(mats);
  }

  async function deleteMaterial(id: string) {
    if (!confirm("Удалить материал?")) return;
    await api.admin.deleteMaterial(id);
    if (selectedModule) {
      const mats = await api.admin.getMaterials(selectedModule.id);
      setMaterials(mats);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <Link href="/admin" className="text-blue-500">‹ Назад</Link>
        <h1 className="font-bold text-gray-900 flex-1">Модули и материалы</h1>
        <button onClick={() => setShowModuleForm(true)} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-xl">
          + Модуль
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Module create form */}
        {showModuleForm && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-200 space-y-3">
            <h3 className="font-semibold text-gray-900">Новый модуль</h3>
            <input
              value={moduleForm.title}
              onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
              placeholder="Название модуля"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <textarea
              value={moduleForm.description}
              onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
              placeholder="Описание"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 min-h-[80px]"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Порядок</label>
                <input
                  type="number"
                  value={moduleForm.order_index}
                  onChange={(e) => setModuleForm({ ...moduleForm, order_index: +e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Проходной балл %</label>
                <input
                  type="number"
                  value={moduleForm.passing_score}
                  onChange={(e) => setModuleForm({ ...moduleForm, passing_score: +e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={createModule} className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-medium">
                Создать
              </button>
              <button onClick={() => setShowModuleForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm">
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Modules list */}
        {modules.map((m) => (
          <div key={m.id} className={`bg-white rounded-2xl shadow-sm border transition-colors ${selectedModule?.id === m.id ? "border-blue-300" : "border-gray-100"}`}>
            <button
              onClick={() => selectModule(m)}
              className="w-full text-left p-4 flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                {m.order_index}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{m.title}</p>
                <p className="text-xs text-gray-500 truncate">{m.description}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteModule(m.id); }}
                className="text-red-400 text-xs px-2 py-1 hover:bg-red-50 rounded-lg"
              >
                ✕
              </button>
            </button>

            {/* Materials for selected module */}
            {selectedModule?.id === m.id && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500">Материалы ({materials.length})</p>
                  <button onClick={() => setShowMaterialForm(true)} className="text-xs text-blue-500 border border-blue-200 px-2 py-1 rounded-lg">
                    + Добавить
                  </button>
                </div>

                {showMaterialForm && (
                  <div className="bg-blue-50 rounded-xl p-3 space-y-2">
                    <select
                      value={materialForm.material_type}
                      onChange={(e) => setMaterialForm({ ...materialForm, material_type: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                    >
                      <option value="text">Текст</option>
                      <option value="faq">FAQ</option>
                      <option value="script">Скрипт продаж</option>
                    </select>
                    <textarea
                      value={materialForm.content_text}
                      onChange={(e) => setMaterialForm({ ...materialForm, content_text: e.target.value })}
                      placeholder="Текст материала..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none min-h-[100px]"
                    />
                    <div className="flex gap-2">
                      <button onClick={createMaterial} className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-xs font-medium">
                        Сохранить
                      </button>
                      <button onClick={() => setShowMaterialForm(false)} className="flex-1 border border-gray-200 py-1.5 rounded-lg text-xs text-gray-600">
                        Отмена
                      </button>
                    </div>
                  </div>
                )}

                {materials.map((mat) => (
                  <div key={mat.id} className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                    <div className="flex-1">
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{mat.material_type}</span>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-3">{mat.content_text}</p>
                    </div>
                    <button onClick={() => deleteMaterial(mat.id)} className="text-red-400 text-xs flex-shrink-0">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
