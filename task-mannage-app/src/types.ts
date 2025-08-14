// src/types.ts
export type Priority = "low" | "medium" | "high";

export type Task = {
    id: string;
    text: string;
    done: boolean;
    collapsed?: boolean;
    children: Task[];
    priority?: Priority;
    due?: string;   // ISO-8601 日付文字列（例: "2025-08-14"）
    note?: string;
};
