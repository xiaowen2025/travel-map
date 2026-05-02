# Europe Travel Map - 核心功能 (Core Features)

该项目旨在提供一个沉浸式、交互式的高端网页地图，用于欧洲历史与旅行规划的可视化探索。

## 1. 历史纪元漫游 (Scrollytelling History)
- **滚轮穿梭**：通过鼠标滚轮按时间顺序自动切换景点，每个景点皆以其对应的历史时间作为漫游依据。
- **动态演进**：当前时代的遗迹高亮显示，过往时代的遗留点自动变暗沉淀。

## 2. 交互式可视化地图 (Interactive Map)
- **ECharts 驱动**：基于 ECharts 渲染的高性能欧洲 GeoJSON 地图。
- **平滑缩放与拖拽**：支持漫游（Roam）操作，交互流畅。
- **视觉美学**：采用极简的深色暗黑模式（Dark Theme）与定制的呼吸动画（Ripple Effect）。

## 3. 自动化数据管道 (Automated Data Pipeline)
- **Markdown 智能解析**：通过 Node.js 脚本 (`parse_refs.js`) 自动读取 `.md` 游记/研究文件。
- **结构化提取**：自动提取景点名称、地理位置、年代、一句话简介与正文描述，并结合字典映射经纬度。

## 4. 沉浸式信息面板 (Immersive Detail Panel)
- **侧边栏详情**：点击地图节点平滑滑出毛玻璃质感的详情页。
- **关联高亮**：选中某景点时，自动高亮同一纪元或相关联的其他历史人文点。

## 5. 多维度探索模式 (Multi-mode Exploration)
- 预留 **”历史纪元” (History)**、**”城市探索” (City)** 和 **”自然风光” (Nature)** 三个独立维度的切换支持。

## 6. 自动化部署 (Automated Deployment)
- **Cloudflare Pages** + **GitHub Actions** 实现每次推送到 `main` 分支自动部署
- 部署地址：https://travel-map-dkr.pages.dev
