package src

import (
	"database/sql"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
	native_json "encoding/json"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/goccy/go-json"
	"github.com/iden3/go-rapidsnark/prover"
	"github.com/iden3/go-rapidsnark/witness"
	_ "github.com/lib/pq"
	"github.com/golang-jwt/jwt/v5"
)

var JWTSecret []byte = []byte(os.Getenv("JWT_SECRET"))

/// CreateJWT creates a new JWT token
func CreateJWT(userID string, role string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"role":    role,
	})

	return token.SignedString(JWTSecret)
}

type ProofState string

/// @todo cleanup duplicate types 

/// The full proof response
type ProofResponse struct {
	CircuitName  string 	`json:"circuitName"`
	ProofID      int    	`json:"proofId"`
	Proof        string 	`json:"proof"`
	PublicInputs string 	`json:"publicInputs"`
	TimeTaken    string 	`json:"timeTaken"`
}

/// The intermediate results sent to a user when requesting a proof
type ProofInfo struct {
	CircuitName string 
	ProofID     int
}

//nolint:govet // PoC skip
type Result struct {
	Status      ProofState  `json:"status"`
	Proof       interface{} `json:"proof"`
	PublicInput interface{} `json:"publicInput"`
}

/// The request for generating a proof
type GenerateProofRequest struct {
	CircuitName  string          `json:"circuitName"`
	CircuitInput json.RawMessage `json:"circuitInput"`
}

/// The request for generating multiple proofs
type GenerateMultipleProofsRequest struct {
	Requests []GenerateProofRequest `json:"proofs"`
}

// A prover struct holds all circuits registered
type Prover struct {
	db       *sql.DB
}

// The request body to register a new circuit
type RegisterNewCircuitRequest struct {
	CircuitName string `json:"circuitName"`
	ZKeyURL     string `json:"zKeyURL"`
	WASMURL     string `json:"wasmURL"`
}

// The request body to get a proof for a circuit
type CircuitProofRequest struct {
	CircuitName string `json:"circuitName"`
	ProofIds    []int  `json:"proofIds"`
}

// The request body to get proofs for more circuits
type GetMultipleCircuitsProofsRequest struct {
	Circuits []CircuitProofRequest `json:"circuits"`
}

// A circuit type with zkey and wasm paths
type Circuit struct {
	ZKeyPath string      		`json:"zKeyPath"`
	WASMPath string      		`json:"wasmPath"`
}

// Statuses for the proof generation
const (
	WaitingForRequest     ProofState = "WaitingForRequest"     // No current proof request, waiting for one
	GeneratingProof       ProofState = "GeneratingProof"       // Currently generating a proof
	ProofAvailable        ProofState = "ProofAvailable"        // A proof has been generated and is available for retrieval
	ProofGenerationFailed ProofState = "ProofGenerationFailed" // Proof generation failed
)

/// UTILS 

// downloadFile - Util function to download a file from a URL
func downloadFile(URL string, outPath string) error {
	// Create the file
	out, err := os.Create(outPath)
	if err != nil {
		return err
	}
	defer out.Close()

	// Get the data
	resp, err := http.Get(URL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Check server response
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to download, status code: %s", resp.Status)
	}

	// Writer the body to file
	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return err
	}

	return nil
}

// ParseJWT - Parse the token 
func ParseJWT(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate the alg is what we expect
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
		}

		// Return the secret used to sign the token
		return JWTSecret, nil
	})

	if err != nil {
		return nil, err
	}

	// Return the claims
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	} else {
		return nil, fmt.Errorf("Invalid token")
	}
}

// AuthUser - Authenticates the user
func AuthUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the token from the header
		authHeader := c.GetHeader("Authorization")

		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(401, gin.H{"error": "Invalid token"})
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// Parse the token
		claims, err := ParseJWT(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(401, gin.H{"error": "Invalid token"})
			return
		}

		// Get the role
		role, ok := claims["role"].(string)
		if !ok {
			c.AbortWithStatusJSON(401, gin.H{"error": "Invalid token"})
			return
		}

		// Set the user ID and role in the context
		if role != "admin" {
			c.AbortWithStatusJSON(403, gin.H{"error": "Invalid role"})
			return
		}  
	}
}

