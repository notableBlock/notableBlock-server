// 블록 태그 화이트리스트 — 클라이언트 constants/security.ts의 ALLOWED_BLOCK_TAGS와 동일
const ALLOWED_BLOCK_TAGS = [
  "h1",
  "h2",
  "h3",
  "p",
  "img",
  "code",
  "blockquote",
  "divider",
  "todo",
];

// sanitize-html 옵션 — 클라이언트 EDITOR_DOMPURIFY_CONFIG와 동일한 허용 범위
// "code"는 인라인 포맷용 (블록 태그 "code"와 별개)
const SANITIZE_OPTIONS = {
  allowedTags: ["b", "i", "u", "br", "span", "a", "strong", "em", "div", "code"],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    span: ["style", "class"],
    div: [],
  },
};

module.exports = { ALLOWED_BLOCK_TAGS, SANITIZE_OPTIONS };
