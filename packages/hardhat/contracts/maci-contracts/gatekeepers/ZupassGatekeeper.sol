// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

import { SignUpGatekeeper } from "maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol";

import { Groth16Verifier } from "../../Groth16Verifier.sol";

/// @title SignUpTokenGatekeeper
/// @notice This contract allows to gatekeep MACI signups
/// by requiring new voters to own a certain ERC721 token
contract ZupassGatekeeper is
	SignUpGatekeeper,
	Ownable(msg.sender)
{

	// The Zupass event UUID converted to bigint
	uint256 immutable validEventId;

	// hex to bigint conversion for Zupass event signer
	uint256 immutable validSigner1;
	uint256 immutable validSigner2;

	Groth16Verifier immutable verifier;

	/// @notice the reference to the MACI contract
	address public maci;

	/// @notice a mapping of ticket IDs to whether they have been used
	mapping(uint256 => bool) public registeredTickets;

	/// @notice custom errors
	error AlreadyRegistered();
	error InvalidProof();
	error InvalidEventId();
	error InvalidSigners();
	error InvalidWatermark();
	error OnlyMACI();

	/// @notice creates a new ZupassGatekeeper
	/// @param _validEventId Zupass event UUID converted to bigint
	/// @param _validSigner1 Zupass event signer[0]
	/// @param _validSigner2 Zupass event signer[1]
	constructor(uint256 _validEventId, uint256 _validSigner1, uint256 _validSigner2, address _verifier) payable {
		validEventId = _validEventId;
		validSigner1 = _validSigner1;
		validSigner2 = _validSigner2;
		verifier = Groth16Verifier(_verifier);
	}

	/// @notice Adds an uninitialised MACI instance to allow for token signups
	/// @param _maci The MACI contract interface to be stored
	function setMaciInstance(address _maci) public override onlyOwner {
		maci = _maci;
	}

	/// @notice Registers the user if they own the token with the token ID encoded in
	/// _data. Throws if the user does not own the token or if the token has
	/// already been used to sign up.
	/// @param _user The user's Ethereum address.
	/// @param _data The ABI-encoded tokenId as a uint256.
	function register(address _user, bytes memory _data) public override {
		if (maci != msg.sender) revert OnlyMACI();

		// Decode the given _data bytes
		(uint256[2] memory _pA,
		uint256[2][2] memory _pB,
		uint256[2] memory _pC,
		uint256[38] memory _pubSignals) = abi.decode(_data, (uint256[2], uint256[2][2], uint256[2], uint256[38]));
		if (!verifier.verifyProof(_pA, _pB, _pC, _pubSignals))
			revert InvalidProof();

		// Events are stored from starting index 15 to till valid event ids length

		if (_pubSignals[15] != validEventId)
			revert InvalidEventId();

		// signers are stored from starting index 13 to 14
		if (
			_pubSignals[13] != validSigner1 ||
			_pubSignals[14] != validSigner2
		)
			revert InvalidSigners();

		// watermark is stored at index 37
		if (_pubSignals[37] != uint256(uint160(_user)))
			revert InvalidWatermark();

		// ticket ID is stored at index 0
		uint256 ticketId = _pubSignals[0];
		if (registeredTickets[ticketId])
			revert AlreadyRegistered();

		registeredTickets[ticketId] = true;
	}
}
