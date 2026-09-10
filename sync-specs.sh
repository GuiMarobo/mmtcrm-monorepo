#!/bin/bash

cd "$(git rev-parse --show-toplevel)"

echo "🔄 Sincronizando specs do mmturbana-setup..."
git fetch setup
git checkout setup/main -- context/

echo "✅ Pronto! Mudanças trazidas para context/"
git status
