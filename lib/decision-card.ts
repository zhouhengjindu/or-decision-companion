import type { DecisionRecord } from '@/lib/types';

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  });
  if (line) lines.push(line);
  return lines;
}

export async function downloadDecisionCard(record: DecisionRecord) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable.');

  const gradient = ctx.createLinearGradient(0, 0, 1200, 1500);
  gradient.addColorStop(0, '#f7f1e7');
  gradient.addColorStop(.58, '#efe8dc');
  gradient.addColorStop(1, record.accepted ? '#d7dfd2' : '#ead8cd');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 1500);

  ctx.globalAlpha = .07;
  for (let y = 0; y < 1500; y += 18) {
    for (let x = (y / 18) % 2 ? 9 : 0; x < 1200; x += 18) {
      ctx.fillStyle = '#302d28';
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#b86f52';
  ctx.fillRect(90, 92, 70, 5);
  ctx.fillStyle = '#292721';
  ctx.font = '600 62px Georgia, serif';
  ctx.fillText('Or.', 90, 180);
  ctx.fillStyle = '#777168';
  ctx.font = '500 24px Avenir, sans-serif';
  ctx.fillText(new Date(record.createdAt).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase(), 90, 242);

  ctx.fillStyle = '#292721';
  ctx.font = '500 58px Georgia, serif';
  const questionLines = wrap(ctx, record.question, 1000).slice(0, 4);
  questionLines.forEach((line, index) => ctx.fillText(line, 90, 385 + index * 70));

  const resultY = 385 + questionLines.length * 70 + 95;
  ctx.fillStyle = '#777168';
  ctx.font = '600 22px Avenir, sans-serif';
  ctx.fillText('IT’S DECIDED', 90, resultY);
  ctx.fillStyle = '#687b69';
  ctx.font = 'italic 500 80px Georgia, serif';
  const choiceLines = wrap(ctx, record.finalChoice, 980).slice(0, 3);
  choiceLines.forEach((line, index) => ctx.fillText(line, 90, resultY + 105 + index * 92));

  const reasonY = resultY + 105 + choiceLines.length * 92 + 80;
  ctx.strokeStyle = 'rgba(41,39,33,.2)';
  ctx.beginPath(); ctx.moveTo(90, reasonY); ctx.lineTo(1110, reasonY); ctx.stroke();
  ctx.fillStyle = '#5f5a52';
  ctx.font = 'italic 31px Georgia, serif';
  const reasonLines = wrap(ctx, record.reflection || record.reason, 990).slice(0, 5);
  reasonLines.forEach((line, index) => ctx.fillText(line, 90, reasonY + 70 + index * 44));

  ctx.fillStyle = '#777168';
  ctx.font = '500 20px Avenir, sans-serif';
  ctx.fillText(`${record.mode.toUpperCase()} OR  ·  ${record.confidence}% CONFIDENCE  ·  ${record.mood.toUpperCase()}`, 90, 1410);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('The card could not be generated.');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `or-decision-${record.id.slice(0, 8)}.png`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
