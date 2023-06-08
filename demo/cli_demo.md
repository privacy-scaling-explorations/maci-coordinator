### api/genproof

```
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"maciPollId":"12345","name":"Ethcon Korea 2023","authToken":"PVT_kwDOBheqls4AMmQM"}' \
  http://localhost:8080/api/genproof
```

### /api/checkStatus/{maciPollId}

```
curl http://localhost:8080/api/checkStatus/12345
```

### /api/getResult/{maciPollId}

```
curl http://localhost:8080/api/getResult/12345
```
