import * as fs from "fs";
import { parse } from 'csv-parse';
import "dotenv/config";
import { GoogleCustomSearch } from "@langchain/community/tools/google_custom_search";
import  { ChatPromptTemplate } from "@langchain/core/prompts";
import { SearchResult } from "./types";
import { ChatOpenAI } from "@langchain/openai";

const getGoogleResults = async (input: string, link: string) => {
  const links: SearchResult = {
    linkedinLinks: [],
    name: input,
    link
  }
  const search = new GoogleCustomSearch({
    apiKey: process.env.GOOGLE_API_KEY,
    googleCSEId: process.env.GOOGLE_CSE_ID,
  });

  try {
    const request = await search.invoke(
      `${input} linkedin.com profile`,
    );

    const results = JSON.parse(request) as { link: string }[];
    links.linkedinLinks = results.map(result => result.link);
  } catch (e) {
    console.error('Custom search error', e);
  }

  return links;
}


const parseDocument =  (path: string) => {
  const csvData: string[][]=[];
  return new Promise((resolve, reject) => {
    fs.createReadStream(path)
    .pipe(parse({delimiter: ','}))
    .on('data', function(csvrow: string[]) {
        csvData.push(csvrow);        
    })
    .on('end',function() {
      resolve(csvData)
    });
  })
}

const main = async () => {
  const csvData = await parseDocument('./data/companies_kv.csv');
  console.log('csvData', csvData[0], csvData[1]);
  const requiredData: [string, string][] = []

  if (Array.isArray(csvData) && csvData[0][0] === 'name' && csvData[0][1] === 'link') {
    requiredData.push(...(csvData as [string, string][]).slice(1, 5)); //TODO: delte 5
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

  console.log('data', data[0]);

  const model = new ChatOpenAI({ 
    model: "gpt-3.5-turbo",
    openAIApiKey: process.env.OPENAI_API_KEY,
});

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful AI assistant. You will be given a company name and a list of LinkedIn links. Your task is to choose the one link that most accurately represents the profile of the given company. Usually correct link contains string '/company/'. Analyze the given text and return the result in JSON format with the following key: 'linkedinLink'."],
    ["human", "Company name is {name}. List of links: {links}"],
  ]);

  const chain = prompt.pipe(model);

  const resultLinks = await Promise.all((data as SearchResult[]).map(company => {
    return new Promise(async (resolve, reject) => {
      const res = await chain.invoke({
        name: company.name,
        links: company.linkedinLinks
      });
      const linkedinLink = JSON.parse(res?.content as string ?? '')?.linkedinLink?.trim();
      resolve({
        name: company.name,
        link: company.link,
        linkedinLink: linkedinLink ?? 'not found'
      })
    })
  }))

  console.log(resultLinks)

};

main();