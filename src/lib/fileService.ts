
/**
 * 判断是否在 Tauri 环境
 */
export const isTauri = () => {
    return Boolean(window && (window as any).__TAURI_INTERNALS__);
};

/**
 * 保存文件（纯浏览器 API 方案，支持位置记忆/默认位置）
 */
export async function saveFile(
    filename: string,
    content: string | Uint8Array,
    extension: string
): Promise<boolean> {
    // MIME 类型映射
    const mimeTypes: Record<string, string> = {
        json: "application/json",
        txt: "text/plain",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    };
    const mimeType = mimeTypes[extension] || "text/plain";

    try {
        // 尝试使用 File System Access API (Tauri WebView2 支持此 API)
        if ('showSaveFilePicker' in window) {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: `${extension.toUpperCase()} File`,
                    accept: { [mimeType]: [`.${extension}`] }
                }]
            });
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
            
            // 注意：浏览器 API 无法直接获取保存后的绝对路径，
            // 但它会自动记住上次选择的文件夹。
            return true;
        }
    } catch (e: any) {
        if (e.name === 'AbortError') return false;
        console.warn("File System Access API 失败，回退到普通下载:", e);
    }

    // 回退到普通下载逻辑
    const blob = new Blob([content as any], { // any 理由：绕过 Uint8Array 与 BlobPart 的潜在定义冲突
        type: mimeType
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return true;
}
