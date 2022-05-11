const { expect } = require('chai');
const { ethers } = require('hardhat');
const fs = require('fs');
const { groth16, plonk } = require('snarkjs');

function unstringifyBigInts(o) {
  if (typeof o == 'string' && /^[0-9]+$/.test(o)) {
    return BigInt(o);
  } else if (typeof o == 'string' && /^0x[0-9a-fA-F]+$/.test(o)) {
    return BigInt(o);
  } else if (Array.isArray(o)) {
    return o.map(unstringifyBigInts);
  } else if (typeof o == 'object') {
    if (o === null) return null;
    const res = {};
    const keys = Object.keys(o);
    keys.forEach(k => {
      res[k] = unstringifyBigInts(o[k]);
    });
    return res;
  } else {
    return o;
  }
}

describe('HelloWorld', function () {
  let Verifier;
  let verifier;

  beforeEach(async function () {
    Verifier = await ethers.getContractFactory(
      'contracts/HelloWorldVerifier.sol:HelloWorldVerifier',
    );
    verifier = await Verifier.deploy();
    await verifier.deployed();
  });

  it('Should return true for correct proof', async function () {
    // Generate proof and public signals for witness a=1 and b=2
    const { proof, publicSignals } = await groth16.fullProve(
      { a: 1, b: 2 },
      'contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm',
      'contracts/circuits/HelloWorld/circuit_final.zkey',
    );

    // Convert public signals from string to big int
    const editedPublicSignals = unstringifyBigInts(publicSignals);
    
    // Convert proof from string to big int
    const editedProof = unstringifyBigInts(proof);

    // Prepare smart contract call data using big int proof and public signals
    const calldata = await groth16.exportSolidityCallData(
      editedProof,
      editedPublicSignals,
    );

    // Convert call data string into an array of values to be used on the proof verification
    const argv = calldata
      .replace(/["[\]\s]/g, '')
      .split(',')
      .map(x => BigInt(x).toString());

    // proof formating
    const a = [argv[0], argv[1]];
    const b = [
      [argv[2], argv[3]],
      [argv[4], argv[5]],
    ];
    const c = [argv[6], argv[7]];
    const Input = argv.slice(8);

    // proof verification on smart contract must return true
    expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
  });

  it('Should return false for invalid proof', async function () {
    //[assignment] insert your script here
    // invalid proof values
    let a = [0, 0];
    let b = [
      [0, 0],
      [0, 0],
    ];
    let c = [0, 0];
    let d = [0];

    // Wrong proof leads to invalid verification
    expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
  });
});

describe('Multiplier3 with Groth16', function () {
  let Verifier;
  let verifier;

  beforeEach(async function () {
    Verifier = await ethers.getContractFactory(
      'contracts/Multiplier3Verifier.sol:Multiplier3Verifier',
    );
    verifier = await Verifier.deploy();
    await verifier.deployed();
  });

  it('Should return true for correct proof', async function () {
    const { proof, publicSignals } = await groth16.fullProve(
      { a: 1, b: 2, c: 3 },
      'contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm',
      'contracts/circuits/Multiplier3/circuit_final.zkey',
    );

    const editedPublicSignals = unstringifyBigInts(publicSignals);

    const editedProof = unstringifyBigInts(proof);

    const calldata = await groth16.exportSolidityCallData(
      editedProof,
      editedPublicSignals,
    );

    const argv = calldata
      .replace(/["[\]\s]/g, '')
      .split(',')
      .map(x => BigInt(x).toString());

    const a = [argv[0], argv[1]];
    const b = [
      [argv[2], argv[3]],
      [argv[4], argv[5]],
    ];
    const c = [argv[6], argv[7]];
    const Input = argv.slice(8);

    // Expect the verifiers response to be true
    expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
  });

  it('Should return false for invalid proof', async function () {
    const { proof, publicSignals } = await groth16.fullProve(
      { a: 1, b: 2, c: 3 },
      'contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm',
      'contracts/circuits/Multiplier3/circuit_final.zkey',
    );

    const editedPublicSignals = unstringifyBigInts(publicSignals);

    const editedProof = unstringifyBigInts(proof);

    const calldata = await groth16.exportSolidityCallData(
      editedProof,
      editedPublicSignals,
    );

    const argv = calldata
      .replace(/["[\]\s]/g, '')
      .split(',')
      .map(x => BigInt(x).toString());

    const a = [argv[0], argv[1]];
    const b = [
      [argv[2], argv[3]],
      [argv[4], argv[5]],
    ];
    const c = [argv[6], argv[7]];
    // changes small detail on input so it is not valid anymore
    const wrongInput = [argv[8].replace('6', '7')];

    // Expect the verifiers response to be false
    expect(await verifier.verifyProof(a, b, c, wrongInput)).to.be.false;
  });
});

describe('Multiplier3 with PLONK', function () {
  let Verifier;
  let verifier;

  beforeEach(async function () {
    Verifier = await ethers.getContractFactory(
      'contracts/Multiplier3Verifier_plonk.sol:Multiplier3PlonkVerifier',
    );
    verifier = await Verifier.deploy();
    await verifier.deployed();
  });

  it('Should return true for correct proof', async function () {
    const { proof, publicSignals } = await plonk.fullProve(
      { a: 1, b: 2, c: 3 },
      'contracts/circuits/Multiplier3_plonk/Multiplier3_js/Multiplier3.wasm',
      'contracts/circuits/Multiplier3_plonk/circuit_final.zkey',
    );

    const editedPublicSignals = unstringifyBigInts(publicSignals);

    const editedProof = unstringifyBigInts(proof);

    const calldata = await plonk.exportSolidityCallData(
      editedProof,
      editedPublicSignals,
    );

    const argv = calldata.replace(/["[\]\s]/g, '').split(',');

    const proofBytes = argv[0];
    const Input = [argv[1].toString()];

    expect(await verifier.verifyProof(proofBytes, Input)).to.be.true;
  });

  it('Should return false for invalid proof', async function () {
    // same routine as other tests
    const { proof, publicSignals } = await plonk.fullProve(
      { a: 1, b: 2, c: 3 },
      'contracts/circuits/Multiplier3_plonk/Multiplier3_js/Multiplier3.wasm',
      'contracts/circuits/Multiplier3_plonk/circuit_final.zkey',
    );

    const editedPublicSignals = unstringifyBigInts(publicSignals);

    const editedProof = unstringifyBigInts(proof);

    const calldata = await plonk.exportSolidityCallData(
      editedProof,
      editedPublicSignals,
    );

    const argv = calldata.replace(/["[\]\s]/g, '').split(',');

    // changes small detail on proof so it is not valid anymore
    const wrongProofBytes = argv[0].replace('3', '4');
    const wrongInput = [argv[1].toString().replace('6', '7')];

    expect(await verifier.verifyProof(wrongProofBytes, wrongInput)).to.be.false;
  });
});
