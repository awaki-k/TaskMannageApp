import { useState } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { v4 as uuidv4 } from 'uuid'

const ItemType = { TASK: 'task' }

function TaskCard({ task, onDropDependency, onComplete, onDelete }) {
    const [, drag] = useDrag(() => ({
        type: ItemType.TASK,
        item: { id: task.id },
    }))

    const [, drop] = useDrop(() => ({
        accept: ItemType.TASK,
        drop: (draggedItem) => {
            if (draggedItem.id !== task.id) {
                onDropDependency(draggedItem.id, task.id)
            }
        },
    }))

    return (
        <div
            ref={(node) => drag(drop(node))}
            className={`bg-gradient-to-r from-gray-700 to-gray-800 p-4 rounded-lg shadow-lg mb-3 cursor-move border hover:border-blue-400 flex justify-between items-start gap-4 ${
                task.completed ? 'opacity-60' : ''
            }`}
        >
            <div className="flex-1">
                <p className={`font-bold text-lg ${task.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                    {task.title}
                </p>
                {task.dependsOnTitle && (
                    <p className="text-sm text-gray-400 mt-1">
                        ↳ 依存: {task.dependsOnTitle}
                    </p>
                )}
            </div>
            <div className="flex flex-col items-end gap-1">
                <button
                    className="text-sm text-green-400 hover:underline"
                    onClick={() => onComplete(task.id)}
                >
                    ✔ 完了
                </button>
                <button
                    className="text-sm text-red-400 hover:underline"
                    onClick={() => onDelete(task.id)}
                >
                    🗑 削除
                </button>
            </div>
        </div>
    )
}

// TaskTreeコンポーネント: 再帰的にツリー表示
function TaskTree({ tasks, parentId, onDropDependency, onComplete, onDelete }) {
    // parentIdがnullのものがルート
    const children = tasks.filter(t => t.dependsOn === parentId)
    return (
        <ul className="pl-4 border-l border-gray-500">
            {children.map(task => (
                <li key={task.id} className="mb-2">
                    <TaskCard
                        task={task}
                        onDropDependency={onDropDependency}
                        onComplete={onComplete}
                        onDelete={onDelete}
                    />
                    {/* 子タスクがあれば再帰的に表示 */}
                    <TaskTree
                        tasks={tasks}
                        parentId={task.id}
                        onDropDependency={onDropDependency}
                        onComplete={onComplete}
                        onDelete={onDelete}
                    />
                </li>
            ))}
        </ul>
    )
}


export default function App() {
    const [tasks, setTasks] = useState([])
    const [input, setInput] = useState('')
    const [filter, setFilter] = useState('all') // フィルター状態

    const addTask = () => {
        if (!input.trim()) return
        const newTask = {
            id: uuidv4(),
            title: input,
            dependsOn: null,
            dependsOnTitle: null,
            completed: false,
        }
        setTasks([...tasks, newTask])
        setInput('')
    }

    const handleDrop = (draggedId, targetId) => {
        setTasks((prev) =>
            prev.map((t) =>
                t.id === draggedId
                    ? {
                        ...t,
                        dependsOn: targetId,
                        dependsOnTitle: prev.find((t2) => t2.id === targetId)?.title || null,
                    }
                    : t
            )
        )
    }

    const handleComplete = (id) => {
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, completed: true } : t))
        )
    }

    const handleDelete = (id) => {
        setTasks((prev) =>
            prev
                .filter((t) => t.id !== id)
                .map((t) =>
                    t.dependsOn === id
                        ? { ...t, dependsOn: null, dependsOnTitle: null }
                        : t
                )
        )
    }

    // フィルターされたタスクを取得
    const filteredTasks = tasks.filter((task) => {
        if (filter === 'completed') return task.completed
        if (filter === 'incomplete') return !task.completed
        return true // 'all'
    })

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="max-w-full mx-auto p-6">
                <h1 className="text-2xl font-bold mb-4">タスク依存関係モック</h1>
                <div className="flex gap-2 mb-4">
                    <input
                        className="border p-2 rounded w-full"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="タスクを入力"
                        onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    />
                    <button onClick={addTask} className="bg-blue-500 text-white px-4 py-2 rounded">
                        追加
                    </button>
                </div>
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
                    >
                        全て
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-4 py-2 rounded ${filter === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
                    >
                        完了済み
                    </button>
                    <button
                        onClick={() => setFilter('incomplete')}
                        className={`px-4 py-2 rounded ${filter === 'incomplete' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
                    >
                        未完了
                    </button>
                </div>
                <h2 className="text-xl font-semibold mb-2">タスク一覧</h2>
                <div className="max-w-full bg-gray-600 p-4 rounded shadow-sm text-left">
                    <TaskTree
                        tasks={filteredTasks}
                        parentId={null}
                        onDropDependency={handleDrop}
                        onComplete={handleComplete}
                        onDelete={handleDelete}
                    />
                </div>
            </div>
        </DndProvider>
    )
}