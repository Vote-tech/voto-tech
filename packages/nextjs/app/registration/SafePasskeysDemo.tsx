import { useState } from "react";
import "./App.css";
import { PasskeyCard } from "./PasskeyCard";
import { SafeCard } from "./SafeCard";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import { PasskeyLocalStorageFormat, createPasskey, toLocalStorageFormat } from "./logic/passkeys";

const PASSKEY_LOCALSTORAGE_KEY = "passkeyId";

export const SafePasskeysDemo: React.FC = () => {
  const [passkey, setPasskey] = useLocalStorageState<PasskeyLocalStorageFormat | undefined>(
    PASSKEY_LOCALSTORAGE_KEY,
    undefined,
  );
  const [error, setError] = useState<string>();

  const handleCreatePasskeyClick = async () => {
    setError(undefined);
    try {
      const passkey = await createPasskey();
      setPasskey(toLocalStorageFormat(passkey));
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Unknown error");
      }
    }
  };

  return (
    <>
      <PasskeyCard passkey={passkey} handleCreatePasskeyClick={handleCreatePasskeyClick} />

      {passkey && <SafeCard passkey={passkey} />}

      {error && (
        <div className="card">
          <p>Error: {error}</p>
        </div>
      )}
    </>
  );
};
