#!/bin/bash

#export NODE_OPTIONS="--max-old-space-size=16384"

cd circuits
mkdir -p build

if [ -f ./powersOfTau28_hez_final_18.ptau ]; then
    echo "powersOfTau28_hez_final_16.ptau already exists. Skipping."
else
    echo 'Downloading powersOfTau28_hez_final_16.ptau'
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_18.ptau
fi

echo "Compiling: sudoku..."

mkdir -p build/sudoku

# compile circuit

# if [ -f ./build/sudoku.r1cs ]; then
    # echo "Circuit already compiled. Skipping."
# else
    circom sudoku.circom --r1cs --wasm --sym -o sudoku
    snarkjs r1cs info sudoku.r1cs
# fi

# Start a new zkey and make a contribution

# if [ -f ./build/sudoku/verification_key.json ]; then
    # echo "verification_key.json already exists. Skipping."
# else
snarkjs groth16 setup sudoku/sudoku.r1cs powersOfTau28_hez_final_16.ptau sudoku/circuit_0000.zkey
snarkjs zkey contribute sudoku/circuit_0000.zkey sudoku/circuit_final.zkey --name="1st Contributor Name" -v -e="random text"
snarkjs zkey export verificationkey sudoku/circuit_final.zkey sudoku/verification_key.json
# fi

# generate solidity contract
snarkjs zkey export solidityverifier sudoku/circuit_final.zkey ../contracts/verifier.sol