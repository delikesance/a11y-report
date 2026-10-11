import { truncate } from '../report/shared.js';
import { violationRows } from './rows.js';

const HEADER = ['page', 'rule', 'impact', 'rgaa', 'wcag', 'target', 'html'];
const NEEDS_QUOTES = /[",\r\n]/;
const BOM = '﻿';

export const escapeCsvField = (value) => {
  const text = String(value ?? '');
  return NEEDS_QUOTES.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const toLine = (fields) => fields.map(escapeCsvField).join(',');

const toRecord = ({ page, violation, node, rule }) => [
  page.url,
  violation.id,
  violation.impact,
  rule.rgaa,
  rule.wcag,
  node.target,
  truncate(String(node.html ?? '')),
];

export function render(scan, { bom = false } = {}) {
  const records = [HEADER, ...Array.from(violationRows(scan), toRecord)];
  return `${bom ? BOM : ''}${records.map(toLine).join('\r\n')}\r\n`;
}
