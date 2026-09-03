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

    // 状态行前置图标：emoji 字符 + 预置动画名（rainbow-icon-bounce / -spin / -pulse / -wiggle / -flip）。
    const ICON = { content: "⏳", animation: "rainbow-icon-flip 1.2s ease-in-out infinite" };

    // 运行状态行样式：命中 TurnStatus 的稳定属性（role="status" aria-live="polite"），
    // 注入流动彩虹渐变字 + 前置动效图标。样式表随插件卸载/热替换一并移除。
    // 图标用 ::before 渲染，-webkit-text-fill-color: currentcolor 保住 emoji 原色
    // （否则会被父级的 transparent 渐变色裁掉）；inline-block 让 transform 动画生效。
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
  content: "${ICON.content} ";
  display: inline-block;
  -webkit-text-fill-color: currentcolor;
  color: #ff9f43;
  animation: ${ICON.animation};
}
@keyframes rainbow-status-flow {
  to { background-position: 300% 0; }
}
@keyframes rainbow-icon-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
@keyframes rainbow-icon-spin {
  to { transform: rotate(360deg); }
}
@keyframes rainbow-icon-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.25); }
}
@keyframes rainbow-icon-wiggle {
  0%, 100% { transform: rotate(-12deg); }
  50% { transform: rotate(12deg); }
}
@keyframes rainbow-icon-flip {
  0% { transform: rotateX(0); }
  50% { transform: rotateX(180deg); }
  100% { transform: rotateX(360deg); }
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
