# Code Lecturer (代码讲解器) 💡

这是一个 VS Code 扩展，允许你选中一段代码，然后通过 DeepSeek API 获取对这段代码的通俗易懂的解释。

## 功能

* 选中代码，右键点击 "Explain This Code (AI)"。
* 在编辑器旁打开一个新窗口，显示 AI 的解释。
* 渲染 Markdown 格式，自动适配 VS Code 主题。

## ❗️(重要) 如何配置

本插件**需要**你自己提供 DeepSeek API 密钥。

1.  安装本插件后，打开 VS Code 的设置 (快捷键 `Cmd+,` 或 `Ctrl+,`)。
2.  在搜索框中，搜索 **`code-lecturer.apiKey`**。
3.  在输入框中，粘贴你自己的 DeepSeek API 密钥 (以 `sk-` 开头)。

## 如何使用

1.  配置好 API Key。
2.  打开任意代码文件。
3.  选中一段你想了解的代码。
4.  右键 -> "Explain This Code (AI)"。
