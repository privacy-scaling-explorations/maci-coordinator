package main

import (
	"encoding/json"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/iden3/go-rapidsnark/prover"
	"github.com/iden3/go-rapidsnark/types"
	"github.com/iden3/go-rapidsnark/verifier"
	"github.com/stretchr/testify/require"
)

func Test_Groth16Prover(t *testing.T) {
	var verificationKey []byte
	var err error

	proofJson, err := os.ReadFile("./data/processMessages/proof.json")
	require.NoError(t, err)

	pubSignalsJson, err := os.ReadFile("./data/processMessages/public.json")
	require.NoError(t, err)

	var proofData types.ProofData
	var pubSignals []string

	err = json.Unmarshal([]byte(proofJson), &proofData)
	if err != nil {
		fmt.Errorf("err: %s", err)
	}
	err = json.Unmarshal([]byte(pubSignalsJson), &pubSignals)
	if err != nil {
		fmt.Errorf("err: %s", err)
	}

	proof := &types.ZKProof{Proof: &proofData, PubSignals: pubSignals}

	verificationKey, err = os.ReadFile("./data/processMessages/vk.json")
	require.NoError(t, err)

	err = verifier.VerifyGroth16(*proof, verificationKey)
	require.NoError(t, err)

	// Gen Proofs
	// provingKey, err := os.ReadFile("./data/zkeys/ProcessMessages_10-2-1-2_test.0.zkey")
	// require.NoError(t, err)

	// witness, err := os.ReadFile("./data/processMessages/output.wtns")
	// require.NoError(t, err)

	// _, _, err = prover.Groth16ProverRaw(provingKey, witness)

	// Measure time

	// Measure time
	start := time.Now() // Get the current time

	provingKey, err := os.ReadFile("./data/zkeys/ProcessMessages_10-2-1-2_test.0.zkey")
	require.NoError(t, err)

	elapsed := time.Since(start) // Calculate the elapsed time
	fmt.Printf("Elapsed time for reading 10-2-1-2: %s\n", elapsed)

	witness, err := os.ReadFile("./data/processMessages/output.wtns")
	require.NoError(t, err)

	start = time.Now() // Get the current time
	_, _, err = prover.Groth16ProverRaw(provingKey, witness)
	elapsed = time.Since(start) // Calculate the elapsed time
	fmt.Printf("Elapsed time for gen proof 10-2-1-2: %s\n", elapsed)

	start = time.Now() // Get the current time

	_, err = os.ReadFile("./data/zkeys/ProcessMessages_6-8-2-3_test.0.zkey")
	require.NoError(t, err)

	elapsed = time.Since(start) // Calculate the elapsed time
	fmt.Printf("Elapsed time for reading 6-8-2-3: %s\n", elapsed)

}
