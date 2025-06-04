// content.js
const automatorContainer = document.createElement('div');
automatorContainer.classList.add('plugin-automator-container');

const collapsedText = document.createElement('div');
collapsedText.classList.add('collapsed-text');
collapsedText.textContent = '插件修改器';
automatorContainer.appendChild(collapsedText);

const expandedContent = document.createElement('div');
expandedContent.classList.add('expanded-content');

// 更新HTML结构顺序
expandedContent.innerHTML = `
    <button class="close-btn" title="关闭">&times;</button>
    <h2 id="automatorMainTitle">插件文件修改器</h2>

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

        <div class="mb-2 mt-2">
            <label for="automatorFileContent">文件内容 (<span id="currentOpenFileNameDisplay">未选择文件</span>)</label>
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

    <div id="automatorMessageBox" class="message-box"></div>

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

    <div class="export-section">
         <button id="exportProjectJsonBtn" class="action-btn export-btn" title="导出项目文件为JSON到剪贴板">导出项目为JSON</button>
    </div>`;
    // 注意：原MessageBox在最末尾，现在移到了Config区和Export区之前，并从原位置删除。

automatorContainer.appendChild(expandedContent);
document.body.appendChild(automatorContainer);

console.log("Plugin Automator: UI elements created and appended to body.");

// --- UI元素获取 ---
const mainTitle = automatorContainer.querySelector('#automatorMainTitle');
const fileContentTextarea = automatorContainer.querySelector('#automatorFileContent');
const currentOpenFileNameDisplay = automatorContainer.querySelector('#currentOpenFileNameDisplay');
const saveFileBtn = automatorContainer.querySelector('#automatorSaveFileBtn');
const messageBox = automatorContainer.querySelector('#automatorMessageBox'); // 确保获取的是新位置的 messageBox
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
let currentOpenFileRelativePath = null;

// --- 消息提示函数 ---
function showMessage(message, type, duration = 5000) {
    messageBox.textContent = message;
    messageBox.className = 'message-box'; // Reset classes first
    messageBox.classList.add(type);
    messageBox.style.display = 'block';
    if (messageBox.timeoutId) {
        clearTimeout(messageBox.timeoutId);
    }
    messageBox.timeoutId = setTimeout(() => {
        if (messageBox.textContent === message) { // Only hide if it's still the same message
            messageBox.style.display = 'none';
        }
    }, duration);
}

// --- 路径处理函数 ---
function pathJoin(base, part) {
    if (base === "." || base === "./") {
        return "./" + part.replace(/^\.\//, '');
    }
    return base.replace(/\/$/, '') + "/" + part.replace(/^\.\//, '');
};
function getParentPath(currentPath) {
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
    if (parent === "") return "."; // Covers cases like single folder name "foo" becoming empty
    return parent || ".";
};

// --- 配置基础目录 ---
async function configureBaseDirectory(path) {
    console.log("Plugin Automator: configureBaseDirectory called with path:", path);
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
        console.log("Plugin Automator: Response from configBaseDir:", response);

        if (response && response.success) {
            currentConfiguredBasePath = response.configuredPath;
            baseDirPathInput.value = currentConfiguredBasePath; // Update input with potentially resolved path from server
            pluginNameDisplay.textContent = response.pluginName || "名称读取失败";
            configuredPathDisplay.textContent = currentConfiguredBasePath;
            collapsedText.textContent = response.pluginName || "插件修改器"; // Update collapsed title
            mainTitle.textContent = `${response.pluginName || "插件"} 文件修改器`; // Update expanded title

            // 使用后台脚本保存配置
            await chrome.runtime.sendMessage({
                action: 'saveConfig',
                data: {
                    configuredBaseDir: currentConfiguredBasePath,
                    configuredPluginName: response.pluginName
                }
            });
            
            showMessage(`目标插件 "${response.pluginName}" 配置成功！路径: ${currentConfiguredBasePath}`, "success");
            fileInteractionArea.style.display = 'block'; // 显示交互区域
            currentDirectoryPath = "."; // 重置浏览路径
            currentOpenFileRelativePath = null; // 重置当前打开文件
            currentOpenFileNameDisplay.textContent = "未选择文件";
            fileContentTextarea.value = ""; // 清空文本区
            renderDirectory(currentDirectoryPath); // 加载根目录
            return true;
        } else {
            const errorMsg = response && response.error ? response.error : "配置失败，未知错误。";
            showMessage(`配置路径失败: ${errorMsg}`, "error");
            pluginNameDisplay.textContent = "配置失败";
            configuredPathDisplay.textContent = "无效路径";
            fileInteractionArea.style.display = 'none'; // 隐藏交互区域
            return false;
        }
    } catch (error) {
        showMessage(`配置路径时发生通信错误: ${error.message}`, "error");
        console.error("Plugin Automator: 配置路径通信错误:", error);
        fileInteractionArea.style.display = 'none';
        return false;
    }
}

setBaseDirBtn.addEventListener('click', () => {
    console.log("Plugin Automator: Set Base Dir button clicked.");
    const newPath = baseDirPathInput.value.trim();
    configureBaseDirectory(newPath);
});

// --- 初始化加载配置 ---
async function loadInitialConfig() {
    console.log("Plugin Automator: loadInitialConfig called.");
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'loadConfig',
            keys: ['configuredBaseDir', 'configuredPluginName']
        });
        console.log("Plugin Automator: Response from loadConfig:", response);

        if (response && response.success && response.data && response.data.configuredBaseDir) {
            const data = response.data;
            baseDirPathInput.value = data.configuredBaseDir;
            // pluginNameDisplay & configuredPathDisplay will be set by configureBaseDirectory
            const success = await configureBaseDirectory(data.configuredBaseDir);
            if (!success) {
                 showMessage("上次配置的路径无效或加载失败，请重新设置。", "error");
                 fileInteractionArea.style.display = 'none';
            }
        } else {
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
        console.error("Plugin Automator: 读取本地存储或配置时发生错误:", e);
        showMessage(`读取配置失败: ${e.message}。请手动配置。`, "error");
        fileInteractionArea.style.display = 'none';
    }
}

