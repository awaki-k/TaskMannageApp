// src/components/TaskTree.tsx
import { useMemo, useState } from "react";
import type { Task } from "../types";

type Props = {
    tasks: Task[];
    filter: "all" | "active" | "done";
    onToggleDone: (id: string) => void;
    onRemove: (id: string) => void;
    onToggleCollapse: (id: string) => void;
    onDropAsChild: (parentId: string, draggedId: string) => void;
    onDropToRoot: (draggedId: string) => void;
};

export default function TaskTree({
                                     tasks,
                                     filter,
                                     onToggleDone,
                                     onRemove,
                                     onToggleCollapse,
                                     onDropAsChild,
                                     onDropToRoot,
                                 }: Props) {
    const filtered = useMemo(() => {
        if (filter === "active") return filterTasks(tasks, (t) => !t.done);
        if (filter === "done") return filterTasks(tasks, (t) => t.done);
        return tasks;
    }, [tasks, filter]);

    return (
        <section className="panel">
            <div className="panel-head">
                <h2>構造的タスク表示</h2>
                <p className="muted">ドラッグ&ドロップで親子関係を変更／ルートに落とすと最上位へ</p>
            </div>

            <div className="root-drop glass" onDragOver={prevent} onDrop={(e) => handleRootDrop(e, onDropToRoot)}>
                ここにドロップで最上位に移動
            </div>

            <ul className="tree-level">
                {filtered.map((t) => (
                    <Node
                        key={t.id}
                        task={t}
                        depth={0}
                        onToggleDone={onToggleDone}
                        onRemove={onRemove}
                        onToggleCollapse={onToggleCollapse}
                        onDropAsChild={onDropAsChild}
                    />
                ))}
            </ul>
        </section>
    );
}

function Node({
                  task,
                  depth,
                  onToggleDone,
                  onRemove,
                  onToggleCollapse,
                  onDropAsChild,
              }: {
    task: Task;
    depth: number;
    onToggleDone: (id: string) => void;
    onRemove: (id: string) => void;
    onToggleCollapse: (id: string) => void;
    onDropAsChild: (parentId: string, draggedId: string) => void;
}) {
    const [over, setOver] = useState(false);

    const onDragStart: React.DragEventHandler<HTMLDivElement> = (e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
    };

    const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
        e.preventDefault();
        setOver(true);
    };

    const onDragLeave: React.DragEventHandler<HTMLDivElement> = () => {
        setOver(false);
    };

    const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
        e.preventDefault();
        setOver(false);
        const draggedId = e.dataTransfer.getData("text/plain");
        if (!draggedId || draggedId === task.id) return;
        onDropAsChild(task.id, draggedId);
    };

    return (
        <li className="tree-item">
            <div
                className={`card neon ${over ? "drop-over" : ""}`}
                style={{ marginLeft: depth * 16 }}
                draggable
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                aria-label={`タスク: ${task.text}`}
            >
                <div className="card-left">
                    <button
                        className="icon-btn"
                        aria-label={task.collapsed ? "展開" : "折りたたみ"}
                        onClick={() => onToggleCollapse(task.id)}
                        title={task.collapsed ? "展開" : "折りたたみ"}
                    >
                        {task.children.length > 0 ? (task.collapsed ? "▸" : "▾") : "·"}
                    </button>

                    <label className="task-label">
                        <input type="checkbox" checked={task.done} onChange={() => onToggleDone(task.id)} />
                        <span className={`task-text ${task.done ? "done" : ""}`}>{task.text}</span>
                    </label>
                </div>

                <div className="card-meta">
                    {task.priority && <span className={`pill ${task.priority}`}>{prioLabel(task.priority)}</span>}
                    {task.due && <span className="pill due">期限 {fmtDate(task.due)}</span>}
                </div>

                <div className="card-actions">
                    <button className="icon-btn danger" onClick={() => onRemove(task.id)} aria-label="削除">✕</button>
                </div>
            </div>

            {!task.collapsed && task.children.length > 0 && (
                <ul className="tree-level">
                    {task.children.map((c) => (
                        <Node
                            key={c.id}
                            task={c}
                            depth={depth + 1}
                            onToggleDone={onToggleDone}
                            onRemove={onRemove}
                            onToggleCollapse={onToggleCollapse}
                            onDropAsChild={onDropAsChild}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

/* helpers */
function prevent(e: React.DragEvent) { e.preventDefault(); }
function handleRootDrop(e: React.DragEvent, onDropToRoot: (id: string) => void) {
    e.preventDefault();
    const draggedId = (e.dataTransfer && e.dataTransfer.getData("text/plain")) || "";
    if (draggedId) onDropToRoot(draggedId);
}
function prioLabel(p: NonNullable<Task["priority"]>) {
    return p === "low" ? "低" : p === "medium" ? "中" : "高";
}
function fmtDate(iso: string) {
    try {
        const d = new Date(iso + "T00:00:00");
        return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
    } catch { return iso; }
}
function filterTasks(tasks: Task[], pred: (t: Task) => boolean): Task[] {
    const visit = (arr: Task[]): Task[] =>
        arr
            .map((t) => ({ ...t, children: visit(t.children) }))
            .filter(predOrHasDescendant);
    const predOrHasDescendant = (t: Task): boolean =>
        pred(t) || t.children.some(predOrHasDescendant);
    return visit(tasks);
}
