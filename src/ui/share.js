// 小红书分享：Canvas 绘制 3:4 分享图（封面卡 + 出道名单卡）
// 全部用系统字体手绘，不依赖图片资源和第三方库；容器内走 window.xhs.miniTool 端能力。
import { el } from './dom.js';
import { displayGroup } from '../data/members.js';
import { getState, selectedMembers, positionsOf } from '../state.js';
import { toast } from './shell.js';
import {
  supportsPostNote,
  supportsSaveToAlbum,
  toFilePaths,
  saveImageToAlbum,
  postNote,
} from '../xhs.js';

const W = 1080;
const H = 1440; // 3:4，小红书标准竖图比例
const FONT = "'PingFang SC','HarmonyOS Sans SC','Microsoft YaHei',sans-serif";

const C = {
  bg: '#efefef',
  card: '#ffffff',
  ink: '#161616',
  ink2: '#696969',
  accent: '#161616',
  line: '#dddddd',
  lilac: '#e7e7e7',
  lavender: '#dedede',
  green: '#f0f0f0',
  blue: '#d7d7d7',
};
const CHIP_COLORS = [C.lilac, C.lavender, C.green, C.blue];
const CHIP_INKS = ['#333333', '#333333', '#333333', '#333333'];

/* ---------------- canvas 基础工具 ---------------- */

function newCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'alphabetic';
  return { canvas, ctx };
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function centerText(ctx, text, y, { fs, weight = 700, color = C.ink, spacing = '' }) {
  ctx.font = `${weight} ${fs}px ${FONT}`;
  if (spacing) ctx.letterSpacing = spacing;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, W / 2, y);
  if (spacing) ctx.letterSpacing = '0px';
}

function fitTeamName(ctx, name) {
  // 自动缩小 + 最多两行，超出加省略号
  for (let fs = 104; fs >= 58; fs -= 6) {
    ctx.font = `800 ${fs}px ${FONT}`;
    if (ctx.measureText(name).width <= W - 200) return { lines: [name], fs };
    const mid = Math.ceil(name.length / 2);
    for (let cut = mid; cut > 1 && cut < name.length - 1; cut--) {
      const a = name.slice(0, cut);
      const b = name.slice(cut);
      if (ctx.measureText(a).width <= W - 200 && ctx.measureText(b).width <= W - 200) {
        return { lines: [a, b], fs };
      }
    }
  }
  ctx.font = `800 58px ${FONT}`;
  let t = name;
  while (t.length > 2 && ctx.measureText(t + '…').width > W - 200) t = t.slice(0, -1);
  return { lines: [t + '…'], fs: 58 };
}

function paintBg(ctx, { blobs = true } = {}) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  if (!blobs) return;
  const blobs2draw = [
    [C.lilac, -140, -160, 300],
    [C.green, W + 60, 260, 240],
    [C.blue, 60, H + 80, 280],
    [C.lavender, W - 180, H - 220, 190],
  ];
  for (const [color, x, y, r] of blobs2draw) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function paintFooter(ctx, y) {
  centerText(ctx, '#重生之我组kpop团体 · 粉丝二创小游戏', y, {
    fs: 26, weight: 600, color: C.ink2, spacing: '2px',
  });
}

/* ---------------- 卡片 1 · 封面卡 ---------------- */

