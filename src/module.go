package src

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Request struct {
	MaciPollID string `json:"maciPollId"`
	Name       string `json:"name"`
	AuthToken  string `json:"authToken"`
}

type Status struct {
	MaciPollID string `json:"maciPollId"`
	Status     string `json:"status"`
}

type Result struct {
	MaciPollID string `json:"maciPollId"`
	Proof      string `json:"proof"` // Change this to the data type of your proof
}

func NewRouter() *gin.Engine {
	r := gin.Default()

	r.POST("/api/genproof", GenerateProof)
	r.GET("/api/checkStatus/:maciPollId", CheckStatus)
	r.GET("/api/getResult/:maciPollId", GetResult)

	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "api_demo.html", nil)
	})

	return r
}

func GenerateProof(c *gin.Context) {
	var req Request

	if err := c.BindJSON(&req); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"status": false, "message": err.Error()})

		return
	}

	c.JSON(http.StatusOK, Status{MaciPollID: req.MaciPollID, Status: "Proof generation requested"})
}

func CheckStatus(c *gin.Context) {
	maciPollID := c.Params.ByName("maciPollId")

	c.JSON(http.StatusOK, Status{MaciPollID: maciPollID, Status: "Processing"})
}

func GetResult(c *gin.Context) {
	maciPollID := c.Params.ByName("maciPollId")

	c.JSON(http.StatusOK, Result{MaciPollID: maciPollID, Proof: "I'm an awesome proof"})
}
