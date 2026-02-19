/**
 * AI 文章自动生成脚本
 * 使用 DeepSeek API 随机生成技术文章、教程
 * 
 * 环境变量:
 *   DEEPSEEK_API_KEY - DeepSeek API 密钥
 *   ARTICLE_COUNT    - 每次生成文章数量 (默认 1)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ============================================================
// 话题库 - 涵盖各类技术方向和热门教程
// ============================================================
const TOPIC_POOL = [
  // ---- 前端开发 ----
  { title: 'React 18 新特性完全指南：Concurrent Mode、Suspense 与 Server Components', category: '前端', tags: ['React', 'JavaScript', '前端框架'] },
  { title: 'Vue 3.4 最新特性详解与实战：defineModel、泛型组件与性能优化', category: '前端', tags: ['Vue3', 'JavaScript', '前端框架'] },
  { title: 'Next.js 14 App Router 全栈开发实战教程', category: '前端', tags: ['Next.js', 'React', '全栈'] },
  { title: 'Tailwind CSS 高级技巧：从入门到实战项目', category: '前端', tags: ['CSS', 'Tailwind', '前端'] },
  { title: 'TypeScript 5.x 高级类型体操：条件类型、模板字面量与装饰器', category: '前端', tags: ['TypeScript', '类型系统', '前端'] },
  { title: 'Astro 框架入门到精通：构建超快静态网站', category: '前端', tags: ['Astro', '静态网站', '前端'] },
  { title: 'Svelte 5 Runes 响应式革命：全面教程', category: '前端', tags: ['Svelte', 'JavaScript', '前端框架'] },
  { title: 'Nuxt 3 全栈开发指南：SSR、API Routes 与部署', category: '前端', tags: ['Nuxt', 'Vue3', '全栈'] },
  { title: 'Web Components 原生组件开发完全指南', category: '前端', tags: ['Web Components', 'JavaScript', '前端'] },
  { title: 'CSS 新特性 2026：Container Queries、:has() 与 Subgrid 实战', category: '前端', tags: ['CSS', '前端', '布局'] },
  { title: 'Vite 6 构建工具深度解析与插件开发', category: '前端', tags: ['Vite', '构建工具', '前端'] },
  { title: 'Three.js 3D 网页开发入门到实战', category: '前端', tags: ['Three.js', 'WebGL', '3D'] },
  { title: 'React Native 最新版跨平台移动开发完全教程', category: '前端', tags: ['React Native', '移动开发', '跨平台'] },
  { title: 'Electron 桌面应用开发从零到发布', category: '前端', tags: ['Electron', '桌面应用', 'JavaScript'] },
  { title: 'PWA 渐进式 Web 应用开发完全指南', category: '前端', tags: ['PWA', 'Service Worker', '前端'] },
  { title: 'WebAssembly 入门与实战：用 Rust 编写高性能 Web 模块', category: '前端', tags: ['WebAssembly', 'Rust', '性能优化'] },
  { title: 'Remix 全栈框架深度教程：路由、加载器与最佳实践', category: '前端', tags: ['Remix', 'React', '全栈'] },
  { title: '微前端架构实战：qiankun、Module Federation 方案对比', category: '前端', tags: ['微前端', '架构', '前端'] },
  { title: '前端性能优化终极指南：Core Web Vitals 实战', category: '前端', tags: ['性能优化', 'Core Web Vitals', '前端'] },
  { title: 'Zustand vs Jotai vs Recoil：React 状态管理方案深度对比', category: '前端', tags: ['React', '状态管理', '前端'] },

  // ---- 后端开发 ----
  { title: 'Node.js 22 新特性全解析：内置 Watch Mode、权限模型与 WebSocket', category: '后端', tags: ['Node.js', 'JavaScript', '后端'] },
  { title: 'Go 语言 Web 开发实战：Gin + GORM + JWT 完整项目', category: '后端', tags: ['Go', 'Gin', 'Web开发'] },
  { title: 'Python FastAPI 从入门到生产：构建高性能 REST API', category: '后端', tags: ['Python', 'FastAPI', 'API'] },
  { title: 'Rust Web 开发入门：Actix-web + Diesel + PostgreSQL', category: '后端', tags: ['Rust', 'Web开发', '后端'] },
  { title: 'Java Spring Boot 3 微服务架构实战教程', category: '后端', tags: ['Java', 'Spring Boot', '微服务'] },
  { title: 'NestJS 企业级 Node.js 框架完全教程', category: '后端', tags: ['NestJS', 'Node.js', 'TypeScript'] },
  { title: 'GraphQL 完全指南：从 Schema 设计到性能优化', category: '后端', tags: ['GraphQL', 'API', '后端'] },
  { title: 'gRPC 微服务通信实战：Protocol Buffers + Go/Node.js', category: '后端', tags: ['gRPC', '微服务', '通信'] },
  { title: 'Django 5 全栈开发教程：从 Models 到部署', category: '后端', tags: ['Python', 'Django', 'Web开发'] },
  { title: 'Bun 运行时深度体验：比 Node.js 快 4 倍的 JavaScript Runtime', category: '后端', tags: ['Bun', 'JavaScript', '运行时'] },
  { title: 'Deno 2.0 入门实战：安全、TypeScript 原生支持的新选择', category: '后端', tags: ['Deno', 'TypeScript', '后端'] },
  { title: 'Elixir Phoenix LiveView 实时 Web 应用开发', category: '后端', tags: ['Elixir', 'Phoenix', '实时'] },
  { title: 'Kotlin Ktor 后端开发实战指南', category: '后端', tags: ['Kotlin', 'Ktor', '后端'] },
  { title: 'Express.js 中间件原理与企业级实践', category: '后端', tags: ['Express', 'Node.js', '中间件'] },
  { title: 'WebSocket 实时通信完全指南：原理、实现与最佳实践', category: '后端', tags: ['WebSocket', '实时通信', '后端'] },

  // ---- 数据库 ----
  { title: 'PostgreSQL 高级教程：窗口函数、CTE、JSON 操作与性能调优', category: '数据库', tags: ['PostgreSQL', 'SQL', '数据库'] },
  { title: 'Redis 7 实战指南：数据结构、缓存策略与分布式锁', category: '数据库', tags: ['Redis', '缓存', '数据库'] },
  { title: 'MongoDB 8 新特性与最佳实践：聚合管道、事务与 Atlas', category: '数据库', tags: ['MongoDB', 'NoSQL', '数据库'] },
  { title: 'MySQL 8 性能优化实战：索引、查询优化与慢查询分析', category: '数据库', tags: ['MySQL', 'SQL', '性能优化'] },
  { title: 'Prisma ORM 完全指南：现代 Node.js 数据库开发', category: '数据库', tags: ['Prisma', 'ORM', 'Node.js'] },
  { title: 'Elasticsearch 8 搜索引擎实战：从入门到集群部署', category: '数据库', tags: ['Elasticsearch', '搜索引擎', '数据库'] },
  { title: 'ClickHouse OLAP 数据库入门：海量数据实时分析', category: '数据库', tags: ['ClickHouse', 'OLAP', '大数据'] },
  { title: 'SQLite 进阶教程：嵌入式数据库的强大能力', category: '数据库', tags: ['SQLite', 'SQL', '嵌入式'] },
  { title: 'Supabase 后端即服务全栈教程：PostgreSQL + Auth + Realtime', category: '数据库', tags: ['Supabase', 'BaaS', 'PostgreSQL'] },
  { title: 'Drizzle ORM vs Prisma：TypeScript ORM 深度对比', category: '数据库', tags: ['Drizzle', 'Prisma', 'TypeScript'] },

  // ---- DevOps / 运维 ----
  { title: 'Docker Compose 多容器编排实战：从开发到生产环境', category: 'DevOps', tags: ['Docker', '容器化', 'DevOps'] },
  { title: 'Kubernetes 从入门到实战：Pod、Service、Ingress 完全教程', category: 'DevOps', tags: ['Kubernetes', '容器编排', 'DevOps'] },
  { title: 'GitHub Actions CI/CD 高级教程：矩阵构建、自定义 Action 与安全', category: 'DevOps', tags: ['GitHub Actions', 'CI/CD', 'DevOps'] },
  { title: 'Terraform 基础设施即代码实战：AWS/GCP 多云部署', category: 'DevOps', tags: ['Terraform', 'IaC', '云计算'] },
  { title: 'Nginx 高级配置指南：反向代理、负载均衡与 HTTPS', category: 'DevOps', tags: ['Nginx', '反向代理', '运维'] },
  { title: 'Linux 命令行终极指南：效率提升 10 倍的技巧', category: 'DevOps', tags: ['Linux', '命令行', '运维'] },
  { title: 'Prometheus + Grafana 监控体系搭建完全教程', category: 'DevOps', tags: ['Prometheus', 'Grafana', '监控'] },
  { title: 'Ansible 自动化运维实战：从 Playbook 到 Role', category: 'DevOps', tags: ['Ansible', '自动化', '运维'] },
  { title: 'AWS 免费套餐全攻略：EC2、S3、Lambda 省钱玩转云服务', category: 'DevOps', tags: ['AWS', '云计算', '免费'] },
  { title: 'Vercel + Cloudflare 免费部署方案：零成本搭建全球加速网站', category: 'DevOps', tags: ['Vercel', 'Cloudflare', '部署'] },
  { title: 'Docker 安全最佳实践：镜像扫描、非 Root 运行与 Secrets 管理', category: 'DevOps', tags: ['Docker', '安全', 'DevOps'] },
  { title: 'GitOps 实战：ArgoCD + Kubernetes 持续部署', category: 'DevOps', tags: ['GitOps', 'ArgoCD', 'Kubernetes'] },
  { title: '日志收集与分析：ELK Stack 完整教程', category: 'DevOps', tags: ['ELK', '日志', '运维'] },

  // ---- AI / 机器学习 ----
  { title: 'LLM 本地部署完全指南：Ollama + LLaMA 3 + Open WebUI', category: 'AI', tags: ['LLM', 'Ollama', 'AI'] },
  { title: 'RAG 检索增强生成实战：LangChain + ChromaDB + OpenAI', category: 'AI', tags: ['RAG', 'LangChain', 'AI'] },
  { title: 'Stable Diffusion 本地部署与 AI 绘画入门教程', category: 'AI', tags: ['Stable Diffusion', 'AI绘画', 'AI'] },
  { title: 'PyTorch 深度学习入门：从张量到神经网络', category: 'AI', tags: ['PyTorch', '深度学习', 'AI'] },
  { title: 'Hugging Face Transformers 从入门到微调大模型', category: 'AI', tags: ['Hugging Face', 'Transformers', 'AI'] },
  { title: 'GPT API 应用开发实战：构建智能聊天机器人', category: 'AI', tags: ['GPT', 'API', 'AI'] },
  { title: 'AI Agent 智能体开发：AutoGPT 原理与实现', category: 'AI', tags: ['AI Agent', 'AutoGPT', 'AI'] },
  { title: 'ComfyUI 工作流教程：AI 图像生成高级玩法', category: 'AI', tags: ['ComfyUI', 'AI绘画', '工作流'] },
  { title: 'TensorFlow.js 浏览器端机器学习实战', category: 'AI', tags: ['TensorFlow.js', '机器学习', 'JavaScript'] },
  { title: 'DeepSeek API 开发指南：低成本调用强大 AI 模型', category: 'AI', tags: ['DeepSeek', 'API', 'AI'] },
  { title: 'LoRA 微调大语言模型完全教程', category: 'AI', tags: ['LoRA', '微调', 'LLM'] },
  { title: 'Midjourney 提示词工程：生成专业级 AI 图像', category: 'AI', tags: ['Midjourney', '提示词', 'AI绘画'] },
  { title: 'LangGraph 多 Agent 协作框架教程', category: 'AI', tags: ['LangGraph', 'AI Agent', 'LangChain'] },
  { title: 'Whisper 语音识别模型本地部署与应用', category: 'AI', tags: ['Whisper', '语音识别', 'AI'] },
  { title: 'Cursor AI 编程助手高效使用指南', category: 'AI', tags: ['Cursor', 'AI编程', '效率'] },

  // ---- 热门网络教程 ----
  { title: '2026 年最值得学习的 10 个编程语言排行榜', category: '技术趋势', tags: ['编程语言', '技术趋势', '学习'] },
  { title: '从零搭建个人博客：Hexo + GitHub Pages 完全教程', category: '教程', tags: ['Hexo', 'GitHub Pages', '博客'] },
  { title: 'VS Code 效率翻倍：50 个必装插件与快捷键大全', category: '工具', tags: ['VS Code', '效率', '工具'] },
  { title: 'Git 高级操作大全：rebase、cherry-pick、bisect 实战', category: '工具', tags: ['Git', '版本控制', '工具'] },
  { title: 'Mac/Windows 开发环境配置终极指南 2026', category: '教程', tags: ['开发环境', '工具', '配置'] },
  { title: '正则表达式从入门到精通：常用模式与实战案例', category: '编程基础', tags: ['正则表达式', '编程基础', '字符串'] },
  { title: 'OAuth 2.0 + JWT 认证授权完全指南', category: '安全', tags: ['OAuth', 'JWT', '认证'] },
  { title: 'HTTPS 原理深度解析：SSL/TLS 握手与证书机制', category: '网络', tags: ['HTTPS', 'SSL', '网络安全'] },
  { title: '设计模式实战：23 种经典模式的 JavaScript/TypeScript 实现', category: '编程基础', tags: ['设计模式', 'JavaScript', '软件工程'] },
  { title: 'RESTful API 设计最佳实践与规范', category: '后端', tags: ['REST', 'API', '规范'] },
  { title: '算法面试必刷：二叉树、动态规划、图论 50 题精解', category: '算法', tags: ['算法', '面试', '数据结构'] },
  { title: 'Linux 从零到精通：文件系统、权限、Shell 脚本完全教程', category: '运维', tags: ['Linux', 'Shell', '运维'] },
  { title: 'Charles/Fiddler 抓包教程：HTTP 调试与 Mock 数据', category: '工具', tags: ['抓包', '调试', '工具'] },
  { title: '手把手教你用 Cloudflare Workers 搭建免费 API 代理', category: '教程', tags: ['Cloudflare', 'Workers', '免费'] },
  { title: 'GitHub Copilot 高效使用技巧：AI 辅助编程最佳实践', category: '工具', tags: ['GitHub Copilot', 'AI编程', '效率'] },
  { title: 'FFmpeg 音视频处理完全指南：转码、剪辑、推流', category: '工具', tags: ['FFmpeg', '音视频', '工具'] },
  { title: 'Markdown 写作效率提升：高级语法与自动化工具', category: '工具', tags: ['Markdown', '写作', '效率'] },
  { title: 'ChatGPT 提示词工程完全指南：让 AI 输出更精准', category: 'AI', tags: ['ChatGPT', '提示词工程', 'AI'] },
  { title: 'Notion + Obsidian 知识管理系统搭建教程', category: '工具', tags: ['Notion', 'Obsidian', '知识管理'] },
  { title: 'Figma 开发者协作指南：设计稿到代码的完美工作流', category: '设计', tags: ['Figma', '设计', '协作'] },

  // ---- 更多热门技术 ----
  { title: 'Tauri 2.0 桌面应用开发：比 Electron 更轻量的选择', category: '跨平台', tags: ['Tauri', 'Rust', '桌面应用'] },
  { title: 'Flutter 3 跨平台开发实战：一套代码四端运行', category: '移动开发', tags: ['Flutter', 'Dart', '跨平台'] },
  { title: 'Hono.js 轻量级 Web 框架：Edge Functions 最佳选择', category: '后端', tags: ['Hono', 'Edge', 'Cloudflare'] },
  { title: 'Turborepo Monorepo 项目管理完全教程', category: '工程化', tags: ['Turborepo', 'Monorepo', '工程化'] },
  { title: 'shadcn/ui 组件库使用指南：最受欢迎的 React UI 方案', category: '前端', tags: ['shadcn', 'React', 'UI'] },
  { title: 'Playwright 端到端测试完全教程：比 Cypress 更强大', category: '测试', tags: ['Playwright', 'E2E测试', '自动化'] },
  { title: 'Biome 代替 ESLint + Prettier：新一代格式化工具', category: '工具', tags: ['Biome', 'ESLint', '格式化'] },
  { title: 'htmx 入门教程：不写 JavaScript 构建动态网页', category: '前端', tags: ['htmx', 'HTML', '简洁'] },
  { title: 'Zod 数据校验库深度教程：TypeScript 类型安全利器', category: '前端', tags: ['Zod', 'TypeScript', '校验'] },
  { title: 'tRPC 全栈类型安全 API 开发教程', category: '全栈', tags: ['tRPC', 'TypeScript', '全栈'] },
  { title: 'Cloudflare D1 + Workers 全栈应用开发', category: '全栈', tags: ['Cloudflare', 'D1', 'Serverless'] },
  { title: 'Effect-TS 函数式编程新范式：错误处理与并发', category: '前端', tags: ['Effect', 'TypeScript', '函数式'] },
  { title: 'WireGuard VPN 搭建完全教程：比 OpenVPN 更快更简单', category: '网络', tags: ['WireGuard', 'VPN', '网络'] },
  { title: 'Caddy 服务器入门：自动 HTTPS 的现代 Web Server', category: '运维', tags: ['Caddy', 'HTTPS', 'Web服务器'] },
  { title: 'frp 内网穿透完全教程：远程访问家庭服务器', category: '网络', tags: ['frp', '内网穿透', '远程'] },
  { title: '1Panel 面板搭建指南：新一代 Linux 服务器管理面板', category: '运维', tags: ['1Panel', 'Linux', '面板'] },
  { title: 'NAS 家用服务器搭建教程：Docker + Jellyfin + Nextcloud', category: '教程', tags: ['NAS', 'Docker', '自建服务'] },
  { title: 'Alist 网盘聚合工具部署教程：一站管理所有云存储', category: '教程', tags: ['Alist', '网盘', '自建服务'] },
  { title: 'n8n 自动化工作流搭建：免费开源的 IFTTT 替代方案', category: '工具', tags: ['n8n', '自动化', '工作流'] },
  { title: 'Memos 开源备忘录部署：自托管的 flomo 替代品', category: '教程', tags: ['Memos', '自建服务', '笔记'] },
];

// ============================================================
// DeepSeek API 调用
// ============================================================
function callDeepSeekAPI(prompt, apiKey) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是一位资深的技术博客作者，擅长撰写详细、专业、通俗易懂的中文技术文章和教程。文章要求：
1. 内容详实，至少 2000 字以上
2. 包含清晰的章节结构（使用 ## 和 ### 标题）
3. 包含代码示例（使用代码块，注明语言）
4. 包含实际操作步骤
5. 包含注意事项和最佳实践
6. 语言流畅自然，有技术深度但不晦涩
7. 适当使用列表、表格等 Markdown 格式增强可读性
8. 文末包含"总结"和"参考资料"章节
9. 直接输出 Markdown 正文内容，不要包含 front-matter 元数据
10. 不要在最开始使用一级标题（文章标题已在 front-matter 中定义）`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 8192,
      temperature: 0.8,
      top_p: 0.95,
    });

    const options = {
      hostname: 'api.deepseek.com',
      port: 443,
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 120000,
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.error) {
            reject(new Error(`API Error: ${json.error.message || JSON.stringify(json.error)}`));
            return;
          }
          if (json.choices && json.choices[0]) {
            resolve(json.choices[0].message.content);
          } else {
            reject(new Error(`Unexpected response: ${body.substring(0, 500)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}, body: ${body.substring(0, 500)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(data);
    req.end();
  });
}

// ============================================================
// 工具函数
// ============================================================

// 生成文件名安全的 slug
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

// 生成当前北京时间 (UTC+8)
function randomRecentDate() {
  const now = new Date();
  const bjTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const y = bjTime.getUTCFullYear();
  const m = String(bjTime.getUTCMonth() + 1).padStart(2, '0');
  const d = String(bjTime.getUTCDate()).padStart(2, '0');
  const h = String(bjTime.getUTCHours()).padStart(2, '0');
  const min = String(bjTime.getUTCMinutes()).padStart(2, '0');
  const s = String(bjTime.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

// 检查文章是否已存在（按标题模糊匹配）
function isArticleExists(postsDir, slug) {
  if (!fs.existsSync(postsDir)) return false;
  const files = fs.readdirSync(postsDir);
  return files.some(f => f.includes(slug));
}

// 获取随机不重复的话题
function getRandomTopics(count) {
  const postsDir = path.join(__dirname, '..', 'source', '_posts');
  const existingFiles = fs.existsSync(postsDir) ? fs.readdirSync(postsDir) : [];

  // 打乱话题池
  const shuffled = [...TOPIC_POOL].sort(() => Math.random() - 0.5);

  const selected = [];
  for (const topic of shuffled) {
    if (selected.length >= count) break;
    const slug = slugify(topic.title);
    // 检查是否已有类似文章
    const exists = existingFiles.some(f => {
      const fSlug = f.replace('.md', '');
      return fSlug === slug || fSlug.includes(slug.substring(0, 20));
    });
    if (!exists) {
      selected.push(topic);
    }
  }

  // 如果话题池都用完了，随机从池中选（允许出重复但加日期区分）
  while (selected.length < count) {
    const randomTopic = TOPIC_POOL[Math.floor(Math.random() * TOPIC_POOL.length)];
    selected.push({
      ...randomTopic,
      title: randomTopic.title + '（' + new Date().getFullYear() + '最新版）',
    });
  }

  return selected;
}

// ============================================================
// 主流程
// ============================================================
async function main() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('❌ 错误: 请设置 DEEPSEEK_API_KEY 环境变量');
    console.error('   获取 API Key: https://platform.deepseek.com/api_keys');
    process.exit(1);
  }

  const articleCount = parseInt(process.env.ARTICLE_COUNT || '1', 10);
  const postsDir = path.join(__dirname, '..', 'source', '_posts');

  // 确保目录存在
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
  }

  console.log(`🚀 开始生成 ${articleCount} 篇文章...\n`);

  const topics = getRandomTopics(articleCount);

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    console.log(`📝 [${i + 1}/${topics.length}] 正在生成: ${topic.title}`);

    try {
      const prompt = `请撰写一篇关于「${topic.title}」的详细技术文章。

要求：
- 文章要非常详细，内容丰富，至少 2000 字
- 从基础概念讲起，逐步深入到高级用法
- 包含完整的、可运行的代码示例
- 包含实际项目中的使用场景
- 包含常见问题与解决方案
- 包含性能优化建议（如适用）
- 内容要与时俱进，反映最新技术趋势
- 适合中级开发者阅读，有深度但不过于晦涩

请直接输出文章 Markdown 正文，不要包含标题（##开始即可）和 front-matter。`;

      const content = await callDeepSeekAPI(prompt, apiKey);

      // 生成文件名
      const slug = slugify(topic.title);
      const date = randomRecentDate();
      const datePrefix = date.substring(0, 10).replace(/-/g, '');

      // 构建 Hexo front-matter
      const frontMatter = `---
title: "${topic.title}"
date: ${date}
updated: ${date}
categories:
  - ${topic.category}
tags:
${topic.tags.map(t => `  - ${t}`).join('\n')}
excerpt: "${topic.title} - 详细教程与实战指南"
---

`;

      const fileName = `${slug}.md`;
      const filePath = path.join(postsDir, fileName);

      // 写入文件
      fs.writeFileSync(filePath, frontMatter + content, 'utf-8');
      console.log(`   ✅ 已保存: source/_posts/${fileName}`);
      console.log(`   📊 字数: ~${content.length} 字符\n`);

      // 避免 API 限流，间隔 3 秒
      if (i < topics.length - 1) {
        console.log('   ⏳ 等待 3 秒...');
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (err) {
      console.error(`   ❌ 生成失败: ${err.message}\n`);
    }
  }

  console.log('🎉 文章生成完成！');
}

main().catch(err => {
  console.error('❌ 脚本执行失败:', err.message);
  process.exit(1);
});
