import { useState } from "react";
import type { Priority } from "../types";


// ソートの種類を定義
export type SortKey = 'dueDate' | 'priority' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

interface SortTagsProps {
    // 現在のソートキーと順序をApp.tsxから受け取る
    currentSortKey: SortKey;
    currentSortOrder: SortOrder;
    // ソートが変更されたときにApp.tsxに通知する関数
    onSortChange: (key: SortKey, order: SortOrder) => void;
}

const SortTags: React.FC<SortTagsProps> = ({ currentSortKey, currentSortOrder, onSortChange }) => {

    const handleSort = (key: SortKey) => {
        // 同じキーがクリックされたら、昇順/降順を切り替える
        if (key === currentSortKey) {
            onSortChange(key, currentSortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // 違うキーがクリックされたら、デフォルトで降順にする
            onSortChange(key, 'desc');
        }
    };

    return (
        <div className="chips">
            <button
                className={`chip ${currentSortKey === 'dueDate' ? 'active' : ''}`}
                onClick={() => handleSort('dueDate')}
            >
                期限順 {currentSortKey === 'dueDate' && (currentSortOrder === 'asc' ? '🔼' : '🔽')}
            </button>
            <button
                className={`chip ${currentSortKey === 'priority' ? 'active' : ''}`}
                onClick={() => handleSort('priority')}
            >
                重要度順 {currentSortKey === 'priority' && (currentSortOrder === 'asc' ? '🔼' : '🔽')}
            </button>
            <button
                className={`chip ${currentSortKey === 'createdAt' ? 'active' : ''}`}
                onClick={() => handleSort('createdAt')}
            >
                追加した順 {currentSortKey === 'createdAt' && (currentSortOrder === 'asc' ? '🔼' : '🔽')}
            </button>
        </div>
    );
};

export default SortTags;