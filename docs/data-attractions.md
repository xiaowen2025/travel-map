# 景点数据规范 / Attraction Data Schema

本文档定义 `public/data/attractions.json` 的数据结构规范。

---

## 1. 基础结构

```json
{
  "timelinePoints": [
    {
      "id": "example-attraction",
      "name": {
        "en": "Example Attraction",
        "zh": "示例景点"
      },
      "era": "1st century",
      "sortYear": 1,
      "eraCategory": "Ancient Era",
      "category": "cultural",
      "coordinates": [12.3456, 41.9876],
      "tags": ["Ancient Era"],
      "shortDesc": {
        "en": "One sentence description",
        "zh": "一句话描述"
      },
      "description": {
        "en": "Detailed description in English...",
        "zh": "详细描述..."
      },
      "country": {
        "en": "Italy",
        "zh": "意大利"
      },
      "region": {
        "en": "Rome",
        "zh": "罗马"
      },
      "city": null,
      "image": "example-attraction.jpg"
    }
  ]
}
```

---

## 2. 字段说明

### 2.1 必填字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | string | 唯一标识符，kebab-case | `pantheon` |
| `name` | `{en, zh}` | 名称（双语） | `Pantheon` / `万神殿` |
| `era` | string | 时代描述（英文） | `1st century`, `late 18th century` |
| `sortYear` | number | 排序年份（负数为公元前） | `-500`, `1`, `1940` |
| `eraCategory` | string | 时代分类 | `Ancient Era`, `Medieval Trade` |
| `category` | string | 分类 | `cultural` |
| `coordinates` | [lng, lat] | 经纬度 | `[12.4768, 41.8986]` |
| `tags` | string[] | 标签数组 | `["Ancient Era"]` |
| `shortDesc` | `{en, zh}` | 短描述（双语） | `...` |
| `description` | `{en, zh}` | 详细描述（双语） | `...` |
| `country` | `{en, zh}` | 国家 | `Italy` / `意大利` |
| `region` | `{en, zh}` | 地区 | `Rome` / `罗马` |
| `city` | null | 城市（可选） | `null` |

### 2.2 可选字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `image` | string | 图片文件名 | `pantheon.jpg` |

---

## 3. `sortYear` 规范

| 场景 | sortYear 值 | 说明 |
|------|-------------|------|
| 20 世纪 1940 年 | `1940` | 使用 4 位数 |
| 1 世纪（公元 1-100 年） | `1` | 使用起始年 |
| 18 世纪（公元 1701-1800 年） | `1701` | 使用起始年 |
| 公元前 500 年 | `-500` | 公元前用负数 |

---

## 4. 时代分类 / Era Categories

| 中文 | English | sortYear 范围 |
|------|---------|---------------|
| 史前与青铜时代 | Prehistoric Bronze Age | ~ -10000 ~ -800 |
| 古代 | Ancient Era | ~ -700 ~ 500 |
| 中世纪贸易 | Medieval Trade | ~ 500 ~ 1400 |
| 文艺复兴与宗教改革 | Renaissance Reformation | ~ 1400 ~ 1600 |
| 帝国、启蒙与革命 | Empires Enlightenment Revolution | ~ 1600 ~ 1800 |
| 世界大战与冷战 | World Wars Cold War | ~ 1800 ~ 1990 |

---

## 5. `era` 文本规范

### 5.1 命名规则

| 场景 | 规则 | 正确示例 | 错误示例 |
|------|------|----------|----------|
| 单世纪 | 序数词 + century | `1st century` | `1st Century`, `century 1` |
| 世纪范围 | `-` 连接两个世纪 | `12th-14th century` | `12th to 14th century` |
| 半世纪前缀 | early/mid/late + 世纪 | `early 18th century` | `18th century early` |
| 公元前 | century + BC | `8th century BC` | `BC 8th century` |
| 多阶段 | 分号分隔，核心年代最后 | `built 13th century; rebuilt 16th century` | — |
| 不确定起始 | from + 世纪 | `from 13th century` | `since 13th century` |
| 近似年代 | ~ + 数字 + BC | `~20000 BC` | `around 20000 BC` |

### 5.2 格式化规则

```
[前缀] [世纪] [-世纪] [后缀]
```

| 组件 | 可选值 | 说明 |
|------|--------|------|
| 前缀 | early, mid, late | 半世纪标识 |
| 世纪 | 1st, 2nd, 3rd, 4th-20th | 序数词 |
| 范围 | `-` | 世纪连接符 |
| 后缀 | BC | 公元前标识 |

### 5.3 标准格式速查表

| era | sortYear |
|-----|----------|
| ~20000 BC | -20000 |
| ~12000 BC | -12000 |
| 1st century | 1 |
| 2nd century | 101 |
| 3rd century | 201 |
| 4th century | 301 |
| 5th-6th century | 401 |
| 8th century BC | -800 |
| 13th century | 1201 |
| built 13th century; rebuilt 16th century | 1201 |
| late 18th century | 1761 |
| mid 20th century | 1940 |
| from 13th century | 1201 |

### 5.4 常见错误纠正

| 错误写法 | 正确写法 |
|----------|----------|
| `1 century` | `1st century` |
| `1700s` | `18th century` |
| `12-14c` | `12th-14th century` |
| `built in the 13th century` | `built 13th century` |

---

## 6. 禁止事项

- ❌ 不要用 2 位数表示 20 世纪（如 `sortYear: 40` 应为 `1940`）
- ❌ 不要使用世纪缩写（如 `12-14c`）
- ❌ 不要使用世纪复数形式（如 `1700s` 应用 `18th century`）
- ❌ 不要在 era 文本中混入冗余描述
- ❌ 不要使用占位符如 `999999`
