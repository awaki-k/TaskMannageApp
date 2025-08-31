// src/components/TaskInput.tsx
import { useState } from "react";

type Props = {
    onAdd: (text: string) => void;
};

export default function TaskInput({ onAdd }: Props) {
    const [text, setText] = useState("");

    const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        const v = text.trim();
        if (!v) return;
        onAdd(v);
        setText("");
    };

    return (
        <form onSubmit={submit} className="task-input">
            <input
                aria-label="新しいタスク"
                placeholder="新しいタスクを入力..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="btn">追加</button>
        </form>
    );
}
