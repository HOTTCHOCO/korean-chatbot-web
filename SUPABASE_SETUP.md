# Supabase 설정 가이드

## 🚀 Supabase 프로젝트 생성

### 1. Supabase 대시보드에서 프로젝트 생성

1. [Supabase](https://supabase.com)에 로그인
2. "New Project" 클릭
3. 프로젝트 설정:
   - **Name**: `korean-chatbot-app`
   - **Database Password**: 안전한 비밀번호 설정
   - **Region**: 가장 가까운 리전 선택 (예: `Northeast Asia (Tokyo)`)
4. "Create new project" 클릭

### 2. 프로젝트 설정 정보 확인

프로젝트 생성 후 다음 정보를 확인하세요:

1. **Project URL**: `https://[project-id].supabase.co`
2. **anon public key**: Settings → API → Project API keys → anon public

### 3. 데이터베이스 스키마 적용

1. Supabase 대시보드 → SQL Editor
2. `supabase/schema.sql` 파일의 내용을 복사하여 실행
3. 또는 SQL Editor에서 직접 실행:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nickname TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id_created_at ON public.messages(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (위의 schema.sql 파일 참조)
```

### 4. 인증 설정

1. Authentication → Settings
2. **Email Auth** 활성화
3. **Confirm email** 선택 (선택사항)
4. **Secure email change** 활성화

### 5. 환경 변수 설정

#### 로컬 개발 환경
```bash
# backend/.env 파일 생성
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
```

#### 배포 환경 (Render)
- Render 대시보드 → Environment → Environment Variables
- `SUPABASE_URL`: `https://[project-id].supabase.co`
- `SUPABASE_ANON_KEY`: `[your-anon-key]`

### 6. 테이블 구조 확인

Supabase 대시보드 → Table Editor에서 다음 테이블들이 생성되었는지 확인:

#### profiles 테이블
- `id` (UUID, Primary Key)
- `nickname` (TEXT)
- `updated_at` (TIMESTAMPTZ)

#### conversations 테이블
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `created_at` (TIMESTAMPTZ)

#### messages 테이블
- `id` (UUID, Primary Key)
- `conversation_id` (UUID, Foreign Key)
- `user_id` (UUID, Foreign Key)
- `role` (TEXT, 'user' 또는 'assistant')
- `content` (TEXT)
- `created_at` (TIMESTAMPTZ)

### 7. 샘플 데이터 테스트

SQL Editor에서 다음 쿼리로 테스트:

```sql
-- 테이블 존재 확인
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('profiles', 'conversations', 'messages');

-- 인덱스 확인
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename IN ('profiles', 'conversations', 'messages');
```

### 8. API 테스트

백엔드 서버 실행 후 다음 엔드포인트 테스트:

```bash
# Supabase 연결 테스트
curl http://localhost:3001/api/supabase-test

# 대화 목록 조회
curl http://localhost:3001/api/conversations

# 새 대화 생성
curl -X POST http://localhost:3001/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user-id"}'
```

## 🔒 보안 고려사항

1. **Row Level Security (RLS)**: 모든 테이블에 RLS가 활성화되어 있음
2. **인증**: Supabase Auth를 통한 이메일/비밀번호 인증
3. **API 키**: anon 키는 공개되어도 안전하지만, service_role 키는 절대 공개하지 마세요

## 📝 다음 단계

1. 프론트엔드에서 Supabase 클라이언트 설정
2. 사용자 인증 UI 구현
3. 채팅 인터페이스 개발
4. OpenAI API 연동
