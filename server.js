// server.js
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

// currentConfiguredBaseDir 会在运行时通过 /config-base-dir 端点设置
let currentConfiguredBaseDir = null;
// 初始的路径仅用于启动时的日志，实际操作路径依赖 currentConfiguredBaseDir
const initialServerLocationInfo = path.resolve(__dirname, '..', 'autofilemagic/plugin-automator-extension');

console.log(`服务器脚本启动。初始预期插件位置 (仅供参考): ${initialServerLocationInfo}`);
console.log(`等待客户端配置实际操作目录...`);


function executeCommand(command, targetBaseDir) {
    return new Promise((resolve, reject) => {
        if (!targetBaseDir) {
            return reject({ error: new Error("目标基础目录未配置。"), command });
        }
        exec(command, { cwd: targetBaseDir }, (error, stdout, stderr) => {
            if (error) {
                const noChangesMessages = ['nothing to commit', 'no changes added to commit'];
                const stdoutHasNoChanges = stdout && noChangesMessages.some(msg => stdout.toLowerCase().includes(msg.toLowerCase()));
                const stderrHasNoChanges = stderr && noChangesMessages.some(msg => stderr.toLowerCase().includes(msg.toLowerCase()));

                if (command.startsWith('git commit') && (stdoutHasNoChanges || stderrHasNoChanges)) {
                    console.warn(`Git commit 命令 [${command}] 在目录 [${targetBaseDir}] 中没有实际更改需要提交。Stdout: ${stdout}`);
                    return resolve({ stdout, stderr, noChanges: true });
                }
                console.error(`命令 [${command}] 在目录 [${targetBaseDir}] 中执行失败。Error: ${error.message}. Stdout: [${stdout}]. Stderr: [${stderr}]`);
                return reject({ error: error, stdout, stderr, command });
            }
            resolve({ stdout, stderr });
        });
    });
}

// 新 API 端点：配置基础目录并获取插件信息
app.post('/config-base-dir', async (req, res) => {
    const { newPath } = req.body;
    if (!newPath) {
        return res.status(400).json({ error: '新路径不能为空。' });
    }

    try {
        const resolvedPath = path.resolve(newPath); // 解析为绝对路径
        if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isDirectory()) {
            return res.status(400).json({ error: `提供的路径 "${resolvedPath}" 无效或不是一个目录。` });
        }

        currentConfiguredBaseDir = resolvedPath; // 更新服务器当前操作的目录
        console.log(`操作目录已更新为: ${currentConfiguredBaseDir}`);

        // 尝试读取 manifest.json 获取插件名称
        const manifestPath = path.join(currentConfiguredBaseDir, 'manifest.json');
        let pluginName = '未知插件';
        if (fs.existsSync(manifestPath)) {
            try {
                const manifestContent = await fs.promises.readFile(manifestPath, 'utf8');
                const manifestData = JSON.parse(manifestContent);
                pluginName = manifestData.name || pluginName;
            } catch (e) {
                console.warn(`读取或解析 ${manifestPath} 失败: ${e.message}`);
                pluginName = '清单文件读取错误';
            }
        } else {
             pluginName = '未找到 manifest.json';
        }

        res.json({ 
            success: true, 
            message: `操作目录已设置为: ${currentConfiguredBaseDir}`,
            configuredPath: currentConfiguredBaseDir,
            pluginName: pluginName 
        });

    } catch (error) {
        console.error(`配置基础目录失败: ${error.message}`);
        res.status(500).json({ error: `配置基础目录失败: ${error.message}` });
    }
});


// 辅助函数：检查并获取当前操作目录
function getCheckedBaseDir() {
    if (!currentConfiguredBaseDir) {
        throw new Error('服务器操作目录尚未配置。请先通过插件设置目标插件路径。');
    }
    return currentConfiguredBaseDir;
}

// API 接口：读取文件内容
app.post('/read-file', async (req, res) => {
    try {
        const baseDir = getCheckedBaseDir();
        const { filePath } = req.body;
        if (!filePath) {
            return res.status(400).json({ error: '文件路径不能为空。' });
        }
        const fullPath = path.resolve(baseDir, filePath);
        if (!fullPath.startsWith(baseDir)) { // 安全检查
            return res.status(403).json({ error: '不允许访问此路径。' });
        }
        const content = await fs.promises.readFile(fullPath, 'utf8');
        res.json({ content });
    } catch (error) {
        console.error(`读取文件失败:`, error);
        res.status(500).json({ error: `读取文件失败: ${error.message}` });
    }
});

