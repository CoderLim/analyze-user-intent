# 关键词分析工具

这是一个基于 Next.js 的关键词分析工具，可以批量分析用户意图关键词。

## 功能特性

- 🔍 支持批量关键词分析
- 🧹 自动去重和过滤纯数字关键词
- ⚙️ 可自定义每批处理的关键词数量（1-200个）
- 👆 手动控制批次处理，用户点击处理下一批
- 📊 实时显示处理统计信息
- 📝 Markdown 格式结果展示
- ⚡ 实时进度显示
- 🛡️ 错误处理和重试机制
- 🎨 现代化 UI 设计

## 技术栈

- **Next.js 14** - React 框架
- **TypeScript** - 类型安全
- **React Markdown** - Markdown 渲染
- **CSS** - 样式设计

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 打开浏览器访问 `http://localhost:3000`

## 使用方法

1. **设置批次大小**：在"每批处理关键词数量"输入框中设置每批处理的关键词数量（1-200个）
2. **输入关键词**：在文本框中输入要分析的关键词，可以用逗号或换行分隔
3. **初始化处理**：点击"初始化处理"按钮，系统会：
   - 自动去重关键词
   - 过滤掉纯数字关键词
   - 按设定数量分批
4. **手动处理批次**：点击"处理第 X 批"按钮逐批处理关键词
5. **查看结果**：每批处理完成后会显示分析结果，支持 Markdown 格式展示
6. **重新开始**：如需重新处理，点击"重新开始"按钮

## API 接口

工具调用的是以下接口：
- **URL**: `https://analyze-user-intents-with-keywords.gengliming110.workers.dev`
- **方法**: POST
- **参数**: `{ keywords: string[] }`
- **返回**: 分析结果数组

## 项目结构

```
analyze-user-intent/
├── app/
│   ├── globals.css      # 全局样式
│   ├── layout.tsx       # 根布局
│   └── page.tsx         # 主页面
├── package.json         # 项目配置
├── next.config.js       # Next.js 配置
├── tsconfig.json        # TypeScript 配置
└── README.md           # 项目说明
```

## 开发说明

- 使用 TypeScript 确保类型安全
- 采用现代 React Hooks 模式
- 支持响应式设计
- 包含完整的错误处理机制
- 支持批量处理和进度显示
