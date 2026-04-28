export interface VpsGroup {
    id: string;
    name: string;
    description?: string;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
}

export interface VpsServer {
    id: string;
    group_id?: string;
    name: string;
    description?: string;

    // Connection Info
    host: string;
    port: number;
    username: string;
    auth_type: 'password' | 'key';

    // Secrets (only used for form input, not returned by API usually)
    password?: string;
    private_key?: string;

    // Status flags (returned by API)
    has_password?: boolean;
    has_private_key?: boolean;

    // Status
    status: 'online' | 'offline' | 'unknown' | 'error';
    last_check_time?: string;
    latency?: number;

    // System Info Cache
    os_info?: string;
    cpu_info?: string;
    mem_info?: string;
    disk_info?: string;

    created_at?: string;
    updated_at?: string;
}

export interface ServerMonitorStats {
    cpu: number;
    mem: {
        total: number;
        used: number;
        percent: number;
    };
    disk: {
        total: number;
        used: number;
        available: number;
        percent: number;
    };
    traffic: {
        down: number;
        up: number;
        total: number;
    };
    net: {
        up: number;
        down: number;
    };
    updatedAt: number;
}

export interface VpsSnippet {
    id: string;
    category: string;
    title: string;
    command: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
}
