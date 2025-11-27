import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const deploymentsRoot = resolve(__dirname, "../../contracts/deployments");
  const localhostPath = resolve(deploymentsRoot, "localhost", "NebulaResumeFHE.json");
  const sepoliaPath = resolve(deploymentsRoot, "sepolia", "NebulaResumeFHE.json");

  let abiJson = null;
  try {
    const data = JSON.parse(await readFile(localhostPath, "utf-8"));
    abiJson = data.abi;
  } catch {
    try {
      const data = JSON.parse(await readFile(sepoliaPath, "utf-8"));
      abiJson = data.abi;
    } catch {}
  }
  if (abiJson) {
    const abiTs = `export const NebulaResumeABI = ${JSON.stringify({ abi: abiJson }, null, 2)}`;
    await writeFile(resolve(__dirname, "../abi/NebulaResumeABI.ts"), abiTs, "utf-8");
    console.log("ABI generated at abi/NebulaResumeABI.ts");
  } else {
    console.warn("Could not locate deployments to generate ABI.");
  }

  const addresses = {
    "31337": { chainId: 31337, chainName: "Hardhat Localhost", address: "0x0000000000000000000000000000000000000000" },
    "11155111": { chainId: 11155111, chainName: "Sepolia", address: "0x0000000000000000000000000000000000000000" }
  };
  try {
    const l = JSON.parse(await readFile(localhostPath, "utf-8"));
    if (l?.address) addresses["31337"].address = l.address;
  } catch {}
  try {
    const s = JSON.parse(await readFile(sepoliaPath, "utf-8"));
    if (s?.address) addresses["11155111"].address = s.address;
  } catch {}
  const addrTs = `export const NebulaResumeAddresses = ${JSON.stringify(addresses, null, 2)} as const;`;
  await writeFile(resolve(__dirname, "../abi/NebulaResumeAddresses.ts"), addrTs, "utf-8");
  console.log("Addresses generated at abi/NebulaResumeAddresses.ts");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});




