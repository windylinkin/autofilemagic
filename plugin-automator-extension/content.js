// content.js
const automatorContainer = document.createElement('div');
automatorContainer.classList.add('plugin-automator-container');

const collapsedText = document.createElement('div');
collapsedText.classList.add('collapsed-text');
collapsedText.textContent = '插件修改器'; // 这个可以动态改成目标插件名
automatorContainer.appendChild(collapsedText);

const expandedContent = document.createElement('div');
expandedContent.classList.add('expanded-content');
expandedContent.innerHTML = `
    <button class="close-btn" title="关闭">&times;</button>
    <h2 id="automatorMainTitle">插件文件修改器</h2>

    <fieldset class="config-section">
        <legend>目标插件配置</legend>
        <div>
            <label for="automatorBaseDirPathInput">目标插件项目绝对路径:</label>
            <input type="text" id="automatorBaseDirPathInput" placeholder="例如: /Users/name/dev/my-chrome-plugin">
        </div>
        <button id="automatorSetBaseDirBtn" class="action-btn mt-1">设置并加载</button>
        <p class="text-xs text-gray-500 mt-1">
            当前目标插件: <strong id="automatorPluginNameDisplay">未配置</strong><br/>
            路径: <span id="automatorConfiguredPathDisplay">未配置</span>
        </p>
    </fieldset>

    <div id="automatorFileInteractionArea" style="display: none;">
        <div class="file-manager">
            <div class="path-controls">
                <button id="automatorGoToRootBtn" title="项目根目录">🏠</button>
                <button id="automatorNavigateUpBtn" title="上一级">⬆️</button>
                <span id="automatorCurrentPathDisplay">./</span>
            </div>
            <div id="automatorFileBrowser" class="file-browser-list">
                </div>
        </div>

        <div class="mb-4 mt-4">
            <label for="automatorFilePath">当前文件路径 (相对于目标插件根目录)</label>
            <input type="text" id="automatorFilePath" placeholder="点击上方文件加载..." readonly>
        </div>
        <div class="mb-4">
            <label for="automatorFileContent">文件内容</label>
            <textarea id="automatorFileContent" rows="8" placeholder="选择文件后，内容将显示在此..."></textarea>
        </div>

        <fieldset class="content-actions-fieldset">
            <legend>内容操作</legend>
            <div class="find-replace-section mb-2">
                <label for="automatorFindText">查找内容:</label>
                <input type="text" id="automatorFindText" class="small-input" placeholder="输入要查找的文本">
                <label for="automatorReplaceText">替换为:</label>
                <input type="text" id="automatorReplaceText" class="small-input" placeholder="输入替换后的文本">
                <div class="button-group-inline mt-1">
                    <button id="automatorReplaceSelectedBtn" class="action-btn">替换选中</button>
                    <button id="automatorReplaceAllInFileBtn" class="action-btn">全部替换(文件内)</button>
                </div>
            </div>
            <div class="button-group-inline mb-2">
                <button id="automatorInsertClipboardBtn" class="action-btn">粘贴板内容插入光标处</button>
                <button id="automatorReplaceAllWithClipboardBtn" class="action-btn">粘贴板内容替换全部</button>
            </div>
        </fieldset>

        <fieldset class="page-interaction-fieldset">
            <legend>页面交互模式 (复制/快捷键触发)</legend>
            <div id="automatorPageInteractionMode" class="interaction-modes">
                <label><input type="radio" name="pageMode" value="insert" checked> 追加到末尾</label>
                <label><input type="radio" name="pageMode" value="replaceAll"> 替换全部内容</label>
                <label><input type="radio" name="pageMode" value="setFind"> 设为查找词</label>
                <label><input type="radio" name="pageMode" value="setReplace"> 设为替换词</label>
            </div>
            <p class="text-xs text-gray-500 mt-1">
                在页面复制内容或按 Ctrl+Shift+Alt+X 触发。
            </p>
        </fieldset>

        <div class="button-group">
            <button id="automatorSaveFileBtn" class="save-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M3 3.5A1.5 1.5 0 0 1 4.5 2h6.879a1.5 1.5 0 0 1 1.06.44l4.122 4.12A1.5 1.5 0 0 1 17 7.622V16.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16.5v-13Zm1.5-1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V7.622a.5.5 0 0 0-.146-.353l-4.122-4.122A.5.5 0 0 0 11.379 3H4.5ZM9 14a1 1 0 1 1 2 0v2a1 1 0 1 1-2 0v-2Zm-2.5-4a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5Z"/></svg>
                保存并同步到GitHub
            </button>
        </div>
    </div> <div id="automatorMessageBox" class="message-box"></div>`;
automatorContainer.appendChild(expandedContent);
document.body.appendChild(automatorContainer);

