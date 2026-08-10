// 초경량 마크다운 -> HTML 변환기.
// 외부 패키지 없이 Step 3 실시간 미리보기 / Step 5 최종 미리보기에 사용합니다.
// 지원: h1~h6, 굵게/기울임/인라인코드, 링크, 순서/비순서 목록, 체크박스, 인용, 구분선, 문단

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(s: string): string {
  let out = escapeHtml(s);
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, "<em>$1</em>");
  out = out.replace(/`(.+?)`/g, '<code class="rounded bg-gray-100 px-1 py-0.5 text-[0.85em]">$1</code>');
  out = out.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2" class="text-violet-600 underline" target="_blank" rel="noreferrer">$1</a>'
  );
  return out;
}

export function renderMarkdown(md: string): string {
  const lines = md.split(/\r?\n/);
  let html = "";
  let inList: "ul" | "ol" | null = null;
  let inBlockquote = false;

  const closeList = () => {
    if (inList) {
      html += inList === "ul" ? "</ul>" : "</ol>";
      inList = null;
    }
  };
  const closeQuote = () => {
    if (inBlockquote) {
      html += "</blockquote>";
      inBlockquote = false;
    }
  };

  for (const line of lines) {
    if (/^\s*$/.test(line)) {
      closeList();
      closeQuote();
      continue;
    }

    let m: RegExpMatchArray | null;

    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
      closeList();
      closeQuote();
      const level = m[1].length;
      const sizeClass =
        level === 1 ? "text-2xl" : level === 2 ? "text-xl" : level === 3 ? "text-lg" : "text-base";
      html += `<h${level} class="mt-6 mb-2 font-bold ${sizeClass}">${inline(m[2])}</h${level}>`;
      continue;
    }

    if ((m = line.match(/^[-*]\s+\[( |x|X)\]\s+(.*)$/))) {
      if (inList !== "ul") {
        closeList();
        html += '<ul class="my-2 list-none space-y-1.5">';
        inList = "ul";
      }
      const checked = m[1].toLowerCase() === "x";
      html += `<li class="flex items-start gap-2"><input type="checkbox" disabled ${
        checked ? "checked" : ""
      } class="mt-1" /><span>${inline(m[2])}</span></li>`;
      continue;
    }

    if ((m = line.match(/^[-*]\s+(.*)$/))) {
      if (inList !== "ul") {
        closeList();
        html += '<ul class="my-2 list-disc space-y-1 pl-5">';
        inList = "ul";
      }
      html += `<li>${inline(m[1])}</li>`;
      continue;
    }

    if ((m = line.match(/^\d+\.\s+(.*)$/))) {
      if (inList !== "ol") {
        closeList();
        html += '<ol class="my-2 list-decimal space-y-1 pl-5">';
        inList = "ol";
      }
      html += `<li>${inline(m[1])}</li>`;
      continue;
    }

    if ((m = line.match(/^>\s?(.*)$/))) {
      if (!inBlockquote) {
        closeList();
        html += '<blockquote class="my-2 border-l-4 border-violet-300 pl-4 italic text-gray-600">';
        inBlockquote = true;
      }
      html += `<p>${inline(m[1])}</p>`;
      continue;
    }

    if (/^-{3,}$/.test(line.trim())) {
      closeList();
      closeQuote();
      html += '<hr class="my-4 border-gray-200" />';
      continue;
    }

    closeList();
    closeQuote();
    html += `<p class="my-2 leading-7">${inline(line)}</p>`;
  }
  closeList();
  closeQuote();
  return html;
}
