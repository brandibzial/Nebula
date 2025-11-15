# NebulaCV (简历02/action)

全新 UI 风格的去中心化履历 DApp，功能与 `简历01/action` 等价，但：
- 合约与方法已全部重命名（`NebulaResumeFHE` 等）；
- 前端采用霓虹 + 玻璃拟态的深色主题；
- 仍使用 FHEVM（本地 Hardhat 节点）与 mock 进行加密交互。

## 目录结构

- `contracts/` Hardhat 合约工程（NebulaResumeFHE）
- `frontend/` Next.js 前端工程（NebulaCV UI）

## 快速开始

1) 启动本地 Hardhat 节点与部署合约：

```bash
cd contracts
npm install
npx hardhat node    # 保持后台运行
npx hardhat deploy --network localhost
```

2) 生成前端 ABI 与地址：

```bash
node ../frontend/scripts/genabi.mjs
```

3) 启动前端：

```bash
cd ../frontend
npm install
npm run dev
```

打开浏览器访问 `http://localhost:3000`。

## 注意
- 本地运行 FHEVM 时，前端通过 `mock` 与 Relayer SDK 的本地模拟交互；
- 如果遇到 KMS/ACL 相关地址报错，请确认本地节点支持 `fhevm_relayer_metadata`，或参考 `简历01` 的处理方式（例如补齐 KMSVerifierAddress 等）。


