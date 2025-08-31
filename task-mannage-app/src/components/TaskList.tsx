export type Task = {
    id: string;
    text: string;
    done: boolean;
};

type Props = {
    tasks: Task[];
    onToggle: (id: string) => void;
    onRemove: (id: string) => void;
};

export default function TaskList({ tasks, onToggle, onRemove }: Props) {
    if (tasks.length === 0) return <p>まだタスクはありません。</p>;

    return (
        <ul className="task-list">
            {tasks.map((t) => (
                <li key={t.id} className={t.done ? "done" : ""}>
                    <label>
                        <input
                            type="checkbox"
                            checked={t.done}
                            onChange={() => onToggle(t.id)}
                        />
                        <span>{t.text}</span>
                    </label>
                    <button onClick={() => onRemove(t.id)}>削除</button>
                </li>
            ))}
        </ul>
    );
}
