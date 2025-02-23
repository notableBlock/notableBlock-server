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

module.exports = runCommand;
