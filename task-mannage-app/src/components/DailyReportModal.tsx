import { useState } from "react";
import type { Task } from "../types";


// The structure of the analysis result passed from App.tsx
export type ReportAnalysis = {
    completedTasks: Task[];
    problemTasks: Task[]; // Overdue or upcoming tasks
};

interface DailyReportModalProps {
    analysis: ReportAnalysis;
    onClose: () => void;
    onGenerate: (userResponses: Record<string, { blocker: string; progress: string }>) => Promise<void>;
    isGenerating: boolean;
    generatedReport: string | null;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
                                                                      analysis,
                                                                      onClose,
                                                                      onGenerate,
                                                                      isGenerating,
                                                                      generatedReport,
                                                                  }) => {
    // State to manage user's answers to questions
    const [responses, setResponses] = useState<Record<string, { blocker: string; progress: string }>>({});

    const handleResponseChange = (taskId: string, field: 'blocker' | 'progress', value: string) => {
        setResponses(prev => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                [field]: value,
            },
        }));
    };

    const handleDownload = () => {
        if (!generatedReport) return;
        const blob = new Blob([generatedReport], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const today = new Date().toISOString().slice(0, 10);
        a.download = `daily-report-${today}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleCopy = () => {
        if (!generatedReport) return;
        // Using the clipboard API
        navigator.clipboard.writeText(generatedReport).then(() => {
            // You can add a success message here if you like
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };


    const renderForm = () => (
        <>
            <div className="modal-header">
                <h3>日報作成アシスタント</h3>
                <button className="icon-btn danger" onClick={onClose}>✕</button>
            </div>
            <div className="modal-body">
                <h4>✅ 最近完了したタスク</h4>
                {analysis.completedTasks.length > 0 ? (
                    <ul>{analysis.completedTasks.map(t => <li key={t.id}>{t.text}</li>)}</ul>
                ) : (
                    <p className="muted">過去24時間以内に完了したタスクはありません。</p>
                )}

                <h4>⚠️ 確認が必要なタスク</h4>
                {analysis.problemTasks.length > 0 ? (
                    analysis.problemTasks.map(task => (
                        <div key={task.id} className="form-row" style={{ marginBottom: '20px' }}>
                            <label className="label" style={{ fontSize: '1em' }}>{task.text}</label>
                            <textarea
                                className="input textarea"
                                rows={2}
                                placeholder="どこで詰まっていますか？（任意）"
                                value={responses[task.id]?.blocker || ''}
                                onChange={(e) => handleResponseChange(task.id, 'blocker', e.target.value)}
                            />
                            <textarea
                                className="input textarea"
                                rows={2}
                                placeholder="現在の進捗はどうですか？（任意）"
                                value={responses[task.id]?.progress || ''}
                                onChange={(e) => handleResponseChange(task.id, 'progress', e.target.value)}
                            />
                        </div>
                    ))
                ) : (
                    <p className="muted">遅延・期限間近のタスクはありません。</p>
                )}
                <div className="form-actions" style={{ marginTop: '20px' }}>
                    <button className="btn primary" onClick={() => onGenerate(responses)}>AIで日報を生成</button>
                </div>
            </div>
        </>
    );

    const renderLoading = () => (
        <div className="modal-body" style={{ textAlign: 'center', padding: '40px' }}>
            <p>AIが日報を生成中です...</p>
            {/* Simple spinner */}
            <div className="spinner"></div>
        </div>
    );

    const renderResult = () => (
        <>
            <div className="modal-header">
                <h3>生成された日報</h3>
                <button className="icon-btn danger" onClick={onClose}>✕</button>
            </div>
            <div className="modal-body">
        <textarea
            className="input textarea"
            rows={15}
            value={generatedReport || ''}
            readOnly
        />
                <div className="form-actions" style={{ marginTop: '20px' }}>
                    <button className="btn ghost" onClick={handleCopy}>コピー</button>
                    <button className="btn ghost" onClick={handleDownload}>ダウンロード (.txt)</button>
                    <button className="btn primary" onClick={onClose}>終了</button>
                </div>
            </div>
        </>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
                {isGenerating ? renderLoading() : generatedReport ? renderResult() : renderForm()}
            </div>
        </div>
    );
};