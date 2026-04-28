import React, { useEffect, useMemo, useState } from 'react';
import io from 'socket.io-client';
import { Icon } from '@/src/shared/components/common/Icon';
import { ServerMonitorStats, VpsGroup, VpsServer } from '../types';
import { formatBytes, formatSpeed } from '../utils/monitoring';

interface MonitorBoardProps {
    servers: VpsServer[];
    groups: VpsGroup[];
    onConnect: (serverId: string) => void;
    onAddServer: () => void;
}

type MonitorState = 'connecting' | 'online' | 'offline' | 'error';

interface MonitorMetricCardProps {
    icon: string;
    label: string;
    value: string;
    subValue: string;
    tone: string;
    progress?: number;
    progressClass?: string;
}

const MonitorMetricCard = ({ icon, label, value, subValue, tone, progress, progressClass = 'bg-gray-400' }: MonitorMetricCardProps) => {
    const progressWidth = Math.max(0, Math.min(100, progress ?? 0));

    return (
        <div className="rounded-2xl border border-gray-100 bg-gray-50/90 p-4 min-w-0">
            <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-medium ${tone}`}>
                <Icon icon={icon} />
                <span>{label}</span>
            </div>
            <div className="mt-3 text-lg font-bold text-gray-900 truncate">{value}</div>
            <div className="mt-1 text-xs text-gray-500 truncate" title={subValue}>{subValue}</div>
            {progress !== undefined && (
                <div className="mt-3 h-1.5 rounded-full bg-white overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${progressClass}`} style={{ width: `${progressWidth}%` }}></div>
                </div>
            )}
        </div>
    );
};