// NewRouter - Create a new router
func NewRouter(p Prover) *gin.Engine {
	r := gin.Default()

	// This configures the middleware to allow all origins:
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true

	r.Use(cors.New(config))

	// endpoint to generate a proof
	r.POST("/api/generateProof", p.GenerateProof)
	// endpoint to generate multiple proofs
	r.POST("/api/generateMultipleProofs", p.GenerateMultipleProofs)
	// endpoint to register a new circuit
	r.POST("/api/registerNewCircuit", AuthUser(), p.RegisterNewCircuit)
	// endpoint to get all the available proofs
	r.GET("/api/proofs/available", p.GetAvailableProofs)
	// endpoint to get one or more proofs for one circuit
	r.GET("/api/getResult", p.GetResult)
	// endpoint to get proofs for multiple circuits
	r.POST("/api/getResult", p.GetMultipleResults)
	// endpoint to get all registered circuits
	r.GET("/api/registeredCircuits", p.GetRegisteredCircuits)

	// on index serve the demo page
	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "api_demo.html", nil)
	})

	return r
}

/// METHODS

// InitDb - Init the database object
func (p *Prover) InitDb(user string, password string, dbName string) {
	connStr := fmt.Sprintf("user=%s password=%s dbname=%s host=localhost sslmode=disable", user, password, dbName)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		panic(err.Error())
	}


	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)

	// store db in prover
	p.db = db
}

/// Close the db connection
func (p Prover) CloseDB() {
	p.db.Close()
}

/// RegisterNewCircuit - Register a new circuit 
func (p Prover) RegisterNewCircuit(c *gin.Context) {
	var request RegisterNewCircuitRequest
	if err := c.ShouldBind(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "The request body is not valid"})
		return
	}

	// make sure there is no circuit with the same name
	exists, err := p.CheckIfCircuitExists(request.CircuitName)
	if err != nil {
		fmt.Println(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query the database"})
		return
	}

	// if there's a result it means it exists already
	if exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "A circuit with the same name already exists"})
		return
	}

	// download artifacts
	zKeyPath := "./data/" + request.CircuitName + ".zkey"
	wasmPath := "./data/" + request.CircuitName + ".wasm"

	// download in parallel but make sure we wait for all three downloads
	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		err := downloadFile(request.ZKeyURL, zKeyPath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to download the zKey file"})
			return
		}
		wg.Done()
	}()

	go func() {
		err := downloadFile(request.WASMURL, wasmPath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to download the WASM file"})
			return
		}
		wg.Done()
	}()

	// wait for all goroutines to finish
	wg.Wait()

	res, err := p.db.Query(
		"INSERT INTO circuits (name, zkey_path, wasm_path) VALUES ($1, $2, $3)",
		request.CircuitName,
		zKeyPath,
		wasmPath,
	)

	defer res.Close()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save the circuit"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// GetRegisteredCircuits - Get the circuit that are registered on the coordinator service
func (p Prover) GetRegisteredCircuits(c *gin.Context) {
	var data []string

	rows, err := p.db.Query("SELECT name FROM circuits;")

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get the circuit names"})
		return
	}

	defer rows.Close()

	// store the data in a slice
	for rows.Next() {
		var name string
		err = rows.Scan(&name)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get the circuit names"})
			return
		}

		data = append(data, name)
	}

	// return the data
	c.JSON(http.StatusOK, gin.H{"circuits": data})
}

// GetNumberOfProofsPerCircuit Get the number of proofs for a certain circuit
func (p Prover) GetNumberOfProofsPerCircuit(circuitName string) (int, error) {
	var count int
	err := p.db.QueryRow("SELECT COUNT(*) FROM proofs WHERE circuit_name = $1", circuitName).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}

// GetCircuitDetails - Get a circuit's details
func (p Prover) GetCircuitDetails(circuitName string) (Circuit, error) {
	var circuit Circuit
	err := p.db.QueryRow(
		"SELECT zkey_path, wasm_path FROM circuits WHERE name = $1", 
		circuitName).Scan(&circuit.ZKeyPath, &circuit.WASMPath)

	if err != nil {
		return circuit, err
	}

	return circuit, nil
}

// UpdateProofStatus - Update the proof status on the db
func (p Prover) UpdateProofStatus(proofState ProofState, circuitName string, id int) error {
	_, err := p.db.Exec("UPDATE proofs SET status = $1 WHERE circuit_name = $2 AND id = $3", proofState, circuitName, id)
	if err != nil {
		return err
	}
	return nil
}

