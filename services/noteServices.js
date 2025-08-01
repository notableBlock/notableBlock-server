const Note = require("../models/Note");
const User = require("../models/User");

const { copyS3Object } = require("./s3Services");

const getCurrentDate = require("../utils/getCurrentDate");

const storeNote = async ({ creator, note, title, editor, baseNoteId = null }) => {
  if (!creator) throw new Error("노트를 생성하는데 실패했어요");

  const savedNote = await Note.create({
    creatorId: creator._id,
    creator: creator.name,
    creatorPicture: creator.picture,
    title,
    blocks: note.blocks ? note.blocks : note,
    isShared: false,
    createdAt: getCurrentDate(),
    editor: editor.name,
    editorId: editor._id,
    editorPicture: editor.picture,
    baseNote: baseNoteId,
    updatedAt: getCurrentDate(),
  });

  await User.updateOne(
    { _id: editor._id },
    {
      $push: { notes: savedNote._id },
    }
  );

  return savedNote;
};

const processImageBlock = async (blocks) => {
  const imageBlocks = blocks.filter(({ tag }) => tag === "img");
  if (imageBlocks.length === 0) return blocks;

  try {
    const copyResults = await Promise.all(
      imageBlocks.map(({ imageUrl }) => {
        const s3Key = imageUrl.split("/").pop();
        const dashIndex = s3Key.indexOf("-");
        const fileName = s3Key.substring(dashIndex + 1);

        return copyS3Object(s3Key, fileName);
      })
    );

    let imageIndex = 0;
    const newBlocks = blocks.map((block) => {
      if (block.tag !== "img") return block;

      return {
        ...block,
        imageUrl: copyResults[imageIndex++].newImageUrl,
      };
    });

    return newBlocks;
  } catch (err) {
    console.log(err);
    throw new Error("이미지를 복사하던 중 오류가 발생했어요.");
  }
};

module.exports = { storeNote, processImageBlock };
