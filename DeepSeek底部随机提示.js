// ==UserScript==
// @name         DeepSeek底部随机提示
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  每隔 x 秒随机切换底部提示文字，支持淡入淡出，并可在油猴菜单中自定义设置
// @author       松茸不吃柯尔鸭
// @match        https://chat.deepseek.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    const DEFAULT_INTERVAL = 60;
    const DEFAULT_TEXTS = [
        "内容由 AI 生成，请仔细甄别",
    ];

    // 初始化设置
    if (GM_getValue('interval') === undefined) GM_setValue('interval', DEFAULT_INTERVAL);
    if (GM_getValue('texts') === undefined) GM_setValue('texts', DEFAULT_TEXTS.join('|'));

    let interval = GM_getValue('interval');
    let texts = GM_getValue('texts').split('|').filter(t => t.trim() !== '');
    if (texts.length === 0) texts = DEFAULT_TEXTS; // 防止空数组

    // 菜单
    GM_registerMenuCommand('设置更新间隔 (当前 ' + interval + ' 秒)', () => {
        const input = prompt('请输入新的间隔秒数（数字）:', interval);
        if (input !== null && !isNaN(input) && Number(input) > 0) {
            interval = Number(input);
            GM_setValue('interval', interval);
            location.reload();
        }
    });

    GM_registerMenuCommand('自定义提示语 (用 | 分隔多条)', () => {
        const input = prompt('请输入提示语，多条用 | 分隔:', texts.join('|'));
        if (input !== null) {
            texts = input.split('|').filter(t => t.trim() !== '');
            if (texts.length === 0) texts = DEFAULT_TEXTS;
            GM_setValue('texts', texts.join('|'));
            location.reload();
        }
    });

    // 核心动画与更新
    function applyFadeEffect(el, newText) {
        el.style.transition = 'opacity 0.3s';
        el.style.opacity = '0';
        setTimeout(() => {
            el.textContent = newText;
            el.style.opacity = '1';
        }, 300);
    }

    function randomText() {
        return texts[Math.floor(Math.random() * texts.length)];
    }

    let timer = null;
    let currentElement = null;

    function startAutoUpdate(element) {
        // 清理旧定时器和目标
        if (timer) clearInterval(timer);
        currentElement = element;
        // 立即显示一条随机文字
        applyFadeEffect(element, randomText());
        // 启动定时器
        timer = setInterval(() => {
            applyFadeEffect(element, randomText());
        }, interval * 1000);
    }

    function init() {
        const target = document.querySelector('._0fcaa63');
        if (target) {
            startAutoUpdate(target);
        } else {
            const observer = new MutationObserver(() => {
                const newTarget = document.querySelector('._0fcaa63');
                if (newTarget) {
                    observer.disconnect();
                    startAutoUpdate(newTarget);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    // 确保 DOM 已就绪（如果脚本在 head 执行 body 可能还不存在）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();