// CheckIfCircuitExists - Check if a circuit exists by using its name
func (p Prover) CheckIfCircuitExists(circuitName string) (bool, error) {
	rows, err := p.db.Query("SELECT name FROM circuits WHERE name = $1", circuitName)

	if err != nil {
		return false, err
	}

	defer rows.Close()

	// if there's no result it means it doesn't exist
	if !rows.Next() {
		return false, nil
	}

	return true, nil
}

// GetProof - Get the proof status and details
func (p Prover) GetProof(circuitName string, id int) (Result, error) {
	var result Result

	err := p.db.QueryRow(
		"SELECT status, proof, public_inputs FROM proofs WHERE circuit_name = $1 AND id = $2;", 
		circuitName, id).Scan(&result.Status, &result.Proof, &result.PublicInput)

	if err != nil {
		return result, err
	}

	return result, nil
}

//nolint:funlen, gocognit, gocyclo, cyclop // PoC skip
// GenerateProof - Generate a single proof for a circuit
func (p Prover) GenerateProof(c *gin.Context) {
	var request GenerateProofRequest
	if err := c.ShouldBind(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "The request body is not valid"})
		return
	}

	// check if there is a circuit with this name
	exists, err := p.CheckIfCircuitExists(request.CircuitName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query the database"})
		return
	}

	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("There is no such circuit %s", request.CircuitName)})
		return
	}

	// generate a new uuid
	proofID, err := p.GetNumberOfProofsPerCircuit(request.CircuitName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get the number of proofs"})
		return
	}

	// calculate wtns name (use name + id to be an unique identifier)
	wtnsPath := fmt.Sprintf("./data/%s_%d.wtns", request.CircuitName, proofID)

	// get the paths to zkey and wasm
	circuit, err := p.GetCircuitDetails(request.CircuitName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get the circuit details"})
		return
	}

	// init a new empty proof in the DB
	// marshal to JSON
	tmpJSON, err := native_json.Marshal("{}")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal the proof"})
		return
	}
	_, err = p.db.Exec(
		"INSERT INTO proofs (id, circuit_name, status, proof, public_inputs) VALUES ($1, $2, $3, $4, $5)",
		proofID,
		request.CircuitName,
		GeneratingProof,
		tmpJSON,
		tmpJSON,
	)

	if (err != nil) {
		fmt.Println(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert the proof in the database"})
		return
	}

	// start generating the proof
	go func() {
		// if another error then recover and update the proof status
		defer func() {
			if r := recover(); r != nil {
				fmt.Printf("\nRecovered from panic: %s", r)
				p.UpdateProofStatus(ProofGenerationFailed, request.CircuitName, proofID)
			}
		}()

		// 1. Calculate witness
		start := time.Now()
		wasmBytes, err := os.ReadFile(circuit.WASMPath)
		if err != nil {
			fmt.Printf("err: %s", err)
			p.UpdateProofStatus(ProofGenerationFailed, request.CircuitName, proofID)
			return 
		}

		inputs, err := witness.ParseInputs(request.CircuitInput)
		if err != nil {
			fmt.Printf("err: %s", err)
			p.UpdateProofStatus(ProofGenerationFailed, request.CircuitName, proofID)
			return 
		}

		calc, err := witness.NewCircom2WitnessCalculator(wasmBytes, true)
		if err != nil {
			fmt.Printf("err: %s", err)
			p.UpdateProofStatus(ProofGenerationFailed, request.CircuitName, proofID)
			return 
		}

		wtns, err := calc.CalculateWTNSBin(inputs, true)
		if err != nil {
			fmt.Printf("err: %s", err)
			p.UpdateProofStatus(ProofGenerationFailed, request.CircuitName, proofID)
			return 
		}

		//nolint:gomnd // PoC skip
		err = os.WriteFile(wtnsPath, wtns, 0600)
		if err != nil {
			fmt.Printf("err: %s", err)
			p.UpdateProofStatus(ProofGenerationFailed, request.CircuitName, proofID)
			return 
		}

		// Calculate the elapsed time
		elapsed := time.Since(start)
		fmt.Printf("Elapsed time for witness calculation %s: %s\n", request.CircuitName, elapsed)

		// 2. Generate Proof
		provingKey, err := os.ReadFile(circuit.ZKeyPath)
		if err != nil {
			fmt.Printf("err: %s", err)
			p.UpdateProofStatus(ProofGenerationFailed, request.CircuitName, proofID)
		}

		witnessOutput, err := os.ReadFile(wtnsPath)
		if err != nil {
			fmt.Printf("err: %s", err)
			p.UpdateProofStatus(ProofGenerationFailed, request.CircuitName, proofID)
			return 
		}

		// Get the current time
		start = time.Now()

		proof, publicInput, err := prover.Groth16ProverRaw(provingKey, witnessOutput)
		if err != nil {
			fmt.Printf("err: %s", err)
			p.UpdateProofStatus(ProofGenerationFailed, request.CircuitName, proofID)
			return 
		}

		// Calculate the elapsed time
		elapsed = time.Since(start)

		fmt.Printf("Elapsed time for generating proof %s: %s\n", request.CircuitName, elapsed)

		// store the result on the db 
		// the proof and public input must be encoded as JSON
		jsonPublicInput, err := native_json.Marshal(publicInput)
		if err != nil {
			fmt.Printf("err: %s", err)
			p.UpdateProofStatus(ProofGenerationFailed, request.CircuitName, proofID)
		}

		jsonProof, err := native_json.Marshal(proof)
		if err != nil {
			fmt.Printf("err: %s", err)
			p.UpdateProofStatus(ProofGenerationFailed, request.CircuitName, proofID)
			return 
		}

		// if no error marshaling, we can save to the DB
		_, err = p.db.Exec(
			"UPDATE proofs SET proof = $1, public_inputs = $2, status = $3, time_taken = $4 WHERE id = $5 AND circuit_name = $6", 
			jsonProof, jsonPublicInput, ProofAvailable, elapsed.String(), proofID, request.CircuitName)

		if err != nil {
			fmt.Printf("err: %s", err)
			p.UpdateProofStatus(ProofGenerationFailed, request.CircuitName, proofID)
		} else {
			fmt.Printf("Proof available for %s", request.CircuitName)
		}
		
	}()

	// Return before go routine finishes so that the requester knows the proof id 
	c.JSON(http.StatusOK, gin.H{
		"status":  http.StatusOK,
		"message": "Proof generation started for Circuit: " + request.CircuitName + " proof Id: " + strconv.Itoa(proofID),
	})
}

