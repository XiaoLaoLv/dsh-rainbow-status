# dsh-rainbow-status

DeepSeek Harness（DSH）聊天运行状态定制插件：把默认的「深度求索中...」换成**随机轮换的文案池**（默认 8 条），并配上**流动彩虹渐变字**。

纯浏览器半插件：零依赖、零构建、无 Host 逻辑。改动即热生效（无需刷新页面，无需重启）。

## 效果

- 模型运行时，状态行每 2.5 秒随机换一条文案（不与上一条重复），文字带 3 秒循环的流动彩虹渐变；
- 每轮对话开始时随机起手；
- 轮次结束、状态行消失时自动停止轮换，页面空闲零开销；
- 其余界面文案不受影响（走 locale fallback 链逐键回落原字典）。

## 安装（GitHub 一条命令）

前提：机器上装有 pnpm（`dsh plugin` 是 pnpm 转发器，缺失时会明确报错）。

```sh
# 从 DSH 源码仓库运行：
pnpm dsh plugin --profile web add github:<你的用户名>/dsh-rainbow-status

# 或 npx 方式（无需仓库）：
npx @deepseek-ai/dsh plugin --profile web add github:<你的用户名>/dsh-rainbow-status
```

然后**重启该 profile 的实例**（bundle 层在启动时装配）。浏览器刷新页面即可看到效果。卸载方式见下方「卸载」一节。

> npx 用户注意：npx 每次可能拉取最新版 dsh，而本插件依赖的 client 插件契约（`dsh.client` 清单、`__ModuleLoader__` 注册格式、`locale`/`timer` 服务）在 pre-release 阶段快速演进。建议用 `npx @deepseek-ai/dsh@<版本>` 钉住与插件验证过的版本；dsh 升级后如插件加载失败（fail loud），请到上游仓库对照最新契约更新。

> 注意：如果你此前用 `file:///` 行本地挂载过本插件，安装 bundle 版前请先删掉那一行 —— 同包名双行会触发 `resolves from multiple active Loader sources` 冲突，且发生在启动装配段时**整个服务无法启动**（不是本插件降级）。排障口诀：查 live 层有没有与 `dsh.profile.bundles` 同包名的行。

## 本地开发（免安装挂载）

往 `~/.dsh/profiles/web/cordis.patch.yml`（Windows: `%USERPROFILE%\.dsh\profiles\web\cordis.patch.yml`）追加：

```yaml
- id: rainbow-status
  name: 'file:///<本仓库绝对路径>/dsh-rainbow-status/src/index.js'
```

行增删热生效；改 `lib/client.js` 后由 `client-hmr` 的 stat 轮询热替换，无需刷新。

## 自定义

编辑 `lib/client.js` 顶部两个常量：

- `PHRASES` —— 文案池（数组，随意增删；少于 2 条时停止轮换）；
- `ROTATE_MS` —— 轮换间隔毫秒数。

彩虹配色在 `RAINBOW_CSS` 里，改 `linear-gradient` 的色标即可。

## 卸载

```sh
# 从 DSH 源码仓库运行：
pnpm dsh plugin --profile web remove dsh-rainbow-status

# 或 npx 方式（无需仓库）：
npx @deepseek-ai/dsh plugin --profile web remove dsh-rainbow-status
```

重启实例后彻底移除（语言、字典、样式全部随插件卸载自动还原）。`remove` 与当前目录无关 —— 转发器固定操作 `~/.dsh/profiles/web`；本仓库源码与 GitHub 远程不受影响。若 `node_modules` 残留链接，在 profile 目录跑一次 `pnpm install` 对账（勿对 junction 用递归删除）。

## 原理（locale 接缝）

`locale` 服务的 `register` 对同一 (命名空间, 语言) 是单一占用者，`chat`+`zh` 已被 ui-chat 占用，第三方无法覆盖式重注册。本插件走语言包扩展点：

1. `addLanguage({ id: 'zh-x-rainbow', fallback: 'zh' })` 注册自定义语言；
2. `register('chat', 'zh-x-rainbow', { 'chat.deepDiving': '...' })` 只覆盖这一个键；
3. `setLocale('zh-x-rainbow')` 切换过去 —— 查找逐键走 fallback 链，其余文案全部回落原语言；
4. 文案轮换 = 字典热替换：注销旧注册再注册新文案，revision 提升让已挂载文案立即刷新；
5. `MutationObserver` 盯状态行（`[role="status"][aria-live="polite"]`）出现/消失，只在可见期间用 `timer` 服务定时轮换；
6. 样式经 `document.head` 注入 `<style>`，用稳定属性选择器命中 TurnStatus（其类名是 CSS Module 哈希，不可依赖）；
7. 所有副作用（样式、语言、字典、定时器、observer）挂在 `ctx.effect` 清理链上，卸载/热替换完全可逆。

## 兼容性

针对本仓库当前的 client 插件契约开发（`dsh.client` 清单、`__ModuleLoader__` 工厂注册格式、`locale`/`timer` 服务）。DSH 处于 pre-release 阶段，契约快速演进，升级 DSH 后如失效请对照上游示例更新。