// --- 文件浏览与加载 ---
async function renderDirectory(dirPath) {
    console.log("Plugin Automator: renderDirectory called for path:", dirPath);
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
            
            const fullItemPath = pathJoin(currentDirectoryPath, item.name);
            if (item.type === 'file' && fullItemPath === currentOpenFileRelativePath) {
                itemElement.classList.add('selected-file');
            }

            itemElement.addEventListener('click', () => {
                const newPathForAction = pathJoin(currentDirectoryPath, item.name);
                if (item.type === 'directory') {
                    renderDirectory(newPathForAction);
                } else {
                    const previouslySelected = fileBrowserDiv.querySelector('.selected-file');
                    if (previouslySelected) {
                        previouslySelected.classList.remove('selected-file');
                    }
                    itemElement.classList.add('selected-file');
                    currentOpenFileRelativePath = newPathForAction;
                    currentOpenFileNameDisplay.textContent = item.name;
                    loadFileContent(newPathForAction);
                }
            });
            fileBrowserDiv.appendChild(itemElement);
        });
    } catch (error) {
        fileBrowserDiv.innerHTML = '';
        showMessage(`加载目录 "${dirPath}" 失败: ${error.message}`, 'error');
        console.error('Plugin Automator: 加载目录失败:', error);
    }
}

async function loadFileContent(filePathToLoad) {
    console.log("Plugin Automator: loadFileContent called for:", filePathToLoad);
    if (!currentConfiguredBasePath) {
        showMessage("请先配置并加载目标插件路径！", "error");
        return;
    }
    if (!filePathToLoad) {
        showMessage('文件路径无效！', 'error');
        return;
    }
    
    fileContentTextarea.classList.add('content-loading');
    currentOpenFileNameDisplay.textContent = `加载中: ${filePathToLoad.split('/').pop()}`;
    showMessage('正在加载文件内容...', 'info');
    
    try {
        const response = await chrome.runtime.sendMessage({ action: 'readFile', filePath: filePathToLoad });
        if (response.error) throw new Error(response.error);
        
        fileContentTextarea.value = response.content;
        currentOpenFileNameDisplay.textContent = filePathToLoad.split('/').pop();
        showMessage('文件内容加载成功！', 'success');
    } catch (error) {
        console.error('Plugin Automator: 加载文件失败:', error);
        showMessage(`加载文件 "${filePathToLoad}" 失败: ${error.message}`, 'error');
        fileContentTextarea.value = '';
        currentOpenFileNameDisplay.textContent = "加载失败";
    } finally {
        setTimeout(() => {
            fileContentTextarea.classList.remove('content-loading');
            fileContentTextarea.classList.add('content-loaded');
            setTimeout(() => fileContentTextarea.classList.remove('content-loaded'), 300);
        }, 100);
    }
}