// GenerateMultipleProofs Generate multiple proofs for multiple circuits
func (p Prover) GenerateMultipleProofs(c *gin.Context) {
	var request GenerateMultipleProofsRequest
	if err := c.ShouldBind(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "The request body is not valid"})
		return
	}

	// Create a channel to collect circuit names and proof IDs
	infoChannel := make(chan ProofInfo, len(request.Requests))

	// store the info about each proof request
	var infos []ProofInfo

	// loop through the requested circuits and inputs
	for _, proofRequest := range request.Requests {
		// @note This next part before the proof generation should be blocking. 
		// we want to ensure that the circuit exists and that the DB is prepared
		// accordingly

		// check if there is a circuit with this name
		exists, err := p.CheckIfCircuitExists(proofRequest.CircuitName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query the database"})
			return
		}

		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("There is no such circuit %s", proofRequest.CircuitName)})
			return
		}

		// generate a new uuid
		proofID, err := p.GetNumberOfProofsPerCircuit(proofRequest.CircuitName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get the number of proofs"})
			return
		}

		// calculate wtns name (use name + id to be an unique identifier)
		wtnsPath := fmt.Sprintf("./data/%s_%d.wtns", proofRequest.CircuitName, proofID)

		// get the paths to zkey and wasm
		circuit, err := p.GetCircuitDetails(proofRequest.CircuitName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get the circuit details"})
			return
		}

		// init a new empty proof in the DB
		// marshal to JSON
		tmpJSON, err := native_json.Marshal("{}")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal the proof"})
			return
		}
		_, err = p.db.Exec(
			"INSERT INTO proofs (id, circuit_name, status, proof, public_inputs) VALUES ($1, $2, $3, $4, $5)",
			proofID,
			proofRequest.CircuitName,
			GeneratingProof,
			tmpJSON,
			tmpJSON,
		)

		if (err != nil) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert the proof in the database"})
			return
		}

		// start generating the proof
		go func(circuitName string, proofId int, circuit Circuit, circuitInput native_json.RawMessage, wntsPath string) {
			// if another error then recover and update the proof status
			defer func() {
				if r := recover(); r != nil {
					fmt.Printf("\nRecovered from panic: %s", r)
					p.UpdateProofStatus(ProofGenerationFailed, circuitName, proofId)
					// exit this go routine
					return 
				}
			}()

			// send the circuit name and proof id to the channel
			infoChannel <- ProofInfo{CircuitName: circuitName, ProofID: proofId}

			// 1. Calculate witness
			start := time.Now()
			wasmBytes, err := os.ReadFile(circuit.WASMPath)
			if err != nil {
				fmt.Printf("\nerr: %s", err)
				p.UpdateProofStatus(ProofGenerationFailed, circuitName, proofId)
				return 
			}

			inputs, err := witness.ParseInputs(circuitInput)
			if err != nil {
				fmt.Printf("\nerr: %s", err)
				p.UpdateProofStatus(ProofGenerationFailed, circuitName, proofId)
				return 
			}

			calc, err := witness.NewCircom2WitnessCalculator(wasmBytes, true)
			if err != nil {
				fmt.Printf("\nerr: %s", err)
				p.UpdateProofStatus(ProofGenerationFailed, circuitName, proofId)
				return 
			}

			wtns, err := calc.CalculateWTNSBin(inputs, true)
			if err != nil {
				fmt.Printf("\nerr: %s", err)
				p.UpdateProofStatus(ProofGenerationFailed, circuitName, proofId)
				return 
			}

			//nolint:gomnd
			err = os.WriteFile(wtnsPath, wtns, 0600)
			if err != nil {
				fmt.Printf("\nerr: %s", err)
				p.UpdateProofStatus(ProofGenerationFailed, circuitName, proofId)
				return 
			}

			// Calculate the elapsed time
			elapsed := time.Since(start)
			fmt.Printf("\nElapsed time for witness calculation %s: %s\n", circuitName, elapsed)

			// 2. Generate Proof
			provingKey, err := os.ReadFile(circuit.ZKeyPath)
			if err != nil {
				fmt.Printf("\nerr: %s", err)
				p.UpdateProofStatus(ProofGenerationFailed, circuitName, proofId)
				return 
			}

			witnessOutput, err := os.ReadFile(wtnsPath)
			if err != nil {
				fmt.Printf("\nerr: %s", err)
				p.UpdateProofStatus(ProofGenerationFailed, circuitName, proofId)
				return 
			}

			// Get the current time
			start = time.Now()

			proof, publicInput, err := prover.Groth16ProverRaw(provingKey, witnessOutput)
			if err != nil {
				fmt.Printf("\nerr: %s", err)
				p.UpdateProofStatus(ProofGenerationFailed, circuitName, proofId)
				return 
			}

			// Calculate the elapsed time
			elapsed = time.Since(start)

			fmt.Printf("\nElapsed time for generating proof %s: %s\n", circuitName, elapsed)

			// store the result on the db 
			// the proof and public input must be encoded as JSON
			jsonPublicInput, err := native_json.Marshal(publicInput)
			if err != nil {
				fmt.Printf("\nerr: %s", err)
				p.UpdateProofStatus(ProofGenerationFailed, circuitName, proofId)
				return 
			}

			jsonProof, err := native_json.Marshal(proof)
			if err != nil {
				fmt.Printf("\nerr: %s", err)
				p.UpdateProofStatus(ProofGenerationFailed, circuitName, proofId)
				return 
			}

			_, err = p.db.Exec(
				"UPDATE proofs SET proof = $1, public_inputs = $2, status = $3, time_taken = $4 WHERE id = $5 AND circuit_name = $6", 
				jsonProof, jsonPublicInput, ProofAvailable, elapsed.String(), proofId, circuitName)
			if err != nil {
				fmt.Printf("\nerr: %s", err)
				p.UpdateProofStatus(ProofGenerationFailed, circuitName, proofId)
			} else {
				fmt.Printf("\nProof available for %s", circuitName)
			}
		}(proofRequest.CircuitName, proofID, circuit, proofRequest.CircuitInput, wtnsPath)
	}

	// Read from the channel to collect circuit names and proof IDs
	for i := 0; i < len(request.Requests); i++ {
		info := <-infoChannel
		infos = append(infos, info)
	}
	close(infoChannel)

	// Return before go routine finishes so that the client knows the proof ids
	c.JSON(http.StatusOK, gin.H{
		"status":  http.StatusOK,
		"message": "Proof generation started",
		"data": infos,
	})
}

