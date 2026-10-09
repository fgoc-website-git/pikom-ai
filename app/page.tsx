const b64 = window._pc.join('');
const content = atob(b64);
const cm = document.querySelector('.cm-content');
cm.focus();
document.execCommand('selectAll');
document.execCommand('insertText', false, content);
