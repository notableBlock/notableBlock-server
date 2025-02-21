const getNoteTitle = (blocks) =>
  (blocks.find((block) => ["h1", "h2", "h3", "p"].includes(block.tag))?.html ?? "제목이 없는") +
  " 노트";

module.exports = getNoteTitle;
