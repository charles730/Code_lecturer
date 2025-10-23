// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import MarkdownIt from 'markdown-it';
import axios from 'axios'; 

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('code-lecturer.explainCode', () => {
    
	// 1. 获取当前活动的编辑器
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return; // 没有打开的编辑器
    }

    // 2. 获取用户选择的文本
    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);

    if (!selectedText) {
      return; // 没有选中文本
    }

    // 3. 调用 AI 并显示结果
    console.log("Selected Text:", selectedText); // 暂时先打印到控制台

    callAIAndShowResult(selectedText);
  });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}


async function callAIAndShowResult(codeSnippet: string) {
  
  // 1. 从 VS Code 设置中读取 API Key
  const configuration = vscode.workspace.getConfiguration('code-lecturer');
  const apiKey = configuration.get<string>('apiKey');

  // 2. 检查用户是否配置了 API Key
  if (!apiKey) {
    vscode.window.showErrorMessage("AI 分析失败：请先在 VS Code 设置中配置 API 密钥 (code-lecturer.apiKey)");
    return; // 停止执行
  }
  
  // 3. DeepSeek API 端点，如需使用其他大模型，可以自行修改
  const apiEndpoint = "https://api.deepseek.com/chat/completions";

  // 4. 构造一个 Prompt
  const prompt = `
    你是一个专业的代码审查助手，擅长用简洁易懂但严谨专业的语言向初学者解释代码。
    请解释以下这段代码的功能：

    \`\`\`
    ${codeSnippet}
    \`\`\`

    请按以下格式回答：
    1.  **功能**：这段代码的主要作用是什么。
    2.  **逻辑**：它是如何一步步实现这个功能的。
    3.  **关键点**：(如果有的话) 指出1-2个初学者可能疑惑的关键点。
  `;

  // 5. 显示一个加载提示
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: "AI 正在分析代码...",
    cancellable: false
  }, async (progress) => {
    try {
      // 发送 API 请求
      const response = await axios.post(apiEndpoint, {
        model: "deepseek-chat", // <-- 根据需要修改模型名称
        messages: [{ role: "user", content: prompt }]
      }, {
        headers: { 'Authorization': `Bearer ${apiKey}` } // <-- 使用从设置中读取的 key
      });

      const explanation = response.data.choices[0].message.content;

      // 展示结果
      showExplanation(explanation);

    } catch (error) {
      console.error(error);
	  
	  // 错误处理
      if (axios.isAxiosError(error) && error.response) {
        // 处理 API 错误
        if (error.response.status === 401) {
          vscode.window.showErrorMessage("AI 分析失败：API 密钥无效或不正确 (401)。请检查设置。");
        } else if (error.response.status === 402) {
          vscode.window.showErrorMessage("AI 分析失败：API 密钥额度不足 (402)。");
        } else {
          vscode.window.showErrorMessage(`AI 分析失败：${error.response.status} ${error.response.statusText}`);
        }
      } else if (error instanceof Error) {
        vscode.window.showErrorMessage("AI 分析失败：" + error.message);
      } else if (typeof error === 'string') {
        vscode.window.showErrorMessage("AI 分析失败：" + error);
      } else {
        vscode.window.showErrorMessage("AI 分析失败：未知错误");
      }
    }
  });
}

// 显示 AI 解释结果的辅助函数
function showExplanation(explanation: string) {
  // 1. 创建 Webview 面板
  const panel = vscode.window.createWebviewPanel(
    'codeExplanation',
    'AI 代码解释',
    vscode.ViewColumn.Beside,
    {}
  );

  // 2. 初始化 Markdown 渲染器
  const md = new MarkdownIt({
    html: true,     // 允许 Markdown 中的 HTML 标签
    linkify: true   // 自动将 URL 转换为链接
  });

  // 3. 将 AI 返回的 Markdown 文本渲染为 HTML
  const htmlResult = md.render(explanation);

  // 4. 设置 Webview 的 HTML 内容（使用下面的辅助函数）
  panel.webview.html = getWebviewContent(htmlResult);
}

function getWebviewContent(htmlResult: string): string {
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI 代码解释</title>
        <style>
            /* * 使用 VS Code 的内置 CSS 变量
             * 来自动匹配用户的当前主题 (暗色/亮色)。
             */
            body {
                font-family: var(--vscode-font-family, sans-serif);
                font-size: var(--vscode-font-size, 1em);
                color: var(--vscode-editor-foreground);
                background-color: var(--vscode-editor-background);
                line-height: 1.6;
                padding: 25px;
            }
            h1, h2, h3 {
                border-bottom: 1px solid var(--vscode-text-separator-foreground);
                padding-bottom: 5px;
            }

            /* AI 返回的代码块样式 */
            pre {
                background-color: var(--vscode-text-block-quote-background);
                border: 1px solid var(--vscode-text-block-quote-border);
                padding: 15px;
                border-radius: 4px;
                overflow-x: auto; /* 如果代码太长，允许横向滚动 */
            }
            code {
                font-family: var(--vscode-editor-font-family, monospace);
                font-size: 0.95em;
            }

            /* AI 返回的行内代码样式 (比如 \`variable\`) */
            p > code, li > code {
                background-color: var(--vscode-text-block-quote-background);
                padding: 2px 4px;
                border-radius: 3px;
            }

            ul, ol {
                padding-left: 20px;
            }
        </style>
    </head>
    <body>
        ${htmlResult}
    </body>
    </html>
  `;
}