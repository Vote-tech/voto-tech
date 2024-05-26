// @ts-nocheck
import {
  banner,
  contractExists,
  currentBlockTimestamp,
  info,
  logError,
  logGreen,
  logYellow,
  success,
  readContractAddress,
  type MergeSignupsArgs,
} from "./utils";
import {
  MACI__factory as MACIFactory,
  Poll__factory as PollFactory,
} from "maci-contracts";

/**
 * Command to merge the signups of a MACI contract
 * @param MergeSignupsArgs - The arguments for the mergeSignups command
 */
export const mergeSignups = async ({
  pollId,
  maciAddress,
  signer,
  quiet = true,
}: MergeSignupsArgs): Promise<boolean> => {
  banner(quiet);
  const network = await signer.provider?.getNetwork();

  // maci contract validation
  if (!readContractAddress("MACI", network?.name) && !maciAddress) {
    logError("Could not read contracts");
  }

  const maciContractAddress =
    maciAddress || readContractAddress("MACI", network?.name);

  if (!(await contractExists(signer.provider!, maciContractAddress))) {
    logError("MACI contract does not exist");
  }

  if (pollId < 0) {
    logError("Invalid poll id");
  }

  const maciContract = MACIFactory.connect(maciContractAddress, signer);
  const pollAddress = await maciContract.polls(pollId);

  if (!(await contractExists(signer.provider!, pollAddress))) {
    logError("Poll contract does not exist");
  }

  const pollContract = PollFactory.connect(pollAddress, signer);

  // check if it's time to merge the message AQ
  const dd = await pollContract.getDeployTimeAndDuration();
  const deadline = Number(dd[0]) + Number(dd[1]);
  const now = await currentBlockTimestamp(signer.provider!);

  if (now < deadline) {
    logError("Voting period is not over");
  }

  if (!(await pollContract.stateMerged())) {
    // go and merge the state tree
    logYellow(quiet, info("Calculating root and storing on Poll..."));
    const tx = await pollContract.mergeMaciState();
    const receipt = await tx.wait();

    if (receipt?.status !== 1) {
      logError("Error merging state subroots");
    }

    logYellow(quiet, info(`Transaction hash: ${receipt!.hash}`));
    logGreen(
      quiet,
      success(
        `Executed mergeStateAq(); gas used: ${receipt!.gasUsed.toString()}`,
      ),
    );
    return true;
  } else {
    logError("The state tree has already been merged.");
    return false;
  }
};
