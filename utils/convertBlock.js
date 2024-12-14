const objectId = require("./objectId");

const blockToMarkdown = (blocks, zwcCreatorId, zwcNoteId) => {
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

  return `${markdown.join("")}\n${zwcCreatorId}\n${zwcNoteId}`;
};

const markdownToBlock = (markdown) => {
  const zeroWidthRegex = /[\u200B-\u200D\uFEFF]/g;
  const lines = markdown.split("\n");

  const blocks = lines.map((line) => {
    const cleanLine = line.replace(zeroWidthRegex, process.env.DELETE_PASSWORD);
    const trimmedLine = cleanLine.trim();

    switch (true) {
      case trimmedLine.startsWith("# "):
        return { id: objectId(), tag: "h1", html: trimmedLine.slice(2) };
      case trimmedLine.startsWith("## "):
        return { id: objectId(), tag: "h2", html: trimmedLine.slice(3) };
      case trimmedLine.startsWith("### "):
        return { id: objectId(), tag: "h3", html: trimmedLine.slice(4) };
      case trimmedLine.indexOf(process.env.DELETE_PASSWORD) !== -1:
        return null;
      default:
        return { id: objectId(), tag: "p", html: trimmedLine };
    }
  });

  return blocks.filter((block) => block !== null);
};

module.exports = { blockToMarkdown, markdownToBlock };