// --- 主UI元素获取 ---
const mainTitle = automatorContainer.querySelector('#automatorMainTitle');
const filePathInput = automatorContainer.querySelector('#automatorFilePath');
const fileContentTextarea = automatorContainer.querySelector('#automatorFileContent');
const saveFileBtn = automatorContainer.querySelector('#automatorSaveFileBtn');
const messageBox = automatorContainer.querySelector('#automatorMessageBox');
const closeBtn = automatorContainer.querySelector('.close-btn');
const fileBrowserDiv = automatorContainer.querySelector('#automatorFileBrowser');
const currentPathDisplay = automatorContainer.querySelector('#automatorCurrentPathDisplay');
const goToRootBtn = automatorContainer.querySelector('#automatorGoToRootBtn');
const navigateUpBtn = automatorContainer.querySelector('#automatorNavigateUpBtn');
const fileInteractionArea = automatorContainer.querySelector('#automatorFileInteractionArea');


// --- 配置UI元素 ---
const baseDirPathInput = automatorContainer.querySelector('#automatorBaseDirPathInput');
const setBaseDirBtn = automatorContainer.querySelector('#automatorSetBaseDirBtn');
const pluginNameDisplay = automatorContainer.querySelector('#automatorPluginNameDisplay');
const configuredPathDisplay = automatorContainer.querySelector('#automatorConfiguredPathDisplay');

// --- 内容操作UI元素获取 ---
const findTextInput = automatorContainer.querySelector('#automatorFindText');
const replaceTextInput = automatorContainer.querySelector('#automatorReplaceText');
const replaceSelectedBtn = automatorContainer.querySelector('#automatorReplaceSelectedBtn');
const replaceAllInFileBtn = automatorContainer.querySelector('#automatorReplaceAllInFileBtn');
const insertClipboardBtn = automatorContainer.querySelector('#automatorInsertClipboardBtn');
const replaceAllWithClipboardBtn = automatorContainer.querySelector('#automatorReplaceAllWithClipboardBtn');
const pageInteractionModeRadios = automatorContainer.querySelectorAll('input[name="pageMode"]');

let isExpanded = false;
let currentDirectoryPath = "."; // 相对于配置的 BASE_DIR
let currentConfiguredBasePath = null; // 在客户端也保存一份，避免频繁从storage读取

// --- 消息提示函数 (同前) ---
function showMessage(message, type, duration = 5000) {
    messageBox.textContent = message;
    messageBox.className = 'message-box';
    messageBox.classList.add(type);
    messageBox.style.display = 'block';
    const timeoutId = setTimeout(() => {
        if (messageBox.textContent === message) { // 避免清除后续消息
            messageBox.style.display = 'none';
        }
    }, duration);
    // 可选：如果想让消息框可以点击关闭
    // messageBox.onclick = () => { clearTimeout(timeoutId); messageBox.style.display = 'none'; };
}


// --- 路径处理函数 (同前) ---
function pathJoin(base, part) { /* ... */ }
function getParentPath(currentPath) { /* ... */ }
// --- (复制粘贴 pathJoin 和 getParentPath 函数到这里) ---
pathJoin = function(base, part) {
    if (base === "." || base === "./") {
        return "./" + part.replace(/^\.\//, ''); // 避免 ././file
    }
    return base.replace(/\/$/, '') + "/" + part.replace(/^\.\//, '');
};
getParentPath = function(currentPath) {
    if (currentPath === "." || currentPath === "./") {
        return ".";
    }
    const parts = currentPath.split('/');
    if (parts.length <= 1) return "."; // "file.js" or "."
    if (parts.length === 2 && parts[0] === ".") return "."; // "./file.js"
    parts.pop();
    return parts.join('/') || ".";
};


// --- 配置基础目录 ---
async function configureBaseDirectory(path) {
    if (!path || path.trim() === "") {
        showMessage("请输入目标插件的有效路径。", "error");
        return false;
    }
    showMessage("正在配置目标插件路径并加载信息...", "info", 10000);
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'configBaseDir',
            newPath: path
        });

        if (response && response.success) {
            currentConfiguredBasePath = response.configuredPath; // 服务器返回的绝对路径
            baseDirPathInput.value = currentConfiguredBasePath; // 更新输入框为服务器确认的路径
            pluginNameDisplay.textContent = response.pluginName || "名称读取失败";
            configuredPathDisplay.textContent = currentConfiguredBasePath;
            collapsedText.textContent = response.pluginName || "插件修改器"; // 更新折叠时的标题
            mainTitle.textContent = `${response.pluginName || "插件"} 文件修改器`; // 更新展开时的标题

            await chrome.storage.local.set({ 
                configuredBaseDir: currentConfiguredBasePath,
                configuredPluginName: response.pluginName 
            });
            
            showMessage(`目标插件 "${response.pluginName}" 配置成功！路径: ${currentConfiguredBasePath}`, "success");
            fileInteractionArea.style.display = 'block'; // 显示文件操作区域
            currentDirectoryPath = "."; // 重置浏览路径
            renderDirectory(currentDirectoryPath); // 加载根目录
            return true;
        } else {
            const errorMsg = response && response.error ? response.error : "配置失败，未知错误。";
            showMessage(`配置路径失败: ${errorMsg}`, "error");
            pluginNameDisplay.textContent = "配置失败";
            configuredPathDisplay.textContent = "无效路径";
            fileInteractionArea.style.display = 'none'; // 隐藏文件操作区域
            return false;
        }
    } catch (error) {
        showMessage(`配置路径时发生通信错误: ${error.message}`, "error");
        console.error("配置路径通信错误:", error);
        fileInteractionArea.style.display = 'none';
        return false;
    }
}

