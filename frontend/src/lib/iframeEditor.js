// Script injected into the preview iframe to enable click-to-select visual editing.
// Returns a string of HTML/JS to be concatenated into the rendered document.
export const EDITOR_INJECT_SCRIPT = `
(function(){
  if (window.__galioEditorInjected) return;
  window.__galioEditorInjected = true;

  const HIGHLIGHT_COLOR = '#3b82f6';
  let selected = null;
  let hovered = null;
  let editing = false;

  function uid(){ return 'g_' + Math.random().toString(36).slice(2,9); }

  // Tag every element with a stable id so we can address it from the parent
  function tagAll(){
    document.body.querySelectorAll('*').forEach((el)=>{
      if (!el.hasAttribute('data-galio-id')) {
        el.setAttribute('data-galio-id', uid());
      }
    });
  }

  function clearOutline(el){ if (!el) return; el.style.outline=''; el.style.outlineOffset=''; }
  function setOutline(el, color){
    if (!el) return;
    el.style.outline = '2px solid ' + color;
    el.style.outlineOffset = '1px';
  }

  function ignore(el){
    if (!el) return true;
    if (el === document.body || el === document.documentElement) return true;
    if (el.closest('html > head')) return true;
    return false;
  }

  function postSelected(el){
    if (!el) {
      window.parent.postMessage({type:'galio:selected', payload: null}, '*');
      return;
    }
    const cs = getComputedStyle(el);
    window.parent.postMessage({type:'galio:selected', payload: {
      id: el.getAttribute('data-galio-id'),
      tag: el.tagName.toLowerCase(),
      text: el.children.length === 0 ? (el.textContent || '') : null,
      classes: el.getAttribute('class') || '',
      styles: {
        color: cs.color, backgroundColor: cs.backgroundColor,
        fontSize: cs.fontSize, fontWeight: cs.fontWeight,
        paddingTop: cs.paddingTop, paddingRight: cs.paddingRight,
        paddingBottom: cs.paddingBottom, paddingLeft: cs.paddingLeft,
        marginTop: cs.marginTop, marginRight: cs.marginRight,
        marginBottom: cs.marginBottom, marginLeft: cs.marginLeft,
        textAlign: cs.textAlign,
      }
    }}, '*');
  }

  function enable(){
    editing = true;
    tagAll();
    document.body.style.cursor = 'crosshair';

    document.addEventListener('mouseover', onOver, true);
    document.addEventListener('mouseout', onOut, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', preventNav, true);
  }
  function disable(){
    editing = false;
    document.body.style.cursor = '';
    clearOutline(hovered); clearOutline(selected);
    hovered = null; selected = null;
    document.removeEventListener('mouseover', onOver, true);
    document.removeEventListener('mouseout', onOut, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('submit', preventNav, true);
    postSelected(null);
  }
  function preventNav(e){ e.preventDefault(); }
  function onOver(e){
    if (!editing) return;
    if (ignore(e.target)) return;
    if (hovered && hovered !== selected) clearOutline(hovered);
    hovered = e.target;
    if (hovered !== selected) setOutline(hovered, 'rgba(59,130,246,0.5)');
  }
  function onOut(e){
    if (!editing) return;
    if (e.target === hovered && hovered !== selected) clearOutline(hovered);
  }
  function onClick(e){
    if (!editing) return;
    if (ignore(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    if (selected) clearOutline(selected);
    selected = e.target;
    setOutline(selected, HIGHLIGHT_COLOR);
    postSelected(selected);
  }

  function findById(id){ return document.querySelector('[data-galio-id="'+id+'"]'); }

  // Receive commands from parent
  window.addEventListener('message', (ev)=>{
    const msg = ev.data || {};
    if (msg.type === 'galio:enable') { enable(); }
    else if (msg.type === 'galio:disable') { disable(); }
    else if (msg.type === 'galio:update' && msg.payload) {
      const { id, patch } = msg.payload;
      const el = findById(id);
      if (!el) return;
      if (patch.text !== undefined && el.children.length === 0) el.textContent = patch.text;
      if (patch.classes !== undefined) el.setAttribute('class', patch.classes);
      if (patch.styles) {
        Object.entries(patch.styles).forEach(([k, v])=>{
          if (v === '' || v == null) el.style.removeProperty(k.replace(/[A-Z]/g, m=>'-'+m.toLowerCase()));
          else el.style[k] = v;
        });
      }
      // refresh outline after change
      if (el === selected) setOutline(el, HIGHLIGHT_COLOR);
      // refresh inspector
      postSelected(el);
    }
    else if (msg.type === 'galio:insert' && msg.payload && msg.payload.html) {
      // append at end of body
      const tpl = document.createElement('template');
      tpl.innerHTML = msg.payload.html.trim();
      document.body.appendChild(tpl.content);
      tagAll();
    }
    else if (msg.type === 'galio:serialize') {
      // strip our edit markers / outlines before returning
      document.querySelectorAll('[data-galio-id]').forEach(el=>{
        el.style.outline=''; el.style.outlineOffset='';
      });
      const html = '<!DOCTYPE html>\\n' + document.documentElement.outerHTML;
      window.parent.postMessage({type:'galio:serialized', payload:{html}}, '*');
    }
  });

  // Auto-tag on first load
  tagAll();

  // Signal parent that the editor script is ready
  window.parent.postMessage({ type: 'galio:ready' }, '*');
})();
`;

/**
 * Inject the editor script into an HTML document string.
 * Appends just before </body>.
 */
export function injectEditorScript(html) {
  if (!html) return html;
  const tag = `<script>${EDITOR_INJECT_SCRIPT}</script>`;
  if (html.includes("</body>")) return html.replace("</body>", `${tag}</body>`);
  return html + tag;
}
