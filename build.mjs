import fs from "node:fs"
import {exec} from "child_process"

//TODO: Get out of callback hell!!!! 🔥👿👹
fs.readFile("./tsconfig.json", "utf8", (err, data) => {
  if (err) {
    console.error("Error on build process");
    console.error(err);
    return;
  }
  const outDir = `./${JSON.parse(data).compilerOptions.outDir}`;
  console.log("Deleting '" + outDir + "' folder contents");

  try {
    fs.rm(outDir, { recursive: true, force: true }, (err) => {
      if (err) {
        throw err;
      }
      console.log(`${outDir} is deleted!`);
    });

    console.log("Building...");

    exec("tsc", (err, stdout) => {
      if (err) {
        throw err;
      }
      console.log("Done:");
      console.log(stdout)
    });
  } catch (err) {
    console.error("Error on build process");
    console.error(err);
  }
});