function drawCover() {
  const { canvas, ctx } = newCanvas();
  const { teamName } = getState();
  const members = selectedMembers();

  paintBg(ctx);

  // 白色主卡面
  ctx.fillStyle = C.card;
  roundRect(ctx, 70, 150, W - 140, H - 300, 56);
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 3;
  roundRect(ctx, 70, 150, W - 140, H - 300, 56);
  ctx.stroke();

  let y = 300;
  centerText(ctx, '重生之我组kpop团体 · DEBUT PROFILE', y, {
    fs: 28, weight: 800, color: C.accent, spacing: '10px',
  });

  // 团名
  const { lines, fs } = fitTeamName(ctx, teamName.trim() || '未命名团体');
  y += 130 + (lines.length - 1) * (fs * 1.16);
  for (const line of lines) {
    centerText(ctx, line, y, { fs, weight: 800, spacing: '4px' });
    y += Math.round(fs * 1.16);
  }

  // 虚线分隔
  y += 46;
  ctx.strokeStyle = '#cbdcde';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 14]);
  ctx.beginPath();
  ctx.moveTo(190, y);
  ctx.lineTo(W - 190, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // 人数
  y += 84;
  centerText(ctx, `成员人数：${members.length} 人 · 今日正式出道`, y, {
    fs: 32, weight: 600, color: C.ink2,
  });

  // 成员名牌（胶囊，自动换行居中）
  y += 66;
  const chipH = 60, gapX = 18, gapY = 20, maxW = W - 260;
  let rowW = 0, rowStart = [];
  const rows = [[]];
  for (const m of members) {
    ctx.font = `700 28px ${FONT}`;
    const w = Math.ceil(ctx.measureText(m.zh || m.name).width) + 52;
    if (rowW + w > maxW && rows[rows.length - 1].length) {
      rows.push([]);
      rowW = 0;
    }
    rows[rows.length - 1].push([m, w]);
    rowW += w + gapX;
  }
  for (const row of rows) {
    const total = row.reduce((s, [, w]) => s + w + gapX, 0) - gapX;
    let x = (W - total) / 2;
    for (const [m, w] of row) {
      const idx = members.indexOf(m);
      ctx.font = `700 28px ${FONT}`;
      const text = m.zh || m.name;
      ctx.fillStyle = CHIP_COLORS[idx % 4];
      roundRect(ctx, x, y, w, chipH, chipH / 2);
      ctx.fill();
      ctx.fillStyle = CHIP_INKS[idx % 4];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x + w / 2, y + chipH / 2 + 2);
      ctx.textBaseline = 'alphabetic';
      x += w + gapX;
    }
    y += chipH + gapY;
  }

  // 底部口号 + 引导（在名牌结束与卡片底边之间垂直居中，收掉大留白）
  const cardBottom = H - 150;
  const chipsEnd = y + 20;
  const sloganY = Math.max(
    chipsEnd + 96,
    chipsEnd + ((cardBottom - 130 - chipsEnd) * 2) / 3
  );
  centerText(ctx, '这是你组建的团体！', sloganY, {
    fs: 42, weight: 800, color: C.accent, spacing: '4px',
  });
  centerText(ctx, '你也来组一个，评论区交出你的梦中团体', sloganY + 72, {
    fs: 28, weight: 500, color: C.ink2,
  });
  paintFooter(ctx, H - 122);

  return canvas;
}

/* ---------------- 卡片 2+ · 出道名单卡 ---------------- */

