document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('items');
  const copyAllBtn = document.getElementById('copyAll');
  const exportBtn = document.getElementById('export');
  const donateBtn = document.getElementById('donate');
  const clearBtn = document.getElementById('clear');

  // 设置静态文本
  document.querySelector('h3').textContent = chrome.i18n.getMessage("popupTitle");
  copyAllBtn.textContent = chrome.i18n.getMessage("copyAllBtn");
  exportBtn.textContent = chrome.i18n.getMessage("exportBtn");
  donateBtn.textContent = chrome.i18n.getMessage("donateBtn");
  clearBtn.textContent = chrome.i18n.getMessage("clearBtn");

  // 渲染缓存列表
  function renderItems(items) {
    container.innerHTML = '';
    if (!items || items.length === 0) {
      container.innerHTML = `<p style="text-align:center; color:#999;">${chrome.i18n.getMessage("emptyMsg")}</p>`;
      return;
    }

    items.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `
        <div class="text">${escapeHtml(item.text)}</div>
        <button class="delete" data-index="${index}">${chrome.i18n.getMessage("deleteBtn")}</button>
        <div style="clear:both;"></div>
      `;
      container.appendChild(div);
    });

    // 绑定删除按钮事件
    document.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = e.target.dataset.index;
        chrome.storage.local.get({ savedItems: [] }, (result) => {
          const items = result.savedItems;
          items.splice(index, 1);
          chrome.storage.local.set({ savedItems: items }, () => {
            renderItems(items);
          });
        });
      });
    });
  }

  // HTML转义
  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 初始加载
  chrome.storage.local.get({ savedItems: [] }, (result) => {
    renderItems(result.savedItems);
  });

  // 复制所有
  copyAllBtn.addEventListener('click', () => {
    chrome.storage.local.get({ savedItems: [] }, (result) => {
      const items = result.savedItems;
      if (items.length === 0) {
        alert(chrome.i18n.getMessage("noCopyContent"));
        return;
      }
      const allText = items.map(item => item.text).join('\n\n');
      navigator.clipboard.writeText(allText).then(() => {
        alert(chrome.i18n.getMessage("copySuccess"));
      }).catch(() => {
        alert(chrome.i18n.getMessage("copyFail"));
      });
    });
  });

  // 导出为文件
  exportBtn.addEventListener('click', () => {
    chrome.storage.local.get({ savedItems: [] }, (result) => {
      const items = result.savedItems;
      if (items.length === 0) {
        alert(chrome.i18n.getMessage("noExportContent"));
        return;
      }
      const lines = items.map(item => {
        return `【${new Date(item.date).toLocaleString()}】\n来自：${item.title || item.url}\n${item.text}\n----------------\n`;
      });
      const content = lines.join('\n');
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      chrome.downloads.download({
        url: url,
        filename: `缓存文本_${new Date().toISOString().slice(0, 10)}.txt`,
        conflictAction: 'uniquify'
      });
    });
  });

  // 捐赠按钮 - 请替换为你的 PayPal 捐赠链接
  donateBtn.addEventListener('click', () => {
    // 在此处替换为你的实际 PayPal 捐赠链接
    const paypalLink = 'https://www.paypal.com/donate/?hosted_button_id=YOUR_BUTTON_ID';
    chrome.tabs.create({ url: paypalLink });
  });

  // 清空所有
  clearBtn.addEventListener('click', () => {
    if (confirm(chrome.i18n.getMessage("confirmClear"))) {
      chrome.storage.local.set({ savedItems: [] }, () => {
        renderItems([]);
      });
    }
  });
});
