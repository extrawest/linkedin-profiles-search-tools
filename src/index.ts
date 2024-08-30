import "dotenv/config";
import  { ChatPromptTemplate } from "@langchain/core/prompts";
import { Result, SearchResult } from "./types";
import { ChatOpenAI } from "@langchain/openai";
import { parseDocument } from './helpers/parseDocument';
import { getGoogleResults } from './helpers/getGoogleResults';
import { saveCsv } from './helpers/saveCsv';
import { delay } from "./helpers/delay";
import { z } from "zod";
import { saveDataToGoogleSheet } from "./helpers/saveToGoogleSheets";

const main = async () => {
  const csvData = await parseDocument('./data/companies.csv');
  const requiredData: [string, string][] = []

  console.log('DOCUMENT PARSED')

  if (Array.isArray(csvData) && csvData[0][0] === 'name' && csvData[0][1] === 'link') {
    requiredData.push(...(csvData as [string, string][]).slice(1)); //TODO: use (1) instead of test data
  } else {
    throw new Error('Wrong document format');
  }
  
  const data = await Promise.all((requiredData as [string, string][]).map(row => {
    return new Promise(async (resolve, reject) => {
      if (row[0] && row[1]) {
        await delay(1000);
        resolve(getGoogleResults(row[0], row[1]));
      } else {
        reject('Data has format issue')
      }
    })
  }));

  console.log('GOOGLE REQUESTS FINESHED')

  const responseSchema = z.object({
    linkedinLink: z.string().describe("linkedin company link"),
  });

  const model = new ChatOpenAI({ 
    model: "gpt-4o-mini",
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const structuredLlm = model.withStructuredOutput(responseSchema);


  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a helpful AI assistant. 
      You will be given a company name and a list of LinkedIn links with description.
      Your task is to choose the one link that most accurately represents the profile of the given company.
      Correct link always contains string '/company/'.
      Analyze the given text and return just resulted link as a single string.
      If links are not provided or data has incorrect format return 'Not found'`],
    ["human", "Company name is {name}. List of links with description: {links}"],
  ]);

  const chain = prompt.pipe(structuredLlm);

  const resultLinks = await Promise.all((data as SearchResult[]).map(company => {
    return new Promise(async (resolve) => {
      const res = await chain.invoke({
        name: company.name,
        links: company.linkedinLinks
      });
      await delay(1000);

      resolve({
        name: company.name,
        link: company.link,
        linkedinLink: res?.linkedinLink ?? 'not found'
      })
    })
  }));

  console.log('RESULTED LINKS READY');

  await saveCsv(resultLinks as Result[]);

  saveDataToGoogleSheet(resultLinks as Result[])
};

main();