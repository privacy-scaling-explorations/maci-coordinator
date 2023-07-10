### /api/generateProof

Send a POST request to the `/api/generateProof` endpoint with a JSON body containing the cicuit input of the desired circuit:

ProcessMessages:
```
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d @demo/request_generateProof_ProcessMessages.json \
  http://localhost:8080/api/generateProof
```

TallyVotes:
```
curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d @demo/request_generateProof_TallyVotes.json \
  http://localhost:8080/api/generateProof
```

### /api/getResult

```
curl http://localhost:8080/api/getResult
```

## Generate Proof using snarkjs

```
snarkjs groth16 prove instruments/TallyVotes_6-2-3_test.0.zkey data/TallyVotes/6-2-3/witness_wasm.wtns outputs/proof_TallyVotes_6-2-3.json outputs/public_TallyVotes_6-2-3.json
```
