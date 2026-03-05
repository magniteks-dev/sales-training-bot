"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, AdminStats } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const { user, isAdmin, isLoading, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/login");
    }
  }, [isAdmin, isLoading]);

  useEffect(() => {
    if (isAdmin) {
      api.admin.getStats().then(setStats).catch(console.error);
    }
  }, [isAdmin]);

  if (isLoading) return <div className="p-8 text-center">Загрузка...</div>;

  const menuItems = [
    { href: "/admin/materials", icon: "📚", label: "Модули и материалы", desc: "Учебный контент" },
    { href: "/admin/questions", icon: "📝", label: "Вопросы экзамена", desc: "Настройка теста" },
    { href: "/admin/scenarios", icon: "💼", label: "Сценарии практики", desc: "Roleplay и звонки" },
    { href: "/admin/trainees", icon: "👥", label: "Стажёры", desc: "Прогресс и результаты" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500">Школа продаж</p>
        </div>
        <button onClick={logout} className="text-sm text-red-500 hover:text-red-600">
          Выйти
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total_trainees}</div>
              <p className="text-xs text-gray-500 mt-1">Стажёров</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.passed_exam}</div>
              <p className="text-xs text-gray-500 mt-1">Сдали экзамен</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.total_roleplay_sessions}</div>
              <p className="text-xs text-gray-500 mt-1">Практик</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <div className="text-3xl font-bold text-orange-500">{stats.total_voice_sessions}</div>
              <p className="text-xs text-gray-500 mt-1">Звонков</p>
            </div>
          </div>
        )}

        {/* Menu */}
        <div className="space-y-3">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">
                {item.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.label}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              <span className="text-gray-400 text-xl">›</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
