// 블록 태그 화이트리스트 — 클라이언트 constants/security.ts의 ALLOWED_BLOCK_TAGS와 동일
const ALLOWED_BLOCK_TAGS = ["h1", "h2", "h3", "p", "img"];

// sanitize-html 옵션 — 클라이언트 EDITOR_DOMPURIFY_CONFIG와 동일한 허용 범위
const SANITIZE_OPTIONS = {
  allowedTags: ["b", "i", "u", "br", "span", "a", "strong", "em", "div"],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    span: ["style"],
    div: [],
  },
};

module.exports = { ALLOWED_BLOCK_TAGS, SANITIZE_OPTIONS };
