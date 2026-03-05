"use client";

import { useEffect, useState } from "react";
import { api, UserProgress } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/auth";

export default function ProgressPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.progress.getMyProgress().then(setProgress).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const completion = progress?.overall_completion ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 px-4 py-5">
        <h1 className="text-xl font-bold text-gray-900">Мой прогресс</h1>
        <p className="text-sm text-gray-500 mt-1">{user?.first_name}</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Overall */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Общий прогресс</h2>
            <span className="text-2xl font-bold text-blue-600">{completion}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl font-bold text-blue-600">{progress?.completed_modules ?? 0}/{progress?.total_modules ?? 0}</div>
            <p className="text-xs text-gray-500 mt-1">Модулей пройдено</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm border text-center ${progress?.exam_passed ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100"}`}>
            <div className={`text-3xl font-bold ${progress?.exam_passed ? "text-green-600" : "text-gray-400"}`}>
              {progress?.exam_passed ? `${progress.exam_score}%` : "—"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Экзамен {progress?.exam_passed ? "сдан" : "не сдан"}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl font-bold text-purple-600">{progress?.roleplay_sessions_count ?? 0}</div>
            <p className="text-xs text-gray-500 mt-1">Практик переписки</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl font-bold text-green-600">{progress?.voice_sessions_count ?? 0}</div>
            <p className="text-xs text-gray-500 mt-1">Звонков</p>
          </div>
        </div>

        {/* Modules */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Модули</h3>
          <div className="space-y-2">
            {progress?.modules.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                  m.chat_completed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                }`}>
                  {m.chat_completed ? "✓" : i + 1}
                </div>
                <span className="text-sm text-gray-700 flex-1">{m.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  m.chat_completed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {m.chat_completed ? "Пройдено" : "В процессе"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Exam badge */}
        {progress?.exam_passed && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-5 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <p className="text-white font-bold text-lg">Обучение завершено!</p>
            <p className="text-yellow-100 text-sm mt-1">Экзамен сдан с результатом {progress.exam_score}%</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
