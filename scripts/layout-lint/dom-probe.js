export const PAGE_WIDTH_PX = 794;
export const PAGE_HEIGHT_PX = 1122.52;

export function probeLayout({ pageHeight }) {
  const TOLERANCE = 1.5;
  const STRANDED_BAND = 90;
  const HEADINGS = new Set(['H1', 'H2', 'H3', 'H4']);
  const findings = [];
  for (const flow of document.querySelectorAll('.flow')) {
    flow.style.height = `${Math.ceil(flow.getBoundingClientRect().height / pageHeight) * pageHeight}px`;
  }
  const pageOf = (top) => Math.floor((top + TOLERANCE) / pageHeight) + 1;
  const label = (element) => {
    const text = (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
    const cls = typeof element.className === 'string' && element.className ? `.${element.className.split(' ')[0]}` : '';
    return `${element.tagName.toLowerCase()}${cls}${text ? ` « ${text} »` : ''}`;
  };
  const add = (element, kind, detail, top) =>
    findings.push({ page: pageOf(top ?? element.getBoundingClientRect().top + scrollY), kind, detail: `${label(element)} ${detail}` });
  const absolute = (element) => {
    const box = element.getBoundingClientRect();
    return { top: box.top + scrollY, bottom: box.bottom + scrollY, left: box.left, right: box.right, width: box.width, height: box.height };
  };
  const visible = (element) => {
    const box = element.getBoundingClientRect();
    return box.width > 0 && box.height > 0 && getComputedStyle(element).visibility !== 'hidden';
  };
  const all = [...document.body.querySelectorAll('*')].filter(
    (element) => visible(element) && !element.closest('svg') && !['STYLE', 'SCRIPT'].includes(element.tagName),
  );

  for (const section of document.querySelectorAll('.page')) {
    const bounds = absolute(section);
    for (const element of section.querySelectorAll('*')) {
      if (!visible(element) || element.closest('svg')) continue;
      const box = absolute(element);
      if (box.bottom > bounds.bottom + TOLERANCE || box.right > bounds.right + TOLERANCE || box.left < bounds.left - TOLERANCE) {
        add(element, 'overflow', `dépasse la page (bas ${Math.round(box.bottom - bounds.bottom)}px, droite ${Math.round(box.right - bounds.right)}px)`, bounds.top);
      }
    }
  }

  for (const element of all) {
    const box = absolute(element);
    const style = getComputedStyle(element);
    if (style.display !== 'inline' && element.scrollWidth > element.clientWidth + TOLERANCE && element.clientWidth > 0) {
      add(element, 'clipped-text', `scrollWidth ${element.scrollWidth} > clientWidth ${element.clientWidth}`);
    }
    if (style.breakInside !== 'avoid' && (element.tagName === 'TR' || element.matches('[class*="-row"], [class*="-card"], [class*="-item"], li'))) {
      const startPage = pageOf(box.top);
      const endPage = pageOf(box.bottom - TOLERANCE * 2);
      if (endPage > startPage && box.height < pageHeight * 0.5) add(element, 'split-block', `coupé entre les pages ${startPage} et ${endPage}`);
    }
    if (HEADINGS.has(element.tagName) && style.breakAfter !== 'avoid') {
      const remaining = Math.ceil(box.bottom / pageHeight) * pageHeight - box.bottom;
      const next = element.nextElementSibling;
      const nextOnOtherPage = next && pageOf(absolute(next).top) > pageOf(box.top);
      if (remaining < STRANDED_BAND && nextOnOtherPage) add(element, 'stranded-heading', 'titre isolé en bas de page');
    }
    const wrap = style.overflowWrap;
    if (!/mono/i.test(style.fontFamily) && (wrap === 'anywhere' || wrap === 'break-word' || style.wordBreak === 'break-all')) {
      const text = [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent).join(' ');
      const longest = text.split(/\s+/).reduce((max, word) => (word.length > max.length ? word : max), '');
      const context = document.createElement('canvas').getContext('2d');
      context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      if (longest && context.measureText(longest).width > element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) + TOLERANCE) {
        add(element, 'broken-word', `mot « ${longest.slice(0, 30)} » coupé au milieu`);
      }
    }
    const siblings = [...element.parentElement.children].filter((sibling) => sibling !== element && visible(sibling) && !['STYLE', 'SCRIPT'].includes(sibling.tagName));
    for (const sibling of siblings) {
      if (sibling.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING) continue;
      if (['absolute', 'fixed'].some((position) => getComputedStyle(sibling).position === position || style.position === position)) continue;
      const other = absolute(sibling);
      const overlapX = Math.min(box.right, other.right) - Math.max(box.left, other.left);
      const overlapY = Math.min(box.bottom, other.bottom) - Math.max(box.top, other.top);
      if (overlapX > TOLERANCE && overlapY > TOLERANCE) add(element, 'overlap', `chevauche ${label(sibling)}`);
    }
  }

  const samples = [];
  const backgroundOf = (element) => {
    const layers = [];
    for (let node = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.backgroundImage !== 'none') return null;
      layers.unshift(style.backgroundColor);
    }
    const blended = [255, 255, 255];
    for (const layer of layers) {
      const [red, green, blue, alpha = 1] = layer.match(/[\d.]+/g).map(Number);
      [red, green, blue].forEach((channel, index) => {
        blended[index] = channel * alpha + blended[index] * (1 - alpha);
      });
    }
    return blended;
  };
  for (const element of all) {
    const hasText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    if (!hasText) continue;
    const style = getComputedStyle(element);
    const background = backgroundOf(element);
    if (!background) continue;
    const [red, green, blue, alpha = 1] = style.color.match(/[\d.]+/g).map(Number);
    const foreground = [red, green, blue].map((channel, index) => channel * alpha + background[index] * (1 - alpha));
    samples.push({
      page: pageOf(absolute(element).top),
      selector: label(element).slice(0, 50),
      text: element.textContent.trim().slice(0, 30),
      size: parseFloat(style.fontSize),
      weight: Number(style.fontWeight),
      fg: foreground,
      bg: background,
    });
  }
  return { findings, samples };
}
