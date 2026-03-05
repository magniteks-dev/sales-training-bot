# Sales Training Bot — Система обучения продажам

Telegram Mini App для обучения менеджеров по продажам.

## Стек

- **Frontend**: Next.js 14 + TypeScript + Tailwind → Vercel
- **Backend**: Python FastAPI → Render.com
- **Bot**: Python Telegram Bot → Render.com (Worker)
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude claude-sonnet-4-6 (Anthropic)
- **Voice**: ElevenLabs Conversational AI

## Структура проекта

```
sales-training-bot/
├── frontend/     # Next.js приложение (Vercel)
├── backend/      # FastAPI backend (Render.com — Web Service)
├── bot/          # Telegram Bot (Render.com — Background Worker)
└── supabase/     # SQL схема базы данных
```

---

## Деплой: пошаговая инструкция

### 1. Supabase

1. Зайдите на supabase.com → New project
2. В SQL Editor выполните файл `supabase/schema.sql`
3. Скопируйте `Project URL` и `service_role key` (Settings → API)

### 2. Anthropic API

1. Зайдите на console.anthropic.com
2. Создайте API Key

### 3. ElevenLabs

1. Зайдите на elevenlabs.io → Conversational AI
2. Создайте нового агента с системным промптом:
   ```
   Ты голосовой AI-клиент для тренировки продавцов. Играй роль скептичного клиента...
   ```
3. Скопируйте Agent ID и API Key

### 4. Telegram Bot

1. Откройте @BotFather в Telegram
2. Создайте нового бота: `/newbot`
3. Скопируйте токен
4. Включите Web App: `/setmenubutton` или через inline кнопку

### 5. Backend (Render.com)

1. Зайдите на render.com → New Web Service
2. Подключите репозиторий, выберите папку `backend/`
3. Установите переменные окружения (см. `backend/.env.example`):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `ANTHROPIC_API_KEY`
   - `ELEVENLABS_API_KEY`
   - `ELEVENLABS_AGENT_ID`
   - `TELEGRAM_BOT_TOKEN`
   - `ADMIN_PASSWORD` — придумайте пароль для admin-панели
   - `JWT_SECRET` — случайная строка 32+ символов
   - `FRONTEND_URL` — URL вашего Vercel приложения (добавите после)
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 6. Telegram Bot Worker (Render.com)

1. New Background Worker
2. Папка `bot/`
3. Переменные: `TELEGRAM_BOT_TOKEN`, `FRONTEND_URL`
4. Start command: `python main.py`

### 7. Frontend (Vercel)

1. Зайдите на vercel.com → New Project
2. Подключите репозиторий, выберите папку `frontend/`
3. Переменные окружения:
   - `NEXT_PUBLIC_BACKEND_URL` = URL вашего Render backend
   - `NEXT_PUBLIC_TG_BOT_NAME` = username вашего бота
4. Deploy

### 8. Обновите FRONTEND_URL в backend

После деплоя Vercel вернитесь в настройки Render backend и обновите `FRONTEND_URL`.

---

## Локальная разработка

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Заполните .env
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Заполните .env.local
npm run dev
```

### Bot

```bash
cd bot
pip install -r requirements.txt
TELEGRAM_BOT_TOKEN=xxx FRONTEND_URL=http://localhost:3000 python main.py
```

---

## Использование

### Для стажёра
1. Открыть Telegram-бот
2. Нажать кнопку "Открыть обучение"
3. Пройти все учебные модули (чат с AI)
4. Попрактиковаться в переписке (roleplay)
5. Отработать звонки (ElevenLabs голос)
6. Сдать финальный экзамен (минимум 80%)

### Для администратора
1. Открыть `https://your-app.vercel.app/login`
2. Войти с паролем администратора
3. Добавить учебные материалы в **Модули и материалы**
4. Создать вопросы для экзамена в **Вопросы экзамена**
5. Настроить сценарии roleplay в **Сценарии практики**
6. Отслеживать прогресс стажёров в **Стажёры**

---

## API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| POST | /api/auth/telegram | Авторизация через Telegram |
| POST | /api/auth/admin/login | Вход администратора |
| GET | /api/training/modules | Список модулей |
| POST | /api/chat/message | Сообщение в чат обучения |
| GET | /api/roleplay/scenarios | Сценарии практики |
| POST | /api/roleplay/start | Начать roleplay сессию |
| POST | /api/roleplay/message | Сообщение в roleplay |
| POST | /api/roleplay/end | Завершить и получить оценку |
| POST | /api/voice/start | Начать голосовой звонок |
| POST | /api/voice/end | Завершить звонок |
| GET | /api/exam/questions | Вопросы экзамена |
| POST | /api/exam/submit | Сдать экзамен |
| GET | /api/progress/me | Мой прогресс |
| GET | /api/admin/trainees | Список стажёров (admin) |
| GET | /api/admin/stats | Статистика (admin) |
