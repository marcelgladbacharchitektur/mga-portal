#!/bin/bash

# Test authentication flow

echo "1. Testing auth status:"
curl -s http://localhost:5173/api/auth/google/status | jq .

echo -e "\n2. Testing Drive access:"
curl -s http://localhost:5173/api/auth/google/test-drive | jq .

echo -e "\n3. Testing environment debug:"
curl -s http://localhost:5173/api/debug/env | jq .