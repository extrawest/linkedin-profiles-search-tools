import "dotenv/config";
import  { ChatPromptTemplate } from "@langchain/core/prompts";
import { Result, SearchResult } from "./types";
import { ChatOpenAI } from "@langchain/openai";
import { parseDocument } from './helpers/parseDocument';
import { getGoogleResults } from './helpers/getGoogleResults';
import { saveCsv } from './helpers/saveCsv';

const main = async () => {
  const csvData = await parseDocument('./data/companies_kv.csv');
  const requiredData: [string, string][] = []

  console.log('DOCUMENT PARSED')

  if (Array.isArray(csvData) && csvData[0][0] === 'name' && csvData[0][1] === 'link') {
    requiredData.push(...(csvData as [string, string][]).slice(5, 10)); //TODO: use (1) instead of test data
  } else {
    throw new Error('Wrong document format');
  }
  
  const data = await Promise.all((requiredData as [string, string][]).map(row => {
    return new Promise((resolve, reject) => {
      if (row[0] && row[1]) {
        resolve(getGoogleResults(row[0], row[1]))
      } else {
        reject('Data has format issue')
      }
    })
  }));

  console.log('GOOGLE REQUESTS FINESHED')

  const model = new ChatOpenAI({ 
    model: "gpt-3.5-turbo",
    openAIApiKey: process.env.OPENAI_API_KEY,
});

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful AI assistant. You will be given a company name and a list of LinkedIn links. Your task is to choose the one link that most accurately represents the profile of the given company. Usually correct link contains string '/company/'. Analyze the given text and return the result as JSON with the following key: 'linkedinLink'. If links are not provided or data has incorrect format return JSON object with key 'linkedinLink' and value 'Not found'"],
    ["human", "Company name is {name}. List of links: {links}"],
  ]);

  const chain = prompt.pipe(model);

  const resultLinks = await Promise.all((data as SearchResult[]).map(company => {
    return new Promise(async (resolve, reject) => {
      console.log(company, 'COMPANY')
      const res = await chain.invoke({
        name: company.name,
        links: company.linkedinLinks
      });
      const content = (res?.content as string)?.replace('```json', '').replace('```', ''); //TODO: solution for extra symbols
      const linkedinLink = JSON.parse(content ?? '')?.linkedinLink?.trim();
      resolve({
        name: company.name,
        link: company.link,
        linkedinLink: linkedinLink ?? 'not found'
      })
    })
  }));

  console.log('RESULTED LINKS READY');

  await saveCsv(resultLinks as Result[]);
};

main();