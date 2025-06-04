// server.js (原 1.js)
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// 假设此服务器脚本 (1.js) 位于目标插件项目 (plugin-automator-extension) 的父目录下的某个文件夹中
// 例如: project-root/server-scripts/1.js
// 而插件目录是: project-root/plugin-automator-extension
// 那么 BASE_DIR 应该这样设置：
const BASE_DIR = path.resolve(__dirname, '..', '\autofilemagic/plugin-automator-extension');
// 如果 1.js 直接位于 plugin-automator-extension 的父目录 (e.g., project-root/1.js):
// const BASE_DIR = path.resolve(__dirname, 'plugin-automator-extension');
// 请根据您的实际文件结构确认此路径。
console.log(`服务器将操作的基目录 (BASE_DIR): ${BASE_DIR}`);
if (!fs.existsSync(BASE_DIR) || !fs.statSync(BASE_DIR).isDirectory()) {
    console.error(`错误: BASE_DIR ("${BASE_DIR}") 不是一个有效的目录。请检查路径。`);
    // process.exit(1); // 考虑在配置错误时退出
}


function executeCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, { cwd: BASE_DIR }, (error, stdout, stderr) => {
            // console.log(`CMD: ${command}\nSTDOUT: ${stdout}\nSTDERR: ${stderr}\nERROR_OBJ: ${error}`); // 调试日志

            if (error) { // 命令以非零状态码退出
                const noChangesMessages = ['nothing to commit', 'no changes added to commit'];
                const stdoutHasNoChanges = stdout && noChangesMessages.some(msg => stdout.toLowerCase().includes(msg.toLowerCase()));
                const stderrHasNoChanges = stderr && noChangesMessages.some(msg => stderr.toLowerCase().includes(msg.toLowerCase()));

                // 特别处理 git commit 时没有实际更改的情况
                if (command.startsWith('git commit') && (stdoutHasNoChanges || stderrHasNoChanges)) {
                    console.warn(`Git commit 命令 [${command}] 没有实际更改需要提交。Stdout: ${stdout}`);
                    return resolve({ stdout, stderr, noChanges: true }); // 解析为“无更改”状态
                }
                
                // 其他真实错误
                console.error(`命令 [${command}] 执行失败。Error: ${error.message}. Stdout: [${stdout}]. Stderr: [${stderr}]`);
                return reject({ error: error, stdout, stderr, command });
            }
            // 命令成功执行 (状态码 0)
            resolve({ stdout, stderr });
        });
    });
}

// API 接口：读取文件内容 (保持不变)
app.post('/read-file', async (req, res) => {
    const { filePath } = req.body;
    if (!filePath) {
        return res.status(400).json({ error: '文件路径不能为空。' });
    }
    const fullPath = path.resolve(BASE_DIR, filePath);
    if (!fullPath.startsWith(BASE_DIR)) {
        return res.status(403).json({ error: '不允许访问此路径。' });
    }
    try {
        const content = await fs.promises.readFile(fullPath, 'utf8');
        res.json({ content });
    } catch (error) {
        console.error(`读取文件失败: ${fullPath}`, error);
        res.status(500).json({ error: `无法读取文件: ${error.message}` });
    }
});

// API 接口：列出目录内容 (保持不变)
app.post('/list-directory', async (req, res) => {
    const { directoryPath = '.' } = req.body;
    const fullDirectoryPath = path.resolve(BASE_DIR, directoryPath);
    if (!fullDirectoryPath.startsWith(BASE_DIR)) {
        return res.status(403).json({ error: '不允许访问此路径。' });
    }
    try {
        const items = await fs.promises.readdir(fullDirectoryPath, { withFileTypes: true });
        const result = items.map(item => ({
            name: item.name,
            type: item.isDirectory() ? 'directory' : 'file'
        })).sort((a, b) => {
            if (a.type === 'directory' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'directory') return 1;
            return a.name.localeCompare(b.name);
        });
        res.json({ items: result });
    } catch (error) {
        console.error(`列出目录失败: ${fullDirectoryPath}`, error);
        res.status(500).json({ error: `无法列出目录内容: ${error.message}` });
    }
});


