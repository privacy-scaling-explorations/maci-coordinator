/* Queries to create the tables required by the coordinator-service */
CREATE TABLE circuits (
    name TEXT PRIMARY KEY,
    description TEXT,
    zKey_path TEXT,
    wasm_path TEXT 
);

CREATE TABLE proofs (
    id INTEGER,
    circuit_name TEXT REFERENCES circuits(name),
    proof JSONB,
    status TEXT,
    public_inputs JSONB,
    time_taken TEXT,
    PRIMARY KEY(circuit_name, id)
);