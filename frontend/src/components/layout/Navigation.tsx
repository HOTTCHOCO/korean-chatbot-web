import React from 'react';
import { useAuthStore } from '../../store/authStore';
import Logo from '../ui/Logo';

const Navigation: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const currentPath = window.location.pathname;

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <nav className="bg-white border-b border-neutral-200 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => handleNavigation('/')}>
            <Logo size="md" />
          </div>

          {/* 네비게이션 메뉴 */}
          {user ? (
            <div className="flex items-center space-x-8">
              <button
                onClick={() => handleNavigation('/chat')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  currentPath === '/chat'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-neutral-600 hover:text-primary-600 hover:bg-primary-50'
                }`}
              >
                채팅
              </button>
              
              <button
                onClick={() => handleNavigation('/history')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  currentPath === '/history'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-neutral-600 hover:text-primary-600 hover:bg-primary-50'
                }`}
              >
                대화 기록
              </button>
              
              <button
                onClick={() => handleNavigation('/profile')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  currentPath === '/profile'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-neutral-600 hover:text-primary-600 hover:bg-primary-50'
                }`}
              >
                프로필
              </button>

              {/* 사용자 메뉴 */}
              <div className="relative group">
                <button className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-200">
                  <div className="w-6 h-6 bg-primary-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-700">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>{user.email}</span>
                </button>
                
                {/* 드롭다운 메뉴 */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-medium border border-neutral-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200"
                    >
                      로그아웃
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleNavigation('/auth/login')}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-primary-600 transition-colors duration-200"
              >
                로그인
              </button>
              
              <button
                onClick={() => handleNavigation('/auth/signup')}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200 shadow-soft"
              >
                회원가입
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
