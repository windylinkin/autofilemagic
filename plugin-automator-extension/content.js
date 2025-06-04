// content.js
const automatorContainer = document.createElement('div');
automatorContainer.classList.add('plugin-automator-container');

const collapsedText = document.createElement('div');
collapsedText.classList.add('collapsed-text');
collapsedText.textContent = '插件修改器';
automatorContainer.appendChild(collapsedText);

const expandedContent = document.createElement('div');
expandedContent.classList.add('expanded-content');
// 移除 #automatorFilePath 相关label和input
expandedContent.innerHTML = `
    <button class="close-btn" title="关闭">&times;</button>
    <h2 id="automatorMainTitle">插件文件修改器</h2>

    <fieldset class="config-section">
        <legend>目标插件配置</legend>
        <div>
            <label for="automatorBaseDirPathInput">目标插件项目绝对路径:</label>
            <input type="text" id="automatorBaseDirPathInput" placeholder="例如: C:\\Users\\YourName\\Project">
        </div>
        <button id="automatorSetBaseDirBtn" class="action-btn mt-1">设置并加载</button>
        <p class="text-xs text-gray-500 mt-1">
            当前目标插件: <strong id="automatorPluginNameDisplay">未配置</strong><br/>
            路径: <span id="automatorConfiguredPathDisplay">未配置</span>
        </p>
    </fieldset>

    <div id="automatorFileInteractionArea" style="display: none;">
        <div class="file-manager-header">
             <button id="exportProjectJsonBtn" class="action-btn export-btn" title="导出项目文件为JSON到剪贴板">导出JSON</button>
        </div>
        <div class="file-manager">
            <div class="path-controls">
                <button id="automatorGoToRootBtn" title="项目根目录">🏠</button>
                <button id="automatorNavigateUpBtn" title="上一级">⬆️</button>
                <span id="automatorCurrentPathDisplay">./</span>
            </div>
            <div id="automatorFileBrowser" class="file-browser-list">
                </div>
        </div>

        <div class="mb-2 mt-2"> <label for="automatorFileContent">文件内容 (<span id="currentOpenFileNameDisplay">未选择文件</span>)</label>
            <textarea id="automatorFileContent" rows="7" placeholder="选择文件后，内容将显示在此..."></textarea>
        </div>

        <fieldset class="content-actions-fieldset small-fieldset">
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

        <fieldset class="page-interaction-fieldset small-fieldset">
            <legend>页面交互模式</legend>
            <div id="automatorPageInteractionMode" class="interaction-modes">
                <label><input type="radio" name="pageMode" value="insert" checked> 追加到末尾</label>
                <label><input type="radio" name="pageMode" value="replaceAll"> 替换全部内容</label>
                <label><input type="radio" name="pageMode" value="setFind"> 设为查找词</label>
                <label><input type="radio" name="pageMode" value="setReplace"> 设为替换词</label>
            </div>
            <p class="text-xs text-gray-500 mt-1 compact-tip">
                快捷键: Ctrl+Shift+Alt+X
            </p>
        </fieldset>

        <div class="button-group main-save-group">
            <button id="automatorSaveFileBtn" class="save-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M3 3.5A1.5 1.5 0 0 1 4.5 2h6.879a1.5 1.5 0 0 1 1.06.44l4.122 4.12A1.5 1.5 0 0 1 17 7.622V16.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 16.5v-13Zm1.5-1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V7.622a.5.5 0 0 0-.146-.353l-4.122-4.122A.5.5 0 0 0 11.379 3H4.5ZM9 14a1 1 0 1 1 2 0v2a1 1 0 1 1-2 0v-2Zm-2.5-4a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5Z"/></svg>
                保存并同步到GitHub
            </button>
        </div>
    </div> 
    <div id="automatorMessageBox" class="message-box"></div>`;
automatorContainer.appendChild(expandedContent);
document.body.appendChild(automatorContainer);

