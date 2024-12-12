const objectId = require("./objectId");

const convertBlockToMarkdown = (blocks) => {
  const markdown = blocks.map((block) => {
    switch (block.tag) {
      case "h1":
        return `# ${block.html}\n`;
      case "h2":
        return `## ${block.html}\n`;
      case "h3":
        return `### ${block.html}\n`;
      default:
        return `${block.html}\n`;
    }
  });

  return markdown.join("");
};

const convertMarkdownToBlock = (markdown) => {
  const lines = markdown.split("\n");

  const blocks = lines.map((line) => {
    const trimmedLine = line.trim();

    switch (true) {
      case trimmedLine.startsWith("# "):
        return { id: objectId(), tag: "h1", html: trimmedLine.slice(2) };
      case trimmedLine.startsWith("## "):
        return { id: objectId(), tag: "h2", html: trimmedLine.slice(3) };
      case trimmedLine.startsWith("### "):
        return { id: objectId(), tag: "h3", html: trimmedLine.slice(4) };
      default:
        return { id: objectId(), tag: "p", html: trimmedLine };
    }
  });

  return blocks;
};

module.exports = { convertBlockToMarkdown, convertMarkdownToBlock };
