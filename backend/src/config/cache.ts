// 메모리 캐시 시스템 (Redis 없이도 작동)
const memoryCache = new Map<string, { response: string; timestamp: number; ttl: number }>();

const CACHE_TTL = 3600000; // 1시간 (밀리초)
const MAX_CACHE_SIZE = 1000; // 최대 캐시 항목 수

interface CacheItem {
  response: string;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheItem>;

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private generateKey(message: string, conversationHistory: any[]): string {
    const cleanMessage = message.toLowerCase().trim();
    const historyContext = conversationHistory
      .slice(-3)
      .map(msg => msg.content.toLowerCase().trim())
      .join('|');
    
    return `${cleanMessage}|${historyContext}`;
  }

  async get(message: string, conversationHistory: any[] = []): Promise<string | null> {
    const key = this.generateKey(message, conversationHistory);
    
    try {
      const item = this.cache.get(key);
      if (item && Date.now() - item.timestamp < item.ttl) {
        console.log('메모리 캐시 히트:', key);
        return item.response;
      } else if (item) {
        this.cache.delete(key);
      }
    } catch (error) {
      console.error('캐시 조회 오류:', error);
    }
    
    return null;
  }

  async set(message: string, response: string, conversationHistory: any[] = [], ttl: number = CACHE_TTL): Promise<void> {
    const key = this.generateKey(message, conversationHistory);
    const item: CacheItem = {
      response,
      timestamp: Date.now(),
      ttl
    };

    try {
      if (this.cache.size >= MAX_CACHE_SIZE) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey) {
          this.cache.delete(oldestKey);
        }
      }
      
      this.cache.set(key, item);
      console.log('메모리 캐시 저장:', key);
    } catch (error) {
      console.error('캐시 저장 오류:', error);
    }
  }

  getStats(): { size: number; type: string } {
    return {
      size: this.cache.size,
      type: 'Memory'
    };
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

const commonQuestions = [
  {
    question: "안녕하세요",
    response: "안녕하세요! 한국어 학습을 도와드릴게요. 궁금한 점이 있으시면 언제든 물어보세요! 😊"
  },
  {
    question: "감사합니다",
    response: "천만에요! 도움이 되어서 기뻐요. 더 궁금한 점이 있으시면 언제든 말씀해주세요! 🌟"
  },
  {
    question: "한국어 어렵다",
    response: "한국어가 어려우시군요! 하지만 걱정하지 마세요. 차근차근 배우시면 분명히 실력이 늘 거예요. 꾸준히 연습하시고, 궁금한 점이 있으시면 언제든 물어보세요! 💪"
  },
  {
    question: "문법",
    response: "한국어 문법에 대해 궁금하시군요! 한국어 문법의 핵심을 알려드릴게요:\n\n📝 기본 문장 구조: 주어 + 목적어 + 동사\n📝 존댓말: 문장 끝에 '~요', '~습니다' 사용\n📝 조사: '은/는', '이/가', '을/를' 등\n\n구체적인 문법 질문이 있으시면 언제든 물어보세요! 😊"
  }
];

export async function initializeCache(): Promise<void> {
  const cacheManager = CacheManager.getInstance();
  
  for (const item of commonQuestions) {
    await cacheManager.set(item.question, item.response, [], 86400000); // 24시간
  }
  
  console.log('캐시 초기화 완료');
}
