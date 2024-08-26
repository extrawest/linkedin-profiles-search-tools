import * as fs from "fs";
import { parse } from 'csv-parse';
import { GoogleCustomSearch } from "@langchain/community/tools/google_custom_search";
import "dotenv/config";

const getGoogleResults = async (input: string) => {
  const search = new GoogleCustomSearch({
    apiKey: process.env.GOOGLE_API_KEY,
    googleCSEId: process.env.GOOGLE_CSE_ID,
  });

  try {
    const request = await search.invoke(
      `${input} linkedin.com profile`,
    );

    const results = JSON.parse(request) as { link: string }[];
    const links = results.map(result => result.link);
    return links;
  } catch (e) {
    console.error('Custom search error', e);
  }
}


const parseDocument = (path: string) => {
  const csvData: string[]=[];
  fs.createReadStream(path)
    .pipe(parse({delimiter: ':'}))
    .on('data', function(csvrow: string) {
        csvData.push(csvrow);        
    })
    .on('end',function() {
      console.log('document parsed');
    });

    return csvData;
}

const main = async () => {
  const csvData = parseDocument('./data/companies.csv');
  const links = await getGoogleResults('InnoPower linkedin.com profile');
  console.log(links);
};

main();