// API 接口：更新文件内容并同步到 GitHub (修改部分)
app.post('/update-file', async (req, res) => {
    const { filePath, content } = req.body;

    if (!filePath || content === undefined) {
        return res.status(400).json({ error: '文件路径和内容不能为空。' });
    }

    const fullPath = path.resolve(BASE_DIR, filePath); // 确保路径是绝对的以便后续处理
    if (!fullPath.startsWith(BASE_DIR)) {
        return res.status(403).json({ error: '不允许写入此路径。' });
    }

    // 获取相对于 BASE_DIR 的路径，并确保使用正斜杠，这对于git命令很重要
    const relativeFilePath = path.relative(BASE_DIR, fullPath).replace(/\\/g, '/');

    try {
        await fs.promises.writeFile(fullPath, content, 'utf8');
        console.log(`文件已写入: ${fullPath}`);

        await executeCommand(`git add "${relativeFilePath}"`);
        
        const commitMessage = `Auto update ${path.basename(relativeFilePath)} from browser extension`;
        const commitResult = await executeCommand(`git commit -m "${commitMessage}"`);

        if (commitResult.noChanges) {
            console.log(`针对文件 "${relativeFilePath}" 的 Git commit 没有实际内容更改。`);
            // 即使当前文件没有commit，也尝试推送，以同步仓库中可能存在的其他已提交但未推送的更改。
            // 如果希望仅在有新提交时推送，则需要更复杂的逻辑来检查本地与远程差异。
            // 为简单起见，这里仍尝试推送。
            try {
                const pushResult = await executeCommand('git push origin main'); // 假设您的主分支是 'main'
                if (pushResult.stdout.toLowerCase().includes("everything up-to-date") || 
                    (pushResult.stderr && pushResult.stderr.toLowerCase().includes("everything up-to-date"))) {
                    return res.json({ message: `文件 "${relativeFilePath}" 已保存。内容无更改或已是最新，无需同步到 GitHub。` });
                }
                return res.json({ message: `文件 "${relativeFilePath}" 已保存，内容无新提交，但已尝试推送仓库其他潜在更改。` });
            } catch (pushError) {
                 // 如果推送到这里也失败了 (例如认证问题)，则需要捕获并报告
                console.error('在 "noChanges" 后尝试推送失败:', pushError);
                let pushErrorMessage = '尝试推送时发生错误。';
                 if (pushError.command && pushError.error) { // Error from executeCommand
                    if (pushError.stdout.includes('Authentication failed') || pushError.stderr.includes('Authentication failed')) {
                        pushErrorMessage = 'Git 认证失败，请检查您的 GitHub 凭证。';
                    } else if (pushError.stderr) {
                        pushErrorMessage = `Git push 失败: ${pushError.stderr.split('\n')[0]}`;
                    } else if (pushError.stdout) {
                        pushErrorMessage = `Git push 失败 (stdout): ${pushError.stdout.split('\n')[0]}`;
                    }
                }
                return res.status(500).json({ error: `文件 "${relativeFilePath}" 已保存，内容无新提交。但后续推送到 GitHub 失败: ${pushErrorMessage}` });
            }
        }

        // 如果 commitResult.noChanges 为 false，表示提交成功（或应该成功）
        await executeCommand('git push origin main'); // 假设您的主分支是 'main'
        res.json({ message: `文件 "${relativeFilePath}" 已保存并成功同步到 GitHub。` });

    } catch (caughtError) {
        // 这个 catch 块处理 executeCommand 的 reject 或文件系统错误
        console.error(`更新文件 "${relativeFilePath}" 或 Git 同步失败 (外部 catch):`, caughtError);
        
        let errorMessage = '服务器内部错误。';
        if (caughtError.command && caughtError.error) { // 来自 executeCommand 的错误结构
            const cmdBase = caughtError.command.split(' ')[0]; // e.g., "git"
            const actualError = caughtError.error; // node child_process Error 对象
            const stdout = caughtError.stdout || "";
            const stderr = caughtError.stderr || "";

            if (stdout.includes('Authentication failed') || stderr.includes('Authentication failed')) {
                errorMessage = 'Git 认证失败，请检查您的 GitHub 凭证。';
            } else if (stderr.trim()) { // 优先使用 stderr
                errorMessage = `Git 命令 [${cmdBase}] 失败: ${stderr.split('\n')[0].trim()}`;
            } else if (stdout.trim() && actualError.code !== 0) { // 如果有stdout且命令确实失败了
                 errorMessage = `Git 命令 [${cmdBase}] 失败 (stdout): ${stdout.split('\n')[0].trim()}`;
            } else if (actualError && actualError.message) {
                errorMessage = `Git 命令 [${cmdBase}] 执行出错: ${actualError.message.split('\n')[0].trim()}`;
            } else {
                errorMessage = `Git 命令 [${cmdBase}] 操作失败，退出码: ${actualError ? actualError.code : '未知'}`;
            }
        } else if (caughtError.code === 'ENOENT') { // 文件系统错误
            errorMessage = `指定的文件或目录不存在: ${relativeFilePath}`;
        } else if (caughtError.message) { // 其他 JS 错误
            errorMessage = `操作失败: ${caughtError.message}`;
        }
        res.status(500).json({ error: errorMessage });
    }
});

// 启动服务器 (保持不变)
app.listen(port, () => {
    console.log(`本地开发服务器正在运行于 http://localhost:${port}`);
    console.log(`请确保您的目标浏览器插件项目位于: ${BASE_DIR}`);
    console.log('请安装并启用“插件自动化修改器”浏览器扩展程序。');
});