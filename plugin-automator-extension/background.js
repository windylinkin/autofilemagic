// background.js
const SERVER_URL = 'http://localhost:3000';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        try {
            let responseFromFetch;
            let endpoint;
            let method = 'POST'; // 默认POST
            let body = {};

            switch (request.action) {
                case 'readFile':
                    endpoint = '/read-file';
                    body = { filePath: request.filePath };
                    break;
                // ... (其他 case 保持不变) ...
                case 'updateFile':
                    endpoint = '/update-file';
                    body = { filePath: request.filePath, content: request.content };
                    break;
                case 'listDirectory':
                    endpoint = '/list-directory';
                    body = { directoryPath: request.directoryPath };
                    break;
                case 'configBaseDir':
                    endpoint = '/config-base-dir';
                    body = { newPath: request.newPath };
                    break;
                case 'exportProjectJson': // 新增动作
                    endpoint = '/export-project-json';
                    method = 'GET'; // 此端点使用GET
                    // GET请求通常没有body，但如果需要传递参数，可以放在URL查询字符串中
                    break;
                case 'saveConfig':
                    // ... (保持不变)
                    try {
                        await chrome.storage.local.set(request.data);
                        sendResponse({ success: true, message: "配置已保存。" });
                    } catch (e) {
                        console.error("保存配置到 storage 失败:", e);
                        sendResponse({ success: false, error: e.message });
                    }
                    return true;
                case 'loadConfig':
                    // ... (保持不变)
                     try {
                        const result = await chrome.storage.local.get(request.keys);
                        sendResponse({ success: true, data: result });
                    } catch (e) {
                        console.error("从 storage 加载配置失败:", e);
                        if (e.message.toLowerCase().includes("chrome.storage.local is undefined") || e.message.toLowerCase().includes("cannot read properties of undefined (reading 'local')")) {
                             sendResponse({ success: false, error: "Storage API 不可用。请检查插件的 'storage' 权限是否已在 manifest.json 中声明并已重载插件。", data: {} });
                        } else {
                            sendResponse({ success: false, error: e.message, data: {} });
                        }
                    }
                    return true;
                default:
                    sendResponse({ error: '未知动作。', success: false });
                    return true;
            }

            const fetchOptions = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };
            if (method === 'POST' || method === 'PUT') { // 只在需要时添加 body
                fetchOptions.body = JSON.stringify(body);
            }

            responseFromFetch = await fetch(`${SERVER_URL}${endpoint}`, fetchOptions);

            if (!responseFromFetch.ok) {
                const errorData = await responseFromFetch.json().catch(() => ({ error: `服务器错误，状态码: ${responseFromFetch.status}` }));
                sendResponse({ error: errorData.error || `服务器错误: ${responseFromFetch.status}`, success: false });
                return true;
            }

            const data = await responseFromFetch.json();
            // 确保所有响应都有 success 字段 (如果服务器没给，且响应ok，则认为是true)
            if (typeof data.success === 'undefined') {
                data.success = true;
            }
            sendResponse(data);

        } catch (error) {
            console.error(`处理动作 "${request.action}" 时与本地服务器通信失败或发生错误:`, error);
            sendResponse({ error: `无法连接到本地服务器或请求失败: ${error.message}`, success: false });
        }
    })();
    return true;
});