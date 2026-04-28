import React, { useState } from 'react';
import useSWR from 'swr';
import { SiteConfig } from '@/src/shared/types';
import { Icon } from '@/src/shared/components/common/Icon';
import ErrorBoundary from '@/src/shared/components/common/ErrorBoundary';

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('API request failed');
    return res.json();
});

const RightWidgetsContent = ({ config }: { config: SiteConfig }) => {
    const ghConfig = config.rightSidebar.githubTrending || {
        title: 'Github 榜单',
        apiUrl: 'https://api.github.com/search/repositories',
        webUrl: 'https://github.com/trending'
    };
    const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    const getGithubUrl = () => {
        const date = new Date();
        let days = 1;

        if (timeRange === 'weekly') days = 7;
        if (timeRange === 'monthly') days = 30;

        date.setDate(date.getDate() - days);
        const dateStr = date.toISOString().split('T')[0];

        return `${ghConfig.apiUrl}?q=created:>${dateStr}&sort=stars&order=desc&per_page=5`;
    };

    const { data: githubData, error: ghError } = useSWR(getGithubUrl(), fetcher, {
        refreshInterval: 300000,
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    const ghLoading = !githubData && !ghError;
    const repos = githubData?.items || [];

    const formatStars = (count: number) => {
        if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
        return String(count);
    };

    const getTrendingUrl = () => {
        const map = { daily: 'daily', weekly: 'weekly', monthly: 'monthly' };
        return `${ghConfig.webUrl}?since=${map[timeRange]}`;
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
                    <div className="flex items-center gap-2">
                        <Icon icon="fa-brands fa-github" className="text-lg text-black" />
                        <span className="font-bold text-sm text-gray-700">{ghConfig.title}</span>
                    </div>
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                        {[
                            { id: 'daily', label: '日' },
                            { id: 'weekly', label: '周' },
                            { id: 'monthly', label: '月' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTimeRange(t.id as 'daily' | 'weekly' | 'monthly')}
                                className={`
                                    text-xs px-2 py-0.5 rounded-md transition-all
                                    ${timeRange === t.id ? 'bg-white text-[var(--theme-primary)] shadow-sm font-bold' : 'text-gray-400 hover:text-gray-600'}
                                `}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="min-h-[200px]">
                    {ghLoading ? (
                        <div className="flex justify-center items-center h-48 text-gray-300 flex-col gap-2">
                            <Icon icon="fa-solid fa-circle-notch" className="text-xl animate-spin" />
                            <span className="text-xs">加载中...</span>
                        </div>
                    ) : ghError ? (
                        <div className="flex justify-center items-center h-48 text-gray-400 flex-col gap-1">
                            <Icon icon="fa-solid fa-triangle-exclamation" className="text-lg text-yellow-400" />
                            <span className="text-xs">请求受限或失败</span>
                            <span className="text-[10px] opacity-60">API Rate Limited</span>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {repos.length > 0 ? repos.map((repo: any, index: number) => (
                                <a key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer" className="flex items-start justify-between group cursor-pointer">
                                    <div className="flex items-start gap-2.5 overflow-hidden">
                                        <span className={`
                                            text-[10px] font-bold px-1.5 py-0.5 rounded min-w-[18px] text-center mt-0.5 flex-shrink-0
                                            ${index === 0 ? 'bg-[#ff4d4f] text-white' :
                                                index === 1 ? 'bg-[#ff7a45] text-white' :
                                                    index === 2 ? 'bg-[#ffa940] text-white' : 'bg-gray-100 text-gray-500'}
                                        `}>{index + 1}</span>
                                        <div className="flex flex-col overflow-hidden min-w-0">
                                            <span className="text-xs text-gray-700 font-medium group-hover:text-[var(--theme-primary)] transition-colors truncate" title={repo.full_name}>
                                                {repo.name}
                                            </span>
                                            <span className="text-[10px] text-gray-400 truncate" title={repo.description}>{repo.description || '暂无描述'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5 flex-shrink-0">
                                        <Icon icon="fa-solid fa-star" className="text-[10px] text-orange-400" />
                                        <span>{formatStars(repo.stargazers_count)}</span>
                                    </div>
                                </a>
                            )) : (
                                <div className="text-center text-gray-400 text-xs py-10">暂无数据</div>
                            )}
                        </ul>
                    )}
                </div>

                <a href={getTrendingUrl()} target="_blank" rel="noreferrer" className="block text-center text-xs text-gray-400 mt-4 pt-3 border-t border-gray-50 hover:text-[var(--theme-primary)] transition-colors">
                    显示更多 <Icon icon="fa-solid fa-angle-right" className="ml-1" />
                </a>
            </div>
        </div>
    );
};

const RightWidgets = ({ config }: { config: SiteConfig }) => {
    return (
        <ErrorBoundary name="RightWidgets">
            <RightWidgetsContent config={config} />
        </ErrorBoundary>
    );
};

export default React.memo(RightWidgets, (prevProps, nextProps) => {
    return prevProps.config.rightSidebar === nextProps.config.rightSidebar;
});
