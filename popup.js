document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('items');
  const copyAllBtn = document.getElementById('copyAll');
  const exportBtn = document.getElementById('export');
  const clearBtn = document.getElementById('clear');

  // 设置静态文本（标题和按钮）
  document.querySelector('h3').textContent = chrome.i18n.getMessage("popupTitle");
  copyAllBtn.textContent = chrome.i18n.getMessage("copyAllBtn");
  exportBtn.textContent = chrome.i18n.getMessage("exportBtn");
  clearBtn.textContent = chrome.i18n.getMessage("clearBtn");

  // 渲染缓存列表（显示文本 + 删除按钮）
  function renderItems(items) {
    container.innerHTML = '';
    if (!items || items.length === 0) {
      container.innerHTML = `<p style="text-align:center; color:#999;">${chrome.i18n.getMessage("emptyMsg")}</p>`;
      return;
    }

    items.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'item';
      // 显示文本内容，并添加删除按钮（使用国际化删除按钮文本）
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

  // 简单的HTML转义（防止XSS）
  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 初始加载显示
  chrome.storage.local.get({ savedItems: [] }, (result) => {
    renderItems(result.savedItems);
  });

  // 复制所有功能
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
      }).catch(err => {
        console.error('复制失败:', err);
        alert(chrome.i18n.getMessage("copyFail"));
      });
    });
  });

  // 导出为文件（仍保留元信息方便追溯）
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

  // 清空所有
  clearBtn.addEventListener('click', () => {
    if (confirm(chrome.i18n.getMessage("confirmClear"))) {
      chrome.storage.local.set({ savedItems: [] }, () => {
        renderItems([]);
      });
    }
  });
});
