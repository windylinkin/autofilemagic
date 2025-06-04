// background.js
const SERVER_URL = 'http://localhost:3000';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        try {
            let response;
            let endpoint;
            let body = {};

            switch (request.action) {
                case 'readFile':
                    endpoint = '/read-file';
                    body = { filePath: request.filePath };
                    break;
                case 'updateFile':
                    endpoint = '/update-file';
                    body = { filePath: request.filePath, content: request.content };
                    break;
                case 'listDirectory':
                    endpoint = '/list-directory';
                    body = { directoryPath: request.directoryPath };
                    break;
                case 'configBaseDir': // 新增动作处理
                    endpoint = '/config-base-dir';
                    body = { newPath: request.newPath };
                    break;
                default:
                    sendResponse({ error: '未知动作。' });
                    return;
            }

            response = await fetch(`${SERVER_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `服务器错误，状态码: ${response.status}` }));
                sendResponse({ error: errorData.error || `服务器错误: ${response.status}`, success: false }); // 添加 success 标志
                return;
            }

            const data = await response.json();
            // 为 configBaseDir 确保也传递 success 标志（如果服务器没给，则基于 response.ok）
            if (request.action === 'configBaseDir' && typeof data.success === 'undefined') {
                data.success = true; // 假设 ok 意味着成功
            }
            sendResponse(data);
        } catch (error) {
            console.error('与本地服务器通信失败:', error);
            sendResponse({ error: `无法连接到本地服务器或请求失败: ${error.message}`, success: false });
        }
    })();
    return true; // Indicates that the response is sent asynchronously
});