// GetMultipleResults Post request to get multiple proofs results
func (p Prover) GetMultipleResults(c *gin.Context) {
	var request GetMultipleCircuitsProofsRequest
	if err := c.ShouldBind(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// store our response data
	data := make(map[string]map[int]Result)

	// loop through the circuit names provided
	for _, circuitRequest := range request.Circuits {
		// extract the name
		circuitName := circuitRequest.CircuitName

		exists, err := p.CheckIfCircuitExists(circuitName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check if circuit exists"})
			return
		}

		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "There is no such circuit"})
			return
		}

		// init the map for this circuit's results
		if _, exists := data[circuitName]; !exists {
			data[circuitName] = make(map[int]Result)
		}

		// loop through the proof IDs requested
		for _, proofId := range circuitRequest.ProofIds {
			// check if there is a proof with this id
			proofs, err := p.GetNumberOfProofsPerCircuit(circuitName)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get the number of proofs"})
				return
			}

			if proofId >= proofs {
				data[circuitName][proofId] = Result{
					Status: "Invalid Id",
				}
			} else {
				// get the data from the db
				proof, err := p.GetProof(circuitName, proofId)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get the proof"})
					return
				}
				// store in our return variable
				data[circuitName][proofId] = proof
			}
		}
	}

	// the response contains all the requested proofs
	c.JSON(http.StatusOK, gin.H{
		"status": http.StatusOK,
		"data":   data,
	})
}

