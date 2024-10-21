# Linkedin profiles search tool

This app handles csv document with companies names. Using AI tools searches for the most possible linkedin page of this company.

## How to start

- clone repository
- create .env file with required variables
```
GOOGLE_API_KEY=
GOOGLE_CSE_ID=
ANTROPIC_API_KEY=
LANGCHAIN_TRACING_V2=
LANGCHAIN_API_KEY=
OPENAI_API_KEY=
SERVICE_EMAIL=
GOOGLE_SHEET_ID=
PRIVATE_KEY=

```
- install dependencies
```npm i```
- source file must be in 'data' repository (companies_kv.csv)
- run app
```npm start```
- Result will be writen in 'result' repository 
- Also result will we saved in Google Sheets
