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

module.exports = convertBlockToMarkdown;
