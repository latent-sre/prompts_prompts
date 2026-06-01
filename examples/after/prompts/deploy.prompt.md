---
description: Deploy the app to staging.
mode: agent
tools: ['codebase', 'terminalLastCommand']
---

# /deploy-staging

Deploy to **staging**: run tests → build → push Docker image to the registry →
update the staging Kubernetes deployment.

- Run the steps; stop and report on the first failure with the failing command's output.
- Be terse: report each step's result in one line. No background explanation unless I ask.
