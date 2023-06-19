package main

import (
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/iden3/go-rapidsnark/prover"
	"github.com/iden3/go-rapidsnark/witness"
)

type ProverManager struct {
	ProvingKey   []byte
	Witness      []byte
	Proof        []string
	PublicInputs []string
}

func (p *ProverManager) Execute(numProofs int) {

	startAll := time.Now() // Get the current time

	var wg sync.WaitGroup
	for i := 0; i < numProofs; i++ {
		wg.Add(1)
		go func(index int) {
			defer wg.Done()

			start := time.Now() // Get the current time

			var err error
			p.Proof[index], p.PublicInputs[index], err = prover.Groth16ProverRaw(p.ProvingKey, p.Witness)
			if err != nil {
				fmt.Errorf("err: %s", err)
			}

			elapsed := time.Since(start) // Calculate the elapsed time
			fmt.Printf("Elapsed time for gen proof 6-8-2-3: %s\n", elapsed)
		}(i)

	}
	wg.Wait()

	elapsedAll := time.Since(startAll) // Calculate the elapsed time
	fmt.Printf("Elapsed time for gen proofs: %s\n", elapsedAll)

}

func witnessCalc() {
	start := time.Now() // Get the current time

	wasmBytes, _ := os.ReadFile("./data/zkeys/ProcessMessages_6-8-2-3_test_js/ProcessMessages_6-8-2-3_test.wasm")
	inputsByte, _ := os.ReadFile("./data/processMessages/6-8-2-3/input.json")

	inputs, _ := witness.ParseInputs(inputsByte)

	calc, _ := witness.NewCircom2WitnessCalculator(wasmBytes, true)

	wtns, _ := calc.CalculateWTNSBin(inputs, true)
	os.WriteFile("./data/processMessages/6-8-2-3/witness_wasm.wtns", wtns, 0666)

	elapsed := time.Since(start) // Calculate the elapsed time
	fmt.Printf("Elapsed time for witness calculation 6-8-2-3 Processmessages: %s\n", elapsed)
}

func main() {
	// machine: M1 Air with 16 GB Ram
	//
	// ## proof gen 6-8-2-3
	// go-rapidsnark
	// PM took 23.3 s
	// TV took 12 s

	// snarkjs
	// PM took 47 s
	// TV took 26 s

	// witness calculation
	// wasm
	// PM took 11 s

	
	// 1. Calculate Witness
	witnessCalc()


	// 2. Generate Proof
	provingKey, err := os.ReadFile("./data/zkeys/ProcessMessages_6-8-2-3_test.0.zkey")
	if err != nil {
		fmt.Errorf("err: %s", err)
	}
	witness, err := os.ReadFile("./data/processMessages/6-8-2-3/witness_wasm.wtns")
	if err != nil {
		fmt.Errorf("err: %s", err)
	}

	// provingKey, _ := os.ReadFile("./data/zkeys/TallyVotes_6-2-3_test.0.zkey")
	// witness, _ := os.ReadFile("./data/tally/6-8-2-3/output.wtns")

	numProofs := 1
	pm := ProverManager{
		ProvingKey:   provingKey,
		Witness:      witness,
		Proof:        make([]string, numProofs),
		PublicInputs: make([]string, numProofs),
	}

	pm.Execute(numProofs)

	for i := 0; i < numProofs; i++ {
		fmt.Println(pm.Proof[i])
		fmt.Println(pm.PublicInputs[i])
	}

}
