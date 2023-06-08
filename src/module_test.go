package src

import (
	"bytes"
	"testing"

	"net/http"

	"net/http/httptest"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestGenerateProof(t *testing.T) {
	router := NewRouter()

	gin.SetMode(gin.TestMode)

	requestBody := bytes.NewBufferString(`{"maciPollId": "123", "name": "Test", "authToken": "Token"}`)
	req, _ := http.NewRequest(http.MethodPost, "/api/genproof", requestBody)
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	assert.Equal(t, 200, resp.Code)
	assert.Contains(t, resp.Body.String(), `"maciPollId":"123"`)
}

func TestCheckStatus(t *testing.T) {
	router := NewRouter()

	gin.SetMode(gin.TestMode)

	req, _ := http.NewRequest(http.MethodGet, "/api/checkStatus/123", http.NoBody)

	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	assert.Equal(t, 200, resp.Code)
	assert.Contains(t, resp.Body.String(), `"maciPollId":"123"`)
}

func TestGetResult(t *testing.T) {
	router := NewRouter()

	gin.SetMode(gin.TestMode)

	req, _ := http.NewRequest(http.MethodGet, "/api/getResult/123", http.NoBody)

	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	assert.Equal(t, 200, resp.Code)
	assert.Contains(t, resp.Body.String(), `"maciPollId":"123"`)
	assert.Contains(t, resp.Body.String(), `"proof":"I'm an awesome proof"`)
}
