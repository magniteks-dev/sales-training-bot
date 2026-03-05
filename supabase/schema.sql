-- Sales Training Bot — Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id   BIGINT UNIQUE,
    first_name    TEXT NOT NULL,
    last_name     TEXT,
    username      TEXT,
    role          TEXT NOT NULL DEFAULT 'trainee' CHECK (role IN ('trainee', 'admin')),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Training Modules ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_modules (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title         TEXT NOT NULL,
    description   TEXT NOT NULL,
    order_index   INTEGER NOT NULL DEFAULT 0,
    passing_score INTEGER NOT NULL DEFAULT 80,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Training Materials ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_materials (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id     UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
    content_text  TEXT NOT NULL,
    material_type TEXT NOT NULL DEFAULT 'text' CHECK (material_type IN ('text', 'faq', 'script')),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Chat Messages ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id  UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
    role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_user_module ON chat_messages(user_id, module_id);

-- ─── Roleplay Scenarios ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roleplay_scenarios (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title          TEXT NOT NULL,
    product_type   TEXT NOT NULL,
    client_persona TEXT NOT NULL,
    difficulty     TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    system_prompt  TEXT NOT NULL,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Roleplay Sessions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roleplay_sessions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES roleplay_scenarios(id),
    messages    JSONB NOT NULL DEFAULT '[]',
    status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    score       INTEGER,
    feedback    TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_roleplay_sessions_user ON roleplay_sessions(user_id);

-- ─── Voice Sessions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voice_sessions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES roleplay_scenarios(id),
    transcript  TEXT,
    status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    score       INTEGER,
    feedback    TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_voice_sessions_user ON voice_sessions(user_id);

-- ─── Exam Questions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exam_questions (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id      UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
    question       TEXT NOT NULL,
    question_type  TEXT NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'open')),
    options        JSONB,
    correct_answer TEXT NOT NULL,
    explanation    TEXT NOT NULL,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Exam Attempts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exam_attempts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score           INTEGER NOT NULL,
    passed          BOOLEAN NOT NULL,
    answers         JSONB NOT NULL DEFAULT '[]',
    correct_count   INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exam_attempts_user ON exam_attempts(user_id);

-- ─── User Progress ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_progress (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module_id       UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
    chat_completed  BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, module_id)
);

CREATE INDEX idx_user_progress_user ON user_progress(user_id);


-- ─── Seed Data: Sample Training Modules ───────────────────────────────────────
INSERT INTO training_modules (title, description, order_index, passing_score) VALUES
('Введение в продажи', 'Основы продаж, психология покупателя, воронка продаж', 1, 80),
('Продукты компании', 'Детальное изучение всех 6 продуктов: мероприятия, клуб, консалтинг, digital, CRM, школа продаж', 2, 80),
('Работа с возражениями', 'Техники обработки возражений: дорого, не сейчас, подумаю, уже есть', 3, 80),
('Скрипты продаж', 'Готовые скрипты для холодных звонков, переписки, дожима', 4, 80),
('Закрытие сделки', 'Техники закрытия, работа с отказом, удержание клиента', 5, 80)
ON CONFLICT DO NOTHING;


-- ─── Seed Data: Sample Roleplay Scenarios ─────────────────────────────────────
INSERT INTO roleplay_scenarios (title, product_type, client_persona, difficulty, system_prompt) VALUES
(
    'Холодный клиент — Билет на форум',
    'Билет на бизнес-форум',
    'Холодный, занятой предприниматель',
    'medium',
    'Ты занятой предприниматель Алексей, 35 лет. Тебе звонит/пишет менеджер по продажам и предлагает купить билет на бизнес-форум за 15 000 рублей.
Твоя позиция: скептически настроен, у тебя нет времени, кажется что это очередной инфо-бизнес. Возражения: "дорого", "нет времени", "не понимаю зачем мне это".
Говори коротко, как реальный занятой человек. Если продавец хорошо работает с возражениями и убеждает тебя — постепенно смягчайся. Веди диалог на русском языке.'
),
(
    'Тёплый клиент — Абонемент в бизнес-клуб',
    'Абонемент в бизнес-клуб',
    'Заинтересованный, но сомневается в цене',
    'easy',
    'Ты предприниматель Мария, 40 лет. Тебе предлагают абонемент в бизнес-клуб (месячный 5 000 руб, годовой 45 000 руб).
Ты в принципе заинтересована в нетворкинге, но сомневаешься: "А что входит?", "Кто другие участники?", "Стоит ли годовой?".
Задавай уточняющие вопросы, веди себя заинтересованно но осторожно. Говори на русском языке.'
),
(
    'Возражающий клиент — Консультация',
    'Консалтинг для бизнеса',
    'Агрессивный скептик, всё знает сам',
    'hard',
    'Ты владелец малого бизнеса Дмитрий, 45 лет. Тебе предлагают консультацию бизнес-консультанта за 30 000 рублей.
Ты убеждён что сам всё знаешь, консультанты — это "воздух", деньги лучше потратить на рекламу. Агрессивно возражаешь: "я сам консультант", "таких умных много", "покажите результаты клиентов".
Только если менеджер показывает реальную ценность с конкретными примерами — начинаешь немного прислушиваться. Говори на русском языке.'
)
ON CONFLICT DO NOTHING;
