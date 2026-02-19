/**
 * ============================================================
 * AI 全自动文章生成系统 v2.0
 * ============================================================
 * 
 * 功能：
 *   1. 使用 AI 自动生成话题（不依赖固定话题库）
 *   2. AI 自动分类、打标签
 *   3. AI 生成详细长文（2000-5000字）
 *   4. 自动去重（基于已有文章）
 *   5. 全流程无需人工干预
 * 
 * 环境变量:
 *   DEEPSEEK_API_KEY  - DeepSeek API 密钥（必需）
 *   ARTICLE_COUNT     - 每次生成文章数量（默认 1）
 * 
 * 用法:
 *   DEEPSEEK_API_KEY=sk-xxx node tools/auto-writer.js
 *   DEEPSEEK_API_KEY=sk-xxx ARTICLE_COUNT=3 node tools/auto-writer.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ============================================================
// 配置
// ============================================================
const CONFIG = {
  api: {
    host: 'api.deepseek.com',
    path: '/chat/completions',
    model: 'deepseek-chat',
    timeout: 180000, // 3 分钟超时
  },
  article: {
    minLength: 2000,       // 最少字数
    maxTokens: 8192,       // API 最大 token
    temperature: 0.9,      // 创造性
  },
  // 分类体系 - AI 会从中选择最合适的分类
  categories: [
    '前端开发', '后端开发', '数据库', 'DevOps', 'AI与机器学习',
    '移动开发', '网络安全', '云计算', '系统运维', '编程语言',
    '架构设计', '开发工具', '开源项目', '技术趋势', '实战教程',
    '面试算法', '自建服务', '效率提升',
  ],
  // 话题方向池 - AI 基于这些方向自由发挥
  directions: [
    // 前端
    'React/Vue/Angular/Svelte 框架最新特性与实战',
    'Next.js/Nuxt/Remix/Astro 全栈框架教程',
    'TypeScript 高级用法与类型体操',
    'CSS 现代布局与动画技巧',
    'WebAssembly/WebGPU/WebXR 前沿技术',
    '前端工程化、构建工具、包管理器',
    '前端性能优化与 Core Web Vitals',
    '微前端架构与组件库开发',
    '小程序与跨平台移动开发',
    // 后端
    'Node.js/Deno/Bun 服务端开发',
    'Go/Rust/Python/Java 后端实战项目',
    'RESTful API / GraphQL / gRPC 设计与实现',
    '微服务架构、服务网格、分布式系统',
    '消息队列 Kafka/RabbitMQ/Redis Streams',
    '认证授权 OAuth2/JWT/OIDC/Passkey',
    // 数据库
    'PostgreSQL/MySQL 高级特性与性能调优',
    'Redis 缓存策略与数据结构高级用法',
    'MongoDB/Elasticsearch/ClickHouse 实战',
    'ORM 框架 Prisma/Drizzle/TypeORM 对比',
    '数据库迁移、备份、高可用方案',
    // DevOps
    'Docker/Podman 容器化与 Compose 编排',
    'Kubernetes 集群管理与最佳实践',
    'CI/CD 流水线 GitHub Actions/GitLab CI',
    'Terraform/Pulumi 基础设施即代码',
    'Prometheus/Grafana/Loki 监控告警',
    'Nginx/Caddy/Traefik 反向代理配置',
    // AI
    'LLM 大语言模型本地部署与微调',
    'RAG 检索增强生成实战',
    'AI 绘画 Stable Diffusion/ComfyUI/Midjourney',
    'AI Agent 智能体开发框架',
    'AI 编程助手 Cursor/Copilot 使用技巧',
    'TensorFlow/PyTorch 深度学习入门',
    'Prompt Engineering 提示词工程',
    // 热门教程
    'Git 高级操作与团队协作工作流',
    'Linux 系统管理与 Shell 脚本编程',
    'VS Code 插件与效率提升',
    '正则表达式实战与高级模式',
    'HTTPS/TLS/网络安全基础',
    '设计模式与 SOLID 原则实战',
    '算法与数据结构面试题精讲',
    // 自建服务 & 网络热门
    'HomeLab 家庭服务器搭建',
    '内网穿透 frp/Tailscale/Cloudflare Tunnel',
    'NAS 搭建与媒体服务器配置',
    '科学上网/代理工具配置教程',
    'Cloudflare Workers/Pages 免费建站',
    'Alist/Immich/Memos 等开源自部署应用',
    'n8n/Activepieces 自动化工作流',
    '域名、SSL 证书、CDN 配置教程',
    'Tailwind CSS / shadcn/ui 组件库实战',
    'FFmpeg 音视频处理命令大全',
    'Tauri/Electron 桌面应用开发',
    'Flutter/React Native 移动开发',
    'Playwright/Cypress 自动化测试',
    'Biome/ESLint/Prettier 代码规范',
    'Monorepo 管理 Turborepo/Nx',
  ],
};

// ============================================================
// DeepSeek API 封装
// ============================================================
class DeepSeekClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async chat(messages, options = {}) {
    const data = JSON.stringify({
      model: CONFIG.api.model,
      messages,
      max_tokens: options.maxTokens || CONFIG.article.maxTokens,
      temperature: options.temperature || CONFIG.article.temperature,
      top_p: 0.95,
    });

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: CONFIG.api.host,
        port: 443,
        path: CONFIG.api.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: CONFIG.api.timeout,
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            if (json.error) {
              reject(new Error(`API Error: ${json.error.message || JSON.stringify(json.error)}`));
              return;
            }
            if (json.choices?.[0]?.message?.content) {
              resolve(json.choices[0].message.content.trim());
            } else {
              reject(new Error(`Unexpected response: ${body.substring(0, 500)}`));
            }
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}\nBody: ${body.substring(0, 500)}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout (180s)')); });
      req.write(data);
      req.end();
    });
  }
}

// ============================================================
// 文章管理器
// ============================================================
class ArticleManager {
  constructor(postsDir) {
    this.postsDir = postsDir;
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }
  }

  // 获取所有已有文章标题
  getExistingTitles() {
    const files = fs.readdirSync(this.postsDir).filter(f => f.endsWith('.md'));
    const titles = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(this.postsDir, file), 'utf-8');
      const match = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
      if (match) titles.push(match[1]);
    }
    return titles;
  }

  // 生成文件名
  generateFileName(title) {
    const slug = title
      .replace(/[【】「」『』（）()，。、；：？！\s]+/g, '-')
      .replace(/[^\w\u4e00-\u9fff-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60);
    
    // 添加时间戳避免文件名冲突
    const ts = Date.now().toString(36);
    return `${slug}-${ts}.md`;
  }

  // 生成日期
  generateDate() {
    const now = new Date();
    const offset = Math.floor(Math.random() * 7); // 最近 7 天内
    const date = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  // 保存文章
  save(fileName, frontMatter, content) {
    const filePath = path.join(this.postsDir, fileName);
    const fullContent = `---\n${frontMatter}\n---\n\n${content}`;
    fs.writeFileSync(filePath, fullContent, 'utf-8');
    return filePath;
  }
}

// ============================================================
// AI 全自动写手
// ============================================================
class AIAutoWriter {
  constructor(apiKey) {
    this.client = new DeepSeekClient(apiKey);
    this.postsDir = path.join(__dirname, '..', 'source', '_posts');
    this.manager = new ArticleManager(this.postsDir);
  }

  // ---- 第一步：AI 生成话题 ----
  async generateTopics(count, existingTitles) {
    const directions = this._pickRandomDirections(8);
    const existingStr = existingTitles.length > 0
      ? `\n\n以下是已有文章，请避免重复：\n${existingTitles.slice(-30).map(t => `- ${t}`).join('\n')}`
      : '';

    const prompt = `你是一个技术博客的选题编辑。请生成 ${count} 个全新的技术文章话题。

要求：
1. 话题要具体、有吸引力，不能太宽泛
2. 涉及当前热门技术趋势
3. 标题要吸引人，包含具体技术栈名称和版本号
4. 混合不同难度（入门、进阶、高级）
5. 混合不同类型（教程、指南、对比、实战、原理解析）

参考方向（从中选择或自由发挥）：
${directions.map(d => `- ${d}`).join('\n')}

可用分类（每篇文章选一个最合适的）：
${CONFIG.categories.join('、')}
${existingStr}

请严格按以下 JSON 数组格式返回，不要包含其他文字：
[
  {
    "title": "文章标题",
    "category": "分类名",
    "tags": ["标签1", "标签2", "标签3"],
    "description": "一句话描述文章内容",
    "type": "教程|指南|实战|对比|原理"
  }
]`;

    const response = await this.client.chat([
      { role: 'system', content: '你是一个技术博客选题编辑，擅长发现热门技术话题。只返回 JSON，不要返回任何其他内容。' },
      { role: 'user', content: prompt },
    ], { maxTokens: 2000, temperature: 1.0 });

    return this._parseJSON(response);
  }

  // ---- 第二步：AI 写文章正文 ----
  async writeArticle(topic) {
    const typeGuide = {
      '教程': '从零开始，手把手教学，包含每一步的详细操作和完整代码',
      '指南': '系统性介绍，覆盖核心概念、最佳实践和注意事项',
      '实战': '以真实项目为例，从需求分析到完整实现的全过程',
      '对比': '多方案横向对比，包含性能测试、优缺点分析和选型建议',
      '原理': '深入底层原理，配合图解和源码分析',
    };

    const guide = typeGuide[topic.type] || typeGuide['教程'];

    const prompt = `请撰写一篇关于「${topic.title}」的详细技术文章。

文章类型：${topic.type || '教程'}
核心要求：${guide}

写作规范：
1. **字数要求**：不少于 2500 字，越详细越好
2. **结构清晰**：使用 ## 二级标题划分章节，### 三级标题细分内容
3. **代码丰富**：每个关键知识点都要有可运行的代码示例（标明语言）
4. **循序渐进**：从基础概念 → 核心用法 → 高级技巧 → 实战案例
5. **实用性强**：包含真实场景的使用案例和常见问题解决方案
6. **时效性**：内容要反映 2025-2026 年最新的技术版本和趋势

推荐章节结构：
- 简介与背景（为什么要学/用这个技术）
- 环境搭建 / 快速开始
- 核心概念详解
- 代码实战（至少 3 个完整代码示例）
- 高级用法 / 性能优化
- 常见问题与解决方案（FAQ）
- 总结与延伸阅读

注意：
- 直接输出 Markdown 正文，不要输出 front-matter 和一级标题
- 代码块请标注语言（如 \`\`\`javascript、\`\`\`bash、\`\`\`python 等）
- 适当使用表格、列表、加粗等格式增强可读性
- 包含实际可用的命令和配置`;

    return await this.client.chat([
      {
        role: 'system',
        content: `你是一位拥有 10 年经验的全栈技术博主，你的文章以"详细、实用、代码丰富"著称。
你写的每篇文章都像是一本迷你教程，读者跟着你的文章就能完成整个操作。
你会用中文写作，但技术术语和代码保持英文。
文章风格：专业但亲切，有深度但不晦涩。`,
      },
      { role: 'user', content: prompt },
    ], { maxTokens: CONFIG.article.maxTokens, temperature: 0.8 });
  }

  // ---- 完整流程：生成 N 篇文章 ----
  async run(count) {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║     🤖 AI 全自动文章生成系统 v2.0            ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');

    const existingTitles = this.manager.getExistingTitles();
    console.log(`📚 已有文章: ${existingTitles.length} 篇\n`);

    // 第一步：AI 生成话题
    console.log('🧠 [1/3] AI 正在思考话题...');
    let topics;
    try {
      topics = await this.generateTopics(count, existingTitles);
      console.log(`   ✅ 生成了 ${topics.length} 个话题：`);
      topics.forEach((t, i) => console.log(`      ${i + 1}. [${t.category}] ${t.title}`));
      console.log('');
    } catch (err) {
      console.error(`   ❌ 话题生成失败: ${err.message}`);
      console.log('   🔄 使用备用随机话题...\n');
      topics = this._getFallbackTopics(count);
    }

    // 第二步 & 第三步：逐篇写文章并保存
    const results = [];
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      console.log(`📝 [2/3] 正在撰写 (${i + 1}/${topics.length}): ${topic.title}`);
      
      try {
        // AI 写正文
        const content = await this.writeArticle(topic);
        const charCount = content.length;

        if (charCount < 500) {
          console.log(`   ⚠️ 文章过短 (${charCount} 字)，跳过`);
          continue;
        }

        // 生成 front-matter
        const date = this.manager.generateDate();
        const tags = (topic.tags || ['技术']).map(t => `  - ${t}`).join('\n');
        const frontMatter = [
          `title: "${topic.title.replace(/"/g, '\\"')}"`,
          `date: ${date}`,
          `updated: ${date}`,
          `categories:`,
          `  - ${topic.category || '技术趋势'}`,
          `tags:`,
          tags,
          `description: "${(topic.description || topic.title).replace(/"/g, '\\"')}"`,
          `excerpt: "${(topic.description || topic.title).replace(/"/g, '\\"')}"`,
        ].join('\n');

        // 保存文件
        const fileName = this.manager.generateFileName(topic.title);
        const filePath = this.manager.save(fileName, frontMatter, content);

        console.log(`   ✅ 已保存: source/_posts/${fileName}`);
        console.log(`   📊 字数: ~${charCount} 字 | 分类: ${topic.category} | 标签: ${(topic.tags || []).join(', ')}`);
        
        results.push({ title: topic.title, fileName, charCount, category: topic.category });

        // API 间隔
        if (i < topics.length - 1) {
          console.log('   ⏳ 等待 5 秒...\n');
          await this._sleep(5000);
        }
      } catch (err) {
        console.error(`   ❌ 写作失败: ${err.message}\n`);
      }
    }

    // 输出总结
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║     📊 生成报告                               ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(`   ✅ 成功: ${results.length}/${topics.length} 篇`);
    if (results.length > 0) {
      console.log(`   📊 总字数: ~${results.reduce((s, r) => s + r.charCount, 0)} 字`);
      console.log('   📁 文章列表:');
      results.forEach(r => console.log(`      - [${r.category}] ${r.title} (${r.charCount}字)`));

      // 统计分类分布
      const catCount = {};
      results.forEach(r => { catCount[r.category] = (catCount[r.category] || 0) + 1; });
      console.log('   📂 分类分布:');
      Object.entries(catCount).forEach(([cat, cnt]) => console.log(`      - ${cat}: ${cnt} 篇`));
    }
    console.log('');

    return results;
  }

  // ---- 工具方法 ----
  
  _pickRandomDirections(count) {
    const shuffled = [...CONFIG.directions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  _parseJSON(text) {
    // 尝试从返回文本中提取 JSON
    let cleaned = text.trim();
    
    // 去掉 markdown 代码块包裹
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1].trim();
    }

    // 尝试找到 JSON 数组
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      cleaned = arrayMatch[0];
    }

    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      throw new Error('Not an array or empty');
    } catch (e) {
      throw new Error(`Failed to parse topics JSON: ${e.message}\nRaw: ${text.substring(0, 300)}`);
    }
  }

  _getFallbackTopics(count) {
    const fallback = [
      { title: `${new Date().getFullYear()} 年前端开发最新趋势与技术栈推荐`, category: '技术趋势', tags: ['前端', '技术趋势', '2026'], description: '盘点前端最新技术栈', type: '指南' },
      { title: 'Docker + Docker Compose 从入门到生产环境部署完全指南', category: 'DevOps', tags: ['Docker', 'DevOps', '容器化'], description: 'Docker 全流程实战', type: '教程' },
      { title: 'Node.js 高性能后端开发：从单机到分布式架构', category: '后端开发', tags: ['Node.js', '性能优化', '分布式'], description: 'Node.js 架构进阶', type: '实战' },
      { title: 'PostgreSQL vs MySQL 2026 深度对比：选型、性能与最佳实践', category: '数据库', tags: ['PostgreSQL', 'MySQL', '数据库'], description: '两大数据库全面对比', type: '对比' },
      { title: 'LLM 本地部署完全指南：Ollama + Open WebUI + RAG 实战', category: 'AI与机器学习', tags: ['LLM', 'Ollama', 'RAG'], description: '本地部署大模型', type: '教程' },
      { title: 'GitHub Actions CI/CD 自动化从零到精通', category: 'DevOps', tags: ['GitHub Actions', 'CI/CD', '自动化'], description: 'CI/CD 完全教程', type: '教程' },
      { title: 'Tailwind CSS v4 + shadcn/ui 现代前端 UI 开发实战', category: '前端开发', tags: ['Tailwind', 'shadcn', 'UI'], description: '现代 UI 开发方案', type: '实战' },
      { title: 'Rust 编程语言入门到实战：为什么越来越多开发者选择 Rust', category: '编程语言', tags: ['Rust', '编程语言', '系统编程'], description: 'Rust 入门实战', type: '教程' },
    ];
    return fallback.sort(() => Math.random() - 0.5).slice(0, count);
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================
// 主入口
// ============================================================
async function main() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('');
    console.error('❌ 错误: 请设置 DEEPSEEK_API_KEY 环境变量');
    console.error('   获取方式: https://platform.deepseek.com/api_keys');
    console.error('');
    console.error('   用法:');
    console.error('     DEEPSEEK_API_KEY=sk-xxx node tools/auto-writer.js');
    console.error('     DEEPSEEK_API_KEY=sk-xxx ARTICLE_COUNT=3 node tools/auto-writer.js');
    console.error('');
    process.exit(1);
  }

  const count = Math.min(parseInt(process.env.ARTICLE_COUNT || '1', 10), 10);
  const writer = new AIAutoWriter(apiKey);
  
  try {
    const results = await writer.run(count);
    if (results.length === 0) {
      console.error('⚠️ 没有成功生成任何文章');
      process.exit(1);
    }
    console.log(`🎉 全自动生成完成！共 ${results.length} 篇文章`);
  } catch (err) {
    console.error(`❌ 执行失败: ${err.message}`);
    process.exit(1);
  }
}

main();
