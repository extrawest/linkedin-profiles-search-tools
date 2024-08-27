import { GoogleCustomSearch } from "@langchain/community/tools/google_custom_search";
import "dotenv/config";
import { SearchResult } from "../types";
import { delay } from "./delay";

export const getGoogleResults = async (input: string, link: string) => {
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
      await delay(1000);
      const callSearch = async () => {
        const request = await search.invoke(
            `${input} linkedin.com profile`,
        );
      
        const results = JSON.parse(request) as { link: string }[];

        return results;
      }
      
      let results = await callSearch();

      if (!results.length) {
        await delay(1000);
        results = await callSearch();
      }

      console.log('LINKS', input, results.slice(0, 2))
      links.linkedinLinks = results.map(result => result.link);
    } catch (e) {
      console.error('Custom search error', e);
    }
  
    return links;
  }