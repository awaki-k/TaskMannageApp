import { useMemo, useState } from "react";
import InputPanel from "./components/InputPanel";
import TaskTree from "./components/TaskTree";
import SortTags, { SortKey, SortOrder } from "./components/SortTags";
import type { Task, Priority } from "./types";
import "./App.css";

type Filter = "all" | "active" | "done";
type Mode = "input" | "structure";

const priorityOrder: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

export default function App() {
    const [tasks, setTasks] = useState<Task[]>(seed());
    const [filter, setFilter] = useState<Filter>("all");
    const [mode, setMode] = useState<Mode>("input");
    const [sortKey, setSortKey] = useState<SortKey>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const counts = useMemo(() => {
        const total = countTasks(tasks);
        const done = countTasks(tasks, (t) => t.done);
        return { total, done, active: total - done };
    }, [tasks]);

    const create = (p: { text: string; priority?: Priority; due?: string; note?: string }) => {
        const id =
            typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setTasks((prev) => [...prev, { id, text: p.text, done: false, children: [], priority: p.priority, due: p.due, note: p.note, createdAt: new Date() }]);
        setMode("structure");
    };

    const sortedTasks = useMemo(() => {
        const sort = (tasksToSort: Task[]): Task[] => {
            const sorted = [...tasksToSort].sort((a, b) => {
                let comparison = 0;
                switch (sortKey) {
                    case 'dueDate':
                        const dateA = a.due ? new Date(a.due).getTime() : Infinity;
                        const dateB = b.due ? new Date(b.due).getTime() : Infinity;
                        comparison = dateA - dateB;
                        break;
                    case 'priority':
                        const priorityA = a.priority ? priorityOrder[a.priority] : 0;
                        const priorityB = b.priority ? priorityOrder[b.priority] : 0;
                        comparison = priorityB - priorityA;
                        break;
                    case 'createdAt':
                        // ▼ 修正 ▼
                        comparison = b.createdAt.getTime() - a.createdAt.getTime();
                        // ▲ 修正 ▲
                        break;
                }
                return sortOrder === 'asc' ? comparison : -comparison;
            });
            return sorted.map(task => ({ ...task, children: sort(task.children) }));
        };
        return sort(tasks);
    }, [tasks, sortKey, sortOrder]);

    const toggleDone = (id: string) => setTasks((prev) => mapTasks(prev, (t) => (t.id === id ? { ...t, done: !t.done } : t)));
    const toggleCollapse = (id: string) => setTasks((prev) => mapTasks(prev, (t) => (t.id === id ? { ...t, collapsed: !t.collapsed } : t)));
    const removeTask = (id: string) => setTasks((prev) => removeById(prev, id).rest);

    const dropAsChild = (parentId: string, draggedId: string) => {
        setTasks((prev) => {
            if (isDescendant(prev, draggedId, parentId)) return prev;
            const { removed, rest } = removeById(prev, draggedId);
            if (!removed) return prev;
            return insertChild(rest, parentId, removed);
        });
    };
    const dropToRoot = (draggedId: string) => {
        setTasks((prev) => {
            const { removed, rest } = removeById(prev, draggedId);
            if (!removed) return prev;
            return [...rest, removed];
        });
    };

    return (
        <main className="wrap">
            <div className="hero">
                <div className="hero-inner">
                    <h1>構造化タスクメモリー</h1>
                    <div className="chips">
                        <span className="chip">全 {counts.total}</span>
                        <span className="chip">未完 {counts.active}</span>
                        <span className="chip">完了 {counts.done}</span>
                    </div>
                    <div className="mode-switch" role="tablist" aria-label="画面切替">
                        <button className={`tab lg ${mode === "input" ? "active" : ""}`} onClick={() => setMode("input")}>1. 入力</button>
                        <button className={`tab lg ${mode === "structure" ? "active" : ""}`} onClick={() => setMode("structure")}>2. 構造表示</button>
                    </div>
                </div>
            </div>

            <div className="container">
                {mode === "input" ? (
                    <InputPanel onCreate={create} />
                ) : (
                    <section className="panel">
                        <div className="toolbar">
                            <div className="filters" role="tablist" aria-label="フィルタ">
                                <button className={`tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>すべて</button>
                                <button className={`tab ${filter === "active" ? "active" : ""}`} onClick={() => setFilter("active")}>未完</button>
                                <button className={`tab ${filter === "done" ? "active" : ""}`} onClick={() => setFilter("done")}>完了</button>
                            </div>
                            <button className="btn ghost" onClick={() => setMode("input")}>＋ 追加する</button>
                        </div>

                        <div className="toolbar">
                            <SortTags
                                currentSortKey={sortKey}
                                currentSortOrder={sortOrder}
                                onSortChange={(key, order) => {
                                    setSortKey(key);
                                    setSortOrder(order);
                                }}
                            />
                        </div>

                        <TaskTree
                            tasks={sortedTasks}
                            filter={filter}
                            onToggleDone={toggleDone}
                            onRemove={removeTask}
                            onToggleCollapse={toggleCollapse}
                            onDropAsChild={dropAsChild}
                            onDropToRoot={dropToRoot}
                        />
                    </section>
                )}
            </div>

            <nav className="bottom-nav">
                <button className={`bn-item ${mode === "input" ? "active" : ""}`} onClick={() => setMode("input")}>入力</button>
                <button className={`bn-item ${mode === "structure" ? "active" : ""}`} onClick={() => setMode("structure")}>タスク一覧</button>
            </nav>
        </main>
    );
}

function mapTasks(arr: Task[], f: (t: Task) => Task): Task[] {
    return arr.map((t) => ({ ...f(t), children: mapTasks(t.children, f) }));
}
function countTasks(arr: Task[], pred: (t: Task) => boolean = () => true): number {
    let c = 0;
    const walk = (xs: Task[]) => xs.forEach((t) => { if (pred(t)) c++; if (t.children.length) walk(t.children); });
    walk(arr);
    return c;
}
function removeById(arr: Task[], id: string): { removed: Task | null; rest: Task[] } {
    const rest: Task[] = [];
    let removed: Task | null = null;
    for (const t of arr) {
        if (t.id === id) { removed = { ...t, children: t.children.map(clone) }; continue; }
        const sub = removeById(t.children, id);
        if (sub.removed) { removed = sub.removed; rest.push({ ...t, children: sub.rest }); }
        else rest.push(t);
    }
    return { removed, rest };
}
function insertChild(arr: Task[], parentId: string, child: Task): Task[] {
    return arr.map((t) => (t.id === parentId ? { ...t, children: [...t.children, child] } : { ...t, children: insertChild(t.children, parentId, child) }));
}
function isDescendant(arr: Task[], ancestorId: string, maybeDescendantId: string): boolean {
    const a = findById(arr, ancestorId); if (!a) return false; return !!findById(a.children, maybeDescendantId);
}
function findById(arr: Task[], id: string): Task | null {
    for (const t of arr) { if (t.id === id) return t; const f = findById(t.children, id); if (f) return f; }
    return null;
}
function clone(t: Task): Task { return { ...t, children: t.children.map(clone) }; }

function seed(): Task[] {
    const id = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
    const now = new Date();
    return [
        {
            id: id(), text: "卒論", done: false, createdAt: new Date(now.getTime() - 20000),
            children: [
                { id: id(), text: "論文調査", done: false, createdAt: new Date(now.getTime() - 19000), children: [
                        { id: id(), text: "論文A", done: true, children: [], priority: "medium", due: "2025-05-31", createdAt: new Date(now.getTime() - 18000) },
                        { id: id(), text: "論文B", done: false, children: [], priority: "high", due: "2025-06-15", createdAt: new Date(now.getTime() - 17000) },
                        { id: id(), text: "論文C", done: false, children: [], priority: "low", due: "2025-07-01", createdAt: new Date(now.getTime() - 16000) },
                    ], priority: "high", due: "2025-12-16" },
                { id: id(), text: "実装", done: false, createdAt: new Date(now.getTime() - 15000), children: [
                        { id: id(), text: "環境構築", done: true, children: [], priority: "medium", due: "2025-06-15", createdAt: new Date(now.getTime() - 14000) },
                        { id: id(), text: "基本機能", done: false, children: [], priority: "high", due: "2025-09-30", createdAt: new Date(now.getTime() - 13000) },
                        { id: id(), text: "応用機能", done: false, children: [], priority: "medium", due: "2025-11-30", createdAt: new Date(now.getTime() - 12000) },
                    ], priority: "medium" },
            ],
        },
        {
            id: id(), text: "英語の授業", done: false, createdAt: new Date(now.getTime() - 10000),
            children: [
                { id: id(), text: "来週の課題提出", done: true, children: [], priority: "high",due:'2025-09-02', createdAt: new Date(now.getTime() - 9000) },
                { id: id(), text: "次回のディスカッション準備", done: false, children: [], priority: "medium", due:'2025-09-05', createdAt: new Date(now.getTime() - 8000) },
            ],
        },
    ];
}

// // src/App.tsx
// import { useMemo, useState } from "react";
// import InputPanel from "./components/InputPanel";
// import TaskTree from "./components/TaskTree";
// import type { Task, Priority } from "./types";
// import "./App.css";
//
// type Filter = "all" | "active" | "done";
// type Mode = "input" | "structure";
//
// export default function App() {
//     const [tasks, setTasks] = useState<Task[]>(seed());
//     const [filter, setFilter] = useState<Filter>("all");
//     const [mode, setMode] = useState<Mode>("input");
//
//     const counts = useMemo(() => {
//         const total = countTasks(tasks);
//         const done = countTasks(tasks, (t) => t.done);
//         return { total, done, active: total - done };
//     }, [tasks]);
//
//     const create = (p: { text: string; priority?: Priority; due?: string; note?: string }) => {
//         const id =
//             typeof crypto !== "undefined" && "randomUUID" in crypto
//                 ? crypto.randomUUID()
//                 : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
//         setTasks((prev) => [...prev, { id, text: p.text, done: false, children: [], priority: p.priority, due: p.due, note: p.note }]);
//         setMode("structure"); // 追加後は構造表示へ切替（体験をスムーズに）
//     };
//
//     const toggleDone = (id: string) => setTasks((prev) => mapTasks(prev, (t) => (t.id === id ? { ...t, done: !t.done } : t)));
//     const toggleCollapse = (id: string) => setTasks((prev) => mapTasks(prev, (t) => (t.id === id ? { ...t, collapsed: !t.collapsed } : t)));
//     const removeTask = (id: string) => setTasks((prev) => removeById(prev, id).rest);
//
//     const dropAsChild = (parentId: string, draggedId: string) => {
//         setTasks((prev) => {
//             if (isDescendant(prev, draggedId, parentId)) return prev;
//             const { removed, rest } = removeById(prev, draggedId);
//             if (!removed) return prev;
//             return insertChild(rest, parentId, removed);
//         });
//     };
//     const dropToRoot = (draggedId: string) => {
//         setTasks((prev) => {
//             const { removed, rest } = removeById(prev, draggedId);
//             if (!removed) return prev;
//             return [...rest, removed];
//         });
//     };
//
//     return (
//         <main className="wrap">
//             <div className="hero">
//                 <div className="hero-inner">
//                     <h1>構造化タスクメモリー</h1>
//                     {/*<p className="muted">素早く入力 → 階層で整理。スマホでも快適。</p>*/}
//                     <div className="chips">
//                         <span className="chip">全 {counts.total}</span>
//                         <span className="chip">未完 {counts.active}</span>
//                         <span className="chip">完了 {counts.done}</span>
//                     </div>
//
//                     <div className="mode-switch" role="tablist" aria-label="画面切替">
//                         <button className={`tab lg ${mode === "input" ? "active" : ""}`} onClick={() => setMode("input")}>1. 入力</button>
//                         <button className={`tab lg ${mode === "structure" ? "active" : ""}`} onClick={() => setMode("structure")}>2. 構造表示</button>
//                     </div>
//                 </div>
//             </div>
//
//             <div className="container">
//                 {mode === "input" ? (
//                     <InputPanel onCreate={create} />
//                 ) : (
//                     <section className="panel">
//                         <div className="toolbar">
//                             <div className="filters" role="tablist" aria-label="フィルタ">
//                                 <button className={`tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>すべて</button>
//                                 <button className={`tab ${filter === "active" ? "active" : ""}`} onClick={() => setFilter("active")}>未完</button>
//                                 <button className={`tab ${filter === "done" ? "active" : ""}`} onClick={() => setFilter("done")}>完了</button>
//                             </div>
//                             <button className="btn ghost" onClick={() => setMode("input")}>＋ 追加する</button>
//                         </div>
//
//                         <TaskTree
//                             tasks={tasks}
//                             filter={filter}
//                             onToggleDone={toggleDone}
//                             onRemove={removeTask}
//                             onToggleCollapse={toggleCollapse}
//                             onDropAsChild={dropAsChild}
//                             onDropToRoot={dropToRoot}
//                         />
//                     </section>
//                 )}
//             </div>
//
//             {/* モバイル下部ナビ */}
//             <nav className="bottom-nav">
//                 <button className={`bn-item ${mode === "input" ? "active" : ""}`} onClick={() => setMode("input")}>入力</button>
//                 <button className={`bn-item ${mode === "structure" ? "active" : ""}`} onClick={() => setMode("structure")}>タスク一覧</button>
//             </nav>
//         </main>
//     );
// }
//
// /* ---------- ツリー操作ユーティリティ ---------- */
// function mapTasks(arr: Task[], f: (t: Task) => Task): Task[] {
//     return arr.map((t) => ({ ...f(t), children: mapTasks(t.children, f) }));
// }
// function countTasks(arr: Task[], pred: (t: Task) => boolean = () => true): number {
//     let c = 0;
//     const walk = (xs: Task[]) => xs.forEach((t) => { if (pred(t)) c++; if (t.children.length) walk(t.children); });
//     walk(arr);
//     return c;
// }
// function removeById(arr: Task[], id: string): { removed: Task | null; rest: Task[] } {
//     const rest: Task[] = [];
//     let removed: Task | null = null;
//     for (const t of arr) {
//         if (t.id === id) { removed = { ...t, children: t.children.map(clone) }; continue; }
//         const sub = removeById(t.children, id);
//         if (sub.removed) { removed = sub.removed; rest.push({ ...t, children: sub.rest }); }
//         else rest.push(t);
//     }
//     return { removed, rest };
// }
// function insertChild(arr: Task[], parentId: string, child: Task): Task[] {
//     return arr.map((t) => (t.id === parentId ? { ...t, children: [...t.children, child] } : { ...t, children: insertChild(t.children, parentId, child) }));
// }
// function isDescendant(arr: Task[], ancestorId: string, maybeDescendantId: string): boolean {
//     const a = findById(arr, ancestorId); if (!a) return false; return !!findById(a.children, maybeDescendantId);
// }
// function findById(arr: Task[], id: string): Task | null {
//     for (const t of arr) { if (t.id === id) return t; const f = findById(t.children, id); if (f) return f; }
//     return null;
// }
// function clone(t: Task): Task { return { ...t, children: t.children.map(clone) }; }
//
// /* ---------- 体験用シード ---------- */
// function seed(): Task[] {
//     const id = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
//     return [
//         {
//             id: id(),
//             text: "卒論",
//             done: false,
//             children: [
//                 { id: id(), text: "論文調査", done: false, children: [
//                     { id: id(), text: "論文A", done: true, children: [], priority: "medium", due: "2025-05-31" },
//                     { id: id(), text: "論文B", done: false, children: [], priority: "high", due: "2025-06-15" },
//                     { id: id(), text: "論文C", done: false, children: [], priority: "low", due: "2025-07-01" },
//                     ], priority: "high", due: "2025-12-16" },
//                 { id: id(), text: "実装", done: false, children: [
//                     { id: id(), text: "環境構築", done: true, children: [], priority: "medium", due: "2025-06-15" },
//                     { id: id(), text: "基本機能", done: false, children: [], priority: "high", due: "2025-09-30" },
//                     { id: id(), text: "応用機能", done: false, children: [], priority: "medium", due: "2025-11-30" },
//                     ], priority: "medium" },
//                 { id: id(), text: "実験", done: false, children: [
//                     { id: id(), text: "データ収集", done: true, children: [], priority: "high", due: "2025-07-31" },
//                     { id: id(), text: "データ分析", done: false, children: [], priority: "medium", due: "2025-10-15" },
//                     { id: id(), text: "結果整理", done: false, children: [], priority: "medium", due: "2025-11-15" },
//                     ], priority: "medium" },
//                 { id: id(), text: "進捗報告", done: false, children: [
//                     { id: id(), text: "第1回", done: true, children: [], priority: "high", due: "2025-06-30" },
//                     { id: id(), text: "第2回", done: false, children: [], priority: "medium", due: "2025-10-31" },
//                     ], priority: "medium" },
//                 { id: id(), text: "執筆", done: false, children: [
//                     { id: id(), text: "序論", done: true, children: [], priority: "medium", due: "2025-11-30" },
//                     { id: id(), text: "関連研究", done: false, children: [], priority: "medium", due: "2025-12-15" },
//                     { id: id(), text: "方法論", done: false, children: [], priority: "high", due: "2025-12-31" },
//                     { id: id(), text: "実験結果", done: false, children: [], priority: "high", due: "2026-01-15" },
//                     { id: id(), text: "考察", done: false, children: [], priority: "medium", due: "2026-01-31" },
//                     { id: id(), text: "結論", done: false, children: [], priority: "medium", due: "2026-02-15" },
//                     ], priority: "low" },
//                 { id: id(), text: "最終提出", done: false, children: [
//                     { id: id(), text: "ドラフト提出", done: false, children: [], priority: "high", due: "2026-02-20" },
//                     { id: id(), text: "最終版提出", done: false, children: [], priority: "high", due: "2026-02-28" },
//                 ], priority: "high" },
//             ],
//         },
//         {
//             id: id(),
//             text: "英語の授業",
//             done: false,
//             children: [
//                 { id: id(), text: "来週の課題提出", done: true, children: [], priority: "high",due:'2025-09-02' },
//                 { id: id(), text: "次回のディスカッション準備", done: false, children: [], priority: "medium", due:'2025-09-05' },
//                 { id: id(), text: "中間レポート執筆", done: false, children: [], priority: "low", due:'2025-10-15' },
//                 { id: id(), text: "期末試験対策", done: false, children: [], priority: "medium", due:'2025-12-10' },
//             ],
//         },
//     ];
// }
