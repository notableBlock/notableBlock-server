const path = require("path");

const objectId = require("./objectId");

// HTML entity 디코딩 — 마크다운/평문 추출 시 사용
const decodeEntities = (text) =>
  text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

// 인라인 포맷 HTML(<strong>/<em>/<code>) → 마크다운
// 순서 중요: <code>를 먼저 처리해 코드 안 ** / * 가 잘못 변환되지 않게
const htmlInlineToMarkdown = (html) => {
  if (!html) return "";

  return decodeEntities(
    html
      .replace(/<code>([\s\S]*?)<\/code>/gi, "`$1`")
      .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, "**$2**")
      .replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, "*$2*")
      .replace(/<br\s*\/?>/gi, "  \n")
      .replace(/<[^>]+>/g, "")
  );
};

// 코드 블록 HTML → plain text (hljs syntax highlight span 등 제거, <br> → \n)
const htmlCodeToPlain = (html) => {
  if (!html) return "";

  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  );
};

// 마크다운 인라인 → HTML
// 순서 중요: 백틱 먼저(코드 안 별표 보호) → ** → *
const markdownInlineToHtml = (text) => {
  if (!text) return "";

  return text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
};

const blockToMarkdown = (blocks) => {
  const lines = blocks.map((block) => {
    switch (block.tag) {
      case "h1":
        return `# ${htmlInlineToMarkdown(block.html)}\n`;
      case "h2":
        return `## ${htmlInlineToMarkdown(block.html)}\n`;
      case "h3":
        return `### ${htmlInlineToMarkdown(block.html)}\n`;
      case "blockquote":
        return `> ${htmlInlineToMarkdown(block.html)}\n`;
      case "todo":
        return `- [${block.checked ? "x" : " "}] ${htmlInlineToMarkdown(block.html)}\n`;
      case "divider":
        return `---\n`;
      case "code":
        return "```\n" + htmlCodeToPlain(block.html) + "\n```\n";
      case "img":
        const imageName = path.basename(block.imageUrl);

        return `![${imageName}](assets/${imageName})\n`;
      default:
        return `${htmlInlineToMarkdown(block.html)}\n`;
    }
  });

  return lines.join("");
};

const markdownToBlocks = (markdown, s3UploadTargets) => {
  const lines = markdown.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // fenced code block (멀티라인) — ```로 시작/종료
    if (line.startsWith("```")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      // closing ``` 소비
      if (i < lines.length) i++;
      // ContentEditable은 <br>로 줄바꿈을 표시 — import 직후에도 즉시 보이도록 변환
      blocks.push({ id: objectId(), tag: "code", html: codeLines.join("<br>") });
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push({ id: objectId(), tag: "h1", html: markdownInlineToHtml(line.slice(2)) });
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ id: objectId(), tag: "h2", html: markdownInlineToHtml(line.slice(3)) });
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push({ id: objectId(), tag: "h3", html: markdownInlineToHtml(line.slice(4)) });
      i++;
      continue;
    }

    // divider — 마크다운의 가로선 표기 3종 모두 허용
    const trimmed = line.trim();
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      blocks.push({ id: objectId(), tag: "divider", html: "" });
      i++;
      continue;
    }

    // todo — `- [ ] text` / `- [x] text`
    const todoMatch = line.match(/^- \[([ xX])\] (.*)$/);
    if (todoMatch) {
      blocks.push({
        id: objectId(),
        tag: "todo",
        html: markdownInlineToHtml(todoMatch[2]),
        checked: todoMatch[1].toLowerCase() === "x",
      });
      i++;
      continue;
    }

    // blockquote — `> text`
    if (line.startsWith("> ")) {
      blocks.push({
        id: objectId(),
        tag: "blockquote",
        html: markdownInlineToHtml(line.slice(2)),
      });
      i++;
      continue;
    }

    // 이미지: `![alt](path)` — 단일 라인 가정
    if (line.startsWith("![") && line.includes("](") && line.endsWith(")")) {
      const originalFilename = `${path.basename(line).split(")")[0]}`;
      const s3Key = `${objectId()}-${originalFilename}`;
      s3UploadTargets.push({ s3Key, originalFilename });

      const imageUrl = `${process.env.ASSETS_URL}/${s3Key}`;
      blocks.push({ id: objectId(), tag: "img", imageUrl: imageUrl });
      i++;
      continue;
    }

    // 기본: 일반 텍스트(p) — 인라인 마크다운을 HTML 태그로 변환
    blocks.push({ id: objectId(), tag: "p", html: markdownInlineToHtml(line) });
    i++;
  }

  return blocks;
};

module.exports = { blockToMarkdown, markdownToBlocks };
