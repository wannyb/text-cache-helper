// 安装时创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "cache-selection",
    title: chrome.i18n.getMessage("contextMenuTitle"),
    contexts: ["selection"]
  });
});

// 监听右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "cache-selection") {
    const newItem = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      text: info.selectionText,
      url: tab.url,
      title: tab.title,
      date: new Date().toISOString()
    };

    // 读取现有缓存，追加新内容
    chrome.storage.local.get({ savedItems: [] }, (result) => {
      const items = result.savedItems;
      items.push(newItem);
      chrome.storage.local.set({ savedItems: items }, () => {
        console.log('已缓存:', newItem);
      });
    });
  }
});
