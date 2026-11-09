# 成理一号卫星数据平台 UI 重构方案

## Context

现有界面完全沿用 ASF 的顶部横向工具栏 + 全屏地图布局。用户要求改为自有视觉体系，参考「环天星库在线商城」：顶部白色品牌栏、最左 72px 图标导航、左侧白色纵向查询面板、右侧浅色大地图。

平台已品牌化为「成理一号」，无真实后端接口，搜索走本地占位（无结果），因此本次只重构界面与交互外观，保留现有 NgRx 数据流、地图、日期选择与搜索按钮逻辑，不恢复 ASF 功能。

## 目标布局

```
┌───────────────────────────────────────────────┐
│ 品牌栏 56px：logo + 成理一号卫星数据平台   ?  │
├────┬──────────────────┬───────────────────────┤
│Rail│ 查询面板 340px   │ 地图（浅色底 + 白卡控件）│
│72px│ 条件查询/精确查询 │      + 结果面板底部     │
└────┴──────────────────┴───────────────────────┘
```

## 实施步骤

### 1. 科技蓝设计系统

- `src/styles/_variables.scss`：把 `$mat-asf-primary` 的色阶替换为 #2F54EB 科技蓝系（50 #EEF3FF → 900 #1A2F86）。
- `src/styles/asf-theme-variables.scss`：
  - `$asf-app-primary` 改用蓝色 600 档（正好 #2F54EB），400/900 作为 lighter/darker。
  - light 主题显式覆盖：`background-white: #ffffff`、`primary-light: #E8EEFF`、`primary-dark: #1D3BB8`、`blue-link: #2F54EB`。
  - 保留 dark 主题映射，仅同步 primary 派生值。
- 不新增全局设计 token 文件；面板圆角/阴影写在组件 scss。

### 2. App Shell 重构

文件：`src/app/app.component.html`、`src/app/app.component.scss`、`src/app/app.component.ts`

- 品牌栏放在 `mat-sidenav-container` **外部**（避免抽屉覆盖品牌栏）；容器只包 body。
- `app.component.html` 结构：
  - `.brand-bar`：`<img src="/assets/branding/chengli-1-logo.png">` + `PLATFORM.name` / `PLATFORM.fullName`（来自 `src/app/models/platform.model.ts`）+ 右侧 HELP 图标（key `HELP` 已存在）。
  - `mat-sidenav-container` > `mat-sidenav`（沿用 `#sidenav` + `app-sidebar`）> `mat-sidenav-content` > `.app-body`。
  - `.app-body`：`.app-rail`（72px）+ `.search-panel`（`app-header`）+ `.map-area`（`app-map` + `app-results-menu`）。
- `app.component.ts`：
  - 新增 `public platform = models.PLATFORM`。
  - 新增 rail 交互方法：查询 → `uiStore.CloseSidebar()`；收藏 → `uiStore.OpenSidebar(SidebarType.SAVED_SEARCHES)`；历史 → `SidebarType.SEARCH_HISTORY`；导出 → 置灰占位。
  - imports 增加 `MatIcon`；保留 `#sidenav` ViewChild 与既有订阅。
- `app.component.scss`：
  - `.app-shell { height:100vh; display:flex; flex-direction:column }`、品牌栏 56px。
  - `.container { flex:1; min-height:0; height:auto }`。
  - `.app-body { display:grid; grid-template-columns:72px 340px 1fr; min-height:0 }`。
  - `.map-area { position:relative; min-width:0; overflow:hidden }`。
  - MOBILE（`breakpoint === breakpoints.MOBILE`）：隐藏 rail，`.app-body` 改单列两行（查询面板 42vh 可滚动 + 地图 1fr）。

### 3. 查询面板（重点重写）

文件：`src/app/components/header/header.component.html/scss`、`src/app/components/header/dataset-header/dataset-header.component.html/scss/ts`

- `header.component.html` 移除 `app-logo` 区块；保留 searchType 分支（平台只启用 DATASET），面板底部保留 `app-info-bar`（小字摘要）。
- `dataset-header.component.html` 重写为纵向卡片式面板：
  1. 顶部 tab：`条件查询`（激活）/`精确查询`（占位禁用）。
  2. `光学 / SAR` 分段按钮（占位视觉，当前仅 CHENGLI-1 数据集）。
  3. 数据集行：复用 `app-dataset-selector`（保持 `selected` / `selectedChange` 绑定）。
  4. 范围选择卡：
     - 标题 `范围选择 *` + 提示 `请选择查询范围`。
     - 按钮：行政区划（dispatch `uiStore.ToggleAOIOptions()`，展开现有 `app-aoi-options`）、矩形绘制（`mapStore.SetMapDrawMode(MapDrawModeType.BOX)` + `SetMapInteractionMode(DRAW)`）、多边形绘制（`MapDrawModeType.POLYGON` + DRAW）、更多（mat-menu：圆形/线段/点/清除范围）。
     - 复用 `app-aoi-filter` 作为 WKT 显示与“更多选项”入口，置于按钮下方。
     - 提示：`也可直接在地图上完成绘制，新的范围将替换当前范围`。
  5. 拍摄日期：复用 `app-date-selector` + 快捷区间按钮（近一周/近一个月/近三个月/近半年/近一年），dispatch `filtersStore.SetEndDate` 后 `SetStartDate`（UTC 00:00 / 23:59:59），避免 date-selector 自动回写。
  6. 滑杆区（占位，不写 store）：云量 0–100（气泡 `20%`）、侧摆角 0–45（`30°`）、分辨率 0.3–2（`1m`），使用 `MatSlider` + `MatSliderThumb`，本地 signal/属性驱动显示。
  7. sticky footer：`重置`（`filtersStore.ClearDatasetFilters()` + 关闭 AOI/清除绘制 + 清空快捷区间状态）与 `app-search-button`（复用现有搜索逻辑）。