// --- 插件展开与关闭 ---
automatorContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('close-btn')) {
        return; 
    }
    if (isExpanded && expandedContent.contains(event.target)) {
        // If click is inside already expanded content, and not on the container itself (i.e., on specific elements), do nothing here.
        // This prevents collapsing when clicking on buttons, inputs, etc. inside the expanded panel.
        // If we want click on empty space within expanded panel to do something, this needs adjustment.
        if (event.target !== expandedContent) { // Allow click on direct background of expandedContent to do nothing.
            return;
        }
    }

    if (!isExpanded) {
        console.log('Plugin Automator: Clicked to expand. isExpanded:', isExpanded);
        automatorContainer.classList.add('expanded');
        collapsedText.style.display = 'none';
        expandedContent.style.display = 'block';
        isExpanded = true;
        console.log('Plugin Automator: Expanded.');

        if (!currentConfiguredBasePath && (pluginNameDisplay.textContent === "未配置" || pluginNameDisplay.textContent === "加载中..." || pluginNameDisplay.textContent === "配置失败")) {
            console.log('Plugin Automator: Calling loadInitialConfig on expand...');
            loadInitialConfig();
        } else if (currentConfiguredBasePath && 
                   (fileBrowserDiv.innerHTML.trim() === "" || fileBrowserDiv.querySelector('.empty-directory') || fileBrowserDiv.querySelector('.loading-spinner')) && 
                   fileInteractionArea.style.display === 'block') {
            console.log('Plugin Automator: Calling renderDirectory on expand (already configured)...');
             renderDirectory(currentDirectoryPath);
        }
    }
});

closeBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    console.log('Plugin Automator: Close button clicked.');
    automatorContainer.classList.remove('expanded');
    collapsedText.style.display = 'block';
    expandedContent.style.display = 'none';
    isExpanded = false;
});


// --- 文件保存 ---
saveFileBtn.addEventListener('click', async () => {
    console.log("Plugin Automator: Save button clicked.");
    ensureConfigured(async () => {
        if (!currentOpenFileRelativePath) {
            showMessage('没有选定要保存的文件！', 'error');
            return;
        }
        const fileContent = fileContentTextarea.value;
        showMessage('正在保存文件并同步到GitHub...', 'info');
        try {
            const response = await chrome.runtime.sendMessage({ 
                action: 'updateFile', 
                filePath: currentOpenFileRelativePath,
                content: fileContent 
            });
            if (response.error) throw new Error(response.error);
            showMessage(response.message || '操作成功完成!', 'success');
        } catch (error) {
            console.error('Plugin Automator: 保存文件失败:', error);
            showMessage(`保存或同步文件失败: ${error.message}`, 'error');
        }
    }, true); 
});

// --- 文件浏览器导航 ---
goToRootBtn.addEventListener('click', () => {
    ensureConfigured(() => renderDirectory("."));
});
navigateUpBtn.addEventListener('click', () => {
    ensureConfigured(() => renderDirectory(getParentPath(currentDirectoryPath)));
});

// --- 内容操作功能 ---
function ensureConfigured(callback, requireFileOpen = false) {
    if (!currentConfiguredBasePath) {
        showMessage("请先配置并加载目标插件路径！", "error");
        return false;
    }
    if (requireFileOpen && !currentOpenFileRelativePath) {
        showMessage("请先选择一个文件进行操作！", "error");
        return false;
    }
    if (callback) callback();
    return true;
}

replaceSelectedBtn.addEventListener('click', () => {
    ensureConfigured(() => {
        const findText = findTextInput.value;
        const replaceText = replaceTextInput.value;
        const start = fileContentTextarea.selectionStart;
        const end = fileContentTextarea.selectionEnd;

        if (start === end) {
            showMessage('请先在文件内容区选中文本。', 'info');
            return;
        }
        if (fileContentTextarea.value.substring(start, end) === findText || !findText) {
            const before = fileContentTextarea.value.substring(0, start);
            const after = fileContentTextarea.value.substring(end);
            fileContentTextarea.value = before + replaceText + after;
            showMessage('选中内容已替换。', 'success');
            fileContentTextarea.focus();
            fileContentTextarea.setSelectionRange(start, start + replaceText.length);
        } else {
            showMessage('选中的文本与“查找内容”不符。请确保一致或清空“查找内容”框以直接替换选中区。', 'error');
        }
    }, true);
});

replaceAllInFileBtn.addEventListener('click', () => {
    ensureConfigured(() => {
        const findText = findTextInput.value;
        const replaceText = replaceTextInput.value;
        if (!findText) {
            showMessage('请输入要查找的内容。', 'error');
            return;
        }
        const originalContent = fileContentTextarea.value;
        const newContent = originalContent.split(findText).join(replaceText);
        if (originalContent === newContent) {
            showMessage('未找到可替换的内容。', 'info');
        } else {
            fileContentTextarea.value = newContent;
            showMessage('文件内所有匹配内容已替换。', 'success');
        }
    }, true);
});

