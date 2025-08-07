import { useState, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import ChatPage from './components/chat/ChatPage';
import HistoryPage from './components/history/HistoryPage';
import ProfilePage from './components/profile/ProfilePage';
import Navigation from './components/layout/Navigation';
import AuthPage from './components/auth/AuthPage';
import './App.css';

function App() {
  const { user, session, loading, initializeAuth } = useAuthStore();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // 인증 상태 초기화
  useEffect(() => {
    console.log('App: initializeAuth called');
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const handlePathChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePathChange);
    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  console.log('App state:', { user, session, loading, currentPath });

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // 인증 페이지
    if (currentPath.startsWith('/auth')) {
      return <AuthPage />;
    }

    // 인증되지 않은 사용자는 로그인 페이지로
    if (!user || !session) {
      return <AuthPage />;
    }

    // 인증된 사용자의 페이지 라우팅
    switch (currentPath) {
      case '/':
      case '/chat':
        return <ChatPage />;
      case '/history':
        return <HistoryPage />;
      case '/profile':
        return <ProfilePage />;
      default:
        return <ChatPage />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* 네비게이션은 인증된 사용자에게만 표시 */}
      {user && session && !currentPath.startsWith('/auth') && (
        <Navigation />
      )}
      
      <main className="flex-1">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
