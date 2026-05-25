# 技术规格 - 高德地图行程规划

## 技术栈

| 项 | 选择 | 版本 |
|---|------|------|
| 框架 | React | 18+ |
| 构建工具 | Vite | 5+ |
| 地图 SDK | 高德 JS API | v2.0 |
| 样式 | 纯 CSS | - |
| 部署 | 静态文件托管 | - |

## 高德 API Key

- 应用类型：**Web端(JS API)**
- 需要在 [高德控制台](https://console.amap.dev/) 设置域名白名单

## 使用的高德 API

| API | 用途 | 调用位置 |
|-----|------|----------|
| `AMap.Map` | 地图展示 | MapView.jsx |
| `AMap.PlaceSearch` | POI 搜索（餐厅/酒店/地铁站） | EatStep, StayStep |
| `AMap.AutoComplete` | 输入提示/模糊搜索 | EatStep(地点), GoStep(目的地) |
| `AMap.Transfer` | 公交/地铁路线规划 | StayStep(换乘计算) |
| `AMap.Geocoder` | 地址→坐标转换 | 备选使用 |

## 组件树

```
App
├── Header
├── StepIndicator
├── EatStep
│   ├── BudgetInput (双数字框)
│   ├── MealTimeSelect (下拉)
│   ├── LocationSearch (输入框 + Autocomplete)
│   ├── CuisineInput (文本)
│   ├── SearchButton
│   ├── MapView (地图 + 标注)
│   └── RestaurantCard[] (可选卡片列表)
├── GoStep
│   ├── DestinationSearch (输入框 + Autocomplete)
│   ├── MapView
│   └── DestinationCard[] (已选列表)
├── StayStep
│   ├── AreaPanel (推荐区域)
│   ├── PriceFilter (价格输入)
│   ├── SearchButton
│   ├── MapView
│   └── HotelCard[] (可选卡片列表)
├── Itinerary (行程页面)
└── NavigationBar (底部导航)
```

## 数据流

使用 React Context (`TripContext`) 存储全局状态：

```js
{
  // 步骤1 数据
  eatForm: { budgetMin, budgetMax, mealTime, location, locationLnglat, cuisine },
  restaurants: [],           // 搜索结果
  selectedRestaurants: [],   // 用户选中的（1-3家）

  // 步骤2 数据
  destinations: [],          // 用户已添加的目的地 [{name, address, lnglat}]

  // 步骤3 数据
  recommendedAreas: [],      // 推荐的地铁站区域
  selectedArea: null,        // 用户选中的区域
  hotels: [],                // 搜索结果
  selectedHotel: null,       // 用户选中的酒店
  transitInfo: [],           // 换乘信息

  // 步骤控制
  currentStep: 0,            // 0=吃, 1=去, 2=住, 3=行程
}
```

## 文件结构

```
trip-planner/
├── CLAUDE.md
├── docs/
│   ├── requirements.md
│   ├── tech-spec.md
│   ├── design-spec.md
│   └── dev-steps.md
├── dev-log/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── App.css
    ├── context/
    │   └── TripContext.jsx
    ├── components/
    │   ├── Header.jsx
    │   ├── StepIndicator.jsx
    │   ├── MapView.jsx
    │   └── NavigationBar.jsx
    ├── steps/
    │   ├── EatStep.jsx
    │   ├── GoStep.jsx
    │   ├── StayStep.jsx
    │   └── Itinerary.jsx
    └── utils/
        └── amap.js
```
