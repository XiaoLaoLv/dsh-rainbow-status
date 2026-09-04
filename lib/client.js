window.__ModuleLoader__.load({
  id: "dsh-rainbow-status",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

    // 运行状态文案池：每次轮换随机挑一条，不与上一条重复。想加想删改这里就行。
    const PHRASES = [
      "努力搬砖中...",
      "疯狂思考中...",
      "深度求索中...",
      "认真琢磨中...",
      "翻箱倒柜中...",
      "灵光乍现中...",
      "埋头苦干中...",
      "抽丝剥茧中...",
    ];

    // 轮换间隔（毫秒）：只在状态行可见期间计时。
    const ROTATE_MS = 2500;

    // 前置动画图标：svg-spinners 的 wind-toy（MIT License，
    // https://github.com/n3r4zzurr0/svg-spinners，已改为彩虹渐变填充）。
    // SVG 内置 SMIL 声明式动画，编成 data URI 走 background-image，
    // 浏览器原生播放 —— 零 JS、零依赖、离线可用。想换图标：
    // 把任何动画 SVG（或 GIF/WebP）编成 data URI 替换这一串即可。
    const ICON_URL =
      "data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='24' y2='24' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23ff4d4d'/%3E%3Cstop offset='.35' stop-color='%23ffd93d'/%3E%3Cstop offset='.7' stop-color='%234dd7ff'/%3E%3Cstop offset='1' stop-color='%23d94dff'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23g)' d='M20.27,4.74a4.93,4.93,0,0,1,1.52,4.61,5.32,5.32,0,0,1-4.1,4.51,5.12,5.12,0,0,1-5.2-1.5,5.53,5.53,0,0,0,6.13-1.48A5.66,5.66,0,0,0,20.27,4.74ZM12.32,11.53a5.49,5.49,0,0,0-1.47-6.2A5.57,5.57,0,0,0,4.71,3.72,5.17,5.17,0,0,1,9.53,2.2,5.52,5.52,0,0,1,13.9,6.45,5.28,5.28,0,0,1,12.32,11.53ZM19.2,20.29a4.92,4.92,0,0,1-4.72,1.49,5.32,5.32,0,0,1-4.34-4.05A5.2,5.2,0,0,1,11.6,12.5a5.6,5.6,0,0,0,1.51,6.13A5.63,5.63,0,0,0,19.2,20.29ZM3.79,19.38A5.18,5.18,0,0,1,2.32,14a5.3,5.3,0,0,1,4.59-4,5,5,0,0,1,4.58,1.61,5.55,5.55,0,0,0-6.32,1.69A5.46,5.46,0,0,0,3.79,19.38ZM12.23,12a5.11,5.11,0,0,0,3.66-5,5.75,5.75,0,0,0-3.18-6,5,5,0,0,1,4.42,2.3,5.21,5.21,0,0,1,.24,5.92A5.4,5.4,0,0,1,12.23,12ZM11.76,12a5.18,5.18,0,0,0-3.68,5.09,5.58,5.58,0,0,0,3.19,5.79c-1,.35-2.9-.46-4-1.68A5.51,5.51,0,0,1,11.76,12ZM23,12.63a5.07,5.07,0,0,1-2.35,4.52,5.23,5.23,0,0,1-5.91.2,5.24,5.24,0,0,1-2.67-4.77,5.51,5.51,0,0,0,5.45,3.33A5.52,5.52,0,0,0,23,12.63ZM1,11.23a5,5,0,0,1,2.49-4.5,5.23,5.23,0,0,1,5.81-.06,5.3,5.3,0,0,1,2.61,4.74A5.56,5.56,0,0,0,6.56,8.06,5.71,5.71,0,0,0,1,11.23Z'%3E%3CanimateTransform attributeName='transform' type='rotate' dur='1.5s' values='0 12 12;360 12 12' repeatCount='indefinite'/%3E%3C/path%3E%3C/svg%3E";

    // 运行状态行样式：命中 TurnStatus 的稳定属性（role="status" aria-live="polite"），
    // 注入流动彩虹渐变字 + 前置动画图标。样式表随插件卸载/热替换一并移除。
    // 图标用 ::before + background-image 渲染（尺寸可控、不受父级透明裁字影响），
    // SMIL 动画在 image 上下文中由浏览器原生播放。
    const STATUS_CSS = `
[role="status"][aria-live="polite"] {
  background: linear-gradient(90deg,
    #ff4d4d, #ff9f43, #ffd93d, #6bff8f, #4dd7ff, #7c6bff, #d94dff, #ff4d4d);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: rainbow-status-flow 3s linear infinite;
}
[role="status"][aria-live="polite"]::before {
  content: "";
  display: inline-block;
  width: 1.1em;
  height: 1.1em;
  margin-right: 0.35em;
  vertical-align: -0.2em;
  background: url("${ICON_URL}") no-repeat center / contain;
}
@keyframes rainbow-status-flow {
  to { background-position: 300% 0; }
}`;

    const STATUS_SELECTOR = '[role="status"][aria-live="polite"]';

    module.exports = {
      inject: ["locale", "timer"],
      apply(ctx) {
        const locale = ctx.locale;

        // 样式注入：标签挂在 head 尾部，属性选择器双条件确保胜过原样式
        const style = document.createElement("style");
        style.textContent = STATUS_CSS;
        document.head.appendChild(style);

        const previous = locale.getLocale().active;
        const primary = previous.split("-")[0];
        const customId = primary + "-x-rainbow";

        const disposeLanguage = locale.addLanguage({
          id: customId,
          label: primary === "zh" ? "中文（彩虹定制）" : "Custom (" + previous + ")",
          fallback: previous,
        });

        // 文字典注册可热替换：注销旧的再注册新的，revision 提升让已挂载文案立即刷新
        let disposeDict = locale.register("chat", customId, {
          "chat.deepDiving": PHRASES[0],
        });
        const swapPhrase = (text) => {
          disposeDict();
          disposeDict = locale.register("chat", customId, {
            "chat.deepDiving": text,
          });
        };

        // 随机挑一条，不与当前条目重复
        let current = 0;
        const rotate = () => {
          if (PHRASES.length < 2) return;
          let next = current;
          while (next === current) next = Math.floor(Math.random() * PHRASES.length);
          current = next;
          swapPhrase(PHRASES[current]);
        };

        // 只在状态行出现在页面上时轮换：MutationObserver 盯它出现/消失
        let stopInterval = null;
        const startRotation = () => {
          if (stopInterval !== null) return;
          rotate();
          stopInterval = ctx.interval(rotate, ROTATE_MS);
        };
        const stopRotation = () => {
          if (stopInterval === null) return;
          stopInterval();
          stopInterval = null;
        };
        const observer = new MutationObserver(() => {
          if (document.querySelector(STATUS_SELECTOR) !== null) startRotation();
          else stopRotation();
        });
        if (document.querySelector(STATUS_SELECTOR) !== null) startRotation();
        observer.observe(document.body, { childList: true, subtree: true });

        locale.setLocale(customId);

        // 卸载 / 热重载时：停轮换、断监听、摘样式、还原语言、撤销注册
        ctx.effect(() => () => {
          stopRotation();
          observer.disconnect();
          style.remove();
          if (locale.getLocale().active === customId) {
            try {
              locale.setLocale(previous);
            } catch (error) {
              console.error("dsh-rainbow-status: restore locale failed:", error);
            }
          }
          disposeDict();
          disposeLanguage();
        });
      },
    };
    return module.exports;
  },
});
