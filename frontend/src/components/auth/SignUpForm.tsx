import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const { signUp, loading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      // 에러 처리는 store에서 하므로 여기서는 기본 validation만
      return;
    }
    
    await signUp(email, password, nickname);
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <div className="bg-white shadow-medium rounded-xl px-8 pt-6 pb-8 mb-4 border border-neutral-200">
        <h2 className="text-2xl font-bold text-center mb-6 text-primary-800">
          회원가입
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-neutral-700 mb-1">
              닉네임
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
              placeholder="닉네임 (선택사항)"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-1">
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
              placeholder="••••••••"
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-red-600 text-xs mt-1">비밀번호가 일치하지 않습니다.</p>
            )}
          </div>
          
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading || password !== confirmPassword}
            className="w-full bg-accent-500 text-white py-2 px-4 rounded-lg hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-soft"
          >
            {loading ? '회원가입 중...' : '회원가입'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            이미 계정이 있으신가요?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-primary-600 hover:text-primary-800 font-medium transition-colors duration-200"
            >
              로그인
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
