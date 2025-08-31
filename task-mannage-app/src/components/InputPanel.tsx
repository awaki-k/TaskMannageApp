// src/components/InputPanel.tsx
import { useState } from "react";
import type { Priority } from "../types";

type CreatePayload = {
    text: string;
    priority?: Priority;
    due?: string;
    note?: string;
};

export default function InputPanel({ onCreate }: { onCreate: (p: CreatePayload) => void }) {
    const [text, setText] = useState("");
    const [priority, setPriority] = useState<Priority>("medium");
    const [due, setDue] = useState<string>("");
    const [note, setNote] = useState("");

    const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        const v = text.trim();
        if (!v) return;
        onCreate({ text: v, priority, due: due || undefined, note: note.trim() || undefined });
        setText("");
        setDue("");
        setNote("");
        setPriority("medium");
    };

    return (
        <section className="panel">
            <div className="panel-head">
                <h2>タスクを入力</h2>
                <p className="muted">シンプルに入力→必要なら優先度・期限・メモを追加</p>
            </div>

            <form onSubmit={submit} className="glass form">
                <div className="form-row">
                    <label className="label">タスク</label>
                    <input
                        className="input"
                        placeholder="例：論文Bの要約を仕上げる"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        aria-label="タスク本文"
                    />
                </div>

                <div className="form-grid">
                    <div className="form-row">
                        <label className="label">優先度</label>
                        <div className="segmented">
                            {(["low", "medium", "high"] as Priority[]).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    className={`seg-item ${priority === p ? "active" : ""} ${p}`}
                                    onClick={() => setPriority(p)}
                                >
                                    {p === "low" ? "低" : p === "medium" ? "中" : "高"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-row">
                        <label className="label">期限</label>
                        <input
                            className="input"
                            type="date"
                            value={due}
                            onChange={(e) => setDue(e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <label className="label">メモ</label>
                    <textarea
                        className="input textarea"
                        rows={4}
                        placeholder="補足や次の一手を書いておくと便利"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>

                <div className="form-actions">
                    <button className="btn primary" type="submit">追加する</button>
                    <button
                        className="btn ghost"
                        type="button"
                        onClick={() => {
                            setText("");
                            setDue("");
                            setNote("");
                            setPriority("medium");
                        }}
                    >
                        クリア
                    </button>
                </div>
            </form>

            <div className="quick-templates">
                <span className="muted">クイック追加：</span>
                {["Daily Review", "買い物リスト作成", "議事録まとめ"].map((t) => (
                    <button key={t} className="chip action" onClick={() => onCreate({ text: t })}>
                        {t}
                    </button>
                ))}
            </div>
        </section>
    );
}
