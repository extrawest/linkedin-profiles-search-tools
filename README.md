# Linkedin profiles search tool

This app handles csv document with companies names. Using AI tools searches for the most possible linkedin page of this company.

## How to start

- clone repository
- create .env file with required variables
```
GOOGLE_API_KEY=
GOOGLE_CSE_ID=
LANGCHAIN_TRACING_V2=
LANGCHAIN_API_KEY=
OPENAI_API_KEY=
```
- install dependencies
```npm i```
- source file must be in 'data' repository (companies_kv.csv)
- run app
```npm start```
- Result will be writen in 'result' repository 