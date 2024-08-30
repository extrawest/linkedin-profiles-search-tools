import { writeFile } from 'fs/promises';
import { Result } from "../types";


export const saveCsv = async (resultLinks: Result[]) => {
    const date = Date.now();
    const filename = `./result/linkedin-${date}.csv`;
    const dataCSV = resultLinks.reduce((acc, link) => {
        acc += `${link.name}, ${link.link}, ${link.linkedinLink ?? 'not found'}\n`;
        return acc;
      }, 
      `name, link, linkedinLink\n`);

    try {
        await writeFile(filename, dataCSV, 'utf8');
        console.log('file writen')
    } catch(error) {
        console.error(error)
    }
}