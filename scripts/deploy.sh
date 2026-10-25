#!/usr/bin/env bash
# Usage: scripts/deploy.sh <gcp-project>  — ships the repo to the VM and (re)starts the stack.
set -euo pipefail
P=${1:?gcp project}; Z=us-central1-a
tar czf /tmp/ce.tgz --exclude=node_modules --exclude=.git --exclude=frontend --exclude=graphify-out --exclude=kb --exclude=docs --exclude=.venv --exclude=__pycache__ --exclude='backend/.env' .
gcloud compute scp /tmp/ce.tgz ce-vm:~/ce.tgz --zone=$Z --project=$P
gcloud compute ssh ce-vm --zone=$Z --project=$P --command='mkdir -p ~/app && tar xzf ~/ce.tgz -C ~/app && cd ~/app && sudo docker compose -f docker-compose.prod.yml --env-file ~/.env.prod up -d --build'
