import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { SYSTEM_PROMPT, OPENAI_CONFIG } from './config/openai';
import { CacheManager, initializeCache } from './config/cache';

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase 클라이언트 설정
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// OpenAI 클라이언트 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 캐시 매니저 초기화
const cacheManager = CacheManager.getInstance();

// 미들웨어 설정
app.use(cors({
  origin: process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : 
    ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));
app.use(express.json());

// 성능 모니터링 미들웨어
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// 인증 미들웨어 (선택적)
const authenticateUser = async (req: any, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 인증이 없어도 계속 진행 (익명 사용자)
      req.user = { id: 'anonymous' };
      return next();
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      // 토큰이 유효하지 않아도 익명으로 진행
      req.user = { id: 'anonymous' };
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    // 오류가 발생해도 익명으로 진행
    req.user = { id: 'anonymous' };
    next();
  }
};

// 헬스 체크 엔드포인트
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    cache: cacheManager.getStats()
  });
});

// 대화 목록 조회 API (인증 선택적)
app.get('/api/conversations', authenticateUser, async (req: any, res: Response) => {
  try {
    // 익명 사용자는 빈 배열 반환
    if (req.user.id === 'anonymous') {
      return res.json([]);
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 메시지 목록 조회 API (인증 선택적)
app.get('/api/conversations/:conversationId/messages', authenticateUser, async (req: any, res: Response) => {
  try {
    const { conversationId } = req.params;
    
    // 익명 사용자는 빈 배열 반환
    if (req.user.id === 'anonymous') {
      return res.json({ messages: [] });
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    res.json({ messages: data || [] });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 새 대화 생성 API (인증 선택적)
app.post('/api/conversations', authenticateUser, async (req: any, res: Response) => {
  try {
    // 익명 사용자는 임시 대화 ID 생성
    if (req.user.id === 'anonymous') {
      const tempConversationId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return res.json({ id: tempConversationId, user_id: 'anonymous' });
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert([{ user_id: req.user.id }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to create conversation' });
    }

    res.json(data);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 메시지 저장 API (인증 선택적)
app.post('/api/messages', authenticateUser, async (req: any, res: Response) => {
  try {
    const { conversation_id, content, role } = req.body;
    
    if (!conversation_id || !content || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 익명 사용자는 메시지를 저장하지 않음
    if (req.user.id === 'anonymous') {
      return res.json({ 
        id: `temp_msg_${Date.now()}`,
        conversation_id,
        content,
        role,
        user_id: 'anonymous',
        created_at: new Date().toISOString()
      });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id,
        content,
        role,
        user_id: req.user.id,
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save message' });
    }

    res.json(data);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI 응답 생성 API (인증 없음)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Valid message is required',
        details: 'Message must be a non-empty string'
      });
    }

    // 메시지 길이 제한
    if (message.length > 1000) {
      return res.status(400).json({ 
        error: 'Message too long',
        details: 'Message must be less than 1000 characters'
      });
    }

    // 캐시에서 응답 확인
    const cachedResponse = await cacheManager.get(message, conversationHistory);
    if (cachedResponse) {
      console.log('캐시 히트 - 즉시 응답');
      return res.json({ 
        response: cachedResponse,
        usage: null,
        responseTime: 0,
        cached: true
      });
    }

    // 대화 히스토리를 OpenAI 형식으로 변환 (최근 10개 메시지만 포함)
    const recentHistory = conversationHistory.slice(-10);
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentHistory.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    console.log('OpenAI API 호출 시작:', {
      messageLength: message.length,
      historyLength: recentHistory.length,
      model: OPENAI_CONFIG.model
    });

    const startTime = Date.now();

    try {
      // 개선된 OpenAI API 호출
      const completion = await openai.chat.completions.create({
        model: OPENAI_CONFIG.model,
        messages,
        max_tokens: OPENAI_CONFIG.max_tokens,
        temperature: OPENAI_CONFIG.temperature,
        top_p: OPENAI_CONFIG.top_p,
        frequency_penalty: OPENAI_CONFIG.frequency_penalty,
        presence_penalty: OPENAI_CONFIG.presence_penalty,
      });

      const responseTime = Date.now() - startTime;
      const aiResponse = completion.choices[0]?.message?.content || '죄송해요, 응답을 생성할 수 없습니다.';

      console.log('OpenAI API 응답 완료:', {
        responseTime: `${responseTime}ms`,
        tokensUsed: completion.usage?.total_tokens,
        responseLength: aiResponse.length
      });

      // 응답을 캐시에 저장
      await cacheManager.set(message, aiResponse, conversationHistory);

      res.json({ 
        response: aiResponse,
        usage: completion.usage,
        responseTime: responseTime,
        cached: false
      });

    } catch (openaiError: any) {
      console.error('OpenAI API Error:', {
        error: openaiError.message,
        code: openaiError.code,
        status: openaiError.status
      });
      
      // OpenAI API 오류 시 대체 응답 제공
      const fallbackResponse = generateFallbackResponse(message);
      
      res.json({ 
        response: fallbackResponse,
        usage: null,
        note: 'OpenAI API 오류로 인해 대체 응답을 제공합니다.',
        error: openaiError.message
      });
    }

  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ 
      error: 'AI 응답 생성 중 오류가 발생했습니다.', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 스트리밍 응답 API 엔드포인트 (인증 없음)
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Valid message is required',
        details: 'Message must be a non-empty string'
      });
    }

    // 메시지 길이 제한
    if (message.length > 1000) {
      return res.status(400).json({ 
        error: 'Message too long',
        details: 'Message must be less than 1000 characters'
      });
    }

    // 대화 히스토리를 OpenAI 형식으로 변환 (최근 8개 메시지만 포함)
    const recentHistory = conversationHistory.slice(-8);
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentHistory.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    console.log('OpenAI 스트리밍 API 호출 시작:', {
      messageLength: message.length,
      historyLength: recentHistory.length,
      model: OPENAI_CONFIG.model
    });

    const startTime = Date.now();

    // 스트리밍 응답을 위한 헤더 설정
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    try {
      const stream = await openai.chat.completions.create({
        model: OPENAI_CONFIG.model,
        messages,
        max_tokens: OPENAI_CONFIG.max_tokens,
        temperature: OPENAI_CONFIG.temperature,
        top_p: OPENAI_CONFIG.top_p,
        frequency_penalty: OPENAI_CONFIG.frequency_penalty,
        presence_penalty: OPENAI_CONFIG.presence_penalty,
        stream: true,
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`);
        }
      }

      const responseTime = Date.now() - startTime;
      console.log('스트리밍 응답 완료:', {
        responseTime: `${responseTime}ms`,
        responseLength: fullResponse.length
      });

      // 응답을 캐시에 저장
      await cacheManager.set(message, fullResponse, conversationHistory);

      res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
      res.end();

    } catch (openaiError: any) {
      console.error('OpenAI 스트리밍 API Error:', {
        error: openaiError.message,
        code: openaiError.code,
        status: openaiError.status
      });
      
      // 오류 시 대체 응답 스트리밍
      const fallbackResponse = generateFallbackResponse(message);
      const chunks = fallbackResponse.split('').map(char => char);
      
      for (const chunk of chunks) {
        res.write(`data: ${JSON.stringify({ content: chunk, done: false })}\n\n`);
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms 지연
      }
      
      res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('Stream API Error:', error);
    res.write(`data: ${JSON.stringify({ content: '오류가 발생했습니다.', done: true })}\n\n`);
    res.end();
  }
});

// 임시 디버깅 엔드포인트
app.get('/api/test/conversations', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .limit(5);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }

    res.json({ data, error: null });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/test/messages', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .limit(5);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    res.json({ data, error: null });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 서버 시작
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // 캐시 초기화
  await initializeCache();
  console.log('Cache initialized');
});

function generateFallbackResponse(userMessage: string): string {
  const responses = [
    "죄송해요, 지금은 답변하기 어려워요. 조금 더 공부해볼게요! 😊",
    "아직 그 부분은 제가 잘 모르겠어요. 다른 질문이 있으시면 언제든 물어보세요!",
    "그 질문에 대해서는 아직 준비가 안 되어 있어요. 한국어 학습에 도움이 되는 다른 질문은 어떠신가요?",
    "죄송합니다. 그 부분은 제가 아직 학습 중이에요. 다른 한국어 관련 질문이 있으시면 언제든 말씀해주세요!"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}
