# Create DB

Instal postgresql 

```bash
createdb coordinatorservice
psql coordinatorservice
CREATE ROLE coordinator WITH LOGIN PASSWORD 'maci-coordinator';
GRANT ALL PRIVILEGES ON DATABASE coordinatorservice TO coordinator;
```

Schema:

```sql 
CREATE TABLE circuits (
    name TEXT PRIMARY KEY,
    description TEXT,
    zKey_path TEXT,
    wasm_path TEXT 
);

CREATE TABLE Proofs (
    id INTEGER,
    circuit_name TEXT REFERENCES circuits(name),
    proof JSONB,
    status TEXT,
    public_inputs JSONB,
    PRIMARY KEY(circuit_name, id)
);
```

Copy and paste it in psql. 

# Generate TLS certs

```bash
openssl req -x509 -newkey rsa:4096 -keyout demo/server.key -out demo/server.crt -days 365 -nodes
```

# Run the service (without Docker)

`export JWT_SECRET=maci DB_NAME=coordinatorservice SQL_USER="coordinator" SQL_PASSWORD="maci-coordinator" && go run main.go`

Make sure to copy the JWT token printed on screen (only for dev purposes)

# register new circuit config

`curl https://localhost:8080/api/registerNewCircuit -d @demo/registerCircuitRequest.json -H "Content-Type: application/json" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJ1c2VyX2lkIjoiYWRtaW4ifQ.a1XALB112S0zbkl3tE4e_QxO3PA3vutMO4bYc-mO06E" -k`

# get all circuits

`curl https://localhost:8080/api/registeredCircuits -k`

# request a proof

`curl https://localhost:8080/api/generateProof -H "Content-Type: application/json" -d @demo/requestProof.json -k`

# request multiple proofs

`curl https://localhost:8080/api/generateMultipleProofs -H "Content-Type: application/json" -d @demo/requestProofs.json -k`

# get one result

`curl 'https://localhost:8080/api/getResult?circuitName=multiplier&proofIds=0' -k`

# get multiple results

`curl https://localhost:8080/api/getResult -d @demo/getMultipleProofs.json -H "Content-Type: application/json" -k`

# get all available proofs

`curl https://localhost:8080/api/proofs/available -k`  