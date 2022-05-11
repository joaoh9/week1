#!/bin/bash

#export NODE_OPTIONS="--max-old-space-size=16384"

cd circuits
mkdir -p build

if [ -f ./powersOfTau28_hez_final_16.ptau ]; then
    echo "powersOfTau28_hez_final_16.ptau already exists. Skipping."
else
    echo 'Downloading powersOfTau28_hez_final_16.ptau'
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_16.ptau
fi

echo "Compiling: RangeProof..."

mkdir -p build/RangeProof

# compile circuit

if [ -f ./build/RangeProof.r1cs ]; then
    echo "Circuit already compiled. Skipping."
else
    circom RangeProof.circom --r1cs --wasm --sym -o build
    snarkjs r1cs info build/RangeProof.r1cs
fi

# Start a new zkey and make a contribution

if [ -f ./build/RangeProof/verification_key.json ]; then
    echo "verification_key.json already exists. Skipping."
else
    snarkjs plonk setup build/RangeProof.r1cs powersOfTau28_hez_final_16.ptau build/RangeProof/circuit_final.zkey #circuit_0000.zkey
    #snarkjs zkey contribute build/RangeProof/circuit_0000.zkey build/RangeProof/circuit_final.zkey --name="1st Contributor Name" -v -e="random text"
    snarkjs zkey export verificationkey build/RangeProof/circuit_final.zkey build/RangeProof/verification_key.json
fi

# generate solidity contract
snarkjs zkey export solidityverifier build/RangeProof/circuit_final.zkey ../contracts/verifier.sol