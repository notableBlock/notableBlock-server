const { spawn } = require("child_process");

const runCommand = (command, commandArguments, isBlockchainIdRequired = false) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, commandArguments);

    let blockChainId = "";
    let errorMessage = "";

    if (isBlockchainIdRequired) {
      process.stdout.on("data", (data) => {
        blockChainId += data.toString();
      });
    }

    process.stderr.on("data", (data) => {
      errorMessage += data.toString();
      console.log("쉘 명령어 실행 도중 에러 발생: ", data.toString());
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve(isBlockchainIdRequired ? blockChainId.trim() : null);
      } else {
        reject(new Error(errorMessage.trim()));
      }
    });
  });
};

const setExtendedAttributes = async (platform, filePath, creatorId, noteId) => {
  switch (platform) {
    case "darwin":
      await runCommand("/usr/bin/xattr", ["-w", "user.creatorId", creatorId, filePath]);
      await runCommand("/usr/bin/xattr", ["-w", "user.noteId", noteId, filePath]);
      break;
    case "linux":
      await runCommand("setfattr", ["-n", "user.creatorId", "-v", creatorId, filePath]);
      await runCommand("setfattr", ["-n", "user.noteId", "-v", noteId, filePath]);
      break;
    default:
      throw new Error("지원되지 않는 운영체제에요.");
  }
};

const getExtendedAttributes = async (platform, filePath) => {
  switch (platform) {
    case "darwin":
      return {
        creatorId: await runCommand("/usr/bin/xattr", ["-p", "user.creatorId", filePath], true),
        noteId: await runCommand("/usr/bin/xattr", ["-p", "user.noteId", filePath], true),
      };
    case "linux":
      return {
        creatorId: await runCommand(
          "getfattr",
          ["-n", "user.creatorId", "--only-values", filePath],
          true
        ),
        noteId: await runCommand(
          "getfattr",
          ["-n", "user.noteId", "--only-values", filePath],
          true
        ),
      };
    default:
      throw new Error("지원되지 않는 운영체제에요.");
  }
};

const createTarArchive = async (platform, tarPath, tempDirectory, title) => {
  const baseArguments = ["-cf", tarPath, "-C", tempDirectory, `${title}.md`, "assets"];
  const tarArguments =
    platform === "linux" ? ["--xattrs", "--xattrs-include=*", ...baseArguments] : baseArguments;

  await runCommand("tar", tarArguments);
};

module.exports = { runCommand, setExtendedAttributes, getExtendedAttributes, createTarArchive };