// API 接口：列出目录内容
app.post('/list-directory', async (req, res) => {
    try {
        const baseDir = getCheckedBaseDir();
        const { directoryPath = '.' } = req.body;
        const fullDirectoryPath = path.resolve(baseDir, directoryPath);
        if (!fullDirectoryPath.startsWith(baseDir)) { // 安全检查
            return res.status(403).json({ error: '不允许访问此路径。' });
        }
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
        console.error(`列出目录失败:`, error);
        res.status(500).json({ error: `无法列出目录内容: ${error.message}` });
    }
});

// API 接口：更新文件内容并同步到 GitHub
app.post('/update-file', async (req, res) => {
    let relativeFilePathForError = req.body.filePath || "未知文件"; // 用于错误消息
    try {
        const baseDir = getCheckedBaseDir();
        const { filePath, content } = req.body;

        if (!filePath || content === undefined) {
            return res.status(400).json({ error: '文件路径和内容不能为空。' });
        }

        const fullPath = path.resolve(baseDir, filePath);
        if (!fullPath.startsWith(baseDir)) { // 安全检查
            return res.status(403).json({ error: '不允许写入此路径。' });
        }
        
        const relativeFilePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        relativeFilePathForError = relativeFilePath; // 更新为更准确的路径

        await fs.promises.writeFile(fullPath, content, 'utf8');
        console.log(`文件已写入: ${fullPath}`);

        await executeCommand(`git add "${relativeFilePath}"`, baseDir);
        
        const commitMessage = `Auto update ${path.basename(relativeFilePath)} from browser extension`;
        const commitResult = await executeCommand(`git commit -m "${commitMessage}"`, baseDir);

        if (commitResult.noChanges) {
            console.log(`针对文件 "${relativeFilePath}" 在目录 [${baseDir}] 的 Git commit 没有实际内容更改。`);
            try {
                const pushResult = await executeCommand('git push origin main', baseDir);
                if (pushResult.stdout.toLowerCase().includes("everything up-to-date") || 
                    (pushResult.stderr && pushResult.stderr.toLowerCase().includes("everything up-to-date"))) {
                    return res.json({ message: `文件 "${relativeFilePath}" 已保存。内容无更改或已是最新，无需同步到 GitHub。` });
                }
                return res.json({ message: `文件 "${relativeFilePath}" 已保存，内容无新提交，但已尝试推送仓库其他潜在更改。` });
            } catch (pushError) {
                console.error('在 "noChanges" 后尝试推送失败:', pushError);
                let pushErrorMessage = '尝试推送时发生错误。';
                 if (pushError.command && pushError.error) {
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

        await executeCommand('git push origin main', baseDir);
        res.json({ message: `文件 "${relativeFilePath}" 已保存并成功同步到 GitHub。` });

    } catch (caughtError) {
        console.error(`更新文件 "${relativeFilePathForError}" 或 Git 同步失败 (外部 catch):`, caughtError);
        let errorMessage = '服务器内部错误。';
        if (caughtError.message === '服务器操作目录尚未配置。请先通过插件设置目标插件路径。') {
            errorMessage = caughtError.message;
        } else if (caughtError.command && caughtError.error) {
            const cmdBase = caughtError.command.split(' ')[0];
            const actualError = caughtError.error;
            const stdout = caughtError.stdout || "";
            const stderr = caughtError.stderr || "";
            if (stdout.includes('Authentication failed') || stderr.includes('Authentication failed')) {
                errorMessage = 'Git 认证失败，请检查您的 GitHub 凭证。';
            } else if (stderr.trim()) {
                errorMessage = `Git 命令 [${cmdBase}] 失败: ${stderr.split('\n')[0].trim()}`;
            } else if (stdout.trim() && actualError && actualError.code !== 0) {
                 errorMessage = `Git 命令 [${cmdBase}] 失败 (stdout): ${stdout.split('\n')[0].trim()}`;
            } else if (actualError && actualError.message) {
                errorMessage = `Git 命令 [${cmdBase}] 执行出错: ${actualError.message.split('\n')[0].trim()}`;
            } else {
                errorMessage = `Git 命令 [${cmdBase}] 操作失败，退出码: ${actualError ? actualError.code : '未知'}`;
            }
        } else if (caughtError.code === 'ENOENT') {
            errorMessage = `指定的文件或目录不存在: ${relativeFilePathForError}`;
        } else if (caughtError.message) {
            errorMessage = `操作失败: ${caughtError.message}`;
        }
        res.status(500).json({ error: errorMessage });
    }
});

app.listen(port, () => {
    console.log(`本地开发服务器正在运行于 http://localhost:${port}`);
    console.log(`请通过插件配置目标插件的操作目录。`);
    console.log('请安装并启用“插件自动化修改器”浏览器扩展程序。');
});