setBaseDirBtn.addEventListener('click', () => {
    const newPath = baseDirPathInput.value.trim();
    configureBaseDirectory(newPath);
});

// --- 初始化加载配置 ---
async function loadInitialConfig() {
    try {
        const data = await chrome.storage.local.get(['configuredBaseDir', 'configuredPluginName']);
        if (data.configuredBaseDir) {
            baseDirPathInput.value = data.configuredBaseDir;
            pluginNameDisplay.textContent = data.configuredPluginName || "加载中...";
            configuredPathDisplay.textContent = data.configuredBaseDir;
            // 自动尝试用存储的路径配置服务器
            const success = await configureBaseDirectory(data.configuredBaseDir);
            if (!success) {
                 showMessage("上次配置的路径无效，请重新设置。", "error");
                 fileInteractionArea.style.display = 'none';
            }
        } else {
            showMessage("请配置目标插件的项目路径。", "info");
            fileInteractionArea.style.display = 'none';
        }
    } catch (e) {
        console.error("读取本地存储失败:", e);
        showMessage("读取配置失败，请手动配置。", "error");
        fileInteractionArea.style.display = 'none';
    }
}


// --- 文件浏览与加载 (基本同前，但依赖 currentConfiguredBasePath) ---
async function renderDirectory(dirPath) {
    if (!currentConfiguredBasePath) {
        showMessage("请先配置并加载目标插件路径！", "error");
        fileBrowserDiv.innerHTML = '<div class="empty-directory">请先配置路径</div>';
        return;
    }
    // ... (renderDirectory 逻辑基本不变, 确保内部的 sendMessage 不再发送 baseDir)
    // ... (当调用 listDirectory 时，服务器会使用其 currentConfiguredBaseDir)
    currentDirectoryPath = dirPath;
    currentPathDisplay.textContent = dirPath;
    fileBrowserDiv.innerHTML = '<div class="loading-spinner"></div>';
    navigateUpBtn.disabled = (dirPath === "." || dirPath === "./");

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'listDirectory',
            directoryPath: dirPath // 这个路径是相对于 currentConfiguredBaseDir 的
        });
        if (response.error) throw new Error(response.error);

        fileBrowserDiv.innerHTML = '';
        if (response.items.length === 0) {
            fileBrowserDiv.innerHTML = '<div class="empty-directory">目录为空</div>';
        }
        response.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('file-browser-item');
            itemElement.dataset.name = item.name;
            itemElement.dataset.type = item.type;
            const icon = item.type === 'directory' ? '📁' : '📄';
            itemElement.innerHTML = `<span class="item-icon">${icon}</span> <span class="item-name">${item.name}</span>`;
            itemElement.addEventListener('click', () => {
                const newPath = pathJoin(currentDirectoryPath, item.name);
                if (item.type === 'directory') {
                    renderDirectory(newPath);
                } else {
                    filePathInput.value = newPath; // 这个路径也是相对路径
                    loadFileContent(newPath);
                }
            });
            fileBrowserDiv.appendChild(itemElement);
        });
    } catch (error) {
        fileBrowserDiv.innerHTML = '';
        showMessage(`加载目录失败: ${error.message}`, 'error');
        console.error('加载目录失败:', error);
    }
}

async function loadFileContent(filePathToLoad) { // filePathToLoad 是相对路径
    if (!currentConfiguredBasePath) {
        showMessage("请先配置并加载目标插件路径！", "error");
        return;
    }
    // ... (loadFileContent 逻辑基本不变)
    if (!filePathToLoad) {
        showMessage('文件路径无效！', 'error');
        return;
    }
    showMessage('正在加载文件内容...', 'info');
    try {
        const response = await chrome.runtime.sendMessage({ action: 'readFile', filePath: filePathToLoad });
        if (response.error) throw new Error(response.error);
        fileContentTextarea.value = response.content;
        showMessage('文件内容加载成功！', 'success');
    } catch (error) {
        console.error('加载文件失败:', error);
        showMessage(`加载文件失败: ${error.message}`, 'error');
        fileContentTextarea.value = '';
    }
}