- `dataset-header.component.scss` 全部重写（面板、tab、卡片、按钮、滑杆、footer）；覆盖 `.breadcrumb` 70px / `date-selector` 330px 等旧布局，确保 340px 内不溢出。
- `header.component.scss`：`.breadcrumb-list` 背景改白；`.breadcrumb-filter` 从 fixed 900px 改为面板内 absolute（left/right 0，top 52px，max-height 60vh 可滚动）。

### 4. 地图浅色化与白卡控件

文件：`src/app/components/map/map.component.scss`、`src/app/components/map/map-controls/map-controls.component.scss`、`src/app/components/map/attributions/attributions.component.scss`（如需要）

- `map.component.scss`：`:host { position:absolute; inset:0; display:block }`；`.map` 由 `position:fixed` 改 `absolute; inset:0; background:#EEF2F7`；`.map-header` 宽 `100%`（去掉 100vw）。
- 将 `.meatball`、`.opera-logo`、`.mobile-map-controls`、`.mobile-map-controls-full`、`.mobile-controls-background`、`.disclaimer-chip` 由 fixed 改为 absolute（相对 `.map-area`）。
- `map-controls.component.scss`：`.position` 右对齐；`.icon-bar` 改白底 + 8px 圆角 + 轻阴影 + 1px 边；`label`/`.control-icon` 改中性灰蓝；保留地图视图/缩放/图层/AOI/透明度控件。
- 地图默认中国视图保持 `src/app/services/map/views/equatorial.ts` 现状（center [104,36], zoom 4）。
- 构建后如发现 OpenLayers 尺寸未随布局更新，在 `map.component.ts` 初始化/窗口 resize 处补 `map.updateSize()`（先验证再改）。

### 5. 结果面板定位

文件：`src/app/components/results-menu/results-menu.component.scss`

- `.rectangle-wrapper` 由 `position:fixed` 改 `position:absolute; left:0; right:0; bottom:0`，使其只覆盖地图区域。
- `#result-div` 背景改白色；`.desktop-menu-offset` 保持 bottom 0。

### 6. i18n（三语同步）

文件：`src/assets/i18n/zh.json`、`en.json`、`es.json`

新增（复用已有 DRAW_A_BOX / DRAW_A_POLYGON / MORE / INCIDENCE_ANGLE / HELP / SAVED_SEARCHES / SEARCH_HISTORY / EXPORT）：

`CONDITION_QUERY`、`PRECISE_QUERY`、`RANGE_SELECTION`、`PLEASE_SELECT_SEARCH_RANGE`、`ADMINISTRATIVE_REGION`、`RECTANGLE_DRAW`、`POLYGON_DRAW`、`DRAW_RANGE_TIP`、`CAPTURE_DATE`、`PAST_WEEK`、`PAST_MONTH`、`PAST_3_MONTHS`、`PAST_6_MONTHS`、`PAST_YEAR`、`CLOUD_COVER`、`SIDE_LOOK_ANGLE`、`RESOLUTION`、`RESET`、`QUERY`、`OPTICAL`、`SAR`。

## 关键约束

- 不恢复 ASF 登录/按需/下载/搜索类型/外链文档。
- 不新增后端请求；滑杆为占位 UI。
- 模板使用 `@if/@for`；tsconfig 开启 noUnusedLocals/noUnusedParameters，删除未用 import。
- 组件 selector 与 store action 名称以现有代码为准（`ClearDatasetFilters` 已存在，`MapDrawModeType.BOX/POLYGON` 已存在）。

## 验证

1. `npm run check_keys`（package.json 已有脚本）确认三语 key 一致。
2. `npm run build` 通过。
3. 浏览器验证（dev server 4200 若已运行则复用）：
   - 品牌栏、72px rail、340px 面板、右侧浅色地图正确呈现，无横向滚动。
   - 地图默认镜头为中国，缩放/图层/AOI 控件可用且为白卡样式。
   - 点击查询按钮触发搜索（本地占位返回无结果），无 ASF 网络请求。
   - 快捷日期按钮更新起止日期；行政区划展开 AOI 卡；矩形/多边形按钮切换绘制模式。
   - 结果面板仅覆盖地图区域底部。
   - 控制台无运行时错误；MOBILE 宽度下 rail 隐藏、面板可滚动。
