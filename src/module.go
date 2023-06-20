package src

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Circuit struct {
	Result Result `json:"result"`
	Status string `json:"status"`
}

type Result struct {
	Proof       interface{} `json:"proof"`
	PublicInput interface{} `json:"publicInput"`
}

type ResponseData struct {
	ProcessMessagesCircuit Circuit `json:"processMessagesCircuit"`
	TallyVotesCircuit      Circuit `json:"tallyVotesCircuit"`
}

func NewRouter() *gin.Engine {
	r := gin.Default()

	r.POST("/api/generateProof", GenerateProof)
	r.GET("/api/getResult", GetResult)

	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "api_demo.html", nil)
	})

	return r
}

func GenerateProof(c *gin.Context) {
	//nolint:gocritic //  This is a placeholder to use when implementing the following:ㅎ
	//
	// circuitName := c.PostForm("circuitName")
	// circuitInput := c.PostForm("circuitInput")

	// Implement your logic to generate proof here.

	c.JSON(http.StatusOK, gin.H{
		"status":  http.StatusOK,
		"message": "OK",
	})
}

func GetResult(c *gin.Context) {
	// Implement your logic to get result here.

	data := ResponseData{
		ProcessMessagesCircuit: Circuit{
			Status: "inProgress", // Replace with actual status
			Result: Result{
				Proof:       nil, // Replace with actual proof
				PublicInput: nil, // Replace with actual public input
			},
		},
		TallyVotesCircuit: Circuit{
			Status: "inProgress", // Replace with actual status
			Result: Result{
				Proof:       nil, // Replace with actual proof
				PublicInput: nil, // Replace with actual public input
			},
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"status": http.StatusOK,
		"data":   data,
	})
}
