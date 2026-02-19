---
title: "LangChain.js 0.2 实战：手把手教你构建一个能联网的 AI 智能体助手"
date: 2026-02-19 14:35:01
updated: 2026-02-19 14:35:01
categories:
  - AI与机器学习
tags:
  - LangChain
  - AI Agent
  - Node.js
  - OpenAI API
  - 实战
description: "本文通过一个完整的项目，教你如何使用 LangChain.js 最新版本，结合 OpenAI 模型和网络搜索工具，构建一个能回答实时问题的智能体应用。"
excerpt: "本文通过一个完整的项目，教你如何使用 LangChain.js 最新版本，结合 OpenAI 模型和网络搜索工具，构建一个能回答实时问题的智能体应用。"
---

## 简介与背景：为什么需要能联网的 AI 智能体助手？

在 2025-2026 年的 AI 应用开发浪潮中，一个核心痛点日益凸显：**大语言模型的知识存在滞后性**。无论是 GPT-4、Claude 3 还是其他主流模型，其训练数据都存在一个“截止日期”。这意味着它们无法回答关于最新新闻、实时股价、刚刚发布的软件文档或当前天气的问题。一个无法获取最新信息的 AI 助手，其应用场景将大打折扣。

**LangChain.js 0.2** 的发布，为 JavaScript/TypeScript 开发者带来了构建此类“联网智能体”的强大工具箱。相较于之前的版本，0.2 版本在 API 设计、模块化、以及对智能体（Agent）工作流的支持上有了显著提升，使其更加稳定、易用且功能强大。

本文将手把手带你构建一个名为 **“WebWise”** 的智能体助手。它不仅能理解你的自然语言指令，还能主动调用工具（如网络搜索、API 查询）来获取实时信息，并结合其内在知识进行推理和回答，最终形成一个完整的、可部署的 Node.js 应用。

## 环境搭建与快速开始

在开始编码之前，我们需要搭建好开发环境。本项目将使用 Node.js（建议 v18+）和 TypeScript。

### 步骤 1：初始化项目

```bash
# 创建一个新目录并进入
mkdir webwise-agent && cd webwise-agent

# 初始化 npm 项目
npm init -y

# 安装 TypeScript 及相关类型定义
npm install -D typescript @types/node ts-node

# 初始化 tsconfig.json
npx tsc --init
```

### 步骤 2：安装核心依赖

我们将安装 LangChain.js 0.2 的核心包、OpenAI 集成包（作为 LLM 驱动），以及一个用于网络搜索的工具包。

```bash
npm install langchain @langchain/core
npm install @langchain/openai
npm install @langchain/community  # 社区维护的工具和集成
```

### 步骤 3：配置环境变量

为了安全地使用 API 密钥，我们需要一个 `.env` 文件。首先安装 `dotenv`。

```bash
npm install dotenv
```

然后创建 `.env` 文件：

```env
# .env
OPENAI_API_KEY=sk-your-openai-api-key-here
# 后续可能会添加其他 API 密钥，如 SERPAPI 等
```

### 步骤 4：创建第一个“Hello World”智能体

让我们创建一个简单的文件 `src/index.ts`，验证环境是否正常。

```typescript
// src/index.ts
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  // 1. 初始化 LLM (使用 GPT-4o 模型，更快更便宜)
  const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // 2. 构建一个简单的消息链
  const message = new HumanMessage("LangChain.js 是什么？用一句话介绍。");
  
  // 3. 调用模型并获取响应
  const response = await llm.invoke([message]);
  console.log("AI 回复:", response.content);
}

main().catch(console.error);
```

使用以下命令运行：

```bash
npx ts-node src/index.ts
```

如果你看到类似 “LangChain.js 是一个用于开发由语言模型驱动的应用程序的框架...” 的输出，恭喜你，环境搭建成功！

## 核心概念详解：理解 LangChain.js 0.2 的基石

在深入构建智能体之前，理解 LangChain.js 的几个核心抽象至关重要。

