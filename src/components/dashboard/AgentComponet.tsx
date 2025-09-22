import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReactConfetti from 'react-confetti';
import { Trophy, Award, Medal } from 'lucide-react';
import { getUsersStatus } from '@/queries/queries';
import { useQuery } from '@tanstack/react-query';


interface LeaderboardUser {
  id: string;
  name: string;
  role: string;
  conversion: number;
  totalScore: number;
  leads?: Array<{ status: string }>;
}

interface AgentLeaderboardProps {
  data: LeaderboardUser[];
}

const useWindowSize = () => {
  const [size, setSize] = useState([0, 0]);
  useEffect(() => {
    const updateSize = () => {
      setSize([window.innerWidth, window.innerHeight]);
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
};


const AgentLeaderboard: React.FC<AgentLeaderboardProps> = () => {
 const { data: userData = [], isLoading: UserDataLOading, error: userDataError } = useQuery<[]>({
    queryKey: ['userStats'],
    queryFn: () => getUsersStatus(),

  });
  
  const { t } = useTranslation(['dashboard', 'common']);
  const [width, height] = useWindowSize();


  const drawStar = (ctx: CanvasRenderingContext2D) => {
    const numPoints = 5;
    const outerRadius = 10;
    const innerRadius = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0 - outerRadius);

    for (let n = 1; n < numPoints * 2; n++) {
      const radius = n % 2 === 0 ? outerRadius : innerRadius;
      const angle = (n * Math.PI) / numPoints;
      const x = radius * Math.sin(angle);
      const y = -radius * Math.cos(angle);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  };
  // --- END: CUSTOM DRAW FUNCTION ---

  if (!userData || userData.length === 0) {
    return null;
  }

  // ... (getRankIndicator, getRankClasses, getScoreClasses, getRoleBadge functions remain the same)

  const getRankIndicator = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-6 w-6 text-amber-400" />;
      case 2: return <Award className="h-6 w-6 text-slate-400" />;
      case 3: return <Medal className="h-6 w-6 text-orange-500" />;
      default: return <span className="text-base font-semibold text-gray-500">#{rank}</span>;
    }
  };

  const getRankClasses = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-amber-50 border-amber-300 shadow-lg animate-glow';
      case 2: return 'bg-slate-100 border-slate-300';
      case 3: return 'bg-orange-100 border-orange-300';
      default: return 'bg-white border-gray-200';
    }
  };

  const getScoreClasses = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-amber-100 text-amber-800';
      case 2: return 'bg-slate-200 text-slate-800';
      case 3: return 'bg-orange-200 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getRoleBadge = (role: string) => {
    let text = role;
    let className = 'bg-gray-100 text-gray-800';
    switch (role) {
      case 'sales_rep': text = t('common:roles.salesRep', 'Sales Rep'); className = 'bg-green-100 text-green-800'; break;
      case 'team_leader': text = t('common:roles.teamLeader', 'Team Leader'); className = 'bg-blue-100 text-blue-800'; break;
      case 'sales_admin': text = t('common:roles.salesAdmin', 'Sales Admin'); className = 'bg-purple-100 text-purple-800'; break;
      case 'admin': text = t('common:roles.admin', 'Admin'); className = 'bg-red-100 text-red-800'; break;
    }
    return { text, className };
  };

  return (
    <div className="relative bg-white/70 backdrop-blur-md border border-white/60 p-4 sm:p-6 rounded-xl shadow-lg">
      
      <ReactConfetti
        width={width}
        height={height}
        recycle={false} 
        numberOfPieces={400} 
        gravity={0.2}
        initialVelocityY={20} 
        spread={360}
        drawShape={drawStar} 
      />
   

      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{t('leaderboard.title', 'Agent Leaderboard')}</h3>
      <div className="space-y-3">
        {userData.slice(0, 5).map((user, index) => {
          const rank = index + 1;
          const closedDeals = user.leads?.filter((lead) => lead.status === 'closed_deal').length ?? 0;
          const roleBadge = getRoleBadge(user.role);

          return (
            <div
              key={user.id}
              className={`flex items-center p-3 rounded-lg border-2 transition-all ${getRankClasses(rank)}`}
            >
              <div className="w-10 flex-shrink-0 flex items-center justify-center">
                {getRankIndicator(rank)}
              </div>
              <div className="ml-2 h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm">
                {user.name?.split(' ').map((n) => n[0]).join('').toUpperCase()}
              </div>
              <div className="ml-4 flex-grow">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="text-sm font-bold text-gray-900">{user.name}</div>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${roleBadge.className}`}>
                    {roleBadge.text}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  <span>{closedDeals} {t('leaderboard.deals', 'deals')}</span>
                  <span className="mx-1.5 text-gray-300">|</span>
                  <span>{user.conversion}% {t('leaderboard.conversion', 'conversion')}</span>
                </div>
              </div>
              <div className={`ml-4 px-3 py-1 rounded-full text-sm font-semibold flex-shrink-0 ${getScoreClasses(rank)}`}>
                <span className="font-medium">{t('leaderboard.score', 'Score')}: </span>
                <span className="font-bold">{Math.round(user.totalScore)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentLeaderboard;