#!/bin/bash
# sync-firestore-rules.sh
# Script to deploy Firestore rules to both development and production environments

# Set project IDs
DEV_PROJECT="barber-38b88"
PROD_PROJECT="barberapp-prod-2d197"

echo "🔄 DEPLOYING FIRESTORE RULES"
echo "==========================="

# First deploy to development project
echo "🚀 Deploying to development project ($DEV_PROJECT)..."
firebase deploy --only firestore:rules --project=$DEV_PROJECT

# Then deploy to production project
echo "🚀 Deploying to production project ($PROD_PROJECT)..."
firebase deploy --only firestore:rules --project=$PROD_PROJECT

echo "✅ Firestore rules deployed to both environments"