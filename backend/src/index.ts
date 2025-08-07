import express from 'express';
import cors from 'cors';
import { supabase } from './config/supabase';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running' });
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

// Get user conversations
app.get('/api/conversations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        messages (*)
      `)
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

// Create new conversation
app.post('/api/conversations', async (req, res) => {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    
    const { data, error } = await supabase
      .from('conversations')
      .insert([{ user_id }])
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

// Add message to conversation
app.post('/api/messages', async (req, res) => {
  try {
    const { conversation_id, user_id, role, content } = req.body;
    
    if (!conversation_id || !user_id || !role || !content) {
      return res.status(400).json({ 
        error: 'conversation_id, user_id, role, and content are required' 
      });
    }
    
    const { data, error } = await supabase
      .from('messages')
      .insert([{ conversation_id, user_id, role, content }])
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Supabase test: http://localhost:${PORT}/api/supabase-test`);
});