// --- UI元素获取 ---
const mainTitle = automatorContainer.querySelector('#automatorMainTitle');
// const filePathInput = automatorContainer.querySelector('#automatorFilePath'); // 移除了
const fileContentTextarea = automatorContainer.querySelector('#automatorFileContent');
const currentOpenFileNameDisplay = automatorContainer.querySelector('#currentOpenFileNameDisplay');
const saveFileBtn = automatorContainer.querySelector('#automatorSaveFileBtn');
const messageBox = automatorContainer.querySelector('#automatorMessageBox');
const closeBtn = automatorContainer.querySelector('.close-btn');
const fileBrowserDiv = automatorContainer.querySelector('#automatorFileBrowser');
const currentPathDisplay = automatorContainer.querySelector('#automatorCurrentPathDisplay');
const goToRootBtn = automatorContainer.querySelector('#automatorGoToRootBtn');
const navigateUpBtn = automatorContainer.querySelector('#automatorNavigateUpBtn');
const fileInteractionArea = automatorContainer.querySelector('#automatorFileInteractionArea');
const exportProjectJsonBtn = automatorContainer.querySelector('#exportProjectJsonBtn');

const baseDirPathInput = automatorContainer.querySelector('#automatorBaseDirPathInput');
const setBaseDirBtn = automatorContainer.querySelector('#automatorSetBaseDirBtn');
const pluginNameDisplay = automatorContainer.querySelector('#automatorPluginNameDisplay');
const configuredPathDisplay = automatorContainer.querySelector('#automatorConfiguredPathDisplay');

const findTextInput = automatorContainer.querySelector('#automatorFindText');
const replaceTextInput = automatorContainer.querySelector('#automatorReplaceText');
const replaceSelectedBtn = automatorContainer.querySelector('#automatorReplaceSelectedBtn');
const replaceAllInFileBtn = automatorContainer.querySelector('#automatorReplaceAllInFileBtn');
const insertClipboardBtn = automatorContainer.querySelector('#automatorInsertClipboardBtn');
const replaceAllWithClipboardBtn = automatorContainer.querySelector('#automatorReplaceAllWithClipboardBtn');
const pageInteractionModeRadios = automatorContainer.querySelectorAll('input[name="pageMode"]');

let isExpanded = false;
let currentDirectoryPath = "."; 
let currentConfiguredBasePath = null;
let currentOpenFileRelativePath = null; // 用于存储当前打开文件的相对路径

// --- 消息提示函数 (同前) ---
function showMessage(message, type, duration = 5000) { /* ... */ }
// --- 路径处理函数 (同前) ---
function pathJoin(base, part) { /* ... */ }
function getParentPath(currentPath) { /* ... */ }
// (复制之前的实现)
pathJoin = function(base, part) {
    if (base === "." || base === "./") {
        return "./" + part.replace(/^\.\//, '');
    }
    return base.replace(/\/$/, '') + "/" + part.replace(/^\.\//, '');
};
getParentPath = function(currentPath) {
    if (currentPath === "." || currentPath === "./") {
        return ".";
    }
    const parts = currentPath.split('/');
    if (parts.length <= 1 && parts[0] !== '.') return ".";
    if (parts.length === 1 && parts[0] === '.') return ".";
    if (parts.length === 2 && parts[0] === "." && parts[1] !== "") return ".";
    parts.pop();
    if (parts.length === 0) return ".";
    let parent = parts.join('/');
    if (parent === "" && currentPath.includes('/')) return ".";
    if (parent === "") return ".";
    return parent || ".";
};
showMessage = function(message, type, duration = 5000) {
    messageBox.textContent = message;
    messageBox.className = 'message-box';
    messageBox.classList.add(type);
    messageBox.style.display = 'block';
    setTimeout(() => {
        if (messageBox.textContent === message) {
            messageBox.style.display = 'none';
        }
    }, duration);
};


// --- 配置基础目录 ---
async function configureBaseDirectory(path) { /* ... (同前) ... */ }
setBaseDirBtn.addEventListener('click', () => { /* ... (同前) ... */ });
// (复制之前的 configureBaseDirectory 实现)
configureBaseDirectory = async function(path) {
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
            currentConfiguredBasePath = response.configuredPath;
            baseDirPathInput.value = currentConfiguredBasePath;
            pluginNameDisplay.textContent = response.pluginName || "名称读取失败";
            configuredPathDisplay.textContent = currentConfiguredBasePath;
            collapsedText.textContent = response.pluginName || "插件修改器";
            mainTitle.textContent = `${response.pluginName || "插件"} 文件修改器`;
            await chrome.runtime.sendMessage({
                action: 'saveConfig',
                data: {
                    configuredBaseDir: currentConfiguredBasePath,
                    configuredPluginName: response.pluginName
                }
            });
            showMessage(`目标插件 "${response.pluginName}" 配置成功！路径: ${currentConfiguredBasePath}`, "success");
            fileInteractionArea.style.display = 'block';
            currentDirectoryPath = ".";
            currentOpenFileRelativePath = null; // 重置当前打开文件
            currentOpenFileNameDisplay.textContent = "未选择文件";
            fileContentTextarea.value = ""; // 清空文本区
            renderDirectory(currentDirectoryPath);
            return true;
        } else {
            const errorMsg = response && response.error ? response.error : "配置失败，未知错误。";
            showMessage(`配置路径失败: ${errorMsg}`, "error");
            pluginNameDisplay.textContent = "配置失败";
            configuredPathDisplay.textContent = "无效路径";
            fileInteractionArea.style.display = 'none';
            return false;
        }
    } catch (error) {
        showMessage(`配置路径时发生通信错误: ${error.message}`, "error");
        console.error("配置路径通信错误:", error);
        fileInteractionArea.style.display = 'none';
        return false;
    }
};


