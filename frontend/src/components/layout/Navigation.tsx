import React from 'react';
import Logo from '../ui/Logo';
import { useAuthStore } from '../../store/authStore';

interface NavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  user: any;
}

const Navigation: React.FC<NavigationProps> = ({ currentPath, onNavigate, user }) => {
  const { signOut } = useAuthStore();

  const handleSignOut = async () => {
    try {
      await signOut();
      onNavigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        console.error('Google sign in error:', error);
      }
    } catch (error) {
      console.error('Google sign in error:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-primary-100">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <div 
            className="cursor-pointer"
            onClick={() => onNavigate('/')}
          >
            <Logo size="md" />
          </div>

          {/* 네비게이션 메뉴 */}
          <div className="flex items-center space-x-6">
            {/* 채팅 */}
            <button
              onClick={() => onNavigate('/')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPath === '/' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-primary-600 hover:bg-primary-50'
              }`}
            >
              채팅
            </button>

            {/* 대화 기록 (로그인한 사용자만) */}
            {user && (
              <button
                onClick={() => onNavigate('/history')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPath === '/history' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-primary-600 hover:bg-primary-50'
                }`}
              >
                대화 기록
              </button>
            )}

            {/* 프로필 (로그인한 사용자만) */}
            {user && (
              <button
                onClick={() => onNavigate('/profile')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPath === '/profile' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-primary-600 hover:bg-primary-50'
                }`}
              >
                프로필
              </button>
            )}

            {/* 인증 버튼 */}
            <div className="flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-primary-600">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 bg-secondary-100 text-secondary-700 rounded-lg font-medium hover:bg-secondary-200 transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Google 로그인</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
