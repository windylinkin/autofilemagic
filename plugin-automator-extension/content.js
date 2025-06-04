// content.js
const automatorContainer = document.createElement('div');
automatorContainer.classList.add('plugin-automator-container');

const collapsedText = document.createElement('div');
collapsedText.classList.add('collapsed-text');
collapsedText.textContent = '插件修改器';
automatorContainer.appendChild(collapsedText);

const expandedContent = document.createElement('div');
expandedContent.classList.add('expanded-content');
expandedContent.innerHTML = `
    <button class="close-btn" title="关闭">&times;</button>
    <h2>插件文件修改器</h2>

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
        <label for="automatorFilePath">当前文件路径</label>
        <input type="text" id="automatorFilePath" placeholder="点击上方文件加载..." readonly>
    </div>
    <div class="mb-4">
        <label for="automatorFileContent">文件内容</label>
        <textarea id="automatorFileContent" rows="10" placeholder="选择文件后，内容将显示在此..."></textarea>
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
    <div id="automatorMessageBox" class="message-box"></div>`;
automatorContainer.appendChild(expandedContent);
document.body.appendChild(automatorContainer);

// --- 主UI元素获取 ---
const filePathInput = automatorContainer.querySelector('#automatorFilePath');
const fileContentTextarea = automatorContainer.querySelector('#automatorFileContent');
const saveFileBtn = automatorContainer.querySelector('#automatorSaveFileBtn');
const messageBox = automatorContainer.querySelector('#automatorMessageBox');
const closeBtn = automatorContainer.querySelector('.close-btn');
const fileBrowserDiv = automatorContainer.querySelector('#automatorFileBrowser');
const currentPathDisplay = automatorContainer.querySelector('#automatorCurrentPathDisplay');
const goToRootBtn = automatorContainer.querySelector('#automatorGoToRootBtn');
const navigateUpBtn = automatorContainer.querySelector('#automatorNavigateUpBtn');

// --- 新增功能UI元素获取 ---
const findTextInput = automatorContainer.querySelector('#automatorFindText');
const replaceTextInput = automatorContainer.querySelector('#automatorReplaceText');
const replaceSelectedBtn = automatorContainer.querySelector('#automatorReplaceSelectedBtn');
const replaceAllInFileBtn = automatorContainer.querySelector('#automatorReplaceAllInFileBtn');
const insertClipboardBtn = automatorContainer.querySelector('#automatorInsertClipboardBtn');
const replaceAllWithClipboardBtn = automatorContainer.querySelector('#automatorReplaceAllWithClipboardBtn');
const pageInteractionModeRadios = automatorContainer.querySelectorAll('input[name="pageMode"]');

let isExpanded = false;
let currentDirectoryPath = ".";

// --- 消息提示函数 ---
function showMessage(message, type, duration = 5000) {
    messageBox.textContent = message;
    messageBox.className = 'message-box';
    messageBox.classList.add(type);
    messageBox.style.display = 'block';
    setTimeout(() => {
        if (messageBox.textContent === message) {
            messageBox.style.display = 'none';
        }
    }, duration);
}

// --- 路径处理函数 ---
function pathJoin(base, part) {
    if (base === "." || base === "./") {
        return "./" + part;
    }
    return base.replace(/\/$/, '') + "/" + part; // 确保 base 末尾没有 /
}

function getParentPath(currentPath) {
    if (currentPath === "." || currentPath === "./") {
        return ".";
    }
    const parts = currentPath.split('/');
    parts.pop();
    if (parts.length === 0 || (parts.length === 1 && parts[0] === ".")) {
        return ".";
    }
    return parts.join('/') || ".";
}

// --- 文件浏览与加载 ---
async function renderDirectory(dirPath) {
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
            itemElement.addEventListener('click', () => {
                const newPath = pathJoin(currentDirectoryPath, item.name);
                if (item.type === 'directory') {
                    renderDirectory(newPath);
                } else {
                    filePathInput.value = newPath;
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

async function loadFileContent(filePathToLoad) {
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
        if (fileBrowserDiv.innerHTML.trim() === "" || fileBrowserDiv.querySelector('.loading-spinner') || fileBrowserDiv.querySelector('.empty-directory')) {
            renderDirectory(currentDirectoryPath);
        }
    }
});

closeBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    automatorContainer.classList.remove('expanded');
    collapsedText.style.display = 'block';
    expandedContent.style.display = 'none';
    isExpanded = false;
});

// 移除点击页面其他地方自动关闭的功能
// document.addEventListener('click', (event) => {
//     if (isExpanded && !automatorContainer.contains(event.target)) {
//         if (event.target.closest('.message-box') && event.target.closest('.plugin-automator-container')) {
//             return;
//         }
//         automatorContainer.classList.remove('expanded');
//         collapsedText.style.display = 'block';
//         expandedContent.style.display = 'none';
//         isExpanded = false;
//     }
// });

