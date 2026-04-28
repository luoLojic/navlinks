import React from 'react';
import { Icon } from '@/src/shared/components/common/Icon';
import { ServerMonitorStats, VpsServer } from '../types';
import { formatBytes, formatSpeed } from '../utils/monitoring';

interface DashboardProps {
    stats: ServerMonitorStats | null;
    server?: VpsServer;
}

export default function Dashboard({ stats, server }: DashboardProps) {
    if (!stats) {
        return (
            <div className="bg-white p-4 border border-gray-200 rounded-xl flex items-center justify-center h-[164px]">
                <span className="text-gray-400 text-sm flex items-center gap-2">
                    <Icon icon="fa-solid fa-spinner" className="animate-spin" />
                    Waiting for data...
                </span>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 border border-gray-200 rounded-xl grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-h-[164px]">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0">
                    <Icon icon="fa-solid fa-microchip" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500 font-medium">CPU</span>
                        <span className="text-sm font-bold text-gray-800">{stats.cpu}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${stats.cpu > 80 ? 'bg-red-500' : 'bg-orange-500'}`}
                            style={{ width: `${stats.cpu}%` }}
                        ></div>
                    </div>
                    {server?.cpu_info && (
                        <div className="text-[10px] text-gray-400 mt-1 truncate" title={server.cpu_info}>
                            {server.cpu_info}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
                    <Icon icon="fa-solid fa-memory" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500 font-medium">Memory</span>
                        <span className="text-sm font-bold text-gray-800">{stats.mem.percent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${stats.mem.percent > 80 ? 'bg-red-500' : 'bg-purple-500'}`}
                            style={{ width: `${stats.mem.percent}%` }}
                        ></div>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                        {formatBytes(stats.mem.used * 1024)} / {formatBytes(stats.mem.total * 1024)}
                    </div>
                    {server?.mem_info && server.mem_info.includes('Swap') && (
                        <div className="text-[10px] text-gray-400 truncate" title={server.mem_info}>
                            Swap: {server.mem_info.split('Swap:')[1].trim().replace(')', '')}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                    <Icon icon="fa-solid fa-hard-drive" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500 font-medium">Disk</span>
                        <span className="text-sm font-bold text-gray-800">{stats.disk.percent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${stats.disk.percent > 90 ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${stats.disk.percent}%` }}
                        ></div>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                        {formatBytes(stats.disk.used)} / {formatBytes(stats.disk.total)}
                    </div>
                    {server?.disk_info && (
                        <div className="text-[10px] text-gray-400 truncate">
                            Total: {server.disk_info}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Icon icon="fa-solid fa-network-wired" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Icon icon="fa-solid fa-arrow-down" className="text-green-500" />
                            <span>Down</span>
                        </div>
                        <span className="text-xs font-mono font-medium">{formatSpeed(stats.net.down)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Icon icon="fa-solid fa-arrow-up" className="text-blue-500" />
                            <span>Up</span>
                        </div>
                        <span className="text-xs font-mono font-medium">{formatSpeed(stats.net.up)}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 pt-1 truncate">
                        累计流量 {formatBytes(stats.traffic.total)}
                    </div>
                </div>
            </div>
        </div>
    );
}
