"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, TraineeInfo } from "@/lib/api";

export default function TraineesPage() {
  const [trainees, setTrainees] = useState<TraineeInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getTrainees().then(setTrainees).finally(() => setLoading(false));
  }, []);

  function exportCSV() {
    window.open(api.admin.exportTrainees(), "_blank");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <Link href="/admin" className="text-blue-500">‹ Назад</Link>
        <h1 className="font-bold text-gray-900 flex-1">Стажёры</h1>
        <button onClick={exportCSV} className="text-sm text-blue-500 border border-blue-200 px-3 py-1.5 rounded-xl">
          Экспорт CSV
        </button>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 h-24 animate-pulse" />
          ))
        ) : trainees.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Стажёров ещё нет</div>
        ) : (
          trainees.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center font-bold text-blue-600 flex-shrink-0">
                  {t.first_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm">{t.first_name} {t.last_name || ""}</h3>
                    {t.exam_passed && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Сдал</span>
                    )}
                  </div>
                  {t.username && <p className="text-xs text-gray-400">@{t.username}</p>}
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span>📖 {t.modules_completed}/{t.total_modules} модулей</span>
                    <span>💬 {t.roleplay_sessions} практик</span>
                    <span>📞 {t.voice_sessions} звонков</span>
                  </div>
                  {t.exam_score != null && (
                    <p className="text-xs mt-1">
                      <span className={`font-medium ${t.exam_passed ? "text-green-600" : "text-red-500"}`}>
                        Экзамен: {t.exam_score}%
                      </span>
                    </p>
                  )}
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3">
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div
                    className="h-full bg-blue-400 rounded-full"
                    style={{ width: `${t.total_modules > 0 ? (t.modules_completed / t.total_modules) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
