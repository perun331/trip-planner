# 开发步骤清单 - 高德地图行程规划

## Phase 0：项目初始化 + 文档体系 ✅

- [x] 创建 Vite + React 项目
- [x] 安装依赖
- [x] 创建 docs/ 及其下 4 份规范文档
- [x] 创建 dev-log/ 及当天日志
- [x] 创建 CLAUDE.md 指引文件

## Phase 1：基础框架 + 全局样式 + 步骤导航

- [ ] 清空 Vite 默认代码，创建 App.jsx / main.jsx
- [ ] 编写 App.css 全局样式（使用 design-spec.md 中的色彩/字体/间距）
- [ ] 创建 TripContext.jsx（定义数据结构）
- [ ] 创建 Header.jsx（标题栏）
- [ ] 创建 StepIndicator.jsx（步骤圆点指示器）
- [ ] 创建 NavigationBar.jsx（上一步/下一步按钮）
- [ ] App.jsx 中实现四步切换逻辑
- [ ] 创建 utils/amap.js（封装高德 API 加载）
- [ ] 验证：浏览器和手机查看布局正常

## Phase 2：步骤1 — 吃什么

- [ ] 创建 EatStep.jsx（表单 + 搜索 + 结果列表）
- [ ] 集成 AMap.AutoComplete（地点搜索输入）
- [ ] 集成 AMap.PlaceSearch（餐厅搜索）
- [ ] 搜索结果在地图上标注
- [ ] 餐厅卡片列表（可勾选 1-3 家）
- [ ] 选中数据存入 TripContext
- [ ] 验证：搜索→标注→勾选全流程

## Phase 3：步骤2 — 去哪里

- [ ] 创建 GoStep.jsx（搜索 + 已选列表）
- [ ] 集成 AMap.AutoComplete（目的地模糊搜索）
- [ ] 选中后地图标注
- [ ] 已选目的地列表（支持删除）
- [ ] 数据存入 TripContext
- [ ] 验证：搜索→添加→删除全流程

## Phase 4：步骤3 — 住哪里

- [ ] 创建 StayStep.jsx（推荐区域 + 酒店搜索）
- [ ] 实现地铁站搜索 + 换乘计算逻辑
- [ ] 推荐区域面板（显示换乘信息）
- [ ] 价格筛选 + 酒店搜索
- [ ] 酒店卡片列表（单选）
- [ ] 数据存入 TripContext
- [ ] 验证：自动推荐→选区域→选酒店全流程

## Phase 5：步骤4 — 生成行程

- [ ] 创建 Itinerary.jsx
- [ ] 汇总展示所有选择
- [ ] 出行提示（地铁路线、换乘）
- [ ] 复制行程按钮
- [ ] 重新规划按钮
- [ ] 验证：完整走通全流程

## 后续优化（可选）

- [ ] 行程导出为图片
- [ ] 增加地图路线连线展示
- [ ] PWA 支持（可添加到手机主屏幕）
