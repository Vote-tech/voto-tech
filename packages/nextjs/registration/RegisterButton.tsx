import { ETHBERLIN04, zuAuthPopup } from "@pcd/zuauth";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { useAuthContext } from "~~/contexts/AuthContext";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { generateWitness } from "~~/utils/scaffold-eth/pcd";

export default function RegisterButton() {
  const { keypair, isRegistered, generateKeypair } = useAuthContext();
  const { address } = useAccount();

  const { writeAsync } = useScaffoldContractWrite({
    contractName: "MACIWrapper",
    functionName: "signUp",
    args: [
      keypair?.pubKey.asContractParam() as { x: bigint; y: bigint },
      "0x",
      "0x",
    ],
  });

  async function register() {
    if (!keypair || !address) return;

    // Get a valid event id from { supportedEvents } from "zuauth" or https://api.zupass.org/issue/known-ticket-types
    const fieldsToReveal = {
      revealTicketId: true,
    };
    const result = await zuAuthPopup({
      fieldsToReveal,
      watermark: address,
      config: ETHBERLIN04,
    });
    if (result.type !== "pcd") {
      notification.error("Failed to parse PCD");
    }

    const pcd = JSON.parse(result.pcdStr).pcd;
    const witness = generateWitness(JSON.parse(pcd));

    try {
      const data = ethers.utils.defaultAbiCoder.encode(
        ["uint256[2]", "uint256[2][2]", "uint256[2]", "uint256[38]"],
        [witness._pA, witness._pB, witness._pC, witness._pubSignals],
      );
      await writeAsync({
        args: [
          keypair.pubKey.asContractParam() as { x: bigint; y: bigint },
          data as `0x${string}`,
          "0x",
        ],
      });
    } catch (err) {
      console.log(err);
    }
  }

  if (!keypair) {
    return (
      <button
        className="border border-slate-600 bg-primary px-3 py-2 rounded-lg font-bold"
        onClick={generateKeypair}
      >
        Login
      </button>
    );
  }

  if (isRegistered) return <div>Thanks for Registration</div>;

  return (
    <>
      (You are not registered yet)
      <button
        className="border border-slate-600 bg-primary px-3 py-2 rounded-lg font-bold"
        onClick={register}
      >
        Register
      </button>
    </>
  );
}