// --- 文件保存 ---
saveFileBtn.addEventListener('click', async () => {
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

// --- 文件浏览器导航 ---
goToRootBtn.addEventListener('click', () => renderDirectory("."));
navigateUpBtn.addEventListener('click', () => renderDirectory(getParentPath(currentDirectoryPath)));

// --- 新增内容操作功能 ---

// 替换选中内容
replaceSelectedBtn.addEventListener('click', () => {
    const findText = findTextInput.value;
    const replaceText = replaceTextInput.value;
    const start = fileContentTextarea.selectionStart;
    const end = fileContentTextarea.selectionEnd;

    if (start === end) {
        showMessage('请先在文件内容区选中文本。', 'info');
        return;
    }
    if (fileContentTextarea.value.substring(start, end) === findText || !findText) { // 如果查找框为空，或选中内容与查找框一致
         const before = fileContentTextarea.value.substring(0, start);
         const after = fileContentTextarea.value.substring(end);
         fileContentTextarea.value = before + replaceText + after;
         showMessage('选中内容已替换。', 'success');
         // 保持焦点并选中替换后的文本
         fileContentTextarea.focus();
         fileContentTextarea.setSelectionRange(start, start + replaceText.length);
    } else {
        showMessage('选中的文本与“查找内容”不符。请确保一致或清空“查找内容”框以直接替换选中区。', 'error');
    }
});

// 文件内全部替换
replaceAllInFileBtn.addEventListener('click', () => {
    const findText = findTextInput.value;
    const replaceText = replaceTextInput.value;
    if (!findText) {
        showMessage('请输入要查找的内容。', 'error');
        return;
    }
    const originalContent = fileContentTextarea.value;
    const newContent = originalContent.split(findText).join(replaceText); // More robust than replaceAll for all browsers if no regex
    if (originalContent === newContent) {
        showMessage('未找到可替换的内容。', 'info');
    } else {
        fileContentTextarea.value = newContent;
        showMessage('文件内所有匹配内容已替换。', 'success');
    }
});

// 粘贴板内容插入光标处
insertClipboardBtn.addEventListener('click', async () => {
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
        // 保持焦点并将光标移到插入内容之后
        fileContentTextarea.focus();
        fileContentTextarea.setSelectionRange(start + clipboardText.length, start + clipboardText.length);

    } catch (err) {
        showMessage('读取粘贴板失败: ' + err.message, 'error');
        console.error('读取粘贴板失败:', err);
    }
});

// 粘贴板内容替换全部
replaceAllWithClipboardBtn.addEventListener('click', async () => {
    try {
        const clipboardText = await navigator.clipboard.readText();
         if (clipboardText === null || clipboardText === undefined) { // Check if clipboardText is actually empty vs. not readable
            showMessage('粘贴板为空或无法读取。', 'info');
            return;
        }
        fileContentTextarea.value = clipboardText;
        showMessage('文件内容已全部替换为粘贴板内容。', 'success');
    } catch (err) {
        showMessage('读取粘贴板失败: ' + err.message, 'error');
        console.error('读取粘贴板失败:', err);
    }
});


// --- 页面交互处理 ---
function getCurrentPageInteractionMode() {
    for (const radio of pageInteractionModeRadios) {
        if (radio.checked) {
            return radio.value;
        }
    }
    return 'insert'; // Default
}

function handleDataFromPage(data) {
    if (!data || data.trim() === "") {
        showMessage("从页面获取的数据为空。", "info");
        return;
    }

    if (!isExpanded) { // 如果插件未展开，先展开它
        automatorContainer.classList.add('expanded');
        collapsedText.style.display = 'none';
        expandedContent.style.display = 'block';
        isExpanded = true;
        if (fileBrowserDiv.innerHTML.trim() === "") { // 确保文件浏览器已加载
             renderDirectory(currentDirectoryPath);
        }
    }
    fileContentTextarea.focus(); // 尝试聚焦，方便用户看到变化

    const mode = getCurrentPageInteractionMode();
    switch (mode) {
        case 'insert':
            fileContentTextarea.value += (fileContentTextarea.value ? "\n" : "") + data;
            showMessage('页面内容已追加。', 'success');
            fileContentTextarea.scrollTop = fileContentTextarea.scrollHeight; // 滚动到底部
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
}

// 监听页面的复制事件
document.addEventListener('copy', () => {
    // 我们不能阻止默认的复制行为，但可以在复制后获取选中的文本
    // 延迟一小段时间确保文本已经进入系统的剪贴板或者选择状态稳定
    setTimeout(() => {
        const selectedText = window.getSelection().toString().trim();
        if (selectedText && document.activeElement && document.activeElement.closest('.plugin-automator-container') === null) {
            // 确保复制操作不是在插件内部发生的
            // console.log("Page copy detected, selected text:", selectedText);
            // 根据用户要求，复制时自动触发 handleDataFromPage
            // 这个行为可能有点过于主动，用户可能只是想普通复制
            // 暂时注释掉，让快捷键作为主要触发方式
            // handleDataFromPage(selectedText);
            // showMessage("页面内容已复制，按快捷键或在插件内操作以使用。", "info", 3000);
        }
    }, 100);
});

// 监听快捷键
document.addEventListener('keydown', (event) => {
    // Ctrl + Shift + Alt + X
    if (event.ctrlKey && event.shiftKey && event.altKey && event.key === 'X') {
        event.preventDefault();
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
            handleDataFromPage(selectedText);
        } else {
            showMessage("请先在页面上选中文本后再使用快捷键。", "info");
        }
    }
});