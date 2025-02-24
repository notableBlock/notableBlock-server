const objectId = require("./objectId");

const blockToMarkdown = (blocks) => {
  const markdown = blocks.map((block) => {
    switch (block.tag) {
      case "h1":
        return `# ${block.html}\n`;
      case "h2":
        return `## ${block.html}\n`;
      case "h3":
        return `### ${block.html}\n`;
      case "img":
        const imageName = block.imageUrl.split("/").pop();

        return `![${imageName}](assets/${imageName})`;
      default:
        return `${block.html}\n`;
    }
  });

  return `${markdown.join("")}`;
};

const markdownToBlocks = (markdown) => {
  const lines = markdown.split("\n");

  const blocks = lines.map((line) => {
    switch (true) {
      case line.startsWith("# "):
        return { id: objectId(), tag: "h1", html: line.slice(2) };
      case line.startsWith("## "):
        return { id: objectId(), tag: "h2", html: line.slice(3) };
      case line.startsWith("### "):
        return { id: objectId(), tag: "h3", html: line.slice(4) };
      case line.indexOf(process.env.DELETE_PASSWORD) !== -1:
        return null;
      default:
        return { id: objectId(), tag: "p", html: line };
    }
  });

  return blocks.filter((block) => block !== null);
};

module.exports = { blockToMarkdown, markdownToBlocks };