### 1. 模型 I/O (Model I/O)
这是与 LLM 交互的基础层。主要包括：
- **LLMs**: 纯文本补全模型（如 `text-davinci-003`）。
- **Chat Models**: 为对话优化的模型（如 `gpt-4`, `claude-3`），输入输出通常是 `BaseMessage` 对象。
- **Prompts**: 将用户输入和上下文转换为模型可以理解的指令的模板。

```typescript
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { HumanMessagePromptTemplate, SystemMessagePromptTemplate } from "@langchain/core/prompts";

const prompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate("你是一个乐于助人的AI助手，名字叫{assistant_name}。"),
  HumanMessagePromptTemplate.fromTemplate("{user_input}"),
]);

const formattedPrompt = await prompt.format({
  assistant_name: "WebWise",
  user_input: "今天天气如何？",
});
console.log(formattedPrompt);
// 输出: [SystemMessage: “你是一个乐于助人的AI助手，名字叫WebWise。”, HumanMessage: “今天天气如何？”]
```

### 2. 检索 (Retrieval)
用于从外部知识源（如数据库、文档）获取相关信息并注入到提示词中。这是实现“联网”能力的关键，但本文重点在通过“工具”实现更主动的检索。

### 3. 链 (Chains)
将模型调用、提示词、工具等组合成一个可执行的工作流。`LCEL` (LangChain Expression Language) 是 0.2 版本推荐的方式，它使链的构建像管道一样直观。

```typescript
import { StringOutputParser } from "@langchain/core/output_parsers";

const chain = prompt.pipe(llm).pipe(new StringOutputParser());
const result = await chain.invoke({
  assistant_name: "WebWise",
  user_input: "什么是量子计算？",
});
console.log(result);
```

### 4. 工具 (Tools) 与 智能体 (Agents)
这是构建“联网智能体”的核心。
- **工具 (Tools)**: 一个可供 AI 模型调用的函数。例如：`search_web(query: string) => string`。
- **智能体 (Agents)**: 一个由 LLM 驱动的“大脑”，它可以根据用户输入**自主决定**是否需要调用工具、调用哪个工具、以及如何解释工具的返回结果，最终形成给用户的回答。

**智能体的核心循环**可以简化为：
```
用户输入 -> 智能体（LLM）思考 -> [决定调用工具A] -> 执行工具A -> 将结果返回给智能体 -> 智能体再次思考 -> [决定调用工具B或给出最终答案] -> ... -> 输出最终答案
```

## 代码实战：构建 WebWise 智能体助手

现在，让我们分三步构建功能不断增强的 WebWise 助手。

### 实战一：基础问答助手（无联网功能）

首先，我们构建一个基础版本，它使用系统提示词来设定角色，但还不能联网。

```typescript
// src/agent_basic.ts
import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config();

async function runBasicAgent() {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // 定义一个简单的“自我介绍”工具，让智能体了解自己的能力
  const introTool = new DynamicStructuredTool({
    name: "get_agent_intro",
    description: "获取AI助手的基本介绍信息。",
    schema: z.object({}),
    func: async () => {
      return `我是 WebWise，一个基础版AI助手。我目前只能回答基于我内置知识（截止到2023年）的问题，还无法获取实时信息。`;
    },
  });

  const tools = [introTool];

  // 构建提示词模板。`agent_scratchpad` 是一个占位符，用于记录智能体与工具的交互历史。
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `你是一个友好的AI助手，名叫WebWise。
     当用户询问你的能力时，请调用相关工具来回答。
     请用中文与用户交流。`],
    new MessagesPlaceholder("chat_history"), // 用于多轮对话的上下文历史
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  // 创建智能体
  const agent = await createOpenAIFunctionsAgent({
    llm,
    tools,
    prompt,
  });

  // 创建执行器，它负责运行智能体的决策循环
  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    verbose: true, // 开启详细日志，便于调试
  });

  console.log("=== WebWise 基础版启动 ===");
  const result1 = await agentExecutor.invoke({
    input: "你好，你是谁？有什么能力？",
    chat_history: [], // 初次对话，历史为空
  });
  console.log(`用户: 你好，你是谁？有什么能力？`);
  console.log(`WebWise: ${result1.output}\n`);

  const result2 = await agentExecutor.invoke({
    input: "特斯拉今天的股价是多少？",
    chat_history: [], // 为简化，这里不维护历史。实战中需要管理。
  });
  console.log(`用户: 特斯拉今天的股价是多少？`);
  console.log(`WebWise: ${result2.output}`);
}

runBasicAgent().catch(console.error);
```

