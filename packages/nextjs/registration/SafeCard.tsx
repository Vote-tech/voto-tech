import { useEffect, useState } from "react";
import { PasskeyLocalStorageFormat } from "./logic/passkeys";
import { getItem } from "./logic/storage";
import { signAndSendUserOp } from "./logic/userOp";
import { JsonRpcProvider } from "@ethersproject/providers";
import {
  CandidePaymaster,
  DummySignature,
  MetaTransaction,
  SafeAccountWebAuth as SafeAccount,
  createCallData,
  getFunctionSelector,
} from "abstractionkit";

const jsonRPCProvider = process.env.NEXT_PUBLIC_JSON_RPC_PROVIDER;
const bundlerUrl = process.env.NEXT_PUBLIC_BUNDLER_URL as string;
const paymasterUrl = process.env.NEXT_PUBLIC_PAYMASTER_URL as string;
const entrypoint = process.env.NEXT_PUBLIC_ENTRYPOINT_ADDRESS;
const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
  ? BigInt(process.env.NEXT_PUBLIC_CHAIN_ID)
  : 0n;
const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME as string;

console.log(chainName, "chainName");

function SafeCard({ passkey }: { passkey: PasskeyLocalStorageFormat }) {
  const [userOpHash, setUserOpHash] = useState<string>();
  const [deployed, setDeployed] = useState<boolean>(false);
  const [loadingTx, setLoadingTx] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  const [txHash, setTxHash] = useState<string>();

  const accountAddress = getItem("accountAddress") as string;
  const provider = new JsonRpcProvider(process.env.VITE_JSON_RPC_PROVIDER);

  console.log("rpc", jsonRPCProvider);
  console.log("provder", provider);

  const isDeployed = async () => {
    const safeCode = await provider.getCode(accountAddress);
    setDeployed(safeCode !== "0x");
  };

  const handleMintNFT = async () => {
    setLoadingTx(true);
    setTxHash("");
    setError("");
    // mint an NFT
    const nftContractAddress = "0x9a7af758aE5d7B6aAE84fe4C5Ba67c041dFE5336";
    const mintFunctionSignature = "mint(address)";
    const mintFunctionSelector = getFunctionSelector(mintFunctionSignature);
    const mintTransactionCallData = createCallData(
      mintFunctionSelector,
      ["address"],
      [accountAddress],
    );
    const mintTransaction: MetaTransaction = {
      to: nftContractAddress,
      value: 0n,
      data: mintTransactionCallData,
    };

    const safeAccount = SafeAccount.initializeNewAccount([
      passkey.pubkeyCoordinates,
    ]);

    let userOperation = await safeAccount.createUserOperation(
      [mintTransaction],
      jsonRPCProvider,
      bundlerUrl,
      {
        dummySignatures: [DummySignature.webAuthn],
      },
    );

    const paymaster: CandidePaymaster = new CandidePaymaster(paymasterUrl);
    userOperation = await paymaster.createSponsorPaymasterUserOperation(
      userOperation,
      bundlerUrl,
      // {
      // 	preVerificationGasPercentageMultiplier:20,
      // 	verificationGasLimitPercentageMultiplier:20
      // }
    );
    try {
      const bundlerResponse = await signAndSendUserOp(
        safeAccount,
        userOperation,
        passkey,
        entrypoint,
        chainId,
      );
      setUserOpHash(bundlerResponse.userOperationHash);
      const userOperationReceiptResult = await bundlerResponse.included();
      if (userOperationReceiptResult.success) {
        setTxHash(userOperationReceiptResult.receipt.transactionHash);
        console.log(
          "One NTF was minted. The transaction hash is : " +
            userOperationReceiptResult.receipt.transactionHash,
        );
        setUserOpHash("");
      } else {
        setError("Useroperation execution failed");
      }
    } catch (error) {
      if (error instanceof Error) {
        console.log(error);
        setError(error.message);
      } else {
        setError("Unknown error");
      }
    }
    setLoadingTx(false);
  };

  useEffect(() => {
    if (accountAddress) {
      async function isAccountDeployed() {
        await isDeployed();
      }
      isAccountDeployed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deployed, accountAddress]);
  console.log();
  return (
    <div className="card">
      {userOpHash && (
        <p>
          Your account setup is in progress. Track your operation on{" "}
          <a
            target="_blank"
            href={`https://eth-${chainName.toLowerCase()}.blockscout.com/op/${userOpHash}`}
          >
            the block explorer
          </a>
        </p>
      )}
      {txHash && (
        <>
          You collected an NFT, secured with your Safe Account & authenticated
          by your Device Passkeys.
          <br />
          <br />
          View more on{" "}
          <a
            target="_blank"
            href={`https://eth-${chainName}.blockscout.com/tx/${txHash}`}
          >
            the block explorer
          </a>
          <br />
        </>
      )}
      {loadingTx && !userOpHash ? (
        <p>Preparing transaction..</p>
      ) : (
        accountAddress && (
          <div className="card">
            <br />
            <button onClick={handleMintNFT} disabled={!!userOpHash}>
              Mint NFT
            </button>
          </div>
        )
      )}{" "}
      {error && (
        <div className="card">
          <p>Error: {error}</p>
        </div>
      )}
    </div>
  );
}

export { SafeCard };