function drawRosterPage(chunk, allCount, pageIdx, pageCount, offset) {
  const { canvas, ctx } = newCanvas();
  const { teamName } = getState();
  const name = teamName.trim() || '未命名';

  paintBg(ctx);

  ctx.fillStyle = C.card;
  roundRect(ctx, 70, 110, W - 140, H - 220, 56);
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 3;
  roundRect(ctx, 70, 110, W - 140, H - 220, 56);
  ctx.stroke();

  centerText(ctx, `「${name}」出道名单`, 246, { fs: 58, weight: 800, spacing: '2px' });
  centerText(ctx, `共 ${allCount} 人 · 第 ${pageIdx + 1} / ${pageCount} 页`, 318, {
    fs: 28, weight: 600, color: C.ink2,
  });

  ctx.strokeStyle = '#cbdcde';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 14]);
  ctx.beginPath();
  ctx.moveTo(190, 372);
  ctx.lineTo(W - 190, 372);
  ctx.stroke();
  ctx.setLineDash([]);

  const top = 428;
  const bottom = H - 300;
  // 行高设上限：人数少时保持紧凑并整体居中，避免被拉满整页
  const rowH = Math.min((bottom - top) / chunk.length, 150);
  const blockH = rowH * chunk.length;
  const start = top + Math.max(0, (bottom - top - blockH) / 2);

  chunk.forEach((m, i) => {
    const y = start + i * rowH;
    const cy = y + rowH / 2;

    // 序号徽章
    ctx.fillStyle = CHIP_COLORS[i % 4];
    ctx.beginPath();
    ctx.arc(170, cy, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CHIP_INKS[i % 4];
    ctx.font = `800 30px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(offset + i + 1).padStart(2, '0'), 170, cy + 2);
    ctx.textBaseline = 'alphabetic';

    // 名字
    ctx.textAlign = 'left';
    ctx.fillStyle = C.ink;
    ctx.font = `800 40px ${FONT}`;
    ctx.fillText(m.zh || m.name, 236, cy - 8);
    if (m.zh) {
      const zhW = ctx.measureText(m.zh || m.name).width;
      ctx.fillStyle = C.ink2;
      ctx.font = `500 26px ${FONT}`;
      ctx.fillText(m.name, 236 + zhW + 16, cy - 8);
    }

    // 原团 + 定位
    const pos = positionsOf(m.id);
    ctx.fillStyle = C.ink2;
    ctx.font = `500 27px ${FONT}`;
    const posText = pos.length ? pos.join(' / ') : '自由活动';
    ctx.fillText(`原团：${displayGroup(m.group)}｜定位：${posText}`, 236, cy + 40);

    if (i > 0) {
      ctx.strokeStyle = '#e5eded';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(236, y + 2);
      ctx.lineTo(W - 170, y + 2);
      ctx.stroke();
    }
  });

  paintFooter(ctx, H - 122);
  return canvas;
}

/* ---------------- 分享面板 ---------------- */

// 容器内：存相册 + 直接唤起笔记发布页；普通浏览器：预览图片（长按保存）+ 可选中文案
function showSharePanel(canvases) {
  const old = document.querySelector('.share-modal');
  if (old && old.parentNode) old.parentNode.removeChild(old);

  const mount = document.getElementById('app') || document.body;
  const dataUrls = canvases.map((canvas) => canvas.toDataURL('image/png'));
  const canPost = supportsPostNote();
  const canSaveAlbum = supportsSaveToAlbum();
  const caption = buildShareText();
  const title = buildShareTitle();

  const close = () => {
    overlay.remove();
    document.body.classList.remove('share-modal-open');
  };

  const actions = [];

  if (canPost) {
    actions.push(el('button', {
      class: 'share-modal__footbtn',
      type: 'button',
      onclick: () => {
        toFilePaths(dataUrls).then((paths) =>
          postNote({ title, content: caption, images: paths })
            .then(() => toast('已打开笔记发布页'))
            .catch(() => toast('发布页唤起失败，可先用「存相册」再手动发笔记'))
        );
      },
    }, '去发笔记'));
  }

  if (canSaveAlbum) {
    actions.push(el('button', {
      class: 'share-modal__footbtn',
      type: 'button',
      onclick: () => {
        // 逐张保存，避免并发触发系统相册授权
        toFilePaths(dataUrls)
          .then((paths) =>
            paths.reduce(
              (chain, path) => chain.then(() => saveImageToAlbum(path)).catch(() => null),
              Promise.resolve()
            )
          )
          .then(() => toast('已保存到相册 ✨'))
          .catch(() => toast('保存失败，请重试'));
      },
    }, '存到相册'));
  }

  actions.push(el('button', {
    class: 'share-modal__footbtn share-modal__footbtn--solid',
    type: 'button',
    onclick: close,
  }, '完成'));

  const overlay = el('div', { class: 'share-modal' },
    el('div', { class: 'share-modal__bar' },
      el('div', { class: 'share-modal__barText' },
        el('b', {}, '分享到小红书'),
        el('span', {},
          canPost || canSaveAlbum
            ? '图片可直接存相册或带到笔记发布页'
            : '长按图片可保存，文案可长按选中复制')
      )
    ),
    el('div', { class: 'share-modal__scroll' },
      el('div', { class: 'share-modal__preview' },
        dataUrls.map((url, i) =>
          el('div', { class: 'share-modal__item' },
            el('img', { src: url, alt: `分享图 ${i + 1}` })
          )
        )
      ),
      el('div', { class: 'share-modal__caption' },
        el('p', { class: 'share-modal__captionTitle' }, '笔记文案'),
        el('p', { class: 'share-modal__captionText' }, caption)
      )
    ),
    el('footer', { class: 'share-modal__foot' }, actions)
  );

  mount.append(overlay);
  document.body.classList.add('share-modal-open');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}

/* ---------------- 对外入口 ---------------- */

// 结果页「分享到小红书」按钮的唯一入口：生成分享图并弹出分享面板
export function openShare() {
  const members = selectedMembers();
  const n = members.length;
  const pages = Math.ceil(n / 6);
  // 均衡分页：7 人 → 4+3，而不是 6+1，避免出现只剩一人的空页
  const chunks = [];
  let remaining = n;
  let offset = 0;
  for (let p = 0; p < pages; p++) {
    const take = Math.ceil(remaining / (pages - p));
    chunks.push({ list: members.slice(offset, offset + take), offset });
    offset += take;
    remaining -= take;
  }
  const canvases = [drawCover()];
  chunks.forEach((entry, i) =>
    canvases.push(drawRosterPage(entry.list, n, i, pages, entry.offset))
  );
  showSharePanel(canvases);
}

// 笔记标题（postNote.title 最长 20 字）
export function buildShareTitle() {
  const { teamName } = getState();
  const name = teamName.trim() || '未命名';
  const title = `我组的新团「${name}」出道了`;
  return title.length > 20 ? title.slice(0, 19) + '…' : title;
}

// 笔记正文（postNote.content 最长 1000 字；容器禁止剪贴板，故同时用于可选中文本展示）
export function buildShareText() {
  const { teamName } = getState();
  const members = selectedMembers();
  const name = teamName.trim() || '未命名';
  const lines = members.map((m, i) => {
    const pos = positionsOf(m.id);
    const posText = pos.length ? pos.join(' / ') : '自由活动';
    return `${String(i + 1).padStart(2, '0')} ${m.zh || m.name}${m.zh ? `（${m.name}）` : ''}｜原团：${displayGroup(m.group)}｜${posText}`;
  });

  return [
    `【重生之我组kpop团体】我的新团「${name}」今日出道！`,
    '',
    lines.join('\n'),
    '',
    '这个阵容打几分？评论区交出你的梦中团体。',
    '',
    '#重生之我组kpop团体 #kpop #团体企划 #梦中情团 #粉丝二创',
  ].join('\n');
}