const MonitorRow = ({
    server,
    groupName,
    onConnect
}: {
    server: VpsServer;
    groupName?: string;
    onConnect: (serverId: string) => void;
}) => {
    const [stats, setStats] = useState<ServerMonitorStats | null>(null);
    const [state, setState] = useState<MonitorState>('connecting');
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const socket = io({
            path: '/socket.io',
            transports: ['websocket']
        });

        socket.on('connect', () => {
            if (!isMounted) return;
            setState('connecting');
            setError('');
            socket.emit('ssh:connect', {
                serverId: server.id,
                openShell: false
            });
        });

        socket.on('ssh:ready', () => {
            if (!isMounted) return;
            setState('online');
            socket.emit('monitor:start');
        });

        socket.on('monitor:data', (data: ServerMonitorStats) => {
            if (!isMounted) return;
            setStats(data);
            setState('online');
            setError('');
        });

        socket.on('ssh:error', (message: string) => {
            if (!isMounted) return;
            setError(message);
            setState('error');
        });

        socket.on('ssh:close', () => {
            if (!isMounted) return;
            setState('offline');
        });

        socket.on('disconnect', () => {
            if (!isMounted) return;
            setState((current) => current === 'error' ? current : 'offline');
        });

        return () => {
            isMounted = false;
            socket.emit('monitor:stop');
            socket.disconnect();
        };
    }, [server.id]);

    const stateMeta = {
        connecting: {
            label: '连接中',
            dot: 'bg-yellow-400',
            badge: 'bg-yellow-50 text-yellow-700 border-yellow-200'
        },
        online: {
            label: '监控中',
            dot: 'bg-emerald-500',
            badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        },
        offline: {
            label: '已断开',
            dot: 'bg-gray-400',
            badge: 'bg-gray-100 text-gray-600 border-gray-200'
        },
        error: {
            label: '异常',
            dot: 'bg-red-500',
            badge: 'bg-red-50 text-red-700 border-red-200'
        }
    }[state];

    const lastUpdated = stats?.updatedAt ? new Date(stats.updatedAt).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }) : '';

    const metrics = [
        {
            icon: 'fa-solid fa-microchip',
            label: 'CPU',
            value: stats ? `${stats.cpu}%` : '--',
            subValue: server.cpu_info || '等待实时数据',
            tone: 'bg-orange-50 text-orange-700',
            progress: stats?.cpu,
            progressClass: 'bg-orange-500'
        },
        {
            icon: 'fa-solid fa-memory',
            label: '内存',
            value: stats ? `${stats.mem.percent}%` : '--',
            subValue: stats ? `${formatBytes(stats.mem.used * 1024)} / ${formatBytes(stats.mem.total * 1024)}` : (server.mem_info || '等待实时数据'),
            tone: 'bg-fuchsia-50 text-fuchsia-700',
            progress: stats?.mem.percent,
            progressClass: 'bg-fuchsia-500'
        },
        {
            icon: 'fa-solid fa-hard-drive',
            label: '硬盘',
            value: stats ? `${stats.disk.percent}%` : '--',
            subValue: stats ? `${formatBytes(stats.disk.used)} / ${formatBytes(stats.disk.total)}` : (server.disk_info || '等待实时数据'),
            tone: 'bg-emerald-50 text-emerald-700',
            progress: stats?.disk.percent,
            progressClass: 'bg-emerald-500'
        },
        {
            icon: 'fa-solid fa-chart-pie',
            label: '累计流量',
            value: stats ? formatBytes(stats.traffic.total) : '--',
            subValue: stats ? `↓ ${formatBytes(stats.traffic.down)} / ↑ ${formatBytes(stats.traffic.up)}` : '等待实时数据',
            tone: 'bg-sky-50 text-sky-700'
        },
        {
            icon: 'fa-solid fa-arrow-down',
            label: '下载速度',
            value: stats ? formatSpeed(stats.net.down) : '--',
            subValue: '实时入站吞吐',
            tone: 'bg-teal-50 text-teal-700'
        },
        {
            icon: 'fa-solid fa-arrow-up',
            label: '上传速度',
            value: stats ? formatSpeed(stats.net.up) : '--',
            subValue: '实时出站吞吐',
            tone: 'bg-blue-50 text-blue-700'
        }
    ];

    return (
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 xl:p-5">
                <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[240px_minmax(0,1fr)_140px] xl:items-center">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className={`w-2.5 h-2.5 rounded-full ${stateMeta.dot}`}></div>
                            <h3 className="text-lg font-bold text-gray-900 truncate">{server.name}</h3>
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${stateMeta.badge}`}>
                                <span>{stateMeta.label}</span>
                            </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600 font-mono truncate">
                            {server.username}@{server.host}:{server.port}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                            {groupName && (
                                <span className="rounded-full bg-gray-100 px-2.5 py-1">
                                    {groupName}
                                </span>
                            )}
                            {server.os_info && (
                                <span className="rounded-full bg-gray-100 px-2.5 py-1 truncate max-w-full">
                                    {server.os_info}
                                </span>
                            )}
                            {lastUpdated && (
                                <span className="rounded-full bg-gray-100 px-2.5 py-1">
                                    更新于 {lastUpdated}
                                </span>
                            )}
                        </div>
                        {error && (
                            <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        {metrics.map((metric) => (
                            <MonitorMetricCard
                                key={metric.label}
                                icon={metric.icon}
                                label={metric.label}
                                value={metric.value}
                                subValue={metric.subValue}
                                tone={metric.tone}
                                progress={metric.progress}
                                progressClass={metric.progressClass}
                            />
                        ))}
                    </div>

                    <div className="flex xl:justify-end">
                        <button
                            onClick={() => onConnect(server.id)}
                            className="w-full xl:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--theme-primary)] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
                        >
                            <Icon icon="fa-solid fa-terminal" />
                            进入 SSH
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function MonitorBoard({ servers, groups, onConnect, onAddServer }: MonitorBoardProps) {
    const [activeTab, setActiveTab] = useState('All');

    const groupMap = useMemo(() => {
        return groups.reduce<Record<string, string>>((acc, group) => {
            acc[group.id] = group.name;
            return acc;
        }, {});
    }, [groups]);

    const filteredServers = useMemo(() => {
        if (activeTab === 'All') return servers;
        const targetGroup = groups.find((group) => group.name === activeTab);
        return targetGroup ? servers.filter((server) => server.group_id === targetGroup.id) : [];
    }, [activeTab, groups, servers]);

    if (servers.length === 0) {
        return (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white/80 p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                    <Icon icon="fa-solid fa-server" className="text-2xl" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">暂无监控服务器</h2>
                <p className="mt-2 text-sm text-gray-500">先添加服务器，监控板块会自动为每台机器建立独立实时监控连接。</p>
                <button
                    onClick={onAddServer}
                    className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[var(--theme-primary)] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
                >
                    <Icon icon="fa-solid fa-plus" />
                    添加服务器
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">实时监控</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        每台服务器以一条横向监控条展示 CPU、内存、硬盘、累计流量以及实时上传下载速度。
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs text-gray-500 border border-gray-200">
                        <Icon icon="fa-solid fa-rotate" />
                        2 秒刷新
                    </span>
                    <button
                        onClick={onAddServer}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        <Icon icon="fa-solid fa-plus" />
                        添加服务器
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                    onClick={() => setActiveTab('All')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'All' ? 'bg-[var(--theme-primary)] text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                >
                    全部 ({servers.length})
                </button>
                {groups.map((group) => {
                    const count = servers.filter((server) => server.group_id === group.id).length;
                    if (count === 0) return null;

                    return (
                        <button
                            key={group.id}
                            onClick={() => setActiveTab(group.name)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${activeTab === group.name ? 'bg-[var(--theme-primary)] text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                        >
                            {group.name} ({count})
                        </button>
                    );
                })}
            </div>

            <div className="space-y-4">
                {filteredServers.map((server) => (
                    <MonitorRow
                        key={server.id}
                        server={server}
                        groupName={server.group_id ? groupMap[server.group_id] : undefined}
                        onConnect={onConnect}
                    />
                ))}
            </div>
        </div>
    );
}
