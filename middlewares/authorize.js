const createError = require("http-errors");

const Note = require("../models/Note");
const Notification = require("../models/Notification");

// 노트 소유권 검증: creatorId 또는 editorId가 현재 사용자인지 확인
// 검증 통과 시 req.note에 노트 문서를 저장해 컨트롤러의 중복 DB 조회를 방지
const isNoteOwner = async (req, res, next) => {
  const { user } = req;
  const noteId = req.params.noteId || req.body?.data?.noteId;

  if (!noteId) {
    return next(createError(400, "노트 ID가 필요합니다."));
  }

  try {
    const note = await Note.findById(noteId);
    if (!note) {
      return next(createError(404, "노트를 찾을 수 없어요."));
    }

    const userId = user._id.toString();
    const isCreator = note.creatorId.toString() === userId;
    const isEditor = note.editorId.toString() === userId;

    if (!isCreator && !isEditor) {
      return next(createError(403, "이 노트에 접근할 권한이 없어요."));
    }

    req.note = note;
    next();
  } catch (err) {
    next(createError(500, "노트 권한 확인 중 오류가 발생했어요."));
  }
};

// 알림 소유권 검증: recipientId가 현재 사용자인지 확인
// 검증 통과 시 req.notification에 알림 문서를 저장
const isNotificationOwner = async (req, res, next) => {
  const { user } = req;
  const { notificationId } = req.params;

  try {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return next(createError(404, "알림을 찾을 수 없어요."));
    }

    if (notification.recipientId.toString() !== user._id.toString()) {
      return next(createError(403, "이 알림에 접근할 권한이 없어요."));
    }

    req.notification = notification;
    next();
  } catch (err) {
    next(createError(500, "알림 권한 확인 중 오류가 발생했어요."));
  }
};

module.exports = { isNoteOwner, isNotificationOwner };