// GetResult - Get the result for a certain circuit
func (p Prover) GetResult(c *gin.Context) {
	// @note request type : GET /api/getResult?circuitName=foo&proofIds=1,2,3
	// get the circuit names from the query parameter
	circuitName := c.DefaultQuery("circuitName", "")
	// get the proof id
	proofIds := strings.Split(c.DefaultQuery("proofIds", ""), ",")

	data := map[string][]Result{}

	// check if there is a circuit with this name
	exists, err := p.CheckIfCircuitExists(circuitName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check if circuit exists"})
		return
	}

	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Circuit with the name '%s' does not exist", circuitName)})
		return
	}

	// loop through all the requested proof ids
	for _, proofId := range proofIds {
		// convert the proof id to an integer
		proofIdInt, err := strconv.Atoi(proofId)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Proof id '%s' is not a valid integer", proofId)})
			return
		}

		// check if there is a proof with this id
		proofs, err := p.GetNumberOfProofsPerCircuit(circuitName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get the number of proofs"})
			return
		}

		if proofIdInt >= proofs {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Proof with id '%s' does not exist", proofId)})
			return
		}

		// get the proof object
		proof, err := p.GetProof(circuitName, proofIdInt)
		// append to the response array
		data[circuitName] = append(data[circuitName], proof)
	}

	// the response contains all the requested proofs
	c.JSON(http.StatusOK, gin.H{
		"status": http.StatusOK,
		"data":   data,
	})
}

// GetAllAvailableProofsDB - Fetch all proofs from the db (available proofs)
func (p Prover) GetAllAvailableProofsDB() ([]ProofResponse, error) {
	var proofs []ProofResponse
	rows, err := p.db.Query("SELECT circuit_name, id, proof, public_inputs, time_taken FROM proofs WHERE status='ProofAvailable';")
	if err != nil {
		return nil, err
	}

	// loop through all rows
	for rows.Next() {
		var proof ProofResponse
		err := rows.Scan(&proof.CircuitName, &proof.ProofID, &proof.Proof, &proof.PublicInputs, &proof.TimeTaken)
		if err != nil {
			return nil, err
		}
		proofs = append(proofs, proof)
	}

	return proofs, nil
} 

// GetAvailableProofs - Get all proofs generated by the service (can be a lot of data)
func (p Prover) GetAvailableProofs(c *gin.Context) {
	// get all proofs from the db
	proofs, err := p.GetAllAvailableProofsDB()
	if err != nil {
		fmt.Println(err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get proofs"})
		return
	}

	// the response contains all the requested proofs
	c.JSON(http.StatusOK, gin.H{
		"status": http.StatusOK,
		"data":   proofs,
	})
}