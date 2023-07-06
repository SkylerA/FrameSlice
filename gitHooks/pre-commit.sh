#!/bin/sh
npm run test

passed=$?

if [$passed -ne 0]; then
    echo "Tests failed"
    exit 1
fi
