"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Module } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/auth";

const difficultyMap = {
  chat_completed: { label: "Изучено", color: "bg-green-100 text-green-700" },
  pending: { label: "Не начато", color: "bg-gray-100 text-gray-500" },
};

export default function TrainingPage() {
  const { user } = useAuth();
  const [modules, setModules] = useState<(Module & { chat_completed: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const progress = await api.progress.getMyProgress();
      setModules(progress.modules);
      setStats({ completed: progress.completed_modules, total: progress.total_modules });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const completion = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-5">
        <h1 className="text-xl font-bold text-gray-900">Обучение</h1>
        <p className="text-sm text-gray-500 mt-1">
          Привет, {user?.first_name}! Изучи все модули.
        </p>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Общий прогресс</span>
            <span className="text-sm font-bold text-blue-600">{completion}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Пройдено {stats.completed} из {stats.total} модулей
          </p>
        </div>
      </div>

      {/* Modules list */}
      <div className="px-4 space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 h-24 animate-pulse" />
          ))
        ) : (
          modules.map((module, index) => (
            <Link
              key={module.id}
              href={`/training/${module.id}`}
              className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                  module.chat_completed ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                }`}>
                  {module.chat_completed ? "✓" : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{module.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      module.chat_completed ? difficultyMap.chat_completed.color : difficultyMap.pending.color
                    }`}>
                      {module.chat_completed ? difficultyMap.chat_completed.label : difficultyMap.pending.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{module.description}</p>
                </div>
                <span className="text-gray-400 flex-shrink-0">›</span>
              </div>
            </Link>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
