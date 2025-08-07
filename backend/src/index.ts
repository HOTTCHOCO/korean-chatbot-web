import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { supabase } from './config/supabase';
import { openai, SYSTEM_PROMPT, OPENAI_CONFIG } from './config/openai';
import { CacheManager, initializeCache } from './config/cache';

const app = express();
const PORT = process.env.PORT || 3001;

// 캐시 초기화
initializeCache().catch(console.error);

// 성능 모니터링 미들웨어
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// CORS 설정 개선
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174', 
  'http://localhost:5175',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Authentication middleware
const authenticateUser = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('Auth middleware - headers:', req.headers);
    console.log('Auth middleware - authHeader:', authHeader);
    
    if (!authHeader) {
      console.log('Auth middleware - No authorization header');
      return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Auth middleware - token length:', token.length);
    
    // Supabase에서 사용자 정보 확인
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    console.log('Auth middleware - user:', user?.id);
    console.log('Auth middleware - error:', error);
    
    if (error || !user) {
      console.log('Auth middleware - Invalid token or user not found');
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    console.log('Auth middleware - User authenticated:', user.id);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  const cacheStats = CacheManager.getInstance().getStats();
  res.json({ 
    status: 'OK',
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    cache: cacheStats
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: '한국어 학습 챗봇 API 서버',
    version: '1.0.0',
    status: 'running'
  });
});

