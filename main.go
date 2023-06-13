package main

import (
	"fmt"
	"os"
	"time"

	"github.com/iden3/go-rapidsnark/prover"
)

func main() {
	start := time.Now() // Get the current time

	provingKey, _ := os.ReadFile("./data/zkeys/ProcessMessages_10-2-1-2_test.0.zkey")

	elapsed := time.Since(start) // Calculate the elapsed time
	fmt.Printf("Elapsed time for reading 10-2-1-2: %s\n", elapsed)

	witness, _ := os.ReadFile("./data/processMessages/output.wtns")

	start = time.Now() // Get the current time
	_, _, _ = prover.Groth16ProverRaw(provingKey, witness)
	elapsed = time.Since(start) // Calculate the elapsed time
	fmt.Printf("Elapsed time for gen proof 10-2-1-2: %s\n", elapsed)
}
