const path = require("path");

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
        const imageName = path.basename(block.imageUrl);

        return `![${imageName}](assets/${imageName})\n`;
      default:
        return `${block.html}\n`;
    }
  });

  return `${markdown.join("")}`;
};

const markdownToBlocks = (markdown, s3UploadTargets) => {
  const lines = markdown.split("\n");

  const blocks = lines.map((line) => {
    switch (true) {
      case line.startsWith("# "):
        return { id: objectId(), tag: "h1", html: line.slice(2) };
      case line.startsWith("## "):
        return { id: objectId(), tag: "h2", html: line.slice(3) };
      case line.startsWith("### "):
        return { id: objectId(), tag: "h3", html: line.slice(4) };

      case line.startsWith("!["):
        if (line.includes("](") && line.endsWith(")")) {
          const originalFilename = `${path.basename(line).split(")")[0]}`;
          const s3Key = `${objectId()}-${originalFilename}`;
          s3UploadTargets.push({ s3Key, originalFilename });

          const imageUrl = `${process.env.ASSETS_URL}/${s3Key}`;
          return { id: objectId(), tag: "img", imageUrl: imageUrl };
        }

        return { id: objectId(), tag: "p", html: line };
      default:
        return { id: objectId(), tag: "p", html: line };
    }
  });

  return blocks.filter((block) => block !== null);
};

module.exports = { blockToMarkdown, markdownToBlocks };
