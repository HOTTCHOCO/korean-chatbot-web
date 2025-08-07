import { useState, useEffect } from 'react';
import ChatPage from './components/chat/ChatPage';
import HistoryPage from './components/history/HistoryPage';
import ProfilePage from './components/profile/ProfilePage';
import Navigation from './components/layout/Navigation';
import AuthPage from './components/auth/AuthPage';
import { useAuthStore } from './store/authStore';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const { user, loading } = useAuthStore();

  useEffect(() => {
    // 인증 상태 초기화
    initializeAuth();
    
    // 경로 변경 감지
    const handlePathChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePathChange);
    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  // 인증 초기화 함수
  const initializeAuth = async () => {
    try {
      await useAuthStore.getState().initializeAuth();
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  };

  // 경로 변경 함수
  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-700 font-medium">UNNI chat을 준비하고 있어요...</p>
        </div>
      </div>
    );
  }

  // 라우팅 로직
  const renderContent = () => {
    switch (currentPath) {
      case '/auth':
        return <AuthPage />;
      case '/history':
        return user ? <HistoryPage /> : <ChatPage />;
      case '/profile':
        return user ? <ProfilePage /> : <ChatPage />;
      case '/':
      default:
        return <ChatPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <Navigation 
        currentPath={currentPath} 
        onNavigate={navigateTo}
        user={user}
      />
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
