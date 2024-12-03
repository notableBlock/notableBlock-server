const express = require("express");

const Note = require("../models/Note");
const User = require("../models/User");

const router = express.Router();

router.post("/", async (req, res) => {
  const { creatorId } = req.body.data;

  const newNote = new Note({
    creator: creatorId,
    blocks: [],
    shared: false,
  });

  try {
    const savedNote = await newNote.save();
    const creator = await User.findById(creatorId);

    if (!creator) {
      return res.status(404).json({ message: "생성자를 찾을 수 없습니다." });
    }

    creator.notes.push(savedNote._id);
    await creator.save();
    res.status(201).send({ noteId: savedNote._id.toString() });
  } catch (err) {
    console.error("노트 생성 중 오류 발생:", err);
    res.status(500).json({ message: "노트 생성에 실패했습니다." });
  }
});

router.put("/", async (req, res) => {
  const { creatorId, noteId, blocks } = req.body.data;

  try {
    const note = await Note.findById(noteId);

    if (note) {
      note.blocks = blocks;
      await note.save();
      res.status(200).json({ message: "노트 정보가 업데이트 되었습니다." });
    } else {
      const newNote = new Note({
        _id: noteId,
        blocks: blocks,
        creator: creatorId,
        shared: false,
      });
      const savedNote = await newNote.save();
      const creator = await User.findById(creatorId);

      if (!creator) {
        return res.status(404).json({ message: "생성자를 찾을 수 없습니다." })
      }

      creator.notes.push(savedNote._id);
      await creator.save();
      res.status(201).json({ message: "새로운 노트가 저장되었습니다." });
    }
  } catch (err) {
    console.error("노트 정보 저장 중 오류 발생:", err);
    res.status(500).json({ message: "노트 정보 저장에 실패했습니다." });
  }
});

module.exports = router;
