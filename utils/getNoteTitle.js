const getNoteTitle = (blocks) => {
  const title =
    blocks.find((block) => ["h1", "h2", "h3", "p"].includes(block.tag))?.html ?? "제목 없음";
  const noteTitle = `${title} 노트`;

  return noteTitle.length > 10 ? `${noteTitle.slice(0, 10)}... 노트` : noteTitle;
};

module.exports = getNoteTitle;
