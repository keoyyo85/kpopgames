// 小红书小工具端能力封装（容器自动注入 window.xhs，无需引入 SDK）
// 所有调用前先判空并提供降级路径；未注入环境（普通浏览器）下相关能力返回 false / undefined。
// 仅使用在线文档列出的 API，不直接调用原生 bridge。

function getMiniTool() {
  const xhs = window.xhs;
  const miniTool = xhs && xhs.miniTool;
  return miniTool && typeof miniTool === 'object' ? miniTool : null;
}

function hasMethod(name) {
  const miniTool = getMiniTool();
  return !!(miniTool && typeof miniTool[name] === 'function');
}

// 容器注入即认为运行在小工具内（用于切换交互）
export function inMiniTool() {
  return !!getMiniTool();
}

export function supportsPostNote() {
  return hasMethod('postNote');
}

export function supportsSaveToAlbum() {
  return hasMethod('saveImageToPhotosAlbum');
}

// 将 canvas 的 dataURL 落成容器临时文件；失败或无能力时返回原 dataURL
export function toFilePaths(dataUrls) {
  const miniTool = getMiniTool();
  if (!miniTool || typeof miniTool.writeTempFile !== 'function') {
    return Promise.resolve(dataUrls);
  }
  return Promise.all(
    dataUrls.map((url) =>
      Promise.resolve()
        .then(() => miniTool.writeTempFile({ data: url }))
        .then((result) => (result && result.filePath ? result.filePath : url))
        .catch(() => url)
    )
  );
}

export function saveImageToAlbum(filePath) {
  const miniTool = getMiniTool();
  if (!miniTool || typeof miniTool.saveImageToPhotosAlbum !== 'function') {
    return Promise.reject(new Error('saveImageToPhotosAlbum:unavailable'));
  }
  return Promise.resolve().then(() => miniTool.saveImageToPhotosAlbum({ filePath }));
}

// 唤起笔记发布页；title / content 有长度上限，超出部分在此截断
export function postNote(options) {
  const miniTool = getMiniTool();
  if (!miniTool || typeof miniTool.postNote !== 'function') {
    return Promise.reject(new Error('postNote:unavailable'));
  }
  const images = (options && options.images) || [];
  const imageResources = images.map((url) => ({ url }));
  return Promise.resolve().then(() =>
    miniTool.postNote({
      title: String((options && options.title) || '').slice(0, 20),
      content: String((options && options.content) || '').slice(0, 1000),
      pageType: 'photo_publish',
      mediaInfo: { image_resources: imageResources },
    })
  );
}
