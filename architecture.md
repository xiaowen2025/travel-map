# Europe Travel Map - 架构设计文档 (Architecture)

本文档概述了 `app-travel-map` 的技术架构。该应用采用基于 **Vite** 的现代前端工程化架构，在保证极致开发体验的同时，坚持"数据驱动"与"高度模块化"的核心理念。

## 1. 核心设计原则 (Core Principles)
- **现代前端工程化 (Modern Frontend Engineering)**：基于 **Vite** 构建，享受极速的热更新 (HMR) 和模块化开发体验。
- **模块化代码 (Modularization)**：HTML, CSS 和 JavaScript 严格分离（`index.html`, `src/style.css`, `src/main.js`），便于维护。
- **数据驱动视图 (Data-Driven)**：一切 UI 的变化和地图的运镜，完全由一个核心的游标状态 (`currentPointIndex`) 和 JSON 数据源驱动。
- **所见即所得 (WYSIWYG Data)**：纯结构化的静态 JSON 充当唯一数据源，完全解耦数据与表现层。
- **国际化 (i18n)**：内置中英双语支持，通过 `getLoc()` 函数和 `locales` 字典实现一键语言切换。

---

## 2. 项目目录结构 (Directory Structure)

```
app-travel-map/
├── index.html              # 纯净 HTML 入口（57 行），仅包含 DOM 骨架
├── package.json            # NPM 配置：Vite + ECharts 依赖
├── .gitignore              # 忽略 node_modules/ 和 dist/
│
├── src/                    # 源码目录（Vite 实时编译）
│   ├── main.js             # 核心逻辑：i18n、状态管理、ECharts 配置、事件绑定
│   └── style.css           # 全局样式：深色主题、毛玻璃面板、动画
│
├── public/                 # 静态资源（不经过编译，直接 serve）
│   ├── data/
│   │   ├── attractions.json   # 唯一业务数据源（99 景点，含 _en 双语字段）
│   │   └── europe.geo.json    # 欧洲 GeoJSON 底图数据
│   └── assets/             # 景点图片（72 张）
│
├── refs/                   # 原始 Markdown 参考资料（已归档，非运行时依赖）
├── scripts/                # 空目录（旧解析脚本已删除）
│
├── architecture.md         # 本文档
├── features.md             # 功能特性概述
└── plan.md                 # 产品规划
```

---

## 3. 系统分层架构 (System Layers)

### 3.1 数据层 (Data Layer)
所有的内容和地理坐标数据都静态存储在 `public/data/` 目录中：
- `europe.geo.json`：定义了欧洲的国界、海岸线等底层地理多边形数据。
- `attractions.json`：**唯一的业务数据源 (Source of Truth)**。包含 `timelinePoints` 数组，每个对象代表一个具体的历史景点。
  - **核心字段**：`sortYear` (用于线性排序的绝对年份)、`coordinates` (经纬度)、`name` / `name_en` (双语名称)、`description` / `description_en` (双语正文)。

### 3.2 国际化层 (i18n Layer)
- **UI 静态文案**：通过 `locales` 字典管理按钮、提示词等固定文案，使用 `t(key)` 函数读取。
- **动态数据文案**：通过 `getLoc(point, field)` 函数从景点对象中读取当前语言的字段值。英文字段以 `_en` 后缀存储，若缺失或仍为 `[EN]` 占位符则自动回退到中文。

### 3.3 状态管理层 (State Management)
在 `src/main.js` 文件的顶层作用域内维护着一个极简的单向数据流状态机：
```javascript
const state = {
    data: null,                // 存放从 JSON 加载的所有景点数组
    currentPointIndex: 0,      // 核心游标：当前处于时间轴的哪一个节点
    viewMode: 'history',       // 维度切换（history / city / nature）
    activePointId: null,       // 用户手动点击的高亮节点
    currentEraCategory: '',    // 用于判定是否跨越时代的缓存变量
    locale: 'zh'               // 当前语言（zh / en）
};
```
所有的交互操作（如滚动鼠标）本质上只做一件事：修改 `currentPointIndex`，然后触发 `updateTimelineView()`。

### 3.4 渲染引擎层 (Rendering Engine)
选用 **Apache ECharts** 承担核心渲染任务：
- **底图渲染**：利用 `echarts.registerMap` 绘制 GeoJSON，配合深色主题和阴影属性营造质感。
- **节点渲染**：
  - `effectScatter` 系列：带有水波纹呼吸灯效果，用于渲染时间轴最前端的"当前激活点"。
  - `scatter` 系列：用于渲染已经划过的"历史遗迹点"。
- **动态运镜 (Cinematic Fly-to)**：通过更新 ECharts 的 `geo.center` 和 `geo.zoom` 属性，并配置 `animationDurationUpdate` 来实现平滑、具有呼吸感的地图视角切换。

### 3.5 交互与 UI 展现层 (Interaction & UI)
UI 展现基于原生 CSS 和 DOM 操作：
- **沉浸式控制 (Scroll Event)**：监听全局 `wheel` 事件并加入防抖 (Throttle) 逻辑（400ms）。用户的每一格滚动会被转化为时间轴上的前进一步或后退一步。
- **毛玻璃侧边栏 (Glassmorphism Panel)**：通过 CSS `backdrop-filter: blur(10px)` 营造高级质感，在每次时间轴切换时，由 JS 自动更新内部 DOM 内容并将其平滑滑入屏幕。
- **跨纪元字幕 (Era Toast)**：当检测到 `currentPointIndex` 对应的 `eraCategory` 发生改变时，在屏幕中央触发具有电影谢幕质感的文字淡入淡出动画。
- **语言切换 (Language Toggle)**：右上角 `EN / 中文` 按钮，一键切换全页面所有文案、地图标注和详情面板内容。

---

## 4. 已知问题与改进方向 (Known Issues & Next Steps)

### ⚠️ 需要清理的遗留物
- `scripts/` 目录：旧的 `parse_refs.js` 已删除，但空目录仍然残留，应删除。
- `refs/` 目录：原始 Markdown 参考资料，已不再是运行时依赖。考虑归档或在文档中明确标注其用途。

### 🔧 数据质量
- **坐标**：✅ All 99 attractions have valid European coordinates (verified 2026-04-28)
- **英文翻译占位符**：除 `name_en` 外，大部分 `_en` 字段仍为 `[EN]` 占位前缀。需要逐步替换为真正的英文翻译。
- **ID 格式不规范**：部分景点的 `id` 字段带有大量前导下划线（如 `______lascaux_cave`），这是旧脚本的遗留产物。建议统一为 `kebab-case` 格式。

### 🚀 架构演进方向
1. **进一步模块化**：当前 `main.js` 有 382 行，随着功能增加可以拆分为 `map.js`（ECharts 封装）、`ui.js`（DOM 操作）、`i18n.js`（国际化逻辑）。
2. **图片引用关联**：`public/assets/` 中有 72 张景点图片，但目前 `attractions.json` 中没有 `image` 字段将它们关联起来。应在数据中增加 `"image": "alhambra.jpg"` 字段，并在详情面板中渲染。
3. **多模式实现**：City 和 Nature 模式目前仅有 UI 按钮占位，数据中所有景点的 `category` 均为 `"cultural"`。需要为景点补充分类数据。
