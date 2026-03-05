"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/training", icon: "📖", label: "Обучение" },
  { href: "/roleplay", icon: "💬", label: "Практика" },
  { href: "/voice", icon: "📞", label: "Звонок" },
  { href: "/exam", icon: "📝", label: "Экзамен" },
  { href: "/progress", icon: "📊", label: "Прогресс" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
      {navItems.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
              active ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className={active ? "font-medium" : ""}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
