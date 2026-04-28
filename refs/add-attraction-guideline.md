# 添加景点指南 / Add Attraction Guideline

## 1. 添加新景点

在 `public/data/attractions.json` 的 `timelinePoints` 数组中添加新对象。

### 必填字段

| 字段 | 说明 | 示例 |
|------|------|------|
| `id` | 唯一标识符，使用 kebab-case | `pantheon` |
| `name` | 中文名称 | `万神殿` |
| `location` | 地点 | `意大利罗马` |
| `era` | 时代描述 | `公元前27年—公元14年` |
| `sortYear` | 排序年份（负数为公元前） | `-27` |
| `eraCategory` | 时代分类 | `古代` |
| `category` | 分类 | `cultural` |
| `coordinates` | 经纬度 `[lng, lat]` | `[12.4768, 41.8986]` |
| `tags` | 标签数组 | `["古代"]` |
| `shortDesc` | 短描述 | `古罗马最重要的建筑之一` |
| `description` | 详细描述（中文） | `...` |
| `name_en` | 英文名称 | `Pantheon` |
| `location_en` | 英文地点 | `France Dordogne` |
| `era_en` | 英文时代描述 | `~20000 BC` |
| `eraCategory_en` | 英文时代分类 | `Ancient Era` |
| `shortDesc_en` | 英文短描述 | `...` |
| `description_en` | 英文详细描述 | `...` |

**注意：** 所有 `*_en` 字段必须使用**纯英文**，不要使用 `[EN]` 前缀，不要填写中文内容。

### 可选字段

| 字段 | 说明 |
|------|------|
| `image` | 图片文件名，如 `pantheon.jpg` |

---

## 2. 时代分类 / Era Categories

| 中文 | English | sortYear 范围 |
|------|---------|---------------|
| 史前与青铜时代 | Prehistoric Bronze Age | ~ -10000 ~ -800 |
| 古代 | Ancient Era | ~ -700 ~ 500 |
| 中世纪贸易 | Medieval Trade | ~ 500 ~ 1400 |
| 文艺复兴与宗教改革 | Renaissance Reformation | ~ 1400 ~ 1600 |
| 帝国、启蒙与革命 | Empires Enlightenment Revolution | ~ 1600 ~ 1800 |
| 世界大战与冷战 | World Wars Cold War | ~ 1800 ~ 1990 |

---

## 3. 图片要求

### 图片存放位置
```
public/assets/
```

### 图片命名规范
- 使用 kebab-case
- 与 `id` 字段保持一致
- 格式：`.jpg` 或 `.png`

**正确示例：**
- `pantheon.jpg`
- `colosseum.jpg`
- `alhambra.jpg`

**错误示例：**
- `Pantheon.jpg` (大写)
- `pantheon-box.jpg` (不必要的添加)
- `pantheon-01.jpg` (多余序号)

### 图片获取步骤

1. **使用必应图片搜索** (版权风险较低)
   - 搜索：`[景点名] UNESCO` 或 `[景点名] wiki`
   - 优先选择 Creative Commons 授权图片

2. **使用 Wikipedia**
   - 访问 `https://en.wikipedia.org/wiki/[Attraction_Name]`
   - 点击图片查看版权信息
   - 优先选择 Public Domain 图片

3. **验证图片**
   - 确认图片内容正确
   - 确认分辨率足够（建议 1200px 以上）
   - 下载后重命名为标准名称

4. **放置图片**
   - 将图片复制到 `public/assets/`
   - 确认文件名与 `id` 一致

---

## 4. 确保来源准确性

### 信息查找步骤

1. **Wikipedia**
   - 中文维基：`https://zh.wikipedia.org/wiki/`
   - 英文维基：`https://en.wikipedia.org/wiki/`

2. **UNESCO 世界遗产**
   - `https://whc.unesco.org/en/list/`
   - 搜索景点名称，验证是否为世界遗产

3. **必应/Google 学术**
   - 用于验证年代、历史事实

### 信息核实清单

- [ ] 名称：中文名和英文名是否准确
- [ ] 年代：`sortYear` 是否与历史记录一致
- [ ] 地点：国家、城市是否正确
- [ ] 坐标：经纬度是否准确（可在 Google Maps 查找）
- [ ] 描述：事实性描述是否有据可查
- [ ] 分类：`eraCategory` 是否合适

### 常见错误检查

- [ ] `sortYear: 40` 可能被误解为公元40年或1940年
  - 罗马建筑用公元年：`40` = 公元40年
  - 20世纪建筑用4位数：`1940`
- [ ] 负数表示公元前：`sortYear: -500` = 公元前500年
- [ ] 不要使用 `999999` 作为占位符

---

## 5. JSON 格式规范

```json
{
  "timelinePoints": [
    {
      "id": "example-attraction",
      "name": "示例景点",
      "location": "国家 城市",
      "era": "年代描述",
      "sortYear": 1500,
      "eraCategory": "时代分类",
      "category": "cultural",
      "coordinates": [12.3456, 41.9876],
      "tags": ["时代分类"],
      "shortDesc": "一句话描述",
      "description": "详细描述...",
      "name_en": "Example Attraction",
      "location_en": "Country City",
      "era_en": "Description in English",
      "eraCategory_en": "Era Category",
      "shortDesc_en": "One sentence description",
      "description_en": "Detailed description in English...",
      "image": "example-attraction.jpg"
    }
  ]
}
```

---

## 6. 添加后检查

1. 验证 JSON 格式正确：
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('public/data/attractions.json'))"
   ```

2. 重新排序（按 sortYear）：
   ```bash
   node -e "
   const fs = require('fs');
   const data = JSON.parse(fs.readFileSync('public/data/attractions.json', 'utf8'));
   data.timelinePoints.sort((a, b) => a.sortYear - b.sortYear);
   fs.writeFileSync('public/data/attractions.json', JSON.stringify(data, null, 2));
   "
   ```

3. 在浏览器中测试应用

---

## 7. 禁止事项

- 不要添加没有可靠来源的景点
- 不要复制他人描述（侵犯版权）
- 不要使用未经授权的图片
- 不要使用 `999999` 等占位符
- 不要跳过核实步骤
