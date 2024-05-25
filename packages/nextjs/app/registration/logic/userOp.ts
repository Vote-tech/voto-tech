import { ethers } from 'ethers'
import {
  SafeAccountWebAuth as SafeAccount,
  SignerSignaturePair,
  WebauthSignatureData,
  SendUseroperationResponse,
  UserOperation,
} from 'abstractionkit'

import { 
  PasskeyLocalStorageFormat, 
  extractSignature, 
  extractClientDataFields 
} from './passkeys'
import { hexStringToUint8Array } from '../utils/stringConversion'

type Assertion = {
  response: AuthenticatorAssertionResponse
}

/**
 * Signs and sends a user operation to the specified entry point on the blockchain.
 * @param userOp The unsigned user operation to sign and send.
 * @param passkey The passkey used for signing the user operation.
 * @param entryPoint The entry point address on the blockchain. Defaults to ENTRYPOINT_ADDRESS if not provided.
 * @param chainId The chain ID of the blockchain. Defaults to APP_CHAIN_ID if not provided.
 * @returns User Operation hash promise.
 * @throws An error if signing the user operation fails.
 */



async function signAndSendUserOp(
  smartAccount: SafeAccount,
  userOp: UserOperation,
  passkey: PasskeyLocalStorageFormat,
  entryPoint: string = process.env.NEXT_PUBLIC_ENTRYPOINT_ADDRESS!,
  chainId: ethers.BigNumberish = process.env.NEXT_PUBLIC_CHAIN_ID!,
  bundlerUrl: string = process.env.NEXT_PUBLIC_BUNDLER_URL!,
): Promise<SendUseroperationResponse> {
  const safeInitOpHash = SafeAccount.getUserOperationEip712Hash(userOp, BigInt(chainId), 0n, 0n, entryPoint)

  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: ethers.getBytes(safeInitOpHash),
      allowCredentials: [{ type: 'public-key', id: hexStringToUint8Array(passkey.rawId)}],
    },
  })) as Assertion | null

  if (!assertion) {
    throw new Error('Failed to sign user operation')
  }

  const webauthSignatureData: WebauthSignatureData = {
    authenticatorData: assertion.response.authenticatorData,
    clientDataFields: extractClientDataFields(assertion.response),
    rs: extractSignature(assertion.response.signature),
  }

  const webauthSignature: string = SafeAccount.createWebAuthnSignature(webauthSignatureData)

  const SignerSignaturePair: SignerSignaturePair = {
    signer: passkey.pubkeyCoordinates,
    signature: webauthSignature,
  }

  userOp.signature = SafeAccount.formatSignaturesToUseroperationSignature([SignerSignaturePair], userOp.nonce == 0n)

  console.log(userOp, "userOp");
  return await smartAccount.sendUserOperation(userOp, bundlerUrl)
}

export { signAndSendUserOp }