// --- 初始化加载配置 (增加默认路径预填) ---
async function loadInitialConfig() {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'loadConfig',
            keys: ['configuredBaseDir', 'configuredPluginName']
        });

        if (response && response.success && response.data && response.data.configuredBaseDir) {
            const data = response.data;
            baseDirPathInput.value = data.configuredBaseDir; // 不再预填，而是加载存储的值
            pluginNameDisplay.textContent = data.configuredPluginName || "加载中...";
            configuredPathDisplay.textContent = data.configuredBaseDir;
            const success = await configureBaseDirectory(data.configuredBaseDir); // 尝试用存储的路径自动配置
            if (!success) {
                 showMessage("上次配置的路径无效或加载失败，请重新设置。", "error");
                 fileInteractionArea.style.display = 'none';
            }
        } else { // 没有存储的配置，或加载失败
            const defaultPath = "C:\\Users\\halfhalf\\Documents\\GitHub\\autofilemagic\\plugin-automator-extension"; // 您的默认路径
            baseDirPathInput.value = defaultPath;
            pluginNameDisplay.textContent = "未配置";
            configuredPathDisplay.textContent = "请点击“设置并加载”或输入新路径";
            if (response && !response.success && response.error && response.error.includes("Cannot read properties of undefined (reading 'local')") ) {
                 showMessage("存储权限缺失或API不可用。请检查插件manifest.json中的'storage'权限。", "error", 10000);
            } else {
                showMessage("请配置目标插件的项目路径。已为您填入建议的默认路径。", "info");
            }
            fileInteractionArea.style.display = 'none';
        }
    } catch (e) {
        console.error("读取本地存储或配置时发生错误:", e);
        showMessage(`读取配置失败: ${e.message}。请手动配置。`, "error");
        fileInteractionArea.style.display = 'none';
    }
}

// --- 文件浏览与加载 (修改高亮逻辑) ---
async function renderDirectory(dirPath) {
    // ... (renderDirectory 逻辑，在 itemElement.addEventListener 中修改)
    if (!currentConfiguredBasePath) {
        showMessage("请先配置并加载目标插件路径！", "error");
        fileBrowserDiv.innerHTML = '<div class="empty-directory">请先配置路径</div>';
        return;
    }
    currentDirectoryPath = dirPath;
    currentPathDisplay.textContent = dirPath;
    fileBrowserDiv.innerHTML = '<div class="loading-spinner"></div>';
    navigateUpBtn.disabled = (dirPath === "." || dirPath === "./");

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'listDirectory',
            directoryPath: dirPath
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
            
            // 如果是当前打开的文件，添加高亮
            const fullItemPath = pathJoin(currentDirectoryPath, item.name);
            if (item.type === 'file' && fullItemPath === currentOpenFileRelativePath) {
                itemElement.classList.add('selected-file');
            }

            itemElement.addEventListener('click', () => {
                const newPathForAction = pathJoin(currentDirectoryPath, item.name);
                if (item.type === 'directory') {
                    renderDirectory(newPathForAction);
                } else {
                    // 移除旧的高亮
                    const previouslySelected = fileBrowserDiv.querySelector('.selected-file');
                    if (previouslySelected) {
                        previouslySelected.classList.remove('selected-file');
                    }
                    // 添加新的高亮
                    itemElement.classList.add('selected-file');
                    currentOpenFileRelativePath = newPathForAction; // 更新当前打开文件的相对路径
                    currentOpenFileNameDisplay.textContent = item.name; // 显示文件名
                    loadFileContent(newPathForAction);
                }
            });
            fileBrowserDiv.appendChild(itemElement);
        });
    } catch (error) { /* ... */ }
}

