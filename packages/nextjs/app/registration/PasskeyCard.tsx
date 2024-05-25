import { useMemo } from "react";
import { PasskeyLocalStorageFormat } from "./logic/passkeys";
import { setItem } from "./logic/storage";
import { SafeAccountWebAuth as SafeAccount } from "abstractionkit";

const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME as string;

function PasskeyCard({
  passkey,
  handleCreatePasskeyClick,
}: {
  passkey?: PasskeyLocalStorageFormat;
  handleCreatePasskeyClick: () => void;
}) {
  const getAccountAddress = useMemo(() => {
    if (!passkey) return undefined;

    const accountAddress = SafeAccount.createAccountAddress([passkey.pubkeyCoordinates]);
    setItem("accountAddress", accountAddress);

    return accountAddress;
  }, [passkey]);

  return passkey ? (
    <div className="card">
      <p>
        Account Address:{" "}
        <a target="_blank" href={`https://eth-${chainName}.blockscout.com/address/${getAccountAddress}`}>
          {getAccountAddress}
        </a>
      </p>
    </div>
  ) : (
    <div className="card">
      <p>First, you need to create a passkey which will be used to sign transactions</p>
      <button onClick={handleCreatePasskeyClick}>Create Account</button>
    </div>
  );
}

export { PasskeyCard };