运行 `npx ts-node src/agent_basic.ts`，你会看到智能体在回答第二个问题时，由于没有真正的联网工具，只能表示自己能力不足。`verbose: true` 的日志会让你清晰地看到 LLM 的思考过程（“我是否需要调用工具？”）。

### 实战二：集成联网搜索能力

现在，我们为 WebWise 装上“眼睛”。我们将使用 `@langchain/community` 包中的 `TavilySearchResults` 工具。Tavily 是一个为 AI 优化的搜索 API。

首先，注册 [Tavily](https://tavily.com/) 并获取 API 密钥，将其添加到 `.env` 文件。

```env
TAVILY_API_KEY=your_tavily_api_key
```

然后安装依赖并升级智能体：

```bash
npm install @langchain/community
```

```typescript
// src/agent_with_search.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import * as dotenv from "dotenv";

dotenv.config();

async function runSearchAgent() {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // 初始化 Tavily 搜索工具
  const searchTool = new TavilySearchResults({
    apiKey: process.env.TAVILY_API_KEY,
    maxResults: 3, // 每次搜索返回最多3条结果
    includeAnswer: true, // Tavily 会尝试直接生成一个简洁答案，非常有用
  });

  const tools = [searchTool];

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `你是一个强大的联网AI助手，名叫WebWise。
     你必须严格遵守以下规则：
     1. 对于任何涉及实��信息、最新事件、未知概念或需要验证的问题，你必须使用搜索工具。
     2. 在回答时，必须引用信息来源。如果 Tavily 提供了‘answer’，可以优先使用。
     3. 如果搜索后仍无法确定答案，请诚实告知。
     请用中文回答。`],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const agent = await createOpenAIFunctionsAgent({ llm, tools, prompt });
  const agentExecutor = new AgentExecutor({ agent, tools, verbose: true });

  console.log("=== WebWise 联网版启动 ===");

  const questions = [
    "2025年诺贝尔物理学奖获奖者是谁？他们的主要贡献是什么？",
    "帮我总结今天关于人工智能领域最重要的三条新闻。",
    "Node.js 最新稳定版是哪个版本？有什么主要新特性？",
  ];

  for (const question of questions) {
    console.log(`\n用户: ${question}`);
    const result = await agentExecutor.invoke({
      input: question,
      chat_history: [],
    });
    console.log(`WebWise: ${result.output}`);
    // 简单模拟思考间隔
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

runSearchAgent().catch(console.error);
```

运行此代码，你将看到 WebWise 主动调用搜索工具，获取最新信息，并生成包含引用的回答。这是智能体能力的质的飞跃。

### 实战三：构建多功能智能体与记忆系统

一个完整的助手需要记忆（多轮对话）和多种能力。让我们集成计算、天气查询（模拟）和记忆功能。

```typescript
// src/agent_full_featured.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { Calculator } from "@langchain/community/tools/calculator";
import { BufferMemory } from "langchain/memory";
import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

async function runFullFeaturedAgent() {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // 工具1: 网络搜索
  const searchTool = new TavilySearchResults({
    apiKey: process.env.TAVILY_API_KEY,
    maxResults: 2,
  });

  // 工具2: 计算器
  const calculatorTool = new Calculator();

  // 工具3: 模拟天气查询工具 (实际项目中应接入真实API，如 OpenWeatherMap)
  const weatherTool = new DynamicStructuredTool({
    name: "get_weather",
    description: "根据城市名查询当前天气情况。这是一个模拟工具，返回示例数据。",
    schema: z.object({
      city: z.string().describe("要查询天气的城市名称，例如：北京、上海、New York"),
    }),
    func: async ({ city }) => {
      // 模拟 API 调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockData: Record<string, string> = {
        "北京": `北京当前天气：晴，温度 22°C，湿度 45%，西北风2级。`,
        "上海": `上海当前天气：多云，温度 25°C，湿度 65%，东南风3级。`,
        "new york": `New York 当前天气：小雨，温度 18°C，湿度 80%，东北风4级。`,
      };
      return mockData[city.toLowerCase()] || `抱歉，未找到城市“${city}”的模拟天气数据。`;
    },
  });

  const tools = [searchTool, calculatorTool, weatherTool];

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `你是终极版 WebWise 助手，集成了搜索、计算和天气查询功能。
     请根据问题智能选择工具。如果用户问题涉及中文语境，工具参数也尽量使用中文（如城市名）。
     保持对话友好自然。`],
    new MessagesPlaceholder("chat_history"), // 记忆将自动注入这里
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const agent = await createOpenAIFunctionsAgent({ llm, tools, prompt });

  // 创建带有记忆的执行器
  const memory = new BufferMemory({
    memoryKey: "chat_history",
    returnMessages: true, // 返回 Message 对象，而不是字符串
  });

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    memory,
    verbose: true,
  });

  console.log("=== WebWise 完全体启动 (带记忆) ===\n");

  const conversation = [
    { user: "你好，WebWise！" },
    { user: "我的名字叫小明。" },
    { user: "(15 + 7) * 3 等于多少？" },
    { user: "北京现在的天气适合出门吗？" },
    { user: "你还记得我的名字吗？" }, // 测试记忆
    { user: "根据今天的新闻，科技股大盘走势如何？" },
  ];

  for (const turn of conversation) {
    console.log(`用户: ${turn.user}`);
    const result = await agentExecutor.invoke({ input: turn.user });
    console.log(`WebWise: ${result.output}\n`);
    await new Promise(resolve => setTimeout(resolve, 1500)); // 避免请求过快
  }
}

runFullFeaturedAgent().catch(console.error);
```

运行这个完整的智能体，你将看到一个能记住上下文、能算数、能查（模拟）天气、能搜索新闻的强大助手。`BufferMemory` 将对话历史自动管理并注入到每次交互的提示词中。

## 高级用法与性能优化

构建生产级应用时，还需要考虑以下方面：

### 1. 工具选择优化 (Routing)
当工具很多时，LLM 可能选错。可以使用 `ToolCallingAgent` 或自定义 `RunnableBranch` 来更精确地路由。

```typescript
import { RunnableBranch } from "@langchain/core/runnables";

// 伪代码示例：根据输入内容分支到不同的子链或工具集
const routeChain = RunnableBranch.from([
  [
    (input: { topic: string }) => input.topic.includes("天气"),
    weatherChain, // 专门处理天气的子链
  ],
  [
    (input: { topic: string }) => /^[\d\s\+\-\*\/\(\)]+$/.test(input.topic),
    calculatorTool, // 直接路由到计算器
  ],
  defaultChain, // 默认走通用智能体流程
]);
```

### 2. 流式响应 (Streaming)
对于 Web 应用，流式输出能极大提升用户体验。LangChain 支持将最终答案或中间思考过程流式输出。

```typescript
import { AIMessageChunk } from "@langchain/core/messages";

const streamExecutor = agentExecutor.withConfig({ runName: "streamed" });
const stream = await streamExecutor.stream({ input: "你的问题" });

for await (const chunk of stream) {
  if ("agent" in chunk) {
    // 中间步骤日志
    console.log(chunk.agent.messages[0].content);
  } else if ("actions" in chunk) {
    // 工具调用开始
    console.log(`调用工具: ${chunk.actions[0].tool}`);
  } else if ("output" in chunk) {
    // 最终输出流
    process.stdout.write(chunk.output);
  }
}
```

### 3. 错误处理与重试
网络工具可能失败，需要健壮的错误处理。

```typescript
const robustAgentExecutor = new AgentExecutor({
  agent,
  tools,
  maxIterations: 5, // 限制最大循环次数，防止死循环
  handleParsingErrors: (error) => {
    // 当LLM输出无法解析为工具调用时，返回一个友好的错误信息
    return `我理解你的指令时出了点小错：${error}。请换种方式再问我一次吧。`;
  },
  // 也可以为单个工具配置错误处理
});
```

## 常见问题与解决方案 (FAQ)

**Q1: 运行时报错 `Cannot find module 'langchain/agents'` 或类似错误。**
**A:** LangChain.js 0.2 的模块路径有所变化。确保你从正确的包导入。核心模块来自 `langchain`，社区工具来自 `@langchain/community`，模型集成来自如 `@langchain/openai`。始终参考[官方文档](https://js.langchain.com/docs/)的导入示例。

**Q2: 智能体陷入循环，不断调用同一个工具。**
**A:** 这是智能体常见问题。解决方案：
1. 设置 `maxIterations`（如 10）。
2. 在系统提示词中明确指令：“如果第一次搜索未找到答案，请尝试不同的关键词或承认未知，不要重复搜索相同内容。”
3. 使用 `createStructuredChatAgent` 等更可控的智能体类型。

**Q3: API 调用成本如何控制？**
**A:**
- 为 `ChatOpenAI` 设置 `maxTokens` 限制。
- 使用更便宜的模型处理简单任务（如 `gpt-3.5-turbo`）。
- 缓存频繁查询的搜索结果（可以使用 `LangChain` 的 `RunnableWithFallbacks` 或外部缓存如 Redis）。
- 为 Tavily 等付费工具设置使用限额和监控。

**Q4: 如何部署这个应用到 Web 或聊天软件？**
**A:** 核心的 `agentExecutor` 是一个异步函数。你可以轻松地将其集成到：
- **Web API**: 使用 Express.js, Fastify 等框架暴露一个 POST 端点。
- **聊天机器人**: 使用 Bot 框架（如 Telegram Bot API, Discord.js）的消息事件处理器来调用智能体。
- **前端应用**: 通过 Next.js API Route 或类似技术提供后端服务，前端使用流式接收以提高体验。

## 总结与延伸阅读

恭喜你！你已经跟随本教程，从零开始构建了一个功能日益强大的联网 AI 智能体助手。我们涵盖了从环境搭建、核心概念理解，到集成搜索、计算、记忆等高级功能的完整流程。

**关键收获：**
1. **智能体范式**：LLM 作为决策核心，通过工具调用扩展能力边界。
2. **LCEL 的威力**：使用管道（`pipe`）方式组合组件，代码清晰且灵活。
3. **工具即扩展**：任何可以通过代码实现的函数，都可以成为智能体的“手”和“眼”。
4. **记忆的重要性**：`BufferMemory` 等组件使对话具有连贯性。

**下一步探索方向：**
- **自主智能体 (Autonomous Agents)**: 研究 `AutoGPT`、`BabyAGI` 模式，让智能体能够自主规划并执行复杂多步任务。
- **多模态 (Multimodal)**: 集成 `@langchain/openai` 的视觉模型，让智能体能“看”图片并描述。
- **检索增强生成 (RAG)**: 结合 `@langchain/community` 的向量存储（如 `Chroma`, `Pinecone`），让智能体拥有庞大的私有知识库。
- **生产化部署**: 学习使用 `LangSmith` 进行链路追踪、监控和调试，这对于复杂应用至关重要。

**延伸阅读资源：**
- **官方文档**: [https://js.langchain.com/docs](https://js.langchain.com/docs) - 始终是最新、最准确的参考资料。
- **GitHub 仓库**: [https://github.com/langchain-ai/langchainjs](https://github.com/langchain-ai/langchainjs) - 查看源码和示例。
- **社区**: 加入 LangChain Discord 或相关技术论坛，与其他开发者交流实战问题。

AI 智能体的世界刚刚开启，而 LangChain.js 为你提供了建造这一切的坚实脚手架。现在，发挥你的创意，去构建下一个改变人们与信息交互方式的应用程序吧！