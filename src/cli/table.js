import { visibleLength } from './terminal.js';

const GUTTER = 2;
const MIN_FLEX_WIDTH = 12;

const naturalWidth = (column, rows) =>
  Math.max(visibleLength(column.label), ...rows.map((row) => visibleLength(row[column.key] ?? '')));

function fitFlexColumn(columns, widths, width) {
  const flexIndex = columns.findIndex((column) => column.flex);
  const total = widths.reduce((sum, value) => sum + value, 0) + GUTTER * (columns.length - 1);
  if (flexIndex === -1 || total <= width) return widths;
  const fitted = [...widths];
  fitted[flexIndex] = Math.max(MIN_FLEX_WIDTH, widths[flexIndex] - (total - width));
  return fitted;
}

export function columnWidths(columns, rows, width) {
  return fitFlexColumn(columns, columns.map((column) => naturalWidth(column, rows)), width);
}

export const truncate = (text, width, ellipsis) => {
  if (visibleLength(text) <= width) return text;
  return `${[...text].slice(0, width - ellipsis.length).join('')}${ellipsis}`;
};

function padCell(text, width, align) {
  const gap = ' '.repeat(Math.max(0, width - visibleLength(text)));
  return align === 'right' ? `${gap}${text}` : `${text}${gap}`;
}

export function renderTable({ columns, rows, width, term }) {
  const rule = term.ruleChar;
  const widths = columnWidths(columns, rows, width);
  const flexIndex = columns.findIndex((column) => column.flex);
  const renderRow = (cells) =>
    columns
      .map((column, index) => {
        const cell = cells[column.key] ?? '';
        const fitted = index === flexIndex ? truncate(cell, widths[index], term.ellipsis) : cell;
        return padCell(fitted, widths[index], column.align);
      })
      .join(' '.repeat(GUTTER))
      .trimEnd();
  const header = renderRow(Object.fromEntries(columns.map((column) => [column.key, term.paint('bold', column.label)])));
  const divider = term.paint('dim', widths.map((size) => rule.repeat(size)).join(' '.repeat(GUTTER)));
  return [header, divider, ...rows.map(renderRow)];
}
