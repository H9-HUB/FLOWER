# Floral Admin - 花卉商城管理后台

基于 Vue 3 + TypeScript + Vite 开发的花卉商城管理系统前端。

## 技术栈

- **前端框架**: Vue 3 (Composition API + `<script setup>`)
- **类型系统**: TypeScript
- **构建工具**: Vite
- **路由管理**: Vue Router 4
- **HTTP 客户端**: Axios
- **图表库**: Chart.js

## 项目特性

- 完整的管理后台页面（仪表盘、商品、订单、用户、分类管理）
- JWT 认证与权限控制
- Mock 数据支持，便于前端独立开发
- 响应式布局，支持移动端和桌面端
- 清新的浅绿色主题设计

## 目录结构

```
src/
├── api/              # API 接口封装
│   ├── auth.ts       # 登录认证
│   ├── dashboard.ts  # 仪表盘统计
│   ├── product.ts    # 商品管理
│   ├── order.ts      # 订单管理
│   ├── user.ts       # 用户管理
│   └── category.ts   # 分类管理
├── components/       # 公共组件
├── layouts/          # 布局组件
│   └── AdminLayout.vue  # 管理后台主布局
├── mock/             # Mock 数据
│   └── index.ts      # Mock 拦截器和数据
├── router/           # 路由配置
│   └── index.ts      # 路由定义
├── styles/           # 样式文件
│   └── variables.css # CSS 变量（主题色等）
├── types/            # TypeScript 类型定义
│   └── index.ts      # 接口和类型定义
├── utils/            # 工具函数
│   ├── storage.ts    # LocalStorage 封装
│   └── format.ts     # 格式化工具
├── views/            # 页面组件
│   ├── Login.vue     # 登录页
│   ├── Dashboard.vue # 仪表盘
│   ├── Products.vue  # 商品管理
│   ├── Orders.vue    # 订单管理
│   ├── Users.vue     # 用户管理
│   └── Categories.vue # 分类管理
├── App.vue           # 根组件
└── main.ts           # 入口文件
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

项目将在 http://localhost:5173 启动

### 构建生产版本

```bash
npm run build
```

构建产物将生成在 `dist/` 目录

### 预览生产构建

```bash
npm run preview
```

## 默认账号

```
用户名: admin
密码: admin123
```

## 主题颜色

项目使用清新的绿色主题，主要颜色值如下：

- 主色调：`#2e7d32` (深绿)
- 浅色背景：`#e7f5e9` (浅绿)
- 白色：`#ffffff`
- 文字色：`#333333`
- 边框色：`#e0e0e0`

颜色定义在 `src/styles/variables.css` 中，可根据需求调整。

## Mock 数据

项目内置 Mock 数据功能，在 `src/mock/index.ts` 中实现。

### 切换真实 API

要切换到真实后端 API，请修改 `src/mock/index.ts`：

```typescript
import { disableMock } from './mock'

// 在 main.ts 中调用
disableMock()
```

然后配置 `src/api/request.ts` 中的 `baseURL` 为真实后端地址。

## API 接口约定

所有管理后台接口路径以 `/admin` 开头，需要在请求头中携带 JWT Token：

```
Authorization: Bearer {token}
```

### 统一返回格式

```typescript
{
  code: number      // 200 表示成功
  message: string   // 消息提示
  data: any         // 返回数据
}
```

### 核心接口

- `POST /admin/login` - 登录
- `GET /admin/stat/overview?dateType=day|week|month` - 仪表盘统计
- `GET /admin/product` - 商品列表
- `PUT /admin/product/{id}/status` - 商品上下架
- `GET /admin/order` - 订单列表
- `PUT /admin/order/{id}/deliver` - 订单发货
- `GET /admin/user` - 用户列表
- `GET /admin/category` - 分类列表

详细接口定义请参考 `src/api/` 目录下的各个文件。

## 开发说明

1. 所有组件使用 Composition API + `<script setup>` 语法
2. 使用 TypeScript 进行类型检查
3. 遵循 Vue 3 最佳实践
4. 样式使用 scoped CSS 和 CSS 变量

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## License

MIT
