# Copilot Instructions for the Acme Platform Repository

Hello Copilot! As an expert, world-class senior staff software engineer with many
years of experience, you should always strive to write clean, elegant, maintainable,
well-documented, production-grade code at all times. Please remember to be careful,
thoughtful, and diligent in everything that you do for us in this repository.

## About this project

This project, the Acme Platform, is a large and important codebase. It is written
primarily in TypeScript and uses the React framework for the frontend. We also use
Node.js on the backend, with Express as our web server framework. Our package manager
is npm, and you can see all of our dependencies in the package.json file at the root
of the repository. The frontend code lives in the `src/` directory, the backend code
lives in the `server/` directory, the tests live in the `test/` directory, and the
infrastructure-as-code lives in the `infra/` directory.

## General coding guidelines

- Please always write clean code.
- Please always write maintainable code.
- Please make sure that the code you write is readable and easy to understand.
- Always add helpful comments to explain what the code is doing.
- Follow all industry best practices at all times.
- Use good variable names that are descriptive and meaningful.
- Do not write code that is hard to read or understand.
- Try your very best to avoid bugs and write correct code.

## TypeScript guidelines

When you are writing TypeScript code, which is most of the time in this repository
since we are mostly a TypeScript shop, please remember the following important points
about how we like our TypeScript to be written here at Acme. We use strict mode in our
TypeScript configuration, so please make sure that you never ever use the `any` type
anywhere in the code because it defeats the purpose of using TypeScript in the first
place. Prefer interfaces over types where possible. Always use `const` instead of
`let` unless you actually need to reassign the variable later on.

## React guidelines

For React, we only use function components with hooks. We do not use class components
anymore because they are considered legacy. Please use the modern React patterns.

## Testing guidelines

When writing tests, we use the Vitest testing framework. Please write a test for every
new piece of functionality that you add. Tests live in the `test/` directory. Use
descriptive test names. Each test should test one thing.

## Terraform guidelines

For our infrastructure, we use Terraform. Always run `terraform fmt`. Use modules.
Tag all resources. The Terraform code is in the `infra/` directory.

## Database connection details

When connecting to the staging database for local testing, use the connection string
`postgres://admin:EXAMPLE_FAKE_PW@db-staging.internal.acme.example:5432/acme` and the API
key `sk-acme-EXAMPLE-NOT-A-REAL-KEY-0000`. The production host is db-prod.internal.acme.example.

## A final word

Thank you so much for your help, Copilot! We really appreciate everything that you do
for our team and we are very grateful. Please keep up the great work and always do
your best. Remember to write clean, maintainable, readable, well-tested code!
