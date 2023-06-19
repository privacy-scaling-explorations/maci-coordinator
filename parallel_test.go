package main

import (
	"fmt"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/iden3/go-rapidsnark/prover"
	"github.com/stretchr/testify/require"
)

func worker(id int, zkey []byte, witness []byte, wg *sync.WaitGroup) {
	defer wg.Done()

	_, _, err := prover.Groth16ProverRaw(zkey, witness)
	if err != nil {
		fmt.Printf("%d prover failed: %s", id, err)
	}
}

func Test_Parallel(t *testing.T) {
	// Measure time
	start := time.Now() // Get the current time

	provingKey, err := os.ReadFile("./data/zkeys/ProcessMessages_10-2-1-2_test.0.zkey")
	require.NoError(t, err)

	elapsed := time.Since(start) // Calculate the elapsed time
	fmt.Printf("Elapsed time for reading 10-2-1-2: %s\n", elapsed)

	witness, err := os.ReadFile("./data/processMessages/output.wtns")
	require.NoError(t, err)

	start = time.Now() // Get the current time

	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go worker(i, provingKey, witness, &wg)
	}
	wg.Wait()

	elapsed = time.Since(start) // Calculate the elapsed time
	fmt.Printf("Elapsed time for gen proof 10-2-1-2: %s\n", elapsed)
}
