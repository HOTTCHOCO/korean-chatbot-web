import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

interface UserStats {
  totalConversations: number;
  totalMessages: number;
  learningDays: number;
  lastActive: string;
}

const ProfilePage: React.FC = () => {
  const { user, session, signOut } = useAuthStore();
  const [stats, setStats] = useState<UserStats>({
    totalConversations: 0,
    totalMessages: 0,
    learningDays: 0,
    lastActive: ''
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(user?.user_metadata?.nickname || '');

  useEffect(() => {
    if (session) {
      loadUserStats();
    }
  }, [session]);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      
      // 대화 수 통계
      const { count: conversationsCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // 메시지 수 통계
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // 학습 일수 계산 (최근 30일)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('created_at')
        .eq('user_id', user?.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const uniqueDays = new Set(
        recentMessages?.map(msg => new Date(msg.created_at).toDateString()) || []
      );

      setStats({
        totalConversations: conversationsCount || 0,
        totalMessages: messagesCount || 0,
        learningDays: uniqueDays.size,
        lastActive: user?.last_sign_in_at || ''
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { nickname: nickname }
      });

      if (error) throw error;
      
      setIsEditing(false);
      // 사용자 정보 새로고침
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('프로필 업데이트에 실패했습니다.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">프로필</h1>
          <p className="text-gray-600">학습 정보와 계정 설정을 관리하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 사용자 정보 카드 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-1 text-center w-full"
                      placeholder="닉네임을 입력하세요"
                    />
                  ) : (
                    nickname || '닉네임 없음'
                  )}
                </h2>
                <p className="text-gray-500 text-sm">{user?.email}</p>
              </div>

              <div className="space-y-4">
                {isEditing ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUpdateProfile}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setNickname(user?.user_metadata?.nickname || '');
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    닉네임 수정
                  </button>
                )}

                <button
                  onClick={handleSignOut}
                  className="w-full bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>

          {/* 학습 통계 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">학습 통계</h3>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalConversations}</div>
                  <div className="text-sm text-gray-600">총 대화</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.totalMessages}</div>
                  <div className="text-sm text-gray-600">총 메시지</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.learningDays}</div>
                  <div className="text-sm text-gray-600">학습 일수</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round((stats.learningDays / 30) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">참여도</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">마지막 활동</span>
                  <span className="text-gray-900">{formatDate(stats.lastActive)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">가입일</span>
                  <span className="text-gray-900">{formatDate(user?.created_at || '')}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600">계정 상태</span>
                  <span className="text-green-600 font-medium">활성</span>
                </div>
              </div>
            </div>

            {/* 설정 섹션 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">설정</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">이메일 알림</h4>
                    <p className="text-sm text-gray-500">학습 진행 상황 알림</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">다크 모드</h4>
                    <p className="text-sm text-gray-500">어두운 테마 사용</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button className="text-red-600 hover:text-red-700 text-sm">
                    계정 삭제
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
