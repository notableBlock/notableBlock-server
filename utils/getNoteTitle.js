const getNoteTitle = (blocks) => {
  const rawTitle = blocks.find((block) => ["h1", "h2", "h3", "p"].includes(block.tag))?.html;

  const cleanedTitle = !rawTitle || rawTitle === "<br>" ? "제목이 없는" : rawTitle;
  const noteTitle = `${cleanedTitle} 노트`;

  return noteTitle.length > 10 ? `${noteTitle.slice(0, 10)}... 노트` : noteTitle;
};

module.exports = getNoteTitle;