// --- 插件展开与关闭 ---
automatorContainer.addEventListener('mouseenter', () => {
    if (!isExpanded) {
        automatorContainer.classList.add('expanded');
        collapsedText.style.display = 'none';
        expandedContent.style.display = 'block';
        isExpanded = true;
        // 展开时，如果配置未加载或失败，则加载初始配置
        if (!currentConfiguredBasePath && (pluginNameDisplay.textContent === "未配置" || pluginNameDisplay.textContent === "加载中..." || pluginNameDisplay.textContent === "配置失败")) {
            loadInitialConfig();
        } else if (currentConfiguredBasePath && fileBrowserDiv.innerHTML.trim() === "") {
            // 如果已配置但文件浏览器为空 (例如，之前配置失败后成功，或首次展开)
            renderDirectory(currentDirectoryPath);
        }
    }
});

closeBtn.addEventListener('click', (event) => { /* ... 同前 ... */ });
// 移除点击页面其他地方自动关闭的功能 (同前)

// --- 文件保存 (基本同前) ---
saveFileBtn.addEventListener('click', async () => {
    if (!currentConfiguredBasePath) {
        showMessage("请先配置并加载目标插件路径！", "error");
        return;
    }
    // ... (saveFileBtn 逻辑基本不变, filePathInput.value 是相对路径)
    const filePath = filePathInput.value.trim();
    const fileContent = fileContentTextarea.value;
    if (!filePath) {
        showMessage('没有选定文件或文件路径无效！', 'error');
        return;
    }
    showMessage('正在保存文件并同步到GitHub...', 'info');
    try {
        const response = await chrome.runtime.sendMessage({ action: 'updateFile', filePath: filePath, content: fileContent });
        if (response.error) throw new Error(response.error);
        showMessage(response.message || '操作成功完成!', 'success');
    } catch (error) {
        console.error('保存文件失败:', error);
        showMessage(`保存或同步文件失败: ${error.message}`, 'error');
    }
});

// --- 文件浏览器导航 (同前) ---
goToRootBtn.addEventListener('click', () => {
    if (currentConfiguredBasePath) renderDirectory(".");
    else showMessage("请先配置目标插件路径。", "info");
});
navigateUpBtn.addEventListener('click', () => {
    if (currentConfiguredBasePath) renderDirectory(getParentPath(currentDirectoryPath));
    else showMessage("请先配置目标插件路径。", "info");
});

// --- 内容操作功能 (同前) ---
replaceSelectedBtn.addEventListener('click', () => { /* ... */ });
replaceAllInFileBtn.addEventListener('click', () => { /* ... */ });
insertClipboardBtn.addEventListener('click', async () => { /* ... */ });
replaceAllWithClipboardBtn.addEventListener('click', async () => { /* ... */ });

// --- 页面交互处理 (同前) ---
function getCurrentPageInteractionMode() { /* ... */ }
function handleDataFromPage(data) { /* ... */ }
document.addEventListener('copy', () => { /* ... */ });
document.addEventListener('keydown', (event) => { /* ... */ });


// --- (复制粘贴之前的内容操作和页面交互的函数实现到这里) ---
// ... (ensure all previous JS logic for find/replace, clipboard, page interaction is here) ...
// Example for one, ensure others are also present
replaceAllInFileBtn.addEventListener('click', () => {
    if (!currentConfiguredBasePath) { showMessage("请先配置路径", "error"); return; }
    const findText = findTextInput.value;
    const replaceText = replaceTextInput.value;
    if (!findText) {
        showMessage('请输入要查找的内容。', 'error');
        return;
    }
    const originalContent = fileContentTextarea.value;
    // a.split(b).join(c) is a common way to replace all, but if b is a regex special char, it might not work as expected.
    // For simple string replacement, it's usually fine.
    // For more robust, use new RegExp(escapeRegExp(findText), 'g')
    const newContent = originalContent.split(findText).join(replaceText);
    if (originalContent === newContent) {
        showMessage('未找到可替换的内容。', 'info');
    } else {
        fileContentTextarea.value = newContent;
        showMessage('文件内所有匹配内容已替换。', 'success');
    }
});
// Make sure other buttons and event listeners also check for currentConfiguredBasePath if they interact with file content.

// --- 初始加载 ---
// loadInitialConfig(); // 改为在首次展开时调用