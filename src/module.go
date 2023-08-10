package src

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/goccy/go-json"
	"github.com/iden3/go-rapidsnark/prover"
	"github.com/iden3/go-rapidsnark/witness"
)

//nolint:govet // PoC skip
type Circuit struct {
	Status ProverState `json:"status"`
	Result Result      `json:"result"`
}

type Result struct {
	Proof       interface{} `json:"proof"`
	PublicInput interface{} `json:"publicInput"`
}

type RequestData struct {
	CircuitName  string          `json:"circuitName"`
	CircuitInput json.RawMessage `json:"circuitInput"`
}
type ResponseData struct {
	ProcessMessagesCircuit Circuit `json:"processMessagesCircuit"`
	TallyVotesCircuit      Circuit `json:"tallyVotesCircuit"`
}

type Prover struct {
	ProcessMessagesCircuit Circuit
	TallyVotesCircuit      Circuit
}

type ProverState string

const (
	WaitingForRequest ProverState = "WaitingForRequest" // No current proof request, waiting for one
	GeneratingProof   ProverState = "GeneratingProof"   // Currently generating a proof
	ProofAvailable    ProverState = "ProofAvailable"    // A proof has been generated and is available for retrieval
)

func NewRouter(p Prover) *gin.Engine {
	r := gin.Default()

	// This configures the middleware to allow all origins:
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true

	r.Use(cors.New(config))

	r.POST("/api/generateProof", p.GenerateProof)
	r.GET("/api/getResult", p.GetResult)

	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "api_demo.html", nil)
	})

	return r
}

//nolint:funlen, gocognit, gocyclo, cyclop // PoC skip
func (p *Prover) GenerateProof(c *gin.Context) {
	var request RequestData
	if err := c.ShouldBind(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fmt.Println(request.CircuitName)

	//nolint: dupl // PoC skip
	switch request.CircuitName {
	case "ProcessMessages":
		go func() {
			p.ProcessMessagesCircuit.Status = GeneratingProof

			// 1. Calculate witness
			start := time.Now()
			wasmBytes, err := os.ReadFile("./instruments/ProcessMessages_6-8-2-3_test.wasm")
			if err != nil {
				fmt.Printf("err: %s", err)
			}

			inputs, err := witness.ParseInputs(request.CircuitInput)
			if err != nil {
				fmt.Printf("err: %s", err)
			}

			calc, err := witness.NewCircom2WitnessCalculator(wasmBytes, true)
			if err != nil {
				fmt.Printf("err: %s", err)
			}

			wtns, err := calc.CalculateWTNSBin(inputs, true)
			if err != nil {
				fmt.Printf("err: %s", err)
			}

			//nolint:gomnd // PoC skip
			err = os.WriteFile("./data/ProcessMessages/6-8-2-3/witness_wasm.wtns", wtns, 0600)
			if err != nil {
				fmt.Printf("err: %s", err)
			}

			elapsed := time.Since(start) // Calculate the elapsed time
			fmt.Printf("Elapsed time for witness calculation 6-8-2-3 Processmessages: %s\n", elapsed)

			// 2. Generate Proof
			provingKey, err := os.ReadFile("./instruments/ProcessMessages_6-8-2-3_test.0.zkey")
			if err != nil {
				fmt.Printf("err: %s", err)
			}
			witnessOutput, err := os.ReadFile("./data/ProcessMessages/6-8-2-3/witness_wasm.wtns")
			if err != nil {
				fmt.Printf("err: %s", err)
			}

			start = time.Now() // Get the current time

			proof, publicInput, err := prover.Groth16ProverRaw(provingKey, witnessOutput)
			if err != nil {
				fmt.Printf("err: %s", err)
			}

			p.ProcessMessagesCircuit.Result.Proof = proof
			p.ProcessMessagesCircuit.Result.PublicInput = publicInput

			elapsed = time.Since(start) // Calculate the elapsed time

			fmt.Printf("Elapsed time for gen proof 6-8-2-3: %s\n", elapsed)

			p.ProcessMessagesCircuit.Status = ProofAvailable
			fmt.Println("Proof available for ProcessMessages")
		}()
	case "TallyVotes":
		go func() {
			p.TallyVotesCircuit.Status = GeneratingProof
			// 1. Calculate witness
			start := time.Now()
			wasmBytes, err := os.ReadFile("./instruments/TallyVotes_6-2-3_test.wasm")
			if err != nil {
				fmt.Printf("err: %s", err)
			}

			inputs, err := witness.ParseInputs(request.CircuitInput)
			if err != nil {
				fmt.Printf("err: %s", err)
			}

			calc, err := witness.NewCircom2WitnessCalculator(wasmBytes, true)
			if err != nil {
				fmt.Printf("err: %s", err)
			}

			wtns, err := calc.CalculateWTNSBin(inputs, true)
			if err != nil {
				fmt.Printf("err: %s", err)
			}

			//nolint:gomnd // PoC skip
			err = os.WriteFile("./data/TallyVotes/6-2-3/witness_wasm.wtns", wtns, 0600)
			if err != nil {
				fmt.Printf("err: %s", err)
			}

			elapsed := time.Since(start) // Calculate the elapsed time
			fmt.Printf("Elapsed time for witness calculation 6-2-3 TallyVotes: %s\n", elapsed)

			// 2. Generate Proof
			provingKey, err := os.ReadFile("./instruments/TallyVotes_6-2-3_test.0.zkey")
			if err != nil {
				fmt.Printf("err: %s", err)
			}
			witnessOutput, err := os.ReadFile("./data/TallyVotes/6-2-3/witness_wasm.wtns")
			if err != nil {
				fmt.Printf("err: %s", err)
			}

			start = time.Now() // Get the current time

			proof, publicInput, err := prover.Groth16ProverRaw(provingKey, witnessOutput)
			if err != nil {
				fmt.Printf("err: %s", err)
			}

			p.TallyVotesCircuit.Result.Proof = proof
			p.TallyVotesCircuit.Result.PublicInput = publicInput

			elapsed = time.Since(start) // Calculate the elapsed time

			fmt.Printf("Elapsed time for gen proof 6-2-3 TallyVotes: %s\n", elapsed)

			p.TallyVotesCircuit.Status = ProofAvailable
			fmt.Println("Proof available for TallyVotes")
		}()

		c.JSON(http.StatusOK, gin.H{
			"status":  http.StatusOK,
			"message": "OK",
		})
	}
}

func (p *Prover) GetResult(c *gin.Context) {
	data := ResponseData{
		ProcessMessagesCircuit: Circuit{
			Status: p.ProcessMessagesCircuit.Status,
			Result: p.ProcessMessagesCircuit.Result,
		},
		TallyVotesCircuit: Circuit{
			Status: p.TallyVotesCircuit.Status,
			Result: p.TallyVotesCircuit.Result,
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"status": http.StatusOK,
		"data":   data,
	})
}