insertClipboardBtn.addEventListener('click', async () => {
    ensureConfigured(async () => {
         try {
            const clipboardText = await navigator.clipboard.readText();
            if (!clipboardText) {
                showMessage('粘贴板为空。', 'info');
                return;
            }
            const start = fileContentTextarea.selectionStart;
            const end = fileContentTextarea.selectionEnd;
            const before = fileContentTextarea.value.substring(0, start);
            const after = fileContentTextarea.value.substring(end);
            fileContentTextarea.value = before + clipboardText + after;
            showMessage('粘贴板内容已插入。', 'success');
            fileContentTextarea.focus();
            fileContentTextarea.setSelectionRange(start + clipboardText.length, start + clipboardText.length);
        } catch (err) {
            showMessage('读取粘贴板失败: ' + err.message, 'error');
            console.error('读取粘贴板失败:', err);
        }
    }, true);
});

replaceAllWithClipboardBtn.addEventListener('click', async () => {
    ensureConfigured(async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            if (clipboardText === null || clipboardText === undefined) {
                showMessage('粘贴板为空或无法读取。', 'info');
                return;
            }
            fileContentTextarea.value = clipboardText;
            showMessage('文件内容已全部替换为粘贴板内容。', 'success');
        } catch (err) {
            showMessage('读取粘贴板失败: ' + err.message, 'error');
            console.error('读取粘贴板失败:', err);
        }
    }, true);
});


// --- 页面交互处理 ---
function getCurrentPageInteractionMode() {
    for (const radio of pageInteractionModeRadios) {
        if (radio.checked) { return radio.value; }
    }
    return 'insert';
};

function handleDataFromPage(data) {
    const mode = getCurrentPageInteractionMode();
    const requireFileOpenForMode = (mode === 'insert' || mode === 'replaceAll');

    ensureConfigured(() => {
        if (!data || data.trim() === "") { 
            showMessage("从页面获取的数据为空。", "info");
            return;
        }
        if (!isExpanded) { 
            automatorContainer.classList.add('expanded');
            collapsedText.style.display = 'none';
            expandedContent.style.display = 'block';
            isExpanded = true;
            if (!currentConfiguredBasePath) loadInitialConfig();
        }
        fileContentTextarea.focus();
        
        switch (mode) {
            case 'insert':
                fileContentTextarea.value += (fileContentTextarea.value ? "\n" : "") + data;
                showMessage('页面内容已追加。', 'success');
                fileContentTextarea.scrollTop = fileContentTextarea.scrollHeight;
                break;
            case 'replaceAll':
                fileContentTextarea.value = data;
                showMessage('文件内容已替换为页面内容。', 'success');
                break;
            case 'setFind':
                findTextInput.value = data;
                showMessage(`查找词已设为: "${data}"`, 'success');
                findTextInput.focus();
                break;
            case 'setReplace':
                replaceTextInput.value = data;
                showMessage(`替换词已设为: "${data}"`, 'success');
                replaceTextInput.focus();
                break;
        }
    }, requireFileOpenForMode); 
};

document.addEventListener('copy', () => { /* No automatic action on copy */ });

document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.altKey && (event.key === 'X' || event.key === 'x')) {
        event.preventDefault();
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
            handleDataFromPage(selectedText);
        } else {
            showMessage("请先在页面上选中文本后再使用快捷键。", "info");
        }
    }
});

// --- 新增：导出项目为 JSON ---
exportProjectJsonBtn.addEventListener('click', async () => {
    console.log("Plugin Automator: Export JSON button clicked.");
    ensureConfigured(async () => {
        showMessage("正在准备导出项目JSON...", "info", 15000);
        try {
            const response = await chrome.runtime.sendMessage({ action: 'exportProjectJson' });
            console.log("Plugin Automator: Response from exportProjectJson:", response);
            if (response && response.success && response.data) {
                const jsonString = JSON.stringify(response.data, null, 2); // Beautify JSON output
                await navigator.clipboard.writeText(jsonString);
                showMessage("项目JSON数据已复制到剪贴板！ (" + response.data.length + " files)", "success");
            } else {
                const errorMsg = response && response.error ? response.error : "导出失败，未知错误。";
                showMessage(`导出JSON失败: ${errorMsg}`, "error");
            }
        } catch (error) {
            showMessage(`导出JSON时发生通信错误: ${error.message}`, "error");
            console.error("Plugin Automator: 导出JSON错误:", error);
        }
    });
});

// Initial load logic will be triggered on first click/expand if not configured
console.log("Plugin Automator: content.js loaded and event listeners should be active.");