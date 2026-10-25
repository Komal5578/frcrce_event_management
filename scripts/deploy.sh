#!/usr/bin/env bash
# Usage: scripts/deploy.sh <gcp-project> [instance] [zone]  — ships the repo to the VM and (re)starts the stack.
set -euo pipefail
P=${1:?gcp project}; VM=${2:-ce-api}; Z=${3:-asia-south1-a}
tar czf /tmp/ce.tgz --exclude=node_modules --exclude=.git --exclude=frontend --exclude=worker --exclude=.planning --exclude=graphify-out --exclude=kb --exclude=docs --exclude=.venv --exclude=__pycache__ --exclude='backend/.env' .
gcloud compute scp /tmp/ce.tgz $VM:~/ce.tgz --zone=$Z --project=$P
gcloud compute ssh $VM --zone=$Z --project=$P --command='mkdir -p ~/app && tar xzf ~/ce.tgz -C ~/app && cd ~/app && sudo docker compose -f docker-compose.prod.yml --env-file ~/.env.prod up -d --build'
