const { spawn } = require("child_process");

const runCommand = (command, commandArguments, isBlockchainIdRequired = false) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, commandArguments);

    let blockChainId = "";

    if (isBlockchainIdRequired) {
      process.stdout.on("data", (data) => {
        blockChainId += data.toString();
      });
    }

    process.stderr.on("data", (data) => {
      console.log("쉘 명령어 실행 도중 에러 발생: ", data);
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve(isBlockchainIdRequired ? blockChainId.trim() : null);
      } else {
        reject(new Error(`프로세스 종료 코드: ${code}`));
      }
    });
  });
};

module.exports = runCommand;