async function loadFileContent(filePathToLoad) {
    // ... (loadFileContent 逻辑，增加动画)
    if (!currentConfiguredBasePath) { /* ... */ return; }
    if (!filePathToLoad) { /* ... */ return; }
    
    fileContentTextarea.classList.add('content-loading'); // 开始加载动画类
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
        currentOpenFileNameDisplay.textContent = "加载失败";
    } finally {
        // 动画效果：短暂延迟后移除loading并添加loaded，触发fade-in
        setTimeout(() => {
            fileContentTextarea.classList.remove('content-loading');
            fileContentTextarea.classList.add('content-loaded');
            // 动画结束后移除loaded类，以便下次能再次触发
            setTimeout(() => fileContentTextarea.classList.remove('content-loaded'), 300);
        }, 100); // 短暂延迟确保内容已渲染
    }
}

// --- 插件展开与关闭 (同前) ---
automatorContainer.addEventListener('mouseenter', () => { /* ... */ });
closeBtn.addEventListener('click', (event) => { /* ... */ });

// --- 文件保存 (使用 currentOpenFileRelativePath) ---
saveFileBtn.addEventListener('click', async () => {
    if (!currentConfiguredBasePath) { /* ... */ return; }
    if (!currentOpenFileRelativePath) {
        showMessage('没有选定要保存的文件！', 'error');
        return;
    }
    const fileContent = fileContentTextarea.value;
    showMessage('正在保存文件并同步到GitHub...', 'info');
    try {
        const response = await chrome.runtime.sendMessage({ 
            action: 'updateFile', 
            filePath: currentOpenFileRelativePath, // 使用存储的相对路径
            content: fileContent 
        });
        if (response.error) throw new Error(response.error);
        showMessage(response.message || '操作成功完成!', 'success');
    } catch (error) { /* ... */ }
});

// --- 文件浏览器导航 (同前) ---
goToRootBtn.addEventListener('click', () => { /* ... */ });
navigateUpBtn.addEventListener('click', () => { /* ... */ });

// --- 内容操作功能 (同前) ---
function ensureConfigured(callback) { /* ... */ }
replaceSelectedBtn.addEventListener('click', () => { /* ... */ });
replaceAllInFileBtn.addEventListener('click', () => { /* ... */ });
insertClipboardBtn.addEventListener('click', async () => { /* ... */ });
replaceAllWithClipboardBtn.addEventListener('click', async () => { /* ... */ });

// --- 页面交互处理 (同前) ---
function getCurrentPageInteractionMode() { /* ... */ }
function handleDataFromPage(data) { /* ... */ }
document.addEventListener('copy', () => { /* ... */ });
document.addEventListener('keydown', (event) => { /* ... */ });

// (复制之前的内容操作和页面交互的函数实现到这里)
// 确保所有相关函数都已包含
ensureConfigured = function(callback) {
    if (!currentConfiguredBasePath) {
        showMessage("请先配置并加载目标插件路径！", "error");
        return;
    }
    if (callback) callback();
};
// ... (其他函数实现) ...

// --- 新增：导出项目为 JSON ---
exportProjectJsonBtn.addEventListener('click', async () => {
    ensureConfigured(async () => {
        showMessage("正在准备导出项目JSON...", "info", 15000); // 长一点的提示时间
        try {
            const response = await chrome.runtime.sendMessage({ action: 'exportProjectJson' });
            if (response && response.success && response.data) {
                const jsonString = JSON.stringify(response.data, null, 2); // 美化JSON输出
                await navigator.clipboard.writeText(jsonString);
                showMessage("项目JSON数据已复制到剪贴板！", "success");
            } else {
                const errorMsg = response && response.error ? response.error : "导出失败，未知错误。";
                showMessage(`导出JSON失败: ${errorMsg}`, "error");
            }
        } catch (error) {
            showMessage(`导出JSON时发生通信错误: ${error.message}`, "error");
            console.error("导出JSON错误:", error);
        }
    });
});

// 初始化加载配置 (在mouseenter时触发)