// Supabase connection test endpoint
app.get('/api/supabase-test', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      return res.status(500).json({ 
        error: 'Supabase connection failed',
        details: error.message
      });
    }
    
    res.json({ 
      message: 'Supabase connection successful',
      data: data
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// AI Chat Response endpoint - 캐싱 통합 버전
app.post('/api/chat', async (req, res) => {
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

    const cacheManager = CacheManager.getInstance();
    const startTime = Date.now();

    // 캐시에서 응답 확인
    const cachedResponse = await cacheManager.get(message, conversationHistory);
    if (cachedResponse) {
      const responseTime = Date.now() - startTime;
      console.log('캐시 응답 사용:', { responseTime: `${responseTime}ms` });
      
      return res.json({ 
        response: cachedResponse,
        cached: true,
        responseTime: responseTime
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
        timeout: 30000, // 30초 타임아웃
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

// 스트리밍 응답 API 엔드포인트
app.post('/api/chat/stream', async (req, res) => {
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
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    try {
      // 스트리밍 OpenAI API 호출
      const stream = await openai.chat.completions.create({
        model: OPENAI_CONFIG.model,
        messages,
        max_tokens: OPENAI_CONFIG.max_tokens,
        temperature: OPENAI_CONFIG.temperature,
        top_p: OPENAI_CONFIG.top_p,
        frequency_penalty: OPENAI_CONFIG.frequency_penalty,
        presence_penalty: OPENAI_CONFIG.presence_penalty,
        stream: true, // 스트리밍 활성화
        timeout: 30000,
      });

      let fullResponse = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          // 클라이언트에 실시간으로 전송
          res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`);
        }
      }

      const responseTime = Date.now() - startTime;
      
      console.log('OpenAI 스트리밍 응답 완료:', {
        responseTime: `${responseTime}ms`,
        responseLength: fullResponse.length
      });

      // 스트리밍 완료 신호
      res.write(`data: ${JSON.stringify({ content: '', done: true, responseTime })}\n\n`);
      res.end();

    } catch (openaiError: any) {
      console.error('OpenAI 스트리밍 API Error:', {
        error: openaiError.message,
        code: openaiError.code,
        status: openaiError.status
      });
      
      // 에러 시 대체 응답 스트리밍
      const fallbackResponse = generateFallbackResponse(message);
      const words = fallbackResponse.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i] + (i < words.length - 1 ? ' ' : '');
        res.write(`data: ${JSON.stringify({ content: word, done: false })}\n\n`);
        await new Promise(resolve => setTimeout(resolve, 50)); // 자연스러운 타이핑 효과
      }
      
      res.write(`data: ${JSON.stringify({ content: '', done: true, error: openaiError.message })}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('Streaming Chat API Error:', error);
    res.write(`data: ${JSON.stringify({ content: '', done: true, error: '스트리밍 응답 중 오류가 발생했습니다.' })}\n\n`);
    res.end();
  }
});

// Get user conversations (with auth)
app.get('/api/conversations', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (*)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ conversations: data });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new conversation (with auth)
app.post('/api/conversations', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert([{ user_id: req.user.id }])
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ conversation: data });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add message to conversation (with auth)
app.post('/api/messages', authenticateUser, async (req, res) => {
  try {
    const { conversation_id, role, content } = req.body;
    
    if (!conversation_id || !role || !content) {
      return res.status(400).json({ 
        error: 'conversation_id, role, and content are required' 
      });
    }
    
    const { data, error } = await supabase
      .from('messages')
      .insert([{ 
        conversation_id, 
        user_id: req.user.id, 
        role, 
        content 
      }])
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ message: data });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get messages for a specific conversation (with auth)
app.get('/api/conversations/:conversationId/messages', authenticateUser, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ messages: data });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test conversation creation (without auth for debugging)
app.post('/api/test/conversations', async (req, res) => {
  try {
    console.log('Test conversation creation - no auth required');
    
    // 임시 사용자 ID 사용
    const tempUserId = '123e4567-e89b-12d3-a456-426614174000';
    
    const { data, error } = await supabase
      .from('conversations')
      .insert([{ user_id: tempUserId }])
      .select()
      .single();
    
    if (error) {
      console.error('Test conversation creation error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log('Test conversation created:', data);
    res.json({ conversation: data });
  } catch (error) {
    console.error('Test conversation creation error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test message creation (without auth for debugging)
app.post('/api/test/messages', async (req, res) => {
  try {
    const { conversation_id, role, content } = req.body;
    
    if (!conversation_id || !role || !content) {
      return res.status(400).json({ 
        error: 'conversation_id, role, and content are required' 
      });
    }
    
    // 임시 사용자 ID 사용
    const tempUserId = '123e4567-e89b-12d3-a456-426614174000';
    
    const { data, error } = await supabase
      .from('messages')
      .insert([{ 
        conversation_id, 
        user_id: tempUserId, 
        role, 
        content 
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Test message creation error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log('Test message created:', data);
    res.json({ message: data });
  } catch (error) {
    console.error('Test message creation error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 개선된 대체 응답 생성 함수
function generateFallbackResponse(userMessage: string): string {
  const responses = [
    `안녕하세요! 질문해주셔서 감사해요. "${userMessage}"에 대한 답변을 준비하고 있어요. 잠시만 기다려주세요! 😊`,
    
    `안녕하세요! "${userMessage}"에 대해 궁금하시군요. 현재 시스템 점검 중이라 정확한 답변을 드리기 어려워요. 잠시 후 다시 시도해보세요! 💪`,
    
    `안녕하세요! "${userMessage}"에 대한 질문이시군요. 지금은 일시적으로 응답이 지연되고 있어요. 잠시 후 다시 질문해주시면 더 자세히 답변드릴게요! 🌟`,
    
    `안녕하세요! "${userMessage}"에 대해 궁금하시군요. 현재 시스템이 혼잡해서 정확한 답변을 드리기 어려워요. 잠시 후 다시 시도해보세요! 📚`,
    
    `안녕하세요! "${userMessage}"에 대한 질문이시군요. 지금은 일시적으로 응답이 지연되고 있어요. 잠시 후 다시 질문해주시면 더 자세히 답변드릴게요! ✨`
  ];
  
  // 사용자 메시지의 길이에 따라 다른 응답 선택
  const index = userMessage.length % responses.length;
  return responses[index];
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Supabase test: http://localhost:${PORT}/api/supabase-test`);
  console.log(`🤖 AI Chat: http://localhost:${PORT}/api/chat`);
});
