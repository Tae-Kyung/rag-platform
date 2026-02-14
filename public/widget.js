(function () {
  'use strict';

  // Get configuration from script tag
  var script = document.currentScript || document.querySelector('script[data-bot-id]');
  if (!script) return;

  var botId = script.getAttribute('data-bot-id');
  if (!botId) {
    console.error('[AskDocs] Missing data-bot-id attribute');
    return;
  }

  var position = script.getAttribute('data-position') || 'bottom-right';
  var color = script.getAttribute('data-color') || '#0066CC';
  var lang = script.getAttribute('data-lang') || 'en';
  var baseUrl = script.src.replace(/\/widget\.js.*$/, '');

  // Create styles
  var style = document.createElement('style');
  style.textContent = [
    '#askdocs-widget-btn{',
    '  position:fixed;z-index:9999;width:56px;height:56px;border-radius:50%;',
    '  border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.15);',
    '  display:flex;align-items:center;justify-content:center;transition:transform .2s;',
    '}',
    '#askdocs-widget-btn:hover{transform:scale(1.1)}',
    '#askdocs-widget-btn svg{width:28px;height:28px;fill:#fff}',
    '#askdocs-widget-frame{',
    '  position:fixed;z-index:10000;border:none;border-radius:12px;',
    '  box-shadow:0 8px 32px rgba(0,0,0,.2);width:380px;height:560px;',
    '  max-width:calc(100vw - 32px);max-height:calc(100vh - 100px);',
    '  display:none;overflow:hidden;background:#fff;',
    '}',
    position === 'bottom-left'
      ? '#askdocs-widget-btn{bottom:20px;left:20px}#askdocs-widget-frame{bottom:88px;left:20px}'
      : '#askdocs-widget-btn{bottom:20px;right:20px}#askdocs-widget-frame{bottom:88px;right:20px}',
    '@media(max-width:480px){',
    '  #askdocs-widget-frame{width:100vw;height:100vh;max-width:100vw;max-height:100vh;',
    '    border-radius:0;bottom:0;right:0;left:0;top:0}',
    '}',
  ].join('\n');
  document.head.appendChild(style);

  // Create floating button
  var btn = document.createElement('button');
  btn.id = 'askdocs-widget-btn';
  btn.style.backgroundColor = color;
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>';
  document.body.appendChild(btn);

  // Create iframe
  var iframe = document.createElement('iframe');
  iframe.id = 'askdocs-widget-frame';
  iframe.src = baseUrl + '/widget/' + botId + '?lang=' + lang;
  iframe.title = 'AskDocs Chat Widget';
  iframe.allow = 'clipboard-write';
  document.body.appendChild(iframe);

  // Toggle
  var isOpen = false;
  btn.addEventListener('click', function () {
    isOpen = !isOpen;
    iframe.style.display = isOpen ? 'block' : 'none';
    btn.innerHTML = isOpen
      ? '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>';
  